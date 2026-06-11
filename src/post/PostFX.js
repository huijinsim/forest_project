import * as THREE from 'three'
import { CONFIG } from '../config.js'
import vertexShader from '../shaders/post.vert'
import fragmentShader from '../shaders/post.frag'

// ─────────────────────────────────────────────────────────────
// PostFX
// 씬을 렌더타깃에 먼저 그린 뒤, 그 결과를 풀스크린 쿼드에 입혀
// 종이 질감(그레인 + 비네팅)을 덧씌운다. (수동 2-pass 컴포저)
// ─────────────────────────────────────────────────────────────
export class PostFX {
  /** @param {THREE.WebGLRenderer} renderer */
  constructor(renderer) {
    this.renderer = renderer
    this.enabled = true

    // 씬을 그릴 오프스크린 렌더타깃
    this.renderTarget = new THREE.WebGLRenderTarget(1, 1, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      colorSpace: THREE.SRGBColorSpace,
    })

    // 풀스크린 쿼드 전용 씬/카메라
    this.quadScene = new THREE.Scene()
    this.quadCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uScene: { value: this.renderTarget.texture },
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uGrain: { value: CONFIG.paper.grain },
        uVignette: { value: CONFIG.paper.vignette },
        uVignetteSoftness: { value: CONFIG.paper.vignetteSoftness },
        uBloomThreshold: { value: CONFIG.dream.bloomThreshold },
        uBloomStrength: { value: CONFIG.dream.bloomStrength },
        uBloomRadius: { value: CONFIG.dream.bloomRadius },
        uWarmTint: { value: CONFIG.dream.warmTint },
        uWarmColor: { value: new THREE.Color(CONFIG.dream.warmColor) },
        uLift: { value: CONFIG.dream.lift },
        uHaze: { value: CONFIG.dream.haze },
        uSaturation: { value: CONFIG.dream.saturation },
      },
    })

    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.material)
    this.quadScene.add(quad)
  }

  resize(width, height, pixelRatio) {
    const w = Math.floor(width * pixelRatio)
    const h = Math.floor(height * pixelRatio)
    this.renderTarget.setSize(w, h)
    this.material.uniforms.uResolution.value.set(w, h)
  }

  /**
   * 씬을 렌더타깃에 그린 뒤 종이 질감을 입혀 화면에 출력.
   * @param {THREE.Scene} scene
   * @param {THREE.Camera} camera
   * @param {number} elapsed
   */
  render(scene, camera, elapsed) {
    this.material.uniforms.uTime.value = elapsed
    // 종이질감 파라미터를 CONFIG에서 매 프레임 동기화 → 실시간 튜닝
    this.material.uniforms.uGrain.value = CONFIG.paper.grain
    this.material.uniforms.uVignette.value = CONFIG.paper.vignette
    this.material.uniforms.uVignetteSoftness.value = CONFIG.paper.vignetteSoftness

    const d = CONFIG.dream
    const u = this.material.uniforms
    u.uBloomThreshold.value = d.bloomThreshold
    u.uBloomStrength.value = d.bloomStrength
    u.uBloomRadius.value = d.bloomRadius
    u.uWarmTint.value = d.warmTint
    u.uWarmColor.value.set(d.warmColor)
    u.uLift.value = d.lift
    u.uHaze.value = d.haze
    u.uSaturation.value = d.saturation

    if (!this.enabled) {
      this.renderer.setRenderTarget(null)
      this.renderer.render(scene, camera)
      return
    }

    // 1-pass: 씬 → 렌더타깃
    this.renderer.setRenderTarget(this.renderTarget)
    this.renderer.render(scene, camera)

    // 2-pass: 렌더타깃 → 화면(종이 질감 적용)
    this.renderer.setRenderTarget(null)
    this.renderer.render(this.quadScene, this.quadCamera)
  }

  dispose() {
    this.renderTarget.dispose()
    this.material.dispose()
  }
}
