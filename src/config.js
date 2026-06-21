// ─────────────────────────────────────────────────────────────
// config.js — Ethereal Forest 설정
// ─────────────────────────────────────────────────────────────

export const CONFIG = {
  renderer: {
    maxPixelRatio: 1.5,
    clearColor: '#f5e8cc',
    toneMappingExposure: 1.14,
  },

  dayCycle: {
    default: 0.38,
  },

  // Summer Afternoon 무드 — 따뜻한 오후 빛 + 부드러운 발광
  quality: {
    aoRadius: 2.4,
    aoScale: 0.38,
    bloomStrength: 0.1,
    bloomRadius: 0.72,
    bloomThreshold: 0.78,
  },

  painterly: {
    edgeThreshold: 0.2,
    edgeSoftness: 0.34,
    inkColor: '#4a4438',
    inkStrength: 0.22,
    hatchScale: 4.0,
    hatchStrength: 0.0,
    hatchInk: '#5a7058',
    celLevels: 7,
    celMix: 0.1,
    paper: 0.015,
    paperScale: 2.8,
    wash: 0.05,
    washColor: '#f8ecd8',
    saturation: 1.06,
    lift: 0.022,
    shadowTint: '#5a7058',
    highlightTint: '#fff0d0',
    vignette: 0.04,
  },

  // 숲 초입길 시점 (길 입구 위쪽에서 안쪽을 내려다봄)
  camera: {
    overview: {
      position: [-7, 22, 92],
      target: [2, 6, 30],
      fov: 38,
    },
    close: {
      position: [-6, 20, 84],
      target: [6, 6, 22],
      fov: 34,
    },
    zoom: {
      value: 0.78,
      default: 0.78,
      speed: 0.0022,
      damping: 0.12,
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
      title: 'About Me',
      body: '공간과 감각, 기술이 만나는 접점을 탐구하는 디자이너 심희진의 이야기.',
    },
    pink: {
      bg: '#c96a8a',
      title: 'Works',
      body: '자연의 언어를 디지털로 번역한 프로젝트들을 소개합니다.',
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
    color: '#f4f2ec',
    ambientColor: '#c8dcd8',
    bounceColor: '#a898a8',
    ambient: 0.94,
    highlight: 0.14,
    skyFill: 0.26,
    lightMix: 0.12,
    bounceStrength: 0.1,
    moodColor: '#c0d0c8',
    moodStrength: 0.32,
    groundMoodStrength: 0.4,
  },

  outline: {
    width: 0.008,
    color: '#484840',
  },

  /** 3D 스케치 선 — 해칭·외곽선·포스트 엣지 */
  sketch: {
    hatchStrength: 0.2,
    ink: '#484840',
    edgeStrength: 0.28,
    edgeThreshold: 0.055,
    inkNoise: 0.36,
    outlineWobble: 0.0045,
  },

  /** 2.5D — 3D 메시 Y축 눌림 + 플랫 일러스트 */
  flat25d: {
    squashY: 0.36,
    normalFlatten: 0.98,
    shadeBands: 2,
    layerStrength: 0.92,
    layerFog: 0.42,
    colorLevels: 10,
    fogWash: '#dce8d8',
    paperStage: 0.04,
  },

  sky: {
    top: '#5a98d8',
    bottom: '#8ec8f0',
    horizon: '#6eb0e4',
    sunset: '#78b8e8',
    radius: 420,
    celestialX: -0.92,
    celestialY: 0.22,
    isMoon: 0,
  },

  // 몽환적 포스트 FX
  dream: {
    bloomThreshold: 0.64,
    bloomStrength: 0.045,
    bloomRadius: 2.0,
    warmTint: 0.012,
    warmColor: '#f0ece4',
    lift: 0.02,
    haze: 0.012,
    saturation: 0.78,
  },

  // 구름
    clouds: {
    driftAmp: 0.1,
    opacity: 0.12,
    skyBlend: 0.94,
    // GLB 구름 모델 (디오라마 주변에 떠 있음)
    models: [
      { id: 'cloud-puff', url: '/models/cloud-puff.glb', size: 18 },
    ],
    count: 9,
    minScale: 0.7,
    maxScale: 1.5,
    yMin: 38,
    yMax: 66,
    radiusMin: 0.55,
    radiusMax: 1.25,
    items: [
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

  /** 액자 미리보기 — PNG 구름 (풀스크린에서는 숨김) */
  frameClouds: {
    seed: 9042,
    urls: ['/cloud/cloud1.PNG', '/cloud/cloud2.PNG', '/cloud/cloud3.PNG'],
    perImage: 3,
    sizeVw: 46,
    scaleMin: 0.34,
    scaleMax: 0.62,
    driftSpeed: 2.4,
    bobMin: 0.8,
    bobMax: 2.8,
    bobSpeedMin: 0.22,
    bobSpeedMax: 0.48,
    rotMin: 0.6,
    rotMax: 2.4,
    rotSpeedMin: 0.1,
    rotSpeedMax: 0.22,
  },

  /** 디오라마 섬 — 받침대 위 정사각 숲 + 언덕 + 길 */
  diorama: {
    // GLB 지형 사용 (없으면 절차적 언덕)
    terrainUrl: '/models/hill-terrain2.glb',
    glbHeight: 13,
    glbFill: 1.1,
    glbGrid: 220,
    glbSmooth: 5,
    size: 150,
    grid: 320,
    edgeMargin: 14,
    base: 11,
    rimHeight: 1.8,
    rimColor: '#8cb868',
    grassLow: '#5a8f48',
    grassHigh: '#a8d068',
    soilColor: '#c4a888',
    colorHeight: 11,
    surfaceNoise: 2.0,
    hills: [
      { x: 0, z: -14, amp: 9, r: 62 },
      { x: -34, z: 18, amp: 4.5, r: 44 },
      { x: 36, z: 4, amp: 5, r: 46 },
      { x: 12, z: -40, amp: 5.5, r: 50 },
    ],
    path: [
      [-8, 70],
      [-2, 46],
      [14, 26],
      [4, 4],
      [-16, -16],
      [-6, -38],
      [10, -58],
    ],
    pathWidth: 8,
    pathCarve: 0.7,
    pathColor: '#dcc8a8',
    rockCount: 46,
  },

  forest: {
    seed: 2026,
    treeModelHeight: 5.8,
    groundSamplePad: 1.4,
    groundLift: 0.02,
    treeGroundSink: -0.06,
    terrain: {
      url: '/models/emerald-hills.glb',
      width: 400,
      height: 8,
      gridSize: 96,
    },
    treeModelMaterial: {
      tint: '#c8d4b0',
      colorTop: '#dce8c4',
      colorBottom: '#8a8490',
      groundTone: '#d0dcc0',
      groundMix: 0.22,
      variation: 0.08,
      brightness: 1.08,
      saturation: 0.72,
    },
    /** GLB 나무 종류 */
    treeModels: [
      {
        id: 'soft-cypress',
        url: '/models/soft-cypress.glb',
        height: 6.2,
        count: 140,
        minScale: 0.72,
        maxScale: 1.28,
        material: {
          tint: '#4a7a52',
          trunk: '#8b7355',
          trunkRatio: 0.22,
        },
      },
      {
        id: 'soft-pine',
        url: '/models/soft-pine.glb',
        height: 6.0,
        count: 130,
        minScale: 0.64,
        maxScale: 1.16,
        material: {
          tint: '#88c060',
          trunk: '#8b7355',
          trunkRatio: 0.18,
        },
      },
      {
        id: 'soft-bubble',
        url: '/models/soft-bubble.glb',
        height: 5.4,
        count: 160,
        minScale: 0.68,
        maxScale: 1.22,
        groundSink: -0.12,
        material: {
          tint: '#9cd070',
          trunk: '#9a8068',
          trunkRatio: 0.12,
        },
      },
      {
        id: 'plant-a',
        url: '/models/plant-a.glb',
        height: 1.15,
        count: 70,
        minScale: 0.32,
        maxScale: 0.58,
        canopyRadiusScale: 0.38,
        groundSink: -0.05,
        material: {
          tint: '#88c060',
          trunk: '#8b7355',
        },
      },
      {
        id: 'plant-b',
        url: '/models/plant-b.glb',
        height: 1.25,
        count: 65,
        minScale: 0.3,
        maxScale: 0.55,
        canopyRadiusScale: 0.36,
        groundSink: -0.05,
        material: {
          tint: '#a0d070',
          trunk: '#8b7355',
        },
      },
    ],
    areaX: 88,
    zNear: 14,
    zFar: -175,
    clearingCenter: [0, -4],
    clearingRadius: 2.6,
    bushCount: 210,
    cattails: 52,
    ferns: 68,
    rows: 10,
    treeScaleMul: 1.5,
    minTreeScale: 0.72,
    maxTreeScale: 1.28,
    canopyPadding: 1.04,
    canopyRadiusScale: 0.82,
  },

  /** 2D 배경 — 산 없음, 흰 하늘 */
  skyMountains: {
    horizonFallback: 0.52,
    tint: '#ffffff',
    tintMid: '#ffffff',
    tintNear: '#ffffff',
    nightTint: '#3d4540',
    farSkyMix: 0.28,
    midSkyMix: 0.22,
    nearSkyMix: 0.16,
    layers: [],
  },

  paper: {
    grain: 0.022,
    vignette: 0.08,
    vignetteSoftness: 0.72,
  },
}

export const PALETTE = {
  ground: '#a8d068',
  groundWarm: '#f8ecd8',
  groundPatchLight: '#b8dc78',
  groundPatchDark: '#5a8f48',
  groundDirt: '#dcc8a8',
  bush: '#5a8f48',
  cloud: '#fff4e0',
  cloudShade: '#f0e0c8',
  fern: '#98c868',
  cattailStalk: '#a09078',
  cattailTipBright: '#f0d878',
}
