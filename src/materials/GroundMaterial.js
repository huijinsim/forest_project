import * as THREE from 'three'
import { CONFIG, PALETTE } from '../config.js'
import vertexShader from '../shaders/ground.vert'
import fragmentShader from '../shaders/ground.frag'

// ─────────────────────────────────────────────────────────────
// GroundMaterial — 잔디·흙 패치 질감 바닥
// ─────────────────────────────────────────────────────────────
export class GroundMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      vertexShader,
      fragmentShader,
      uniforms: {
        uBaseColor: { value: new THREE.Color(PALETTE.ground) },
        uPatchLight: { value: new THREE.Color(PALETTE.groundPatchLight) },
        uPatchDark: { value: new THREE.Color(PALETTE.groundPatchDark) },
        uDirtColor: { value: new THREE.Color(PALETTE.groundDirt) },
        uLightDir: { value: new THREE.Vector3(...CONFIG.light.direction).normalize() },
        uLightColor: { value: new THREE.Color(CONFIG.light.color) },
        uAmbient: { value: CONFIG.light.ambient },
        uFogColor: { value: new THREE.Color(CONFIG.fog.color) },
        uFogNear: { value: CONFIG.fog.near },
        uFogFar: { value: CONFIG.fog.far },
      },
    })
  }

  update(elapsed) {
    const u = this.uniforms
    u.uAmbient.value = CONFIG.light.ambient
    u.uFogNear.value = CONFIG.fog.near
    u.uFogFar.value = CONFIG.fog.far
  }
}
