// ─────────────────────────────────────────────────────────────
// config.js — 산속 숲 일러스트(970A…) 색감·구도 기준
// ─────────────────────────────────────────────────────────────

export const CONFIG = {
  renderer: {
    maxPixelRatio: 2,
    clearColor: '#edd9a0',
  },

  // 줌 0 = 숲 전체(멀리), 1 = 나무 사이(가까이)
  camera: {
    overview: {
      position: [0, 16, 68],
      target: [0, 5, -38],
      fov: 50,
    },
    close: {
      position: [0, 4.2, 17],
      target: [0, 3.8, -16],
      fov: 46,  // 넓게 → 캐노피 상하 잘림 방지
    },
    zoom: {
      value: 0,       // 0~1, UI·휠이 갱신
      speed: 0.0014,  // 휠 감도
      damping: 0.1,
    },
    // X축 이동(좌우 패닝) — 카메라·시선을 함께 밀어 숲을 가로로 탐색
    pan: {
      value: 0,
      min: -62,
      max: 62,
      wheelSpeed: 0.035,
      keySpeed: 24,   // 화살표 키 (유닛/초)
      damping: 0.1,
    },
    near: 0.1,
    far: 800,
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
    width: 0.02, // 평소 고정 두께
    color: '#2a2e26',
  },

  fog: {
    color: '#ead8aa',
    near: 32,
    far: 165,
  },

  sky: {
    top: '#e5c582',     // 따뜻한 오크라 (하늘)
    bottom: '#f3e5ab',  // 지평선 쪽 밝은 크림
    horizon: '#ede0b0', // 구름·산 경계부
    radius: 420,
  },

  // 구름 — 하늘에 은은하게 녹아드는 레이어
  clouds: {
    driftAmp: 0.1,
    opacity: 0.36,       // 낮을수록 더 투명·덜 튐
    skyBlend: 0.62,      // 하늘색과 섞는 비율
    items: [
      // [x, y, z, scale, variant(0~2), shade(0밝음/1그림자)]
      [-58, 34, -118, 6.2, 2, 0],
      [12, 38, -125, 7.0, 2, 0],
      [68, 32, -112, 5.4, 2, 1],
      [-92, 44, -142, 7.5, 2, 0],
      [98, 40, -135, 6.5, 1, 0],
      [-8, 48, -148, 8.0, 2, 0],
      [42, 26, -102, 4.8, 0, 1],
      [-38, 28, -105, 5.0, 0, 1],
      [115, 34, -128, 5.6, 1, 1],
      [-130, 36, -138, 5.2, 1, 1],
    ],
    scatter: 8,
  },

  forest: {
    seed: 2026,
    treeCount: 980,
    fillGrid: 480,
    areaX: 96,
    zNear: 14,
    zFar: -175,
    clearingCenter: [0, -4],
    clearingRadius: 2.6,
    bushCount: 210,
    grassClumps: 95,
    cattails: 52,
    ferns: 68,
    rows: 11,
    minTreeScale: 0.58,
    maxTreeScale: 1.42,
    canopyPadding: 1.06, // 캐노피 반경 합 × 여유 — 겹침 방지
  },

  mountains: [
    // [x, z, 가로폭, 높이, Z두께] — 뾰족한 능선 실루엣
    [-58, -218, 148, 96, 42],
    [8, -235, 172, 108, 48],
    [62, -222, 128, 82, 36],
    [-118, -228, 118, 72, 32],
    [118, -225, 138, 88, 38],
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
  mountain: ['#a8bc98', '#b8c8a8', '#98b090'],
  mountainShadow: '#8aa080',
  cloud: '#f0e8cc',
  cloudShade: '#e5dcc0',
  grass: '#9bab7a',
  fern: '#b4c494',
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
