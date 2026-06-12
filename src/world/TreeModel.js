import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { CONFIG } from '../config.js'
import { TreeModelMaterial } from '../materials/TreeModelMaterial.js'

// ─────────────────────────────────────────────────────────────
// TreeModel — Meshy GLB 로드 + InstancedMesh 100그루
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
 * @param {(pct:number)=>void} [onProgress]
 */
export function loadTreeTemplate(url, onProgress) {
  const loader = new GLTFLoader()

  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        let src = null
        gltf.scene.traverse((o) => {
          if (o.isMesh && !src) src = o
        })
        if (!src) {
          reject(new Error('GLB에 Mesh가 없습니다'))
          return
        }

        const targetH = CONFIG.forest.treeModelHeight
        const geometry = normalizeTreeGeometry(src.geometry.clone(), targetH)

        let srcMat = src.material
        if (Array.isArray(srcMat)) srcMat = srcMat[0]

        let map = srcMat.map ?? null
        if (map) {
          map = map.clone()
          map.colorSpace = THREE.SRGBColorSpace
        }

        const radius =
          Math.max(
            geometry.boundingBox.max.x - geometry.boundingBox.min.x,
            geometry.boundingBox.max.z - geometry.boundingBox.min.z,
          ) * 0.5

        const material = new TreeModelMaterial({ map, treeHeight: targetH })

        resolve({ geometry, material, height: targetH, radius })
      },
      (ev) => {
        if (onProgress && ev.total) onProgress(ev.loaded / ev.total)
      },
      reject,
    )
  })
}

/** InstancedMesh — draw call 1회, 셰이더에서 instanceMatrix 적용 */
export function createTreeInstances(template, placements) {
  const mesh = new THREE.InstancedMesh(template.geometry, template.material, placements.length)

  const m = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const p = new THREE.Vector3()
  const s = new THREE.Vector3()

  for (let i = 0; i < placements.length; i++) {
    const t = placements[i]
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), t.rotY)
    s.setScalar(t.scale)
    p.set(t.x, 0, t.z)
    m.compose(p, q, s)
    mesh.setMatrixAt(i, m)
  }

  mesh.instanceMatrix.needsUpdate = true
  mesh.computeBoundingSphere()
  mesh.frustumCulled = true
  mesh.userData.interactive = 'tree'
  mesh.userData.isInstancedTrees = true
  return mesh
}

export function treeFocusRoot(placement) {
  return {
    userData: { focusY: placement.focusY },
    getWorldPosition(target) {
      return target.set(placement.x, 0, placement.z)
    },
  }
}
