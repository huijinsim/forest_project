import { CONFIG } from '../config.js'

// ─────────────────────────────────────────────────────────────
// Debug
// 순수 DOM(프레임워크 없음)으로 만든 실시간 파라미터 패널.
// 슬라이더가 CONFIG 값을 직접 바꾸고, 각 모듈이 매 프레임 CONFIG를
// 읽으므로 화면을 보면서 즉시 튜닝할 수 있다.
//   - 'H' 키로 표시/숨김 토글
//   - 'C' 버튼으로 현재 값을 콘솔에 JSON으로 덤프(코드 반영용)
// 프로덕션에서 빼려면 main.js에서 new Debug(...) 한 줄만 지우면 된다.
// ─────────────────────────────────────────────────────────────
export class Debug {
  constructor() {
    this.visible = true
    this._buildDom()
    this._bindKeys()
  }

  _buildDom() {
    const root = document.createElement('div')
    root.id = 'debug-panel'
    root.innerHTML = /* html */ `
      <style>
        #debug-panel {
          position: fixed; top: 14px; right: 14px; z-index: 20;
          width: 240px; padding: 12px 14px 14px;
          background: rgba(28, 34, 24, 0.82); color: #e8eddd;
          font: 12px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace;
          border-radius: 10px; backdrop-filter: blur(6px);
          box-shadow: 0 6px 24px rgba(0,0,0,0.25); user-select: none;
        }
        #debug-panel h4 {
          margin: 10px 0 6px; font-size: 11px; letter-spacing: 0.12em;
          text-transform: uppercase; color: #aebf8e; font-weight: 700;
        }
        #debug-panel h4:first-of-type { margin-top: 2px; }
        #debug-panel .row { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 4px; margin: 3px 0; }
        #debug-panel .row label { opacity: 0.85; }
        #debug-panel .row .val { font-variant-numeric: tabular-nums; opacity: 0.7; min-width: 44px; text-align: right; }
        #debug-panel input[type=range] { grid-column: 1 / -1; width: 100%; accent-color: #9cc06a; height: 16px; }
        #debug-panel .bar {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 6px; padding-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.12);
        }
        #debug-panel .bar .title { font-weight: 700; letter-spacing: 0.08em; }
        #debug-panel .bar .hint { font-size: 10px; opacity: 0.55; }
        #debug-panel button {
          margin-top: 10px; width: 100%; padding: 6px; cursor: pointer;
          background: #9cc06a; color: #20281a; border: 0; border-radius: 6px;
          font: 700 11px ui-monospace, monospace; letter-spacing: 0.08em;
        }
        #debug-panel button:hover { background: #aed080; }
      </style>
      <div class="bar">
        <span class="title">🌿 TUNER</span>
        <span class="hint">H: 숨김</span>
      </div>
      <div class="body"></div>
      <button type="button" data-action="dump">현재 값 콘솔에 복사용 출력</button>
    `
    document.body.appendChild(root)
    this.root = root
    const body = root.querySelector('.body')

    // ── 컨트롤 정의: [대상 객체, 키, 라벨, min, max, step] ──
    this._addGroup(body, '바람 (Wind)', [
      [CONFIG.wind, 'speed', '속도', 0, 3, 0.01],
      [CONFIG.wind, 'frequency', '주파수', 0, 8, 0.05],
      [CONFIG.wind, 'amplitude', '진폭', 0, 0.3, 0.002],
    ])
    this._addGroup(body, '패럴랙스 (Parallax)', [
      [CONFIG.parallax, 'strength', '세기', 0, 4, 0.05],
      [CONFIG.parallax, 'damping', '감쇠', 0.01, 0.3, 0.005],
      [CONFIG.parallax, 'look', '시선', 0, 2, 0.02],
      [CONFIG.parallax, 'breathe', '호흡', 0, 1, 0.01],
    ])
    this._addGroup(body, '공간 · 선 (Space)', [
      [CONFIG.outline, 'width', '외곽선', 0, 0.15, 0.002],
      [CONFIG.fog, 'near', '안개시작', 0, 120, 1],
      [CONFIG.fog, 'far', '안개끝', 40, 400, 1],
      [CONFIG.light, 'ambient', '환경광', 0, 1, 0.01],
    ])
    this._addGroup(body, '종이질감 (Paper)', [
      [CONFIG.paper, 'grain', '그레인', 0, 0.3, 0.005],
      [CONFIG.paper, 'vignette', '비네팅', 0, 1, 0.01],
      [CONFIG.paper, 'vignetteSoftness', '부드러움', 0, 1, 0.01],
    ])

    root.querySelector('[data-action="dump"]').addEventListener('click', () => {
      // 코드(config.js)에 반영하기 쉽도록 보기 좋게 출력
      console.log('[forest] 현재 CONFIG 일부:\n', JSON.stringify(
        { wind: CONFIG.wind, parallax: CONFIG.parallax, paper: CONFIG.paper },
        null, 2,
      ))
    })
  }

  /** 한 섹션(제목 + 슬라이더들) 추가 */
  _addGroup(parent, title, controls) {
    const h = document.createElement('h4')
    h.textContent = title
    parent.appendChild(h)
    for (const [obj, key, label, min, max, step] of controls) {
      this._addSlider(parent, obj, key, label, min, max, step)
    }
  }

  /** 슬라이더 하나 추가: CONFIG 값을 직접 변경 */
  _addSlider(parent, obj, key, label, min, max, step) {
    const row = document.createElement('div')
    row.className = 'row'

    const lab = document.createElement('label')
    lab.textContent = label
    const val = document.createElement('span')
    val.className = 'val'
    val.textContent = (+obj[key]).toFixed(3)

    const input = document.createElement('input')
    input.type = 'range'
    input.min = String(min)
    input.max = String(max)
    input.step = String(step)
    input.value = String(obj[key])

    input.addEventListener('input', () => {
      const v = parseFloat(input.value)
      obj[key] = v // CONFIG를 직접 변경 → 다음 프레임에 반영
      val.textContent = v.toFixed(3)
    })

    row.appendChild(lab)
    row.appendChild(val)
    row.appendChild(input)
    parent.appendChild(row)
  }

  _bindKeys() {
    this._onKey = (e) => {
      if (e.key === 'h' || e.key === 'H') {
        this.visible = !this.visible
        this.root.style.display = this.visible ? 'block' : 'none'
      }
    }
    window.addEventListener('keydown', this._onKey)
  }

  dispose() {
    window.removeEventListener('keydown', this._onKey)
    this.root.remove()
  }
}
