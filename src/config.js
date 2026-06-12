// ─────────────────────────────────────────────────────────────
// config.js — 산속 숲 일러스트(970A…) 색감·구도 기준
// ─────────────────────────────────────────────────────────────

export const CONFIG = {
  renderer: {
    maxPixelRatio: 1.5,
    clearColor: '#f0dcc8',
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
      fov: 46,
    },
    zoom: {
      value: 0.78,
      default: 0.78,
      locked: false,
      speed: 0.0014,
      damping: 0.1,
    },
    pan: {
      value: 0,
      default: 0,
      min: -62,
      max: 62,
      wheelSpeed: 0.035,
      keySpeed: 24,
      damping: 0.1,
    },
    near: 0.1,
    far: 800,
  },

  intro: {
    title: 'Ethereal Forest',
    subtitle: '숲 속으로 들어가기',
    enterLabel: 'Enter the Forest',
  },

  interaction: {
    focusDuration: 1.35,
    returnDuration: 1.1,
    treeCameraOffset: [0, 1.0, 10.8],
    butterflyCameraOffset: [0, 0.45, 5.2],
    treeEnterLabel: '숲의 이야기 보기 ↗',
    butterflyEnterLabel: '나비의 속삭임 ↗',
    backLabel: '돌아가기',
  },

  butterflies: {
    count: 18,
    purple: '#a878e8',
    pink: '#f088b0',
    scaleMin: 0.72,
    scaleMax: 1.05,
    nearRatio: 0.45,
    zone: { x: 38, yMin: 2.0, yMax: 7.5, zNearMin: 4, zNearMax: 18, zFarMin: -42, zFarMax: -2 },
  },

  popups: {
    green: {
      bg: '#4a7a48',
      title: '숲의 이야기',
      body: '고요한 나무 사이, 바람과 빛이 속삭입니다.',
    },
    pink: {
      bg: '#c96a8a',
      title: '나비의 속삭임',
      body: '보랏빛·분홍빛 날개가 숲을 가로지릅니다.',
    },
  },

  parallax: {
    strength: 1.0,
    damping: 0.05,
    look: 0.45,
    breathe: 0.12,
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
    direction: [-0.22, 0.52, 0.48],
    color: '#ffe8c0',
    ambient: 0.84,
    highlight: 0.14,
  },

  outline: {
    width: 0.007,
    color: '#5a5e52',
  },

  fog: {
    color: '#f0dcc8',
    near: 16,
    far: 108,
  },

  sky: {
    top: '#c8d0e0',
    bottom: '#f5ddb0',
    horizon: '#f0b890',
    sunset: '#e89098',
    radius: 420,
  },

  // 몽환적 포스트 — 블룸·따뜻한 색감·헤이즈
  dream: {
    bloomThreshold: 0.48,
    bloomStrength: 0.42,
    bloomRadius: 3.2,
    warmTint: 0.28,
    warmColor: '#fff0d8',
    lift: 0.035,
    haze: 0.22,
    saturation: 0.9,
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
    treeModel: '/models/tree.glb',
    treeModelHeight: 5.8,
    treeModelMaterial: {
      tint: '#7a9858',
      brightness: 1.28,
      saturation: 1.12,
    },
    treeCount: 100,
    areaX: 88,
    zNear: 14,
    zFar: -175,
    clearingCenter: [0, -4],
    clearingRadius: 2.6,
    bushCount: 210,
    grassClumps: 95,
    cattails: 52,
    ferns: 68,
    rows: 10,
    minTreeScale: 0.72,
    maxTreeScale: 1.28,
    canopyPadding: 0.92,
    canopyRadiusScale: 0.82,
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
    grain: 0.028,
    vignette: 0.18,
    vignetteSoftness: 0.62,
  },
}

// ── 팔레트: 일러스트 추출 ─────────────────────────────────
export const PALETTE = {
  // 짙은 침엽 (중·전경만)
  foliageDark: ['#556848', '#5a7048', '#526040', '#607050'],
  // 밝은 잎 (중·전경)
  foliageLight: ['#7a9a5c', '#8da466', '#9bb576', '#a8c078'],
  // 원경·안개 속 (밝고 탁한 녹색)
  foliageMist: ['#a8b490', '#b0bc98', '#9aab82', '#b8c4a0'],
  trunk: '#9a7048',
  trunkDark: '#7a5838',
  coniferLight: '#c8dc62',
  coniferDark: '#2e5c32',
  ground: '#c8d4a8',
  groundWarm: '#d8dcb8',
  groundPatchLight: '#d4dea8',
  groundPatchDark: '#a8b888',
  groundDirt: '#9a9478',
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

/** 잎 색 선택: depth 0(먼)~1(가까움) — 원경은 안개색에 가깝게 */
export function pickFoliageColor(rng, depth) {
  const dark = PALETTE.foliageDark
  const light = PALETTE.foliageLight
  const mist = PALETTE.foliageMist

  if (depth < 0.38) return mist[Math.floor(rng() * mist.length)]
  if (depth < 0.58) {
    return rng() > 0.55
      ? mist[Math.floor(rng() * mist.length)]
      : light[Math.floor(rng() * light.length)]
  }
  if (depth < 0.75) {
    return rng() > 0.4
      ? light[Math.floor(rng() * light.length)]
      : dark[Math.floor(rng() * dark.length)]
  }
  return light[Math.floor(rng() * light.length)]
}
