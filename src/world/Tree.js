import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

// ─────────────────────────────────────────────────────────────
// Tree
// 절차적으로 "손그림풍 나무" 지오메트리를 만든다.
// 면 수를 적게(저폴리) 유지해 셀 셰이딩 + 잉크 외곽선이 또렷하게 보이도록.
//   - buildConifer  : 침엽수(원뿔을 쌓은 형태)
//   - buildBroadleaf: 활엽수(둥근 덩어리 군집)
// 각 빌더는 { trunk, foliage, height } 지오메트리를 돌려준다.
// (채움/외곽선 메쉬가 같은 지오메트리를 공유하므로 한 번만 만든다.)
// ─────────────────────────────────────────────────────────────

/** 잎 덩어리 하나: 정20면체를 비대칭 스케일+이동해 울퉁불퉁하게 */
function blob(rng, radius, y, spread) {
  const g = new THREE.IcosahedronGeometry(radius, 1)
  g.scale(1 + (rng() - 0.5) * 0.4, 0.85 + rng() * 0.5, 1 + (rng() - 0.5) * 0.4)
  g.translate((rng() - 0.5) * spread, y, (rng() - 0.5) * spread)
  return g
}

/** 줄기: 위가 좁은 6각 기둥, 밑동을 y=0에 맞춤 */
function makeTrunk(rng, height, radius) {
  const g = new THREE.CylinderGeometry(radius * 0.6, radius, height, 6, 1)
  g.translate(0, height / 2, 0)
  return g
}

/** 활엽수: 둥근 덩어리 3~5개를 위로 군집 */
export function buildBroadleaf(rng) {
  const trunkH = 2.0 + rng() * 1.2
  const trunkR = 0.16 + rng() * 0.08
  const trunk = makeTrunk(rng, trunkH, trunkR)

  const base = trunkH * 0.8
  const blobs = []
  const count = 3 + Math.floor(rng() * 3)
  let top = base
  for (let i = 0; i < count; i++) {
    const r = 1.6 - i * 0.18 + rng() * 0.4
    const y = base + i * (1.1 + rng() * 0.5)
    blobs.push(blob(rng, Math.max(0.7, r), y, 1.4))
    top = y + r
  }
  return { trunk, foliage: mergeGeometries(blobs), height: top }
}

/** 침엽수: 원뿔을 위로 갈수록 작게 3~4단 쌓음 */
export function buildConifer(rng) {
  const trunkH = 1.4 + rng() * 0.8
  const trunkR = 0.13 + rng() * 0.05
  const trunk = makeTrunk(rng, trunkH, trunkR)

  const tiers = 3 + Math.floor(rng() * 2)
  const cones = []
  let y = trunkH * 0.7
  let r = 1.7 + rng() * 0.4
  let h = 2.0 + rng() * 0.6
  let top = y
  for (let i = 0; i < tiers; i++) {
    const cone = new THREE.ConeGeometry(r, h, 7, 1)
    cone.translate(0, y + h / 2, 0)
    cones.push(cone)
    top = y + h
    y += h * 0.55
    r *= 0.72
    h *= 0.85
  }
  return { trunk, foliage: mergeGeometries(cones), height: top }
}

/** 덤불: 줄기 없는 작은 덩어리 군집 (지면 장식 / 전경 프레이밍) */
export function buildBush(rng) {
  const blobs = []
  const count = 2 + Math.floor(rng() * 3)
  for (let i = 0; i < count; i++) {
    blobs.push(blob(rng, 0.6 + rng() * 0.4, 0.4 + rng() * 0.3, 0.9))
  }
  return { foliage: mergeGeometries(blobs) }
}
