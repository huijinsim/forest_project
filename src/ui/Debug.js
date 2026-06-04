import { CONFIG } from '../config.js'

// ─────────────────────────────────────────────────────────────
// Debug
// 순수 DOM(프레임워크 없음)으로 만든 작고 모던한 실시간 파라미터 패널.
// 슬라이더가 CONFIG 값을 직접 바꾸고, 각 모듈이 매 프레임 CONFIG를
// 읽으므로 화면을 보면서 즉시 튜닝할 수 있다.
//   - 헤더 클릭: 접기/펼치기   - 'H' 키: 표시/숨김   - 'Copy' 버튼: 콘솔 덤프
// 프로덕션에서 빼려면 main.js에서 Debug 관련 줄만 지우면 된다.
// ─────────────────────────────────────────────────────────────
export class Debug {
  constructor() {
    this.visible = true
    this.collapsed = false
    this._buildDom()
    this._bindKeys()
  }

  _buildDom() {
    const root = document.createElement('div')
    root.id = 'tuner'
    root.innerHTML = /* html */ `
      <style>
        #tuner {
          position: fixed; top: 12px; right: 12px; z-index: 20;
          width: 176px; padding: 8px;
          background: rgba(22, 28, 19, 0.66);
          color: #eaf0e0;
          font: 10px/1.3 ui-sans-serif, -apple-system, 'Segoe UI', sans-serif;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px;
          backdrop-filter: blur(10px) saturate(1.1);
          -webkit-backdrop-filter: blur(10px) saturate(1.1);
          box-shadow: 0 8px 30px rgba(0,0,0,0.28);
          user-select: none;
        }
        #tuner .head {
          display: flex; align-items: center; gap: 6px;
          cursor: pointer; padding: 2px 2px 6px;
        }
        #tuner .head .dot { width: 7px; height: 7px; border-radius: 50%; background: #a6cf6f; box-shadow: 0 0 6px #a6cf6f88; }
        #tuner .head .name { font-weight: 600; font-size: 10px; letter-spacing: 0.14em; flex: 1; }
        #tuner .head .chev { font-size: 9px; opacity: 0.5; transition: transform 0.2s ease; }
        #tuner.is-collapsed .chev { transform: rotate(-90deg); }
        #tuner.is-collapsed .body, #tuner.is-collapsed .foot { display: none; }

        #tuner h5 {
          margin: 8px 0 3px; font-size: 8px; font-weight: 700;
          letter-spacing: 0.18em; text-transform: uppercase; color: #9fc06e; opacity: 0.85;
        }
        #tuner h5:first-child { margin-top: 2px; }

        #tuner .row { display: grid; grid-template-columns: 46px 1fr 30px; align-items: center; gap: 6px; height: 18px; }
        #tuner .row label { opacity: 0.7; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        #tuner .row .val { font-variant-numeric: tabular-nums; opacity: 0.6; text-align: right; font-size: 9px; }

        /* 얇고 모던한 슬라이더 */
        #tuner input[type=range] { -webkit-appearance: none; appearance: none; width: 100%; height: 14px; background: transparent; cursor: pointer; }
        #tuner input[type=range]::-webkit-slider-runnable-track { height: 3px; border-radius: 3px; background: rgba(255,255,255,0.16); }
        #tuner input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 11px; height: 11px; margin-top: -4px; border-radius: 50%; background: #b6db82; box-shadow: 0 1px 3px rgba(0,0,0,0.4); }
        #tuner input[type=range]::-moz-range-track { height: 3px; border-radius: 3px; background: rgba(255,255,255,0.16); }
        #tuner input[type=range]::-moz-range-thumb { width: 11px; height: 11px; border: 0; border-radius: 50%; background: #b6db82; }

        #tuner .foot { display: flex; gap: 6px; margin-top: 8px; }
        #tuner .foot button {
          flex: 1; padding: 5px; cursor: pointer;
          background: rgba(255,255,255,0.06); color: #cfe0b4;
          border: 1px solid rgba(255,255,255,0.1); border-radius: 7px;
          font: 600 9px ui-sans-serif, sans-serif; letter-spacing: 0.08em;
          transition: background 0.15s ease;
        }
        #tuner .foot button:hover { background: rgba(182,219,130,0.18); }
      </style>
      <div class="head">
        <span class="dot"></span>
        <span class="name">TUNER</span>
        <span class="chev">▾</span>
      </div>
      <div class="body"></div>
      <div class="foot">
        <button type="button" data-action="dump">Copy</button>
        <button type="button" data-action="reset">Hide (H)</button>
      </div>
    `
    document.body.appendChild(root)
    this.root = root
    const body = root.querySelector('.body')

    // ── 컨트롤 정의: [대상 객체, 키, 라벨, min, max, step] ──
    this._addGroup(body, 'Wind', [
      [CONFIG.wind, 'speed', '속도', 0, 3, 0.01],
      [CONFIG.wind, 'frequency', '주파수', 0, 8, 0.05],
      [CONFIG.wind, 'amplitude', '진폭', 0, 0.3, 0.002],
    ])
    this._addGroup(body, 'Parallax', [
      [CONFIG.parallax, 'strength', '세기', 0, 4, 0.05],
      [CONFIG.parallax, 'damping', '감쇠', 0.01, 0.3, 0.005],
      [CONFIG.parallax, 'look', '시선', 0, 2, 0.02],
      [CONFIG.parallax, 'breathe', '호흡', 0, 1, 0.01],
    ])
    this._addGroup(body, 'Space', [
      [CONFIG.outline, 'width', '외곽선', 0, 0.15, 0.002],
      [CONFIG.fog, 'near', '안개~', 0, 120, 1],
      [CONFIG.fog, 'far', '~안개', 40, 400, 1],
      [CONFIG.light, 'ambient', '환경광', 0, 1, 0.01],
    ])
    this._addGroup(body, 'Paper', [
      [CONFIG.paper, 'grain', '그레인', 0, 0.3, 0.005],
      [CONFIG.paper, 'vignette', '비네팅', 0, 1, 0.01],
      [CONFIG.paper, 'vignetteSoftness', '부드럽', 0, 1, 0.01],
    ])

    // 헤더 클릭 → 접기/펼치기
    root.querySelector('.head').addEventListener('click', () => {
      this.collapsed = !this.collapsed
      root.classList.toggle('is-collapsed', this.collapsed)
    })

    root.querySelector('[data-action="dump"]').addEventListener('click', (e) => {
      e.stopPropagation()
      console.log('[forest] CONFIG snapshot:\n', JSON.stringify(
        { wind: CONFIG.wind, parallax: CONFIG.parallax, outline: CONFIG.outline, fog: CONFIG.fog, paper: CONFIG.paper },
        null, 2,
      ))
    })
    root.querySelector('[data-action="reset"]').addEventListener('click', (e) => {
      e.stopPropagation()
      this._toggleVisible()
    })
  }

  _addGroup(parent, title, controls) {
    const h = document.createElement('h5')
    h.textContent = title
    parent.appendChild(h)
    for (const [obj, key, label, min, max, step] of controls) {
      this._addSlider(parent, obj, key, label, min, max, step)
    }
  }

  _addSlider(parent, obj, key, label, min, max, step) {
    const row = document.createElement('div')
    row.className = 'row'

    const lab = document.createElement('label')
    lab.textContent = label
    const val = document.createElement('span')
    val.className = 'val'
    val.textContent = (+obj[key]).toFixed(step < 0.01 ? 3 : 2)

    const input = document.createElement('input')
    input.type = 'range'
    input.min = String(min)
    input.max = String(max)
    input.step = String(step)
    input.value = String(obj[key])

    input.addEventListener('input', () => {
      const v = parseFloat(input.value)
      obj[key] = v // CONFIG 직접 변경 → 다음 프레임 반영
      val.textContent = v.toFixed(step < 0.01 ? 3 : 2)
    })

    row.appendChild(lab)
    row.appendChild(input)
    row.appendChild(val)
    parent.appendChild(row)
  }

  _toggleVisible() {
    this.visible = !this.visible
    this.root.style.display = this.visible ? 'block' : 'none'
  }

  _bindKeys() {
    this._onKey = (e) => {
      if (e.key === 'h' || e.key === 'H') this._toggleVisible()
    }
    window.addEventListener('keydown', this._onKey)
  }

  dispose() {
    window.removeEventListener('keydown', this._onKey)
    this.root.remove()
  }
}
