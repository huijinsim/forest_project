import * as THREE from 'three'
import { CONFIG } from '../config.js'
import { SkyBackground } from './SkyBackground.js'

// ─────────────────────────────────────────────────────────────
// DayCycle — 슬라이더 색 → 배경 + 숲 조명·무드
// ─────────────────────────────────────────────────────────────

const _a = new THREE.Color()
const _b = new THREE.Color()
const _out = new THREE.Color()

function lerpHex(hexA, hexB, t) {
  return _out.copy(_a.set(hexA)).lerp(_b.set(hexB), t).getHexString()
}

function sampleTrack(keyframes, t, fields) {
  let i = 0
  while (i < keyframes.length - 2 && keyframes[i + 1].t <= t) i += 1
  const left = keyframes[i]
  const right = keyframes[i + 1]
  const local = THREE.MathUtils.clamp((t - left.t) / (right.t - left.t || 1), 0, 1)
  const result = {}
  for (const f of fields) {
    result[f] = lerpHex(left[f], right[f], local)
  }
  return result
}

function sampleNumberTrack(keyframes, t, field) {
  let i = 0
  while (i < keyframes.length - 2 && keyframes[i + 1].t <= t) i += 1
  const left = keyframes[i]
  const right = keyframes[i + 1]
  const local = THREE.MathUtils.clamp((t - left.t) / (right.t - left.t || 1), 0, 1)
  return THREE.MathUtils.lerp(left[field], right[field], local)
}

/** 배경 하늘 — 미피 스타일 선명한 블루 */
function pastelizeSkyHex(hex) {
  _a.set(hex.startsWith('#') ? hex : `#${hex}`)
  const hsl = { h: 0, s: 0, l: 0 }
  _a.getHSL(hsl)
  // 하늘 블루는 채도 유지
  if (hsl.h > 0.48 && hsl.h < 0.68) {
    hsl.s = Math.min(hsl.s * 1.08, 0.78)
    hsl.l = THREE.MathUtils.clamp(hsl.l, 0.58, 0.84)
    return _a.setHSL(hsl.h, hsl.s, hsl.l).getHexString()
  }
  hsl.s = Math.min(hsl.s * 0.88, 0.55)
  hsl.l = THREE.MathUtils.clamp(hsl.l * 0.98 + 0.02, 0.5, 0.9)
  return _a.setHSL(hsl.h, hsl.s, hsl.l).getHexString()
}

const SKY_TRACK = [
  { t: 0.0, top: '#72c8f4', bottom: '#89d8fa', horizon: '#a0e4fc', sunset: '#68c0ec' },
  { t: 0.25, top: '#68c4f2', bottom: '#84d4f8', horizon: '#9ce0fc', sunset: '#60b8e8' },
  { t: 0.5, top: '#5eb8ec', bottom: '#78ccf4', horizon: '#90daf8', sunset: '#58b0e4' },
  { t: 0.75, top: '#88b8d8', bottom: '#a0c8e0', horizon: '#b0d0e8', sunset: '#98b8d0' },
  { t: 1.0, top: '#3d4540', bottom: '#4a5048', horizon: '#5a6058', sunset: '#484e48' },
]

const LIGHT_TRACK = [
  { t: 0.0, color: '#fffef8', ambient: 0.92 },
  { t: 0.25, color: '#ffffff', ambient: 0.96 },
  { t: 0.5, color: '#fffef8', ambient: 0.94 },
  { t: 0.75, color: '#f0f0e8', ambient: 0.88 },
  { t: 1.0, color: '#7888a0', ambient: 0.56 },
]

/** 하늘 색 → 숲 조명·그림자·포스트 무드 */
function computeForestMood(sky, celestial, t) {
  const nightT = THREE.MathUtils.smoothstep(0.58, 1, t)
  const dayT = 1 - nightT
  const sunArc = Math.sin(t * Math.PI)

  const sunMix = celestial.isMoon
    ? 0.18
    : THREE.MathUtils.clamp(0.3 + sunArc * 0.5, 0.22, 0.82)
  const lightColor = `#${lerpHex(sky.horizon, sky.sunset, sunMix)}`
  const ambientColor = `#${lerpHex(sky.horizon, sky.bottom, 0.52)}`
  const bounceColor = `#${lerpHex(sky.bottom, '#6ea14a', 0.28)}`

  const ambient = sampleNumberTrack(LIGHT_TRACK, t, 'ambient')
  const bounceStrength = THREE.MathUtils.lerp(0.14, 0.05, nightT)
  const highlight = THREE.MathUtils.lerp(0.15, 0.05, nightT)

  const outlineColor = `#${lerpHex(lerpHex('#484840', sky.horizon, 0.08), '#2a3040', nightT * 0.58)}`
  const moodColor = `#${lerpHex(lerpHex(sky.horizon, sky.sunset, 0.38), '#b0b8a0', 0.18)}`
  const moodStrength = THREE.MathUtils.lerp(0.26, 0.42, sunArc) * dayT + 0.44 * nightT
  const groundMoodStrength = THREE.MathUtils.lerp(0.34, 0.52, sunArc) * dayT + 0.48 * nightT

  return {
    lightColor,
    ambientColor,
    bounceColor,
    ambient,
    skyFill: THREE.MathUtils.lerp(0.3, 0.46, sunArc) * dayT + 0.34 * nightT,
    lightMix: THREE.MathUtils.lerp(0.12, 0.26, sunArc) * dayT + 0.1 * nightT,
    bounceStrength,
    highlight,
    outlineColor,
    moodColor,
    moodStrength,
    groundMoodStrength,
    warmColor: `#${lerpHex(sky.sunset, sky.horizon, 0.28)}`,
    warmTint: THREE.MathUtils.lerp(0.008, 0.032, sunArc * dayT),
    saturation: THREE.MathUtils.lerp(0.68, 0.82, dayT),
    haze: THREE.MathUtils.lerp(0.014, 0.005, dayT),
    lift: THREE.MathUtils.lerp(0.012, 0.026, dayT),
  }
}

export class DayCycle {
  constructor() {
    this.t = CONFIG.dayCycle.default
    this.renderer = null
    this.skyBackground = new SkyBackground()
    this._atmosphere = this.sample(this.t)
    this.skyBackground.update(this._atmosphere.sky, this._atmosphere.celestial)
  }

  sample(t) {
    const raw = sampleTrack(SKY_TRACK, t, ['top', 'bottom', 'horizon', 'sunset'])
    const sky = {}
    for (const key of Object.keys(raw)) {
      sky[key] = pastelizeSkyHex(raw[key])
    }

    const celestialX = THREE.MathUtils.lerp(-0.92, 0.92, t)
    const celestialY = Math.sin(t * Math.PI) * 0.58 + 0.22
    const isMoon = t >= 0.5
    const celestial = { x: celestialX, y: celestialY, isMoon, t }
    const mood = computeForestMood(sky, celestial, t)

    return {
      t,
      sky,
      celestial,
      mood,
      label: this._label(t),
    }
  }

  _label(t) {
    if (t < 0.18) return '아침'
    if (t < 0.38) return '오전'
    if (t < 0.58) return '점심'
    if (t < 0.78) return '저녁'
    return '밤'
  }

  setTime(t) {
    this.t = THREE.MathUtils.clamp(t, 0, 1)
    this._atmosphere = this.sample(this.t)
    return this._atmosphere
  }

  get atmosphere() {
    return this._atmosphere
  }

  bindRenderer(renderer) {
    this.renderer = renderer
  }

  apply(forest, camera = null) {
    const a = this._atmosphere
    const m = a.mood

    this.skyBackground.update(a.sky, a.celestial, camera)

    if (this.renderer) {
      this.renderer.setClearColor(_a.set(`#${a.sky.bottom}`), 1)
    }

    const nightT = THREE.MathUtils.smoothstep(0.58, 1, a.t)
    const dayT = 1 - nightT

    if (forest?.scene) {
      forest.scene.background = this.skyBackground.texture
      if (!forest.scene.fog) forest.scene.fog = new THREE.Fog('#a0e4fc', 320, 1200)
      forest.scene.fog.color.set(`#${a.sky.horizon}`)
      forest.scene.fog.near = THREE.MathUtils.lerp(300, 100, nightT)
      forest.scene.fog.far = THREE.MathUtils.lerp(1300, 480, nightT)
    }

    if (forest?.sun) {
      forest.sun.color.set('#ffffff')
      forest.sun.intensity = THREE.MathUtils.lerp(0.3, 1.05, dayT)
      const dist = 170
      forest.sun.position.set(
        a.celestial.x * dist,
        Math.max(18, (a.celestial.y + 0.12) * dist),
        70,
      )
      forest.sun.target.position.set(0, 0, -30)
      forest.sun.target.updateMatrixWorld()
    }

    if (forest?.hemi) {
      forest.hemi.color.set(`#${a.sky.top}`)
      forest.hemi.groundColor.set('#6ea14a')
      forest.hemi.intensity = THREE.MathUtils.lerp(0.65, 1.0, dayT)
    }

    if (forest?.ambient) {
      forest.ambient.color.set('#f0f8ff')
      forest.ambient.intensity = THREE.MathUtils.lerp(0.55, 0.78, dayT)
    }
  }

  dispose() {
    this.skyBackground.dispose()
  }
}
