import * as THREE from 'three'

// ─────────────────────────────────────────────────────────────
// Mountain — 일러스트형 산맥 (Lathe 둥근 언덕 X → 뾰족한 능선 실루엣)
// 카메라(+z)를 향해 Extrude된 jagged 프로필로 여러 봉우리 표현
// ─────────────────────────────────────────────────────────────

/**
 * 뾰족한 봉우리가 있는 산 실루엣 (XY 평면) → Z 방향으로 두께
 * @param {number} width  가로 폭
 * @param {number} height 최고봉 높이
 * @param {number} depth  Z 두께(원근)
 * @param {Function} rng
 */
export function buildMountain(width, height, depth, rng) {
  const w = width
  const h = height
  const d = depth

  // 봉우리 개수·높이에 난수 → 매 산마다 다른 실루엣
  const peakCount = 3 + Math.floor(rng() * 2)
  const shape = new THREE.Shape()
  shape.moveTo(-w * 0.5, 0)

  for (let i = 0; i <= peakCount; i++) {
    const t = i / peakCount
    const x = -w * 0.5 + w * t
    const envelope = Math.sin(t * Math.PI)
    const jag = 0.1 * Math.sin(t * (peakCount + 2) * Math.PI + rng() * 2)
    const y = h * envelope * (0.88 + rng() * 0.12 + jag)
    shape.lineTo(x, Math.max(0, y))
  }

  shape.lineTo(w * 0.5, 0)
  shape.lineTo(-w * 0.5, 0)

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: d,
    bevelEnabled: false,
    steps: 1,
  })

  // 중심 정렬: extrude는 +Z로 늘어남 → -Z/2 만큼 이동해 대칭
  geo.translate(0, 0, -d / 2)
  geo.computeVertexNormals()
  return geo
}

/** 멀리 보이는 보조 능선 (더 낮고 넓음) */
export function buildMountainRidge(width, height, depth, rng) {
  const w = width
  const h = height
  const shape = new THREE.Shape()
  shape.moveTo(-w * 0.5, 0)

  const pts = [
    [-0.4, 0.35], [-0.22, 0.55], [-0.05, 0.78], [0.12, 0.62], [0.28, 0.48], [0.45, 0.3],
  ]
  for (const [nx, nh] of pts) {
    shape.lineTo(w * nx, h * nh * (0.9 + rng() * 0.1))
  }
  shape.lineTo(w * 0.5, 0)
  shape.lineTo(-w * 0.5, 0)

  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false })
  geo.translate(0, 0, -depth / 2)
  geo.computeVertexNormals()
  return geo
}
