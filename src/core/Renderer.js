import * as THREE from 'three'
import { CONFIG } from '../config.js'

// ─────────────────────────────────────────────────────────────
// Renderer — WebGLRenderer + 카메라 래퍼
// ─────────────────────────────────────────────────────────────
export class Renderer {
  constructor(container) {
    this.container = container

    this.instance = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    })
    this.instance.setClearColor(new THREE.Color(CONFIG.renderer.clearColor), 1)
    this.instance.outputColorSpace = THREE.SRGBColorSpace
    container.appendChild(this.instance.domElement)

    const ov = CONFIG.camera.overview
    this.camera = new THREE.PerspectiveCamera(
      ov.fov,
      1,
      CONFIG.camera.near,
      CONFIG.camera.far,
    )
    this.camera.position.set(...ov.position)
    this.camera.lookAt(new THREE.Vector3(...ov.target))

    this.resize()
  }

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

  render(scene) {
    this.instance.render(scene, this.camera)
  }

  dispose() {
    this.instance.dispose()
    this.instance.domElement.remove()
  }
}
