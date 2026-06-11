import * as THREE from 'three'
import gsap from 'gsap'
import { CONFIG } from './config.js'
import { Renderer } from './core/Renderer.js'
import { Forest } from './world/Forest.js'
import { PostFX } from './post/PostFX.js'
import { Popup } from './ui/Popup.js'
import { FocusCTA } from './ui/FocusCTA.js'

// ─────────────────────────────────────────────────────────────
// App — Forest → PostFX → RAF
// 자유 시점 + 클릭 확대 → CTA → 상세 팝업
// ─────────────────────────────────────────────────────────────
export class App {
  constructor({ container, loaderEl }) {
    this.container = container
    this.loaderEl = loaderEl
    this.clock = new THREE.Clock()

    this.pointerTarget = new THREE.Vector2(0, 0)
    this.pointer = new THREE.Vector2(0, 0)

    this.zoomSmooth = CONFIG.camera.zoom.default
    this.panSmooth = CONFIG.camera.pan.default

    this._keys = { left: false, right: false }

    this._posOv = new THREE.Vector3(...CONFIG.camera.overview.position)
    this._posCl = new THREE.Vector3(...CONFIG.camera.close.position)
    this._tgtOv = new THREE.Vector3(...CONFIG.camera.overview.target)
    this._tgtCl = new THREE.Vector3(...CONFIG.camera.close.target)
    this._lookAt = new THREE.Vector3()
    this._baseCamPos = new THREE.Vector3()
    this._baseLookAt = new THREE.Vector3()
    this._focusCamPos = new THREE.Vector3()
    this._focusTarget = new THREE.Vector3()

    this.mainActive = false
    this.focusBlend = 0
    this.focusState = 'idle' // idle | focused | popup
    this._focusVariant = null
    this._focusTween = null

    this._raycaster = new THREE.Raycaster()
    this._ndc = new THREE.Vector2()
    this.popup = new Popup()
    this.focusCTA = new FocusCTA({
      onEnter: () => this._openDetailPopup(),
      onBack: () => this._returnFromFocus(),
    })

    this.renderer = new Renderer(container)
    this._bindEvents()
  }

  async init() {
    CONFIG.camera.zoom.value = CONFIG.camera.zoom.default
    CONFIG.camera.pan.value = CONFIG.camera.pan.default

    this.forest = new Forest()
    this.postfx = new PostFX(this.renderer.instance)
    this.resize()
    this.loaderEl.classList.add('is-hidden')
    this.clock.start()
    this._loop()
  }

  enterMain() {
    this.mainActive = true
    this.container.style.cursor = 'pointer'
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
      if (!this.mainActive || this.focusState !== 'idle') return
      e.preventDefault()

      const pan = CONFIG.camera.pan
      const zoom = CONFIG.camera.zoom

      const dx = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : (e.shiftKey ? e.deltaY : 0)
      if (dx !== 0) {
        pan.value = THREE.MathUtils.clamp(pan.value - dx * pan.wheelSpeed, pan.min, pan.max)
        return
      }

      zoom.value = THREE.MathUtils.clamp(zoom.value - e.deltaY * zoom.speed, 0, 1)
      window.dispatchEvent(new CustomEvent('forest:zoom', { detail: zoom.value }))
    }
    this.container.addEventListener('wheel', this._onWheel, { passive: false })

    this._onKeyDown = (e) => {
      if (this.focusState !== 'idle') return
      if (e.key === 'ArrowLeft') this._keys.left = true
      if (e.key === 'ArrowRight') this._keys.right = true
    }
    this._onKeyUp = (e) => {
      if (e.key === 'ArrowLeft') this._keys.left = false
      if (e.key === 'ArrowRight') this._keys.right = false
    }
    window.addEventListener('keydown', this._onKeyDown)
    window.addEventListener('keyup', this._onKeyUp)

    this._onPointerDown = (e) => this._handlePointerDown(e)
    this.container.addEventListener('pointerdown', this._onPointerDown)
  }

  _handlePointerDown(e) {
    if (!this.mainActive || this.focusState !== 'idle' || !this.forest) return

    const rect = this.container.getBoundingClientRect()
    this._ndc.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    )
    this._raycaster.setFromCamera(this._ndc, this.renderer.camera)
    const hits = this._raycaster.intersectObjects(this.forest.getPickables(), false)
    if (!hits.length) return

    const hit = hits[0].object
    const type = hit.userData.interactive
    const root = hit.userData.root
    if (!type || !root) return

    this._focusInteractive(type, root)
  }

  _focusInteractive(type, root) {
    this.focusState = 'focusing'
    this._focusVariant = type === 'tree' ? 'green' : 'pink'
    this.container.style.cursor = 'default'

    const target = new THREE.Vector3()
    root.getWorldPosition(target)
    if (type === 'tree') target.y += root.userData.focusY ?? 2

    const offsetArr =
      type === 'tree' ? CONFIG.interaction.treeCameraOffset : CONFIG.interaction.butterflyCameraOffset
    const offset = new THREE.Vector3(...offsetArr)

    const camDir = new THREE.Vector3()
    this.renderer.camera.getWorldDirection(camDir)
    camDir.y = 0
    if (camDir.lengthSq() < 0.001) camDir.set(0, 0, 1)
    camDir.normalize()

    const side = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), camDir).normalize()
    this._focusTarget.copy(target)
    this._focusCamPos.copy(target)
    this._focusCamPos.addScaledVector(camDir, -offset.z)
    this._focusCamPos.y += offset.y
    this._focusCamPos.addScaledVector(side, offset.x)

    this._focusTween?.kill()
    this._focusTween = gsap.to(this, {
      focusBlend: 1,
      duration: CONFIG.interaction.focusDuration,
      ease: 'power2.inOut',
      onComplete: () => {
        this.focusState = 'focused'
        this.focusCTA.show(this._focusVariant)
      },
    })
  }

  _openDetailPopup() {
    if (this.focusState !== 'focused' || !this._focusVariant) return
    this.focusCTA.hide()
    this.focusState = 'popup'
    this.popup.open(this._focusVariant, () => this._returnFromFocus())
  }

  _returnFromFocus() {
    this.focusCTA.hide()
    this.popup.close(true)
    this._focusTween?.kill()
    this._focusTween = gsap.to(this, {
      focusBlend: 0,
      duration: CONFIG.interaction.returnDuration,
      ease: 'power2.inOut',
      onComplete: () => {
        this.focusState = 'idle'
        this._focusVariant = null
        if (this.mainActive) this.container.style.cursor = 'pointer'
      },
    })
  }

  resize() {
    this.renderer.resize()
    if (this.postfx) {
      const dpr = Math.min(window.devicePixelRatio, CONFIG.renderer.maxPixelRatio)
      this.postfx.resize(this.container.clientWidth, this.container.clientHeight, dpr)
    }
  }

  _applyBaseCamera(elapsed, delta) {
    const p = CONFIG.parallax
    const a = 1 - Math.pow(1 - p.damping, delta * 60)
    this.pointer.lerp(this.pointerTarget, a)

    const panCfg = CONFIG.camera.pan
    const zoomCfg = CONFIG.camera.zoom

    if (this.focusState === 'idle') {
      if (this._keys.left) {
        panCfg.value = THREE.MathUtils.clamp(panCfg.value - panCfg.keySpeed * delta, panCfg.min, panCfg.max)
      }
      if (this._keys.right) {
        panCfg.value = THREE.MathUtils.clamp(panCfg.value + panCfg.keySpeed * delta, panCfg.min, panCfg.max)
      }
      const za = 1 - Math.pow(1 - zoomCfg.damping, delta * 60)
      this.zoomSmooth += (zoomCfg.value - this.zoomSmooth) * za
      const pa = 1 - Math.pow(1 - panCfg.damping, delta * 60)
      this.panSmooth += (panCfg.value - this.panSmooth) * pa
    }

    const t = this.zoomSmooth
    const panX = this.panSmooth
    const cam = this.renderer.camera

    cam.position.lerpVectors(this._posOv, this._posCl, t)
    this._lookAt.lerpVectors(this._tgtOv, this._tgtCl, t)

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

    this._baseCamPos.copy(cam.position)
    this._baseLookAt.copy(this._lookAt)
  }

  _loop() {
    this._raf = requestAnimationFrame(() => this._loop())

    const delta = this.clock.getDelta()
    const elapsed = this.clock.getElapsedTime()

    this._applyBaseCamera(elapsed, delta)

    const cam = this.renderer.camera
    if (this.focusBlend > 0.001) {
      cam.position.lerpVectors(this._baseCamPos, this._focusCamPos, this.focusBlend)
      this._lookAt.lerpVectors(this._baseLookAt, this._focusTarget, this.focusBlend)
      cam.lookAt(this._lookAt)
    }

    if (this.forest) this.forest.update(elapsed)
    this.postfx.render(this.forest.scene, cam, elapsed)
  }

  dispose() {
    cancelAnimationFrame(this._raf)
    this._focusTween?.kill()
    window.removeEventListener('resize', this._onResize)
    window.removeEventListener('pointermove', this._onPointerMove)
    window.removeEventListener('keydown', this._onKeyDown)
    window.removeEventListener('keyup', this._onKeyUp)
    this.container.removeEventListener('wheel', this._onWheel)
    this.container.removeEventListener('pointerdown', this._onPointerDown)
    this.focusCTA?.dispose()
    this.popup?.dispose()
    this.forest?.dispose()
    this.postfx?.dispose()
    this.renderer.dispose()
  }
}
