// ─────────────────────────────────────────────────────────────
// config.js — 산속 숲 일러스트(970A…) 색감·구도 기준
// ─────────────────────────────────────────────────────────────

export const CONFIG = {
  renderer: {
    maxPixelRatio: 2,
    clearColor: '#edd9a0',
  },

  // 숲 입구에서 산·하늘 쪽을 바라보는 구도
  camera: {
    fov: 42,
    near: 0.1,
    far: 800,
    position: [0, 3.0, 26],
    target: [0, 7, -42],
    dolly: {
      min: -8,
      max: 28,
      speed: 0.028,
      damping: 0.08,
    },
  },

  parallax: {
    strength: 1.1,
    damping: 0.05,
    look: 0.55,
    breathe: 0.18,
    breatheSpeed: 0.16,
  },

  wind: {
    speed: 0.95,
    frequency: 0.22,
    amplitude: 0.16,
    swayBase: 1.5,
    swayTop: 9.0,
  },

  light: {
    direction: [-0.35, 0.92, 0.28],
    color: '#fff4d8',
    ambient: 0.7,
  },

  outline: {
    width: 0.032,
    color: '#2a2e26',
  },

  fog: {
    color: '#e8d4a8',
    near: 28,
    far: 150,
  },

  sky: {
    top: '#e5c582',
    bottom: '#f3e5ab',
    radius: 420,
  },

  forest: {
    seed: 2026,
    treeCount: 240,
    areaX: 88,
    zNear: 14,
    zFar: -175,
    // 일러스트 중앙 빈터(연한 바닥)
    clearingCenter: [0, -4],
    clearingRadius: 5.5,
    bushCount: 70,
    grassClumps: 28,
    cattails: 16,
    // 깊이별 밀도 가중
    rows: 5,
  },

  mountains: [
    [-70, -195, 88, 68],
    [-15, -220, 102, 78],
    [55, -205, 82, 62],
    [115, -215, 90, 65],
    [-130, -210, 72, 55],
  ],

  paper: {
    grain: 0.045,
    vignette: 0.28,
    vignetteSoftness: 0.48,
  },
}

// ── 팔레트: 일러스트 추출 ─────────────────────────────────
export const PALETTE = {
  // 짙은 침엽 (배경·원경)
  foliageDark: ['#4b5d3f', '#526848', '#465738', '#556a47'],
  // 밝은 잎 (중·전경)
  foliageLight: ['#7a9a5c', '#8da466', '#9bb576', '#a8c078'],
  trunk: '#8a8272',
  trunkDark: '#6e685c',
  ground: '#c8d4a8',
  groundWarm: '#d8dcb8',
  bush: '#5a6f4a',
  bushDark: '#4b5d3f',
  mountain: ['#c8d5b9', '#b8c8a8', '#d4deca'],
  mountainLine: '#8a9a7a',
  grass: '#9bab7a',
  cattailStalk: '#8a9078',
  cattailTip: '#d4a85a',
  cattailTipBright: '#e8c060',
}

/** 잎 색 선택: depth 0(먼)~1(가까움) */
export function pickFoliageColor(rng, depth) {
  const dark = PALETTE.foliageDark
  const light = PALETTE.foliageLight
  if (depth < 0.3) return dark[Math.floor(rng() * dark.length)]
  if (depth < 0.55) {
    return rng() > 0.5
      ? dark[Math.floor(rng() * dark.length)]
      : light[Math.floor(rng() * light.length)]
  }
  return light[Math.floor(rng() * light.length)]
}
