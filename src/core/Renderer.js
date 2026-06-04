import * as THREE from 'three'
import { CONFIG } from '../config.js'

// ─────────────────────────────────────────────────────────────
// Renderer
// WebGLRenderer + 카메라를 감싼 얇은 래퍼.
// 리사이즈와 픽셀비(DPR) 처리를 한곳에서 책임진다.
// ─────────────────────────────────────────────────────────────
export class Renderer {
  /** @param {HTMLElement} container 캔버스를 붙일 DOM */
  constructor(container) {
    this.container = container

    // WebGL 렌더러 ─ antialias로 손그림 외곽선 계단 현상 완화
    this.instance = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    })
    this.instance.setClearColor(new THREE.Color(CONFIG.renderer.clearColor), 1)
    this.instance.outputColorSpace = THREE.SRGBColorSpace
    container.appendChild(this.instance.domElement)

    // 원근 카메라 ─ 숲 속 빈터에 서서 안쪽을 바라보는 시점
    this.camera = new THREE.PerspectiveCamera(
      CONFIG.camera.fov,
      1, // aspect는 resize에서 갱신
      CONFIG.camera.near,
      CONFIG.camera.far,
    )
    this.camera.position.set(...CONFIG.camera.position)
    this.camera.lookAt(new THREE.Vector3(...CONFIG.camera.target))

    this.resize()
  }

  /** 뷰포트 크기에 맞춰 렌더러/카메라 갱신 */
  resize() {
    const w = this.container.clientWidth
    const h = this.container.clientHeight
    this.aspect = w / h

    const dpr = Math.min(window.devicePixelRatio, CONFIG.renderer.maxPixelRatio)
    this.instance.setPixelRatio(dpr)
    this.instance.setSize(w, h)

    this.camera.aspect = this.aspect
    this.camera.updateProjectionMatrix()
  }

  /** @param {THREE.Scene} scene */
  render(scene) {
    this.instance.render(scene, this.camera)
  }

  dispose() {
    this.instance.dispose()
    this.instance.domElement.remove()
  }
}
