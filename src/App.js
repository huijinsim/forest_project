import * as THREE from 'three'
import { CONFIG } from './config.js'
import { Renderer } from './core/Renderer.js'
import { Forest } from './world/Forest.js'
import { PostFX } from './post/PostFX.js'

// ─────────────────────────────────────────────────────────────
// App — Forest → PostFX → RAF
// 줌(앞뒤) + X축 패닝(좌우) + 마우스 패럴랙스
// ─────────────────────────────────────────────────────────────
export class App {
  constructor({ container, loaderEl }) {
    this.container = container
    this.loaderEl = loaderEl
    this.clock = new THREE.Clock()

    this.pointerTarget = new THREE.Vector2(0, 0)
    this.pointer = new THREE.Vector2(0, 0)

    this.zoomSmooth = CONFIG.camera.zoom.value
    this.panSmooth = CONFIG.camera.pan.value

    this._keys = { left: false, right: false }

    this._posOv = new THREE.Vector3(...CONFIG.camera.overview.position)
    this._posCl = new THREE.Vector3(...CONFIG.camera.close.position)
    this._tgtOv = new THREE.Vector3(...CONFIG.camera.overview.target)
    this._tgtCl = new THREE.Vector3(...CONFIG.camera.close.target)
    this._lookAt = new THREE.Vector3()

    this.renderer = new Renderer(container)
    this._bindEvents()
  }

  async init() {
    this.forest = new Forest()
    this.postfx = new PostFX(this.renderer.instance)
    this.resize()
    this.loaderEl.classList.add('is-hidden')
    this.clock.start()
    this._loop()
  }

  _bindEvents() {
    this._onResize = () => this.resize()
    window.addEventListener('resize', this._onResize)

    this._onPointerMove = (e) => {
      this.pointerTarget.x = (e.clientX / window.innerWidth) * 2 - 1
      this.pointerTarget.y = -((e.clientY / window.innerHeight) * 2 - 1)
    }
    window.addEventListener('pointermove', this._onPointerMove)

    this._onWheel = (e) => {
      e.preventDefault()
      const pan = CONFIG.camera.pan
      const zoom = CONFIG.camera.zoom

      // 가로 휠 / Shift+세로 휠 → X축 이동
      const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : (e.shiftKey ? e.deltaY : 0)
      if (dx !== 0) {
        pan.value = THREE.MathUtils.clamp(
          pan.value - dx * pan.wheelSpeed,
          pan.min,
          pan.max,
        )
        return
      }

      // 세로 휠 → 줌
      zoom.value = THREE.MathUtils.clamp(
        zoom.value - e.deltaY * zoom.speed,
        0,
        1,
      )
      window.dispatchEvent(new CustomEvent('forest:zoom', { detail: zoom.value }))
    }
    this.container.addEventListener('wheel', this._onWheel, { passive: false })

    this._onKeyDown = (e) => {
      if (e.key === 'ArrowLeft') this._keys.left = true
      if (e.key === 'ArrowRight') this._keys.right = true
    }
    this._onKeyUp = (e) => {
      if (e.key === 'ArrowLeft') this._keys.left = false
      if (e.key === 'ArrowRight') this._keys.right = false
    }
    window.addEventListener('keydown', this._onKeyDown)
    window.addEventListener('keyup', this._onKeyUp)
  }

  resize() {
    this.renderer.resize()
    if (this.postfx) {
      const dpr = Math.min(window.devicePixelRatio, CONFIG.renderer.maxPixelRatio)
      this.postfx.resize(this.container.clientWidth, this.container.clientHeight, dpr)
    }
  }

  _loop() {
    this._raf = requestAnimationFrame(() => this._loop())

    const delta = this.clock.getDelta()
    const elapsed = this.clock.getElapsedTime()

    const p = CONFIG.parallax
    const a = 1 - Math.pow(1 - p.damping, delta * 60)
    this.pointer.lerp(this.pointerTarget, a)

    // 화살표 ← → : X축 이동
    const panCfg = CONFIG.camera.pan
    if (this._keys.left) panCfg.value = THREE.MathUtils.clamp(panCfg.value - panCfg.keySpeed * delta, panCfg.min, panCfg.max)
    if (this._keys.right) panCfg.value = THREE.MathUtils.clamp(panCfg.value + panCfg.keySpeed * delta, panCfg.min, panCfg.max)

    const zd = CONFIG.camera.zoom
    const za = 1 - Math.pow(1 - zd.damping, delta * 60)
    this.zoomSmooth += (zd.value - this.zoomSmooth) * za

    const pa = 1 - Math.pow(1 - panCfg.damping, delta * 60)
    this.panSmooth += (panCfg.value - this.panSmooth) * pa

    const t = this.zoomSmooth
    const panX = this.panSmooth
    const cam = this.renderer.camera

    cam.position.lerpVectors(this._posOv, this._posCl, t)
    this._lookAt.lerpVectors(this._tgtOv, this._tgtCl, t)

    // X축 패닝 — 카메라와 시선을 같이 이동
    cam.position.x += panX
    this._lookAt.x += panX

    const parallaxScale = THREE.MathUtils.lerp(0.35, 0.75, t)
    cam.position.x += this.pointer.x * p.strength * parallaxScale
    cam.position.y += this.pointer.y * p.strength * 0.55 * parallaxScale

    const breathe = p.breathe * (1 - t * 0.6)
    cam.position.x += Math.sin(elapsed * p.breatheSpeed) * breathe
    cam.position.y += Math.cos(elapsed * p.breatheSpeed * 0.7) * breathe * 0.5

    cam.lookAt(
      this._lookAt.x - this.pointer.x * p.look * parallaxScale,
      this._lookAt.y - this.pointer.y * p.look * parallaxScale,
      this._lookAt.z,
    )

    cam.fov = THREE.MathUtils.lerp(CONFIG.camera.overview.fov, CONFIG.camera.close.fov, t)
    if (cam.aspect < 1.05) cam.fov += (1.05 - cam.aspect) * 12
    if (t > 0.5) cam.fov += (t - 0.5) * 6
    cam.updateProjectionMatrix()

    this.forest.update(elapsed)
    this.postfx.render(this.forest.scene, cam, elapsed)
  }

  dispose() {
    cancelAnimationFrame(this._raf)
    window.removeEventListener('resize', this._onResize)
    window.removeEventListener('pointermove', this._onPointerMove)
    window.removeEventListener('keydown', this._onKeyDown)
    window.removeEventListener('keyup', this._onKeyUp)
    this.container.removeEventListener('wheel', this._onWheel)
    this.forest?.dispose()
    this.postfx?.dispose()
    this.renderer.dispose()
  }
}
