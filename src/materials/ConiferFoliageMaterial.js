import * as THREE from 'three'
import { CONFIG, PALETTE } from '../config.js'
import vertexShader from '../shaders/conifer.vert'
import fragmentShader from '../shaders/conifer.frag'

// ─────────────────────────────────────────────────────────────
// ConiferFoliageMaterial — 레퍼런스 침엽 그라데이션
// ─────────────────────────────────────────────────────────────
export class ConiferFoliageMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uWindSpeed: { value: CONFIG.wind.speed },
        uWindFreq: { value: CONFIG.wind.frequency },
        uWindAmp: { value: CONFIG.wind.amplitude },
        uSwayBase: { value: CONFIG.wind.swayBase },
        uSwayTop: { value: CONFIG.wind.swayTop },
        uColorTop: { value: new THREE.Color(PALETTE.coniferLight) },
        uColorBottom: { value: new THREE.Color(PALETTE.coniferDark) },
        uLightDir: { value: new THREE.Vector3(...CONFIG.light.direction).normalize() },
        uLightColor: { value: new THREE.Color(CONFIG.light.color) },
        uAmbient: { value: CONFIG.light.ambient },
        uHighlight: { value: CONFIG.light.highlight },
        uFogColor: { value: new THREE.Color(CONFIG.fog.color) },
        uFogNear: { value: CONFIG.fog.near },
        uFogFar: { value: CONFIG.fog.far },
      },
    })
  }

  update(elapsed) {
    const u = this.uniforms
    u.uTime.value = elapsed
    u.uWindSpeed.value = CONFIG.wind.speed
    u.uWindFreq.value = CONFIG.wind.frequency
    u.uWindAmp.value = CONFIG.wind.amplitude
    u.uAmbient.value = CONFIG.light.ambient
    u.uHighlight.value = CONFIG.light.highlight
    u.uFogNear.value = CONFIG.fog.near
    u.uFogFar.value = CONFIG.fog.far
  }
}
