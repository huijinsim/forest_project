import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { CONFIG } from '../config.js'

// ─────────────────────────────────────────────────────────────
// TreeModel — Meshy GLB 로드 + InstancedMesh 배치
// ─────────────────────────────────────────────────────────────

function normalizeTreeGeometry(geometry, targetH) {
  geometry.computeBoundingBox()
  const box = geometry.boundingBox
  const cx = (box.min.x + box.max.x) * 0.5
  const cz = (box.min.z + box.max.z) * 0.5
  geometry.translate(-cx, -box.min.y, -cz)

  const size = new THREE.Vector3()
  box.getSize(size)
  const norm = targetH / Math.max(size.y, 0.001)
  geometry.scale(norm, norm, norm)
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  if (!geometry.attributes.normal) geometry.computeVertexNormals()
  return geometry
}

/**
 * @param {string} url
 * @param {object} [options]
 * @param {number} [options.height]
 * @param {object} [options.material]
 * @param {(pct:number)=>void} [onProgress]
 */
export function loadTreeTemplate(url, options = {}, onProgress) {
  const loader = new GLTFLoader()
  const height = options.height ?? CONFIG.forest.treeModelHeight
  const materialCfg = options.material ?? CONFIG.forest.treeModelMaterial

  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        let src = null
        gltf.scene.traverse((o) => {
          if (o.isMesh && !src) src = o
        })
        if (!src) {
          reject(new Error(`GLB에 Mesh가 없습니다: ${url}`))
          return
        }

        const geometry = normalizeTreeGeometry(src.geometry.clone(), height)

        let srcMat = src.material
        if (Array.isArray(srcMat)) srcMat = srcMat[0]

        // 일러스트 톤을 정확히 맞추기 위해 GLB 텍스처 색은 사용하지 않고
        // 줄기(아래)와 잎(위) 색을 정점 높이로 분리해 칠한다
        const radius =
          Math.max(
            geometry.boundingBox.max.x - geometry.boundingBox.min.x,
            geometry.boundingBox.max.z - geometry.boundingBox.min.z,
          ) * 0.5

        const foliageColor = new THREE.Color(materialCfg.tint ?? '#8aa06a')
        const trunkColor = new THREE.Color(materialCfg.trunk ?? '#8c7a6b')
        const trunkTop = height * (materialCfg.trunkRatio ?? 0.16)
        const trunkBlend = height * 0.04

        const material = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.92,
          metalness: 0.0,
          flatShading: false,
        })
        material.onBeforeCompile = (shader) => {
          shader.uniforms.uTrunkColor = { value: trunkColor }
          shader.uniforms.uFoliageColor = { value: foliageColor }
          shader.uniforms.uTrunkTop = { value: trunkTop }
          shader.uniforms.uTrunkBlend = { value: trunkBlend }
          shader.vertexShader = shader.vertexShader
            .replace(
              '#include <common>',
              '#include <common>\nvarying float vLocalY;\nvarying vec3 vTint;\nattribute vec3 aTint;',
            )
            .replace(
              '#include <begin_vertex>',
              '#include <begin_vertex>\n  vLocalY = position.y;\n  vTint = aTint;',
            )
          shader.fragmentShader = shader.fragmentShader
            .replace(
              '#include <common>',
              '#include <common>\nvarying float vLocalY;\nvarying vec3 vTint;\nuniform vec3 uTrunkColor;\nuniform vec3 uFoliageColor;\nuniform float uTrunkTop;\nuniform float uTrunkBlend;',
            )
            .replace(
              'vec4 diffuseColor = vec4( diffuse, opacity );',
              'float folMix = smoothstep(uTrunkTop, uTrunkTop + uTrunkBlend, vLocalY);\n  vec3 foliage = uFoliageColor * vTint;\n  vec3 baseCol = mix(uTrunkColor, foliage, folMix);\n  vec4 diffuseColor = vec4( baseCol, opacity );',
            )
        }
        material.customProgramCacheKey = () => 'tree-twotone'

        resolve({ geometry, material, height, radius, id: options.id ?? url })
      },
      (ev) => {
        if (onProgress && ev.total) onProgress(ev.loaded / ev.total)
      },
      reject,
    )
  })
}

/** 여러 GLB 나무 템플릿 순차 로드 */
export async function loadAllTreeTemplates(models, onProgress) {
  const templates = []
  for (let i = 0; i < models.length; i++) {
    const m = models[i]
    const t = await loadTreeTemplate(m.url, m, (p) => {
      if (onProgress) onProgress((i + p) / models.length)
    })
    templates.push(t)
    if (onProgress) onProgress((i + 1) / models.length)
  }
  return templates
}

/** InstancedMesh — draw call 1회, 셰이더에서 instanceMatrix 적용 */
export function createTreeInstances(template, placements) {
  const mesh = new THREE.InstancedMesh(template.geometry, template.material, placements.length)
  mesh.castShadow = true
  mesh.receiveShadow = true

  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const p = new THREE.Vector3()
  const s = new THREE.Vector3()

  // 인스턴스별 잎 색 변주 (초록 톤 안에서 명도·색조 다양화)
  const tints = new Float32Array(placements.length * 3)
  const rand = (seed) => {
    const x = Math.sin(seed * 12.9898) * 43758.5453
    return x - Math.floor(x)
  }

  for (let i = 0; i < placements.length; i++) {
    const t = placements[i]
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), t.rotY)
    s.setScalar(t.scale)
    p.set(t.x, t.y ?? 0, t.z)
    m.compose(p, q, s)
    mesh.setMatrixAt(i, m)

    // 밝기(0.82~1.16) + 따뜻함/차가움(노랑↔청록) 변주
    const bright = 0.82 + rand(i + 0.3) * 0.34
    const warm = (rand(i + 7.1) - 0.5) * 0.18
    tints[i * 3] = bright * (1 + warm)
    tints[i * 3 + 1] = bright * (1 + warm * 0.35)
    tints[i * 3 + 2] = bright * (1 - warm)
  }

  mesh.geometry.setAttribute('aTint', new THREE.InstancedBufferAttribute(tints, 3))
  mesh.instanceMatrix.needsUpdate = true
  mesh.computeBoundingSphere()
  mesh.frustumCulled = false
  mesh.userData.interactive = 'tree'
  mesh.userData.isInstancedTrees = true
  return mesh
}

export function treeFocusRoot(placement) {
  return {
    userData: { focusY: placement.focusY },
    getWorldPosition(target) {
      return target.set(placement.x, placement.y ?? 0, placement.z)
    },
  }
}
