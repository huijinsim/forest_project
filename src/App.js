import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { CONFIG } from './config.js'
import { Renderer } from './core/Renderer.js'
import { PostFX } from './post/PostFX.js'
import { Forest } from './world/Forest.js'
import { loadAllTreeTemplates, loadTreeTemplate } from './world/TreeModel.js'
import { loadCloudTemplates } from './world/CloudModel.js'
import { buildHillDiorama } from './world/Diorama.js'
import { PageOverlay } from './ui/PageOverlay.js'
import { loadFonts } from './ui/loadFonts.js'
import { TimeSlider } from './ui/TimeSlider.js'
import { DayCycle } from './systems/DayCycle.js'

// ─────────────────────────────────────────────────────────────
// App — 풀스크린 3D 숲 장소 (OrbitControls 자유 탐색)
// 클릭 → 나무: About / 나비: Works
// ─────────────────────────────────────────────────────────────
export class App {
  constructor({ container, loaderEl }) {
    this.container = container
    this.loaderEl = loaderEl
    this.clock = new THREE.Clock()

    this.mainActive = false
    this._forestLoading = null

    this._raycaster = new THREE.Raycaster()
    this._ndc = new THREE.Vector2()
    this._down = { x: 0, y: 0, t: 0 }

    this.pageOverlay = new PageOverlay()

    this.renderer = new Renderer(container)
    this.postfx = new PostFX(this.renderer.instance, this.renderer.camera)
    this.dayCycle = new DayCycle()
    this.timeSlider = new TimeSlider((t) => {
      this.dayCycle.setTime(t)
      this.timeSlider.setLabel(this.dayCycle.atmosphere.label)
      this.dayCycle.apply(this.forest, this.renderer.camera)
    })

    this._initControls()
    this._bindEvents()
    this._resizeObserver = new ResizeObserver(() => this.resize())
    this._resizeObserver.observe(this.container)
  }

  _initControls() {
    const cam = this.renderer.camera
    const ov = CONFIG.camera.overview
    cam.position.set(...ov.position)
    cam.fov = ov.fov
    cam.updateProjectionMatrix()

    this.controls = new OrbitControls(cam, this.renderer.instance.domElement)
    this.controls.target.set(...ov.target)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.08
    this.controls.rotateSpeed = 0.6
    this.controls.zoomSpeed = 0.9
    this.controls.panSpeed = 0.6
    this.controls.minDistance = 6
    this.controls.maxDistance = 160
    this.controls.maxPolarAngle = Math.PI * 0.46
    this.controls.enabled = false
    this.controls.update()
  }

  bootstrap() {
    this.dayCycle.bindRenderer(this.renderer.instance)
    this.dayCycle.apply(null, this.renderer.camera)
    this.resize()
    this.clock.start()
    this._loop()
    return this.enterMain()
  }

  async _loadForest() {
    if (this.forest) return
    if (this._forestLoading) return this._forestLoading

    const pctEl = this.loaderEl.querySelector('.pct')
    this._forestLoading = (async () => {
      try {
        const templates = await loadAllTreeTemplates(CONFIG.forest.treeModels, (p) => {
          if (pctEl) pctEl.textContent = `${Math.round(p * 48)}%`
        })
        const bushTemplate = CONFIG.forest.bushModel
          ? await loadTreeTemplate(CONFIG.forest.bushModel.url, CONFIG.forest.bushModel, (p) => {
              if (pctEl) pctEl.textContent = `${Math.round(48 + p * 8)}%`
            })
          : null
        const flowerTemplates = CONFIG.forest.flowerModels?.length
          ? await loadAllTreeTemplates(CONFIG.forest.flowerModels, (p) => {
              if (pctEl) pctEl.textContent = `${Math.round(56 + p * 8)}%`
            })
          : []
        const cloudTemplates = await loadCloudTemplates(CONFIG.clouds.models, (p) => {
          if (pctEl) pctEl.textContent = `${Math.round(64 + p * 14)}%`
        })

        let diorama = null
        if (CONFIG.diorama.terrainUrl) {
          try {
            diorama = await buildHillDiorama(CONFIG.diorama.terrainUrl, Math.random, (p) => {
              if (pctEl) pctEl.textContent = `${Math.round(80 + p * 20)}%`
            })
          } catch (e) {
            console.warn('[forest] GLB 지형 로드 실패, 절차적 지형 사용:', e)
          }
        }

        this.forest = new Forest(templates, cloudTemplates, diorama, bushTemplate, flowerTemplates)
      } finally {
        this._forestLoading = null
      }
    })()

    return this._forestLoading
  }

  async enterMain() {
    if (this.mainActive) return

    loadFonts()

    const pctEl = this.loaderEl.querySelector('.pct')
    this.loaderEl.classList.remove('is-hidden')
    if (pctEl) pctEl.textContent = '0%'

    try {
      await this._loadForest()
      this.dayCycle.apply(this.forest, this.renderer.camera)
      this.timeSlider.setValue(this.dayCycle.t, false)
      this.timeSlider.setLabel(this.dayCycle.atmosphere.label)
      this.timeSlider.show(this.dayCycle.t)
      this.mainActive = true
      this.controls.enabled = true
      this.container.style.cursor = 'grab'
    } catch (err) {
      console.error('[forest] 숲 로드 실패:', err)
      if (pctEl) pctEl.textContent = '로드 실패'
      throw err
    } finally {
      this.loaderEl.classList.add('is-hidden')
    }
  }

  _bindEvents() {
    this._onResize = () => this.resize()
    window.addEventListener('resize', this._onResize)

    this._onPointerDown = (e) => {
      this._down.x = e.clientX
      this._down.y = e.clientY
      this._down.t = performance.now()
    }
    this._onPointerUp = (e) => this._handlePointerUp(e)
    this.container.addEventListener('pointerdown', this._onPointerDown)
    this.container.addEventListener('pointerup', this._onPointerUp)
  }

  _handlePointerUp(e) {
    if (!this.mainActive || !this.forest) return

    const dx = e.clientX - this._down.x
    const dy = e.clientY - this._down.y
    const moved = Math.hypot(dx, dy)
    const dt = performance.now() - this._down.t
    if (moved > 6 || dt > 350) return // 드래그(회전)는 무시

    const rect = this.container.getBoundingClientRect()
    this._ndc.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    )
    this._raycaster.setFromCamera(this._ndc, this.renderer.camera)
    const hits = this._raycaster.intersectObjects(this.forest.getPickables(), false)
    if (!hits.length) return

    const obj = hits[0].object
    const type = obj.userData.interactive
    if (type === 'tree' || obj.userData.isInstancedTrees) {
      this.pageOverlay.open('/about.html')
    } else if (type === 'butterfly') {
      this.pageOverlay.open('/works.html')
    }
  }

  resize() {
    this.renderer.resize()
    const rect = this.container.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio, CONFIG.renderer.maxPixelRatio)
    this.postfx?.resize(rect.width, rect.height, dpr)
  }

  _loop() {
    this._raf = requestAnimationFrame(() => this._loop())

    const elapsed = this.clock.getElapsedTime()
    this.controls?.update()

    const cam = this.renderer.camera
    if (this.forest) {
      this.dayCycle.apply(this.forest, cam)
      this.forest.update(elapsed)
      this.postfx.render(this.forest.scene, cam, elapsed)
    } else {
      this.renderer.render(new THREE.Scene(), cam)
    }
  }

  dispose() {
    cancelAnimationFrame(this._raf)
    window.removeEventListener('resize', this._onResize)
    this.container.removeEventListener('pointerdown', this._onPointerDown)
    this.container.removeEventListener('pointerup', this._onPointerUp)
    this._resizeObserver?.disconnect()
    this.controls?.dispose()
    this.pageOverlay?.dispose()
    this.timeSlider?.dispose()
    this.forest?.dispose()
    this.dayCycle?.dispose()
    this.postfx?.dispose()
    this.renderer.dispose()
  }
}
