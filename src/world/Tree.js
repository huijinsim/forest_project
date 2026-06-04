import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

// ─────────────────────────────────────────────────────────────
// Tree — 산속 숲 일러스트 레퍼런스 기반 절차 지오메트리
//   · 침엽: 물결 가장리(teardrop) 층 캐노피 — 일러스트 주 나무
//   · 활엽: 가지 + 둥근 스캘럽 캐노피
//   · 원경: 가느다란 기둥 + 작은 캐노피
// Lathe + 정점 스캘럽으로 기하 도형 느낌을 줄인다.
// ─────────────────────────────────────────────────────────────

const TMP = new THREE.Vector3()

function phase(rng, n = 0) {
  return rng() * Math.PI * 2 + n * 2.13
}

/** 수평 단면 스캘럽(물결 테두리) */
function scallop(theta, phaseOff, lobes = 7) {
  return (
    1 +
    0.11 * Math.sin(theta * lobes + phaseOff) +
    0.06 * Math.sin(theta * (lobes + 3) + phaseOff * 1.4) +
    0.03 * Math.sin(theta * (lobes - 2) + phaseOff * 0.6)
  )
}

/** Lathe 프로필에 스캘럽 적용 */
function applyScallop(g, phaseOff) {
  const pos = g.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    const r = Math.sqrt(x * x + z * z)
    if (r < 0.02) continue
    const s = scallop(Math.atan2(z, x), phaseOff)
    pos.setXYZ(i, x * s, y, z * s)
  }
  g.computeVertexNormals()
  return g
}

/** 물방울/타원형 캐노피 (침엽수) — 위로 길고 가장자리 물결 */
function teardropCanopy(rng, height, radius, y0, phaseOff) {
  const steps = 16
  const pts = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const y = y0 + height * t
    // sin 프로필: 아래 좁고 중간 넓고 꼭대기 뾰족
    const bulge = Math.pow(Math.sin(t * Math.PI), 0.82)
    const r = radius * bulge * (0.94 + 0.06 * Math.sin(t * 9 + phaseOff))
    pts.push(new THREE.Vector2(Math.max(0.02, r), y))
  }
  const g = new THREE.LatheGeometry(pts, 16)
  return applyScallop(g, phaseOff)
}

/** 둥근 캐노피 (활엽·덤불) */
function roundCanopy(rng, radius, height, y0, phaseOff) {
  const steps = 12
  const pts = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const y = y0 + height * t
    const bulge = Math.sin(t * Math.PI)
    const r = radius * (0.35 + 0.65 * bulge)
    pts.push(new THREE.Vector2(r, y))
  }
  const g = new THREE.LatheGeometry(pts, 14)
  return applyScallop(g, phaseOff + 0.5)
}

/** 줄기 */
function trunk(rng, height, radius, lean = 0) {
  const pts = []
  for (let i = 0; i <= 8; i++) {
    const t = i / 8
    const r = radius * (1.08 - t * 0.52)
    pts.push(new THREE.Vector2(r, height * t))
  }
  const g = new THREE.LatheGeometry(pts, 8)
  g.translate(lean * height * 0.25, 0, 0)
  return g
}

/** 가지 하나 */
function branch(length, tiltZ, tiltX, y) {
  const g = new THREE.CylinderGeometry(0.04, 0.07, length, 6)
  g.translate(0, length / 2, 0)
  g.rotateZ(tiltZ)
  g.rotateX(tiltX)
  g.translate(0, y, 0)
  return g
}

function mergeParts(parts) {
  const valid = parts.filter(Boolean)
  return valid.length === 1 ? valid[0] : mergeGeometries(valid)
}

// ── 침엽수 (일러스트 주종): 긴 줄기 + 물결 층 캐노피 ──
export function buildConifer(rng) {
  const h = 2.8 + rng() * 2.2
  const r0 = 0.1 + rng() * 0.05
  const trunkGeo = trunk(rng, h, r0, (rng() - 0.5) * 0.08)
  const p0 = phase(rng)

  const tiers = 3 + Math.floor(rng() * 2)
  const canopies = []
  let y = h * 0.42
  let rad = 1.35 + rng() * 0.45
  let tierH = 2.2 + rng() * 0.6
  let top = y

  for (let i = 0; i < tiers; i++) {
    canopies.push(teardropCanopy(rng, tierH, rad, y, p0 + i * 1.1))
    top = y + tierH
    y += tierH * 0.48
    rad *= 0.62
    tierH *= 0.78
  }

  return { trunk: trunkGeo, foliage: mergeParts(canopies), height: top, kind: 'conifer' }
}

// ── 활엽수: 가지 + 둥근 잎 덩어리 ──
export function buildDeciduous(rng) {
  const h = 2.4 + rng() * 1.6
  const p0 = phase(rng, 1)
  const trunkGeo = trunk(rng, h, 0.12 + rng() * 0.05)

  const branches = []
  const canopies = []
  const nBranch = 2 + Math.floor(rng() * 2)

  for (let i = 0; i < nBranch; i++) {
    const by = h * (0.45 + i * 0.18)
    const tilt = (rng() - 0.5) * 0.9
    const len = 0.7 + rng() * 0.5
    branches.push(branch(len, tilt, (rng() - 0.5) * 0.4, by))
    canopies.push(
      roundCanopy(rng, 0.75 + rng() * 0.35, 1.0 + rng() * 0.3, by + len * 0.85, p0 + i),
    )
  }

  canopies.push(roundCanopy(rng, 1.1 + rng() * 0.4, 1.4 + rng() * 0.4, h * 0.72, p0 + 3))

  return {
    trunk: mergeParts([trunkGeo, ...branches]),
    foliage: mergeParts(canopies),
    height: h + 2.2,
    kind: 'deciduous',
  }
}

// ── 원경 기둥 (밀집 숲 깊이) ──
export function buildSlender(rng) {
  const h = 5 + rng() * 4
  const trunkGeo = trunk(rng, h, 0.05 + rng() * 0.02)
  const p0 = phase(rng, 2)
  const y = h * 0.78
  const foliage = teardropCanopy(rng, 1.4 + rng() * 0.5, 0.45 + rng() * 0.2, y, p0)
  return { trunk: trunkGeo, foliage, height: y + 1.5, kind: 'slender' }
}

// ── 작은 덤불 (지면층) ──
export function buildBush(rng, dark = false) {
  const p0 = phase(rng, 3)
  const n = 2 + Math.floor(rng() * 2)
  const parts = []
  for (let i = 0; i < n; i++) {
    parts.push(
      roundCanopy(
        rng,
        0.45 + rng() * 0.3,
        0.5 + rng() * 0.25,
        0.1 + i * 0.15,
        p0 + i,
      ),
    )
  }
  return { foliage: mergeParts(parts), kind: dark ? 'bushDark' : 'bush' }
}

// 별칭
export const buildBroadleaf = buildDeciduous
export const buildTiered = buildConifer
