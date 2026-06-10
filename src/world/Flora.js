import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

// ─────────────────────────────────────────────────────────────
// Flora — 전경 풀·갈대 (일러스트 하단 장식)
// ─────────────────────────────────────────────────────────────

/** 날카로운 풀잎 여러 개 */
export function buildGrassClump(rng, count = 5) {
  const blades = []
  for (let i = 0; i < count; i++) {
    const h = 0.5 + rng() * 0.9
    const g = new THREE.PlaneGeometry(0.08, h, 1, 1)
    g.translate(0, h / 2, 0)
    g.rotateY((rng() - 0.5) * 1.2)
    g.rotateZ((rng() - 0.5) * 0.35)
    g.translate((rng() - 0.5) * 0.4, 0, (rng() - 0.5) * 0.3)
    blades.push(g)
  }
  return mergeGeometries(blades)
}

/** 갈대 줄기 (끝은 별도 메쉬로 색 분리) */
export function buildCattailStalk(height) {
  const g = new THREE.CylinderGeometry(0.025, 0.035, height, 5)
  g.translate(0, height / 2, 0)
  return g
}

/** 갈대 끝 (주황·노랑) */
export function buildCattailTip(rng) {
  const tipH = 0.2 + rng() * 0.12
  const g = new THREE.CylinderGeometry(0.075, 0.05, tipH, 6)
  g.translate(0, tipH / 2, 0)
  return g
}

/** 작은 양치·잡초 (일러스트 전경 포인트) */
export function buildSmallFern(rng) {
  const parts = []
  const n = 3 + Math.floor(rng() * 2)
  for (let i = 0; i < n; i++) {
    const h = 0.32 + rng() * 0.42
    const g = new THREE.PlaneGeometry(0.2, h, 1, 1)
    g.translate(0, h / 2, 0)
    g.rotateY(rng() * Math.PI * 2)
    g.rotateZ((rng() - 0.5) * 0.55)
    g.translate((rng() - 0.5) * 0.28, 0, (rng() - 0.5) * 0.22)
    parts.push(g)
  }
  return mergeGeometries(parts)
}
