import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { CONFIG } from '../config.js'
import { TreeModelMaterial } from '../materials/TreeModelMaterial.js'

// ─────────────────────────────────────────────────────────────
// TreeModel — Meshy GLB 로드 + 인스턴싱용 정규화
// ─────────────────────────────────────────────────────────────

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

        const geometry = src.geometry.clone()
        let srcMat = src.material
        if (Array.isArray(srcMat)) srcMat = srcMat[0]

        let map = srcMat.map ?? null
        if (map) {
          map = map.clone()
          map.colorSpace = THREE.SRGBColorSpace
        }

        geometry.computeBoundingBox()
        const box = geometry.boundingBox
        const cx = (box.min.x + box.max.x) * 0.5
        const cz = (box.min.z + box.max.z) * 0.5
        geometry.translate(-cx, -box.min.y, -cz)

        const size = new THREE.Vector3()
        box.getSize(size)
        const targetH = CONFIG.forest.treeModelHeight
        const norm = targetH / Math.max(size.y, 0.001)
        geometry.scale(norm, norm, norm)
        geometry.computeBoundingBox()

        const radius =
          Math.max(
            geometry.boundingBox.max.x - geometry.boundingBox.min.x,
            geometry.boundingBox.max.z - geometry.boundingBox.min.z,
          ) * 0.5

        const material = new TreeModelMaterial({ map, treeHeight: targetH })

        resolve({
          geometry,
          material,
          height: targetH,
          radius,
          kind: 'conifer',
          foliageOutline: false,
        })
      },
      (ev) => {
        if (onProgress && ev.total) onProgress(ev.loaded / ev.total)
      },
      reject,
    )
  })
}

/** 배치 데이터 → InstancedMesh */
export function createTreeInstances(template, placements) {
  const mesh = new THREE.InstancedMesh(template.geometry, template.material, placements.length)
  mesh.frustumCulled = true

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
  mesh.userData.interactive = 'tree'
  mesh.userData.isInstancedTrees = true
  return mesh
}

/** 클릭 포커스용 가짜 root */
export function treeFocusRoot(placement) {
  return {
    userData: { focusY: placement.focusY },
    getWorldPosition(target) {
      return target.set(placement.x, 0, placement.z)
    },
  }
}
