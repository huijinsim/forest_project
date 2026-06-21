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
 * @param {(pct:number)=>void} [onProgress]
 */
export function loadTreeTemplate(url, options = {}, onProgress) {
  const loader = new GLTFLoader()
  const height = options.height ?? CONFIG.forest.treeModelHeight
  const baseMat = CONFIG.forest.plantMaterial ?? {}
  const materialCfg = { ...baseMat, ...options.material }

  const foliageColor = new THREE.Color(materialCfg.foliage ?? '#a1b15f')
  const trunkColor = new THREE.Color(materialCfg.trunk ?? '#88826d')

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

        const radius =
          Math.max(
            geometry.boundingBox.max.x - geometry.boundingBox.min.x,
            geometry.boundingBox.max.z - geometry.boundingBox.min.z,
          ) * 0.5

        const trunkTop = height * (materialCfg.trunkRatio ?? 0.14)
        const trunkBlend = height * (materialCfg.trunkBlend ?? 0.04)
        const trunkRadius = Math.max(
          radius * (materialCfg.trunkRadiusRatio ?? 0.16),
          height * 0.045,
        )
        const splitMode = materialCfg.splitMode ?? 'tree'
        const useRadial = splitMode === 'tree' ? 1.0 : 0.0

        const material = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: materialCfg.roughness ?? 0.9,
          metalness: 0.0,
          flatShading: false,
        })

        material.onBeforeCompile = (shader) => {
          shader.uniforms.uFoliageColor = { value: foliageColor }
          shader.uniforms.uTrunkColor = { value: trunkColor }
          shader.uniforms.uTrunkTop = { value: trunkTop }
          shader.uniforms.uTrunkBlend = { value: trunkBlend }
          shader.uniforms.uTrunkRadius = { value: trunkRadius }
          shader.uniforms.uUseRadial = { value: useRadial }

          shader.vertexShader = shader.vertexShader
            .replace(
              '#include <common>',
              '#include <common>\nvarying float vLocalY;\nvarying float vRadial;',
            )
            .replace(
              '#include <begin_vertex>',
              '#include <begin_vertex>\n  vLocalY = position.y;\n  vRadial = length(position.xz);',
            )

          shader.fragmentShader = shader.fragmentShader
            .replace(
              '#include <common>',
              `#include <common>
varying float vLocalY;
varying float vRadial;
uniform vec3 uFoliageColor;
uniform vec3 uTrunkColor;
uniform float uTrunkTop;
uniform float uTrunkBlend;
uniform float uTrunkRadius;
uniform float uUseRadial;`,
            )
            .replace(
              'vec4 diffuseColor = vec4( diffuse, opacity );',
              `float isHigh = smoothstep(uTrunkTop, uTrunkTop + uTrunkBlend, vLocalY);
  float folMix = isHigh;
  if (uUseRadial > 0.5) {
    float isWide = smoothstep(uTrunkRadius * 0.18, uTrunkRadius * 0.72, vRadial);
    folMix = max(isHigh, isWide);
  }
  vec3 baseCol = mix(uTrunkColor, uFoliageColor, folMix);
  vec4 diffuseColor = vec4(baseCol, opacity);`,
            )
        }
        material.customProgramCacheKey = () =>
          `plant-${splitMode}-${materialCfg.foliage}-${materialCfg.trunk}`

        resolve({ geometry, material, height, radius, id: options.id ?? url })
      },
      (ev) => {
        if (onProgress && ev.total) onProgress(ev.loaded / ev.total)
      },
      reject,
    )
  })
}

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

/** InstancedMesh — 종류별 단색 (그라데이션 없음) */
export function createTreeInstances(template, placements) {
  const mesh = new THREE.InstancedMesh(template.geometry, template.material, placements.length)
  mesh.castShadow = true
  mesh.receiveShadow = true

  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const p = new THREE.Vector3()
  const s = new THREE.Vector3()

  for (let i = 0; i < placements.length; i++) {
    const t = placements[i]
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), t.rotY)
    s.setScalar(t.scale)
    p.set(t.x, t.y ?? 0, t.z)
    m.compose(p, q, s)
    mesh.setMatrixAt(i, m)
  }

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
