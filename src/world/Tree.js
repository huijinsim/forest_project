import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

// ─────────────────────────────────────────────────────────────
// Tree — 레퍼런스 침엽수 (층状 스커트 + 수직 그라데이션)
// ─────────────────────────────────────────────────────────────

/** 수평 단면 물결 — 깃털 가장자리 */
function scallop(theta, phaseOff, lobes = 9) {
  return (
    1 +
    0.14 * Math.sin(theta * lobes + phaseOff) +
    0.07 * Math.sin(theta * (lobes + 4) + phaseOff * 1.3) +
    0.04 * Math.sin(theta * (lobes - 3) + phaseOff * 0.7)
  )
}

function applyScallop(g, phaseOff, lobes = 9) {
  const pos = g.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    const r = Math.sqrt(x * x + z * z)
    if (r < 0.02) continue
    const s = scallop(Math.atan2(z, x), phaseOff, lobes)
    pos.setXYZ(i, x * s, y, z * s)
  }
  g.computeVertexNormals()
  return g
}

/** 층 하단 톱니 — 레퍼런스 깃털 끝 */
function applyJaggedHem(g, y0, band, phaseOff) {
  const pos = g.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const y = pos.getY(i)
    const z = pos.getZ(i)
    if (y > y0 + band) continue
    const r = Math.sqrt(x * x + z * z)
    if (r < 0.02) continue
    const t = THREE.MathUtils.clamp((y - y0) / band, 0, 1)
    const theta = Math.atan2(z, x)
    const jag =
      1 +
      0.2 * Math.sin(theta * 16 + phaseOff) +
      0.1 * Math.sin(theta * 24 + phaseOff * 1.2)
    const k = 1.0 + (jag - 1.0) * (1.0 - t)
    pos.setXYZ(i, x * k, y, z * k)
  }
  g.computeVertexNormals()
  return g
}

/** 침엽 층 하나 — 아래 넓고 위 좁은 스커트 */
function buildConiferTier(rng, y0, h, rBottom, rTop, phaseOff) {
  const steps = 24
  const pts = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const y = y0 + h * t
    const flare = Math.exp(-Math.pow((t - 0.1) / 0.16, 2.0)) * 0.22 + 1.0
    const cone = THREE.MathUtils.lerp(rBottom, rTop, Math.pow(t, 0.78))
    const r = cone * flare * (0.94 + 0.06 * Math.sin(t * 11 + phaseOff))
    pts.push(new THREE.Vector2(Math.max(0.02, r), y))
  }
  const g = new THREE.LatheGeometry(pts, 24)
  applyScallop(g, phaseOff)
  applyJaggedHem(g, y0, h * 0.18, phaseOff)
  return g
}

/** 원통형 줄기 */
function buildTrunk(h, radius) {
  const pts = []
  for (let i = 0; i <= 6; i++) {
    const t = i / 6
    const r = radius * (1.05 - t * 0.12)
    pts.push(new THREE.Vector2(r, h * t))
  }
  return new THREE.LatheGeometry(pts, 10)
}

function mergeParts(parts) {
  const valid = parts.filter(Boolean)
  return valid.length === 1 ? valid[0] : mergeGeometries(valid)
}

/** 0~1 높이 attribute (그라데이션 셰이더용) */
function addHeightAttribute(g) {
  const pos = g.attributes.position
  let yMin = Infinity
  let yMax = -Infinity
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i)
    yMin = Math.min(yMin, y)
    yMax = Math.max(yMax, y)
  }
  const span = Math.max(yMax - yMin, 0.001)
  const heights = new Float32Array(pos.count)
  for (let i = 0; i < pos.count; i++) {
    heights[i] = (pos.getY(i) - yMin) / span
  }
  g.setAttribute('aHeight', new THREE.BufferAttribute(heights, 1))
  return g
}

// ── 레퍼런스 침엽수: 대칭 원뿔 + 겹친 층 ──
export function buildConifer(rng) {
  const phase = rng() * Math.PI * 2
  const trunkH = 1.05 + rng() * 0.35
  const trunkR = 0.11 + rng() * 0.04
  const trunkGeo = buildTrunk(trunkH, trunkR)

  const tiers = 4 + Math.floor(rng() * 2)
  const canopies = []
  let y = trunkH * 0.72
  let tierH = 1.15 + rng() * 0.28
  let rad = 1.35 + rng() * 0.3

  for (let i = 0; i < tiers; i++) {
    const rBot = rad
    const rTop = rad * (0.22 + rng() * 0.12)
    canopies.push(buildConiferTier(rng, y, tierH, rBot, rTop, phase + i * 1.05))
    y += tierH * 0.48
    tierH *= 0.86
    rad *= 0.66
  }

  const foliage = addHeightAttribute(mergeParts(canopies))

  return {
    trunk: trunkGeo,
    foliage,
    height: y + tierH * 0.3,
    kind: 'conifer',
    foliageOutline: false,
  }
}

// ── 우선 1종만 사용 ──
export const TREE_KINDS = ['conifer']

export function buildTreeByKind(rng, kind = 'conifer') {
  return buildConifer(rng)
}

// 레거시 export
export const buildDeciduous = buildConifer
export const buildSlender = buildConifer

/** 지면 관목 (나무 1종과 별도) */
export function buildBush(rng) {
  const phase = rng() * Math.PI * 2
  const n = 2 + Math.floor(rng() * 2)
  const parts = []
  for (let i = 0; i < n; i++) {
    const steps = 10
    const pts = []
    const r = 0.42 + rng() * 0.28
    const h = 0.48 + rng() * 0.22
    const y0 = 0.08 + i * 0.12
    for (let j = 0; j <= steps; j++) {
      const t = j / steps
      const y = y0 + h * t
      const bulge = Math.sin(t * Math.PI)
      pts.push(new THREE.Vector2(r * (0.35 + 0.65 * bulge), y))
    }
    parts.push(applyScallop(new THREE.LatheGeometry(pts, 12), phase + i))
  }
  return { foliage: mergeParts(parts), height: 1.0, kind: 'bush', foliageOutline: true }
}
