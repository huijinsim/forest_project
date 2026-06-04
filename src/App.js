import * as THREE from 'three'
import { CONFIG } from './config.js'
import { Renderer } from './core/Renderer.js'
import { Forest } from './world/Forest.js'
import { PostFX } from './post/PostFX.js'

// ─────────────────────────────────────────────────────────────
// App
// 전체 파이프라인을 조립하고 메인 루프를 돌리는 오케스트레이터.
//   Forest(3D 숲) → PostFX(종이질감) → RAF 루프
// 카메라는 마우스 패럴랙스 + 느린 자동 호흡으로 공간을 살아 움직이게 한다.
// 모든 시간 기반 처리는 Clock의 delta/elapsed로 한다.
// ─────────────────────────────────────────────────────────────
export class App {
  /**
   * @param {object} opts
   * @param {HTMLElement} opts.container
   * @param {HTMLElement} opts.loaderEl
   * @param {HTMLElement} opts.hudEl
   */
  constructor({ container, loaderEl, hudEl }) {
    this.container = container
    this.loaderEl = loaderEl
    this.hudEl = hudEl

    this.clock = new THREE.Clock()

    // 포인터: target = 원시 입력, smooth = 감쇠 적용된 값
    this.pointerTarget = new THREE.Vector2(0, 0)
    this.pointer = new THREE.Vector2(0, 0)

    // 카메라 기준 위치/시선 (패럴랙스는 이 값에 오프셋을 더한다)
    this.camBase = new THREE.Vector3(...CONFIG.camera.position)
    this.lookTarget = new THREE.Vector3(...CONFIG.camera.target)

    this.renderer = new Renderer(container)

    this._bindEvents()
  }

  /** 초기화: 숲 구성 → 루프 시작 (외부 에셋이 없어 즉시 준비됨) */
  async init() {
    this.forest = new Forest()
    this.postfx = new PostFX(this.renderer.instance)

    this.resize()
    this._updateHud('숲의 숨결')
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
  }

  resize() {
    this.renderer.resize()
    if (this.postfx) {
      const dpr = Math.min(window.devicePixelRatio, CONFIG.renderer.maxPixelRatio)
      this.postfx.resize(this.container.clientWidth, this.container.clientHeight, dpr)
    }
  }

  _updateHud(title) {
    const t = this.hudEl.querySelector('.ch-title')
    if (t) t.textContent = title
  }

  _loop() {
    this._raf = requestAnimationFrame(() => this._loop())

    const delta = this.clock.getDelta()
    const elapsed = this.clock.getElapsedTime()

    // 포인터 감쇠(프레임레이트 독립): delta 기반 지수 보간
    const a = 1 - Math.pow(1 - CONFIG.parallax.damping, delta * 60)
    this.pointer.lerp(this.pointerTarget, a)

    // ── 카메라 패럴랙스 + 자동 호흡 ──
    const p = CONFIG.parallax
    const breatheX = Math.sin(elapsed * p.breatheSpeed) * p.breathe
    const breatheY = Math.cos(elapsed * p.breatheSpeed * 0.7) * p.breathe * 0.5

    const cam = this.renderer.camera
    cam.position.set(
      this.camBase.x + this.pointer.x * p.strength + breatheX,
      this.camBase.y + this.pointer.y * p.strength * 0.6 + breatheY,
      this.camBase.z,
    )
    // 시선은 포인터 반대로 살짝 끌려가 입체감을 강조
    cam.lookAt(
      this.lookTarget.x - this.pointer.x * p.look,
      this.lookTarget.y - this.pointer.y * p.look,
      this.lookTarget.z,
    )

    // 숲(바람) 갱신
    this.forest.update(elapsed)

    // 종이질감 포스트로 출력
    this.postfx.render(this.forest.scene, cam, elapsed)
  }

  dispose() {
    cancelAnimationFrame(this._raf)
    window.removeEventListener('resize', this._onResize)
    window.removeEventListener('pointermove', this._onPointerMove)
    this.forest?.dispose()
    this.postfx?.dispose()
    this.renderer.dispose()
  }
}
