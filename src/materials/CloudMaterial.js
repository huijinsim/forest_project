import * as THREE from 'three'
import { CONFIG } from '../config.js'
import vertexShader from '../shaders/cloud.vert'
import fragmentShader from '../shaders/cloud.frag'

// ─────────────────────────────────────────────────────────────
// CloudMaterial — 구름 전용 (밝은색, 약한 안개, uTime 표류)
// ─────────────────────────────────────────────────────────────
export class CloudMaterial extends THREE.ShaderMaterial {
  constructor(color) {
    super({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uDrift: { value: CONFIG.clouds.driftAmp },
        uColor: { value: new THREE.Color(color) },
        uFogColor: { value: new THREE.Color(CONFIG.fog.color) },
        uSkyColor: { value: new THREE.Color(CONFIG.sky.horizon) },
        uFogFar: { value: CONFIG.fog.far },
        uOpacity: { value: CONFIG.clouds.opacity },
        uSkyBlend: { value: CONFIG.clouds.skyBlend },
      },
    })
  }

  update(elapsed) {
    this.uniforms.uTime.value = elapsed
    this.uniforms.uDrift.value = CONFIG.clouds.driftAmp
    this.uniforms.uFogFar.value = CONFIG.fog.far
    this.uniforms.uOpacity.value = CONFIG.clouds.opacity
    this.uniforms.uSkyBlend.value = CONFIG.clouds.skyBlend
  }
}
