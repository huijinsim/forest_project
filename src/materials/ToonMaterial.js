import * as THREE from 'three'
import { CONFIG } from '../config.js'
import vertexShader from '../shaders/toon.vert'
import fragmentShader from '../shaders/toon.frag'

// ─────────────────────────────────────────────────────────────
// ToonMaterial
// 셀 셰이딩 + 바람 + 공기원근(안개) 채움 머티리얼.
// 나무 잎/줄기/바닥/산 등 모든 "면"에 쓰는 기본 머티리얼.
// 시간 기반 값은 update(elapsed)에서 uTime/바람 유니폼으로 갱신한다.
// ─────────────────────────────────────────────────────────────
export class ToonMaterial extends THREE.ShaderMaterial {
  /**
   * @param {object} opts
   * @param {string|THREE.Color} opts.color        기본색
   * @param {boolean} [opts.wind=true]             바람 적용 여부(바닥/산은 false)
   */
  constructor({ color, wind = true }) {
    super({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        // 바람: wind=false면 진폭 0으로 고정
        uWindSpeed: { value: CONFIG.wind.speed },
        uWindFreq: { value: CONFIG.wind.frequency },
        uWindAmp: { value: wind ? CONFIG.wind.amplitude : 0 },
        uSwayBase: { value: CONFIG.wind.swayBase },
        uSwayTop: { value: CONFIG.wind.swayTop },

        uBaseColor: { value: new THREE.Color(color) },
        uLightDir: { value: new THREE.Vector3(...CONFIG.light.direction).normalize() },
        uLightColor: { value: new THREE.Color(CONFIG.light.color) },
        uAmbient: { value: CONFIG.light.ambient },
        uHighlight: { value: CONFIG.light.highlight },

        uFogColor: { value: new THREE.Color(CONFIG.fog.color) },
        uFogNear: { value: CONFIG.fog.near },
        uFogFar: { value: CONFIG.fog.far },
      },
    })
    this._wind = wind
  }

  /** 매 프레임: 시간 + CONFIG에서 실시간 튜닝 값 반영 */
  update(elapsed) {
    const u = this.uniforms
    u.uTime.value = elapsed
    u.uWindSpeed.value = CONFIG.wind.speed
    u.uWindFreq.value = CONFIG.wind.frequency
    u.uWindAmp.value = this._wind ? CONFIG.wind.amplitude : 0
    u.uAmbient.value = CONFIG.light.ambient
    u.uHighlight.value = CONFIG.light.highlight
    u.uFogNear.value = CONFIG.fog.near
    u.uFogFar.value = CONFIG.fog.far
  }
}
