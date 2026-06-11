import * as THREE from 'three'
import { CONFIG } from '../config.js'
import vertexShader from '../shaders/sky.vert'
import fragmentShader from '../shaders/sky.frag'

// ─────────────────────────────────────────────────────────────
// SkyMaterial
// 스카이돔(안쪽을 바라보는 큰 구)에 입히는 2색 그라데이션.
// 안개와 색을 맞춰 지평선에서 숲이 하늘로 자연스럽게 녹아든다.
// ─────────────────────────────────────────────────────────────
export class SkyMaterial extends THREE.ShaderMaterial {
  constructor() {
    super({
      vertexShader,
      fragmentShader,
      side: THREE.BackSide,
      depthWrite: false, // 항상 가장 뒤. 깊이에 영향 주지 않음
      uniforms: {
        uTop: { value: new THREE.Color(CONFIG.sky.top) },
        uBottom: { value: new THREE.Color(CONFIG.sky.bottom) },
        uHorizon: { value: new THREE.Color(CONFIG.sky.horizon) },
        uSunset: { value: new THREE.Color(CONFIG.sky.sunset) },
      },
    })
  }
}
