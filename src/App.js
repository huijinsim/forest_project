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
   */
  constructor({ container, loaderEl }) {
    this.container = container
    this.loaderEl = loaderEl

    this.clock = new THREE.Clock()

    // 포인터: target = 원시 입력, smooth = 감쇠 적용된 값
    this.pointerTarget = new THREE.Vector2(0, 0)
    this.pointer = new THREE.Vector2(0, 0)

    // 카메라 기준 위치/시선 (패럴랙스는 이 값에 오프셋을 더한다)
    this.camBase = new THREE.Vector3(...CONFIG.camera.position)
    this.lookTarget = new THREE.Vector3(...CONFIG.camera.target)

    // 줌(시선 방향 돌리): target = 휠 입력, 현재값은 감쇠로 따라간다
    this.zoom = 0
    this.zoomTarget = 0
    // 카메라 → 시선 타깃 방향(정규화). 줌은 이 방향으로 전진/후진.
    this._forward = new THREE.Vector3().subVectors(this.lookTarget, this.camBase).normalize()

    this.renderer = new Renderer(container)

    this._bindEvents()
  }

  /** 초기화: 숲 구성 → 루프 시작 (외부 에셋이 없어 즉시 준비됨) */
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

    // 마우스 휠 → 줌인/줌아웃 (시선 방향 돌리). 페이지 스크롤은 막는다.
    this._onWheel = (e) => {
      e.preventDefault()
      const d = CONFIG.camera.dolly
      this.zoomTarget = THREE.MathUtils.clamp(
        this.zoomTarget - e.deltaY * d.speed,
        d.min,
        d.max,
      )
    }
    this.container.addEventListener('wheel', this._onWheel, { passive: false })
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

    // 포인터 감쇠(프레임레이트 독립): delta 기반 지수 보간
    const a = 1 - Math.pow(1 - CONFIG.parallax.damping, delta * 60)
    this.pointer.lerp(this.pointerTarget, a)

    // 줌 감쇠: 휠 목표값을 부드럽게 따라간다
    const za = 1 - Math.pow(1 - CONFIG.camera.dolly.damping, delta * 60)
    this.zoom += (this.zoomTarget - this.zoom) * za

    // ── 카메라 패럴랙스 + 자동 호흡 + 줌 돌리 ──
    const p = CONFIG.parallax
    const breatheX = Math.sin(elapsed * p.breatheSpeed) * p.breathe
    const breatheY = Math.cos(elapsed * p.breatheSpeed * 0.7) * p.breathe * 0.5

    const f = this._forward
    const cam = this.renderer.camera
    cam.position.set(
      this.camBase.x + f.x * this.zoom + this.pointer.x * p.strength + breatheX,
      this.camBase.y + f.y * this.zoom + this.pointer.y * p.strength * 0.6 + breatheY,
      this.camBase.z + f.z * this.zoom,
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
    this.container.removeEventListener('wheel', this._onWheel)
    this.forest?.dispose()
    this.postfx?.dispose()
    this.renderer.dispose()
  }
}
