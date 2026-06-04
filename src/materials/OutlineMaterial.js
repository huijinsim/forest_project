import * as THREE from 'three'
import { CONFIG } from '../config.js'
import vertexShader from '../shaders/outline.vert'
import fragmentShader from '../shaders/outline.frag'

// ─────────────────────────────────────────────────────────────
// OutlineMaterial
// inverted-hull 잉크 외곽선 머티리얼.
// 뒷면을 노멀 방향으로 부풀려 그려 실루엣에 먹색 테두리를 남긴다.
// 채움(ToonMaterial)과 동일한 바람 유니폼을 써서 테두리가 함께 흔들린다.
// ─────────────────────────────────────────────────────────────
export class OutlineMaterial extends THREE.ShaderMaterial {
  /** @param {boolean} [wind=true] */
  constructor(wind = true) {
    super({
      vertexShader,
      fragmentShader,
      side: THREE.BackSide, // 뒷면만 그려 안쪽은 채움이 덮는다
      uniforms: {
        uTime: { value: 0 },
        uWindSpeed: { value: CONFIG.wind.speed },
        uWindFreq: { value: CONFIG.wind.frequency },
        uWindAmp: { value: wind ? CONFIG.wind.amplitude : 0 },
        uSwayBase: { value: CONFIG.wind.swayBase },
        uSwayTop: { value: CONFIG.wind.swayTop },
        uOutline: { value: CONFIG.outline.width },

        uInk: { value: new THREE.Color(CONFIG.outline.color) },
        uFogColor: { value: new THREE.Color(CONFIG.fog.color) },
        uFogNear: { value: CONFIG.fog.near },
        uFogFar: { value: CONFIG.fog.far },
      },
    })
    this._wind = wind
  }

  update(elapsed) {
    const u = this.uniforms
    u.uTime.value = elapsed
    u.uWindSpeed.value = CONFIG.wind.speed
    u.uWindFreq.value = CONFIG.wind.frequency
    u.uWindAmp.value = this._wind ? CONFIG.wind.amplitude : 0
    u.uOutline.value = CONFIG.outline.width
    u.uFogNear.value = CONFIG.fog.near
    u.uFogFar.value = CONFIG.fog.far
  }
}
