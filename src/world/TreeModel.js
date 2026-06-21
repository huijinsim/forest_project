import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { CONFIG } from '../config.js'

// ─────────────────────────────────────────────────────────────
// TreeModel — Meshy GLB 로드 + InstancedMesh 배치
// ─────────────────────────────────────────────────────────────

function normalizeTreeGeometry(geometry, targetH) {
  geometry.computeBoundingBox()
  const box = geometry.boundingBox
  const minY = box.min.y
  const maxY = box.max.y
  const span = Math.max(maxY - minY, 0.001)
  const pos = geometry.attributes.position

  // 캐노피 bbox가 아니라 맨 아래 기둥 발 기준으로 XZ 중심
  let cx = (box.min.x + box.max.x) * 0.5
  let cz = (box.min.z + box.max.z) * 0.5
  const probeTop = minY + span * 0.06
  let n = 0
  let sx = 0
  let sz = 0
  for (let i = 0; i < pos.count; i++) {
    if (pos.getY(i) <= probeTop) {
      sx += pos.getX(i)
      sz += pos.getZ(i)
      n++
    }
  }
  if (n > 6) {
    cx = sx / n
    cz = sz / n
  }

  geometry.translate(-cx, -minY, -cz)

  const norm = targetH / span
  geometry.scale(norm, norm, norm)
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  if (!geometry.attributes.normal) geometry.computeVertexNormals()
  return geometry
}

function paletteColors(hexList, fallback) {
  const list = hexList?.length ? hexList : [fallback]
  return list.map((h) => new THREE.Color(h))
}

/** 맨 아래 실린더 구간만 샘플 — 잎 tier가 기둥 반경에 끼어들지 않게 */
function estimateTrunkRadius(pos, minY, span, trunkRadiusRatio) {
  const probeTop = minY + span * 0.045
  const radii = []
  for (let i = 0; i < pos.count; i++) {
    if (pos.getY(i) <= probeTop) {
      radii.push(Math.hypot(pos.getX(i), pos.getZ(i)))
    }
  }
  if (!radii.length) return span * trunkRadiusRatio

  radii.sort((a, b) => a - b)
  const idx = Math.min(radii.length - 1, Math.floor(radii.length * 0.88))
  const cap = span * trunkRadiusRatio
  return THREE.MathUtils.clamp(radii[idx] * 1.05, span * 0.018, cap)
}

/** splitMode: tree | stem | foliage(전부 잎) */
function bakePlantPartMask(geometry, { trunkRatio, trunkRadiusRatio, splitMode }) {
  const pos = geometry.attributes.position
  const count = pos.count
  const minY = geometry.boundingBox.min.y
  const maxY = geometry.boundingBox.max.y
  const span = Math.max(maxY - minY, 0.001)

  const mask = new Float32Array(count)

  if (splitMode === 'foliage') {
    mask.fill(1)
    geometry.setAttribute('aPlantPart', new THREE.BufferAttribute(mask, 1))
    return { trunkTop: minY, trunkR: 0 }
  }

  const trunkTop = minY + span * (splitMode === 'stem' ? trunkRatio : Math.min(trunkRatio, 0.085))
  const trunkR =
    splitMode === 'tree' ? estimateTrunkRadius(pos, minY, span, trunkRadiusRatio) : 0

  for (let i = 0; i < count; i++) {
    const y = pos.getY(i)
    if (splitMode === 'stem') {
      mask[i] = y <= trunkTop ? 0 : 1
      continue
    }
    const r = Math.hypot(pos.getX(i), pos.getZ(i))
    mask[i] = y <= trunkTop && r <= trunkR ? 0 : 1
  }

  geometry.setAttribute('aPlantPart', new THREE.BufferAttribute(mask, 1))
  return { trunkTop, trunkR }
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
  const trunkPalette = paletteColors(
    materialCfg.trunkPalette ?? CONFIG.forest.trunkPalette,
    materialCfg.trunk ?? '#88826d',
  )

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

        const trunkRatio = materialCfg.trunkRatio ?? 0.085
        const trunkRadiusRatio = materialCfg.trunkRadiusRatio ?? 0.048
        const splitMode = materialCfg.splitMode ?? 'tree'
        bakePlantPartMask(geometry, {
          trunkRatio,
          trunkRadiusRatio,
          splitMode,
        })

        const material = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: materialCfg.roughness ?? 0.9,
          metalness: 0.0,
          flatShading: false,
        })

        material.onBeforeCompile = (shader) => {
          shader.uniforms.uFoliageColor = { value: foliageColor }

          shader.vertexShader = shader.vertexShader
            .replace(
              '#include <common>',
              '#include <common>\nvarying float vPlantPart;\nvarying vec3 vTrunk;\nattribute float aPlantPart;\nattribute vec3 aTrunk;',
            )
            .replace(
              '#include <begin_vertex>',
              '#include <begin_vertex>\n  vPlantPart = aPlantPart;\n  vTrunk = aTrunk;',
            )

          shader.fragmentShader = shader.fragmentShader
            .replace(
              '#include <common>',
              `#include <common>
varying float vPlantPart;
varying vec3 vTrunk;
uniform vec3 uFoliageColor;`,
            )
            .replace(
              'vec4 diffuseColor = vec4( diffuse, opacity );',
              `float folMix = vPlantPart;
  vec3 trunkCol = vTrunk;
  vec3 baseCol = mix(trunkCol, uFoliageColor, folMix);
  vec4 diffuseColor = vec4(baseCol, opacity);`,
            )
            .replace(
              '#include <emissivemap_fragment>',
              `#include <emissivemap_fragment>
  totalEmissiveRadiance += vTrunk * (1.0 - vPlantPart) * 0.82;`,
            )
        }
        material.customProgramCacheKey = () =>
          `plant-v7-${splitMode}-${materialCfg.foliage}`

        resolve({
          geometry,
          material,
          height,
          radius,
          id: options.id ?? url,
          trunkPalette,
        })
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

/** InstancedMesh — 인스턴스마다 기둥 팔레트 색 */
export function createTreeInstances(template, placements) {
  const mesh = new THREE.InstancedMesh(template.geometry, template.material, placements.length)
  mesh.castShadow = true
  mesh.receiveShadow = true

  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const p = new THREE.Vector3()
  const s = new THREE.Vector3()

  const trunks = new Float32Array(placements.length * 3)
  const palette = template.trunkPalette?.length
    ? template.trunkPalette
    : [new THREE.Color('#88826d')]
  const _c = new THREE.Color()

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

    const seed = (t.seed ?? i) + (template.id?.length ?? 0) * 0.17
    const idx = Math.floor(rand(seed + 19.4) * palette.length) % palette.length
    _c.copy(palette[idx])
    trunks[i * 3] = _c.r
    trunks[i * 3 + 1] = _c.g
    trunks[i * 3 + 2] = _c.b
  }

  mesh.geometry.setAttribute('aTrunk', new THREE.InstancedBufferAttribute(trunks, 3))
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
