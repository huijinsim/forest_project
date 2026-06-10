import { CONFIG } from '../config.js'

// ─────────────────────────────────────────────────────────────
// Debug — 하단 가로 튜너 + 토글 아이콘
// Wind / Space / Zoom 만 노출. Parallax·Paper 제외.
// ─────────────────────────────────────────────────────────────
export class Debug {
  constructor() {
    this.panelOpen = false
    this._buildDom()
    this._bindKeys()
  }

  _buildDom() {
    // ── 토글 FAB (항상 표시) ──
    this.toggleBtn = document.createElement('button')
    this.toggleBtn.id = 'tuner-toggle'
    this.toggleBtn.type = 'button'
    this.toggleBtn.setAttribute('aria-label', '튜너 열기/닫기')
    this.toggleBtn.innerHTML = /* html */ `
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <line x1="4" y1="7" x2="20" y2="7"/><circle cx="8" cy="7" r="2" fill="currentColor" stroke="none"/>
        <line x1="4" y1="12" x2="20" y2="12"/><circle cx="15" cy="12" r="2" fill="currentColor" stroke="none"/>
        <line x1="4" y1="17" x2="20" y2="17"/><circle cx="10" cy="17" r="2" fill="currentColor" stroke="none"/>
      </svg>
    `

    // ── 가로 패널 ──
    this.root = document.createElement('div')
    this.root.id = 'tuner'
    this.root.innerHTML = /* html */ `
      <style>
        #tuner-toggle {
          position: fixed; bottom: 18px; right: 18px; z-index: 30;
          width: 42px; height: 42px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background: rgba(22, 28, 19, 0.78); color: #b6db82;
          border: 1px solid rgba(255,255,255,0.12);
          backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
          box-shadow: 0 4px 20px rgba(0,0,0,0.25);
          cursor: pointer; transition: background 0.15s, transform 0.15s;
        }
        #tuner-toggle:hover { background: rgba(40, 50, 32, 0.9); transform: scale(1.05); }
        #tuner-toggle.is-active { color: #eaf0e0; background: rgba(60, 75, 48, 0.92); }

        #tuner {
          position: fixed; bottom: 70px; left: 50%; transform: translateX(-50%);
          z-index: 29; display: none;
          flex-direction: row; align-items: flex-start; gap: 24px;
          padding: 12px 18px; max-width: min(720px, calc(100vw - 32px));
          background: rgba(22, 28, 19, 0.82); color: #eaf0e0;
          font: 10px/1.3 ui-sans-serif, -apple-system, sans-serif;
          border: 1px solid rgba(255,255,255,0.1); border-radius: 14px;
          backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
          user-select: none;
        }
        #tuner.is-open { display: flex; }

        #tuner .col { display: flex; flex-direction: column; gap: 6px; min-width: 148px; }
        #tuner .col-title {
          font-size: 8px; font-weight: 700; letter-spacing: 0.16em;
          text-transform: uppercase; color: #9fc06e; margin-bottom: 2px;
        }

        #tuner .row { display: flex; align-items: center; gap: 8px; height: 22px; }
        #tuner .row label { width: 42px; opacity: 0.75; flex-shrink: 0; }
        #tuner .row input[type=range] { flex: 1; min-width: 72px; height: 14px; -webkit-appearance: none; appearance: none; background: transparent; cursor: pointer; }
        #tuner .row input[type=range]::-webkit-slider-runnable-track { height: 3px; border-radius: 3px; background: rgba(255,255,255,0.18); }
        #tuner .row input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; width: 11px; height: 11px; margin-top: -4px; border-radius: 50%; background: #b6db82; }
        #tuner .row .val { width: 34px; text-align: right; font-size: 9px; opacity: 0.65; font-variant-numeric: tabular-nums; flex-shrink: 0; }

        #tuner .zoom-hint { font-size: 8px; opacity: 0.5; margin-top: 2px; letter-spacing: 0.04em; }
      </style>
    `

    document.body.appendChild(this.toggleBtn)
    document.body.appendChild(this.root)

    this._addColumn(this.root, 'Wind', [
      [CONFIG.wind, 'speed', '속도', 0, 3, 0.01],
      [CONFIG.wind, 'frequency', '주파수', 0, 8, 0.05],
      [CONFIG.wind, 'amplitude', '진폭', 0, 0.3, 0.002],
    ])

    this._addColumn(this.root, 'Space', [
      [CONFIG.fog, 'near', '안개~', 0, 120, 1],
      [CONFIG.fog, 'far', '~안개', 40, 400, 1],
      [CONFIG.light, 'ambient', '환경광', 0, 1, 0.01],
    ])

    this._addColumn(this.root, 'Zoom', [
      [CONFIG.camera.zoom, 'value', '거리', 0, 1, 0.01],
    ], true)

    this.toggleBtn.addEventListener('click', () => this._togglePanel())
  }

  _addColumn(parent, title, controls, isZoom = false) {
    const col = document.createElement('div')
    col.className = 'col'

    const h = document.createElement('div')
    h.className = 'col-title'
    h.textContent = title
    col.appendChild(h)

    for (const [obj, key, label, min, max, step] of controls) {
      this._addSlider(col, obj, key, label, min, max, step)
    }

    if (isZoom) {
      const hint = document.createElement('div')
      hint.className = 'zoom-hint'
      hint.textContent = '휠 ↑ 가까이 · ↓ 멀리'
      col.appendChild(hint)
    }

    parent.appendChild(col)
  }

  _addSlider(parent, obj, key, label, min, max, step) {
    const row = document.createElement('div')
    row.className = 'row'

    const lab = document.createElement('label')
    lab.textContent = label
    const val = document.createElement('span')
    val.className = 'val'
    val.textContent = (+obj[key]).toFixed(2)

    const input = document.createElement('input')
    input.type = 'range'
    input.min = String(min)
    input.max = String(max)
    input.step = String(step)
    input.value = String(obj[key])

    if (key === 'value' && obj === CONFIG.camera.zoom) {
      this._zoomInput = input
      this._zoomVal = val
    }

    input.addEventListener('input', () => {
      const v = parseFloat(input.value)
      obj[key] = v
      val.textContent = v.toFixed(2)
    })

    row.appendChild(lab)
    row.appendChild(input)
    row.appendChild(val)
    parent.appendChild(row)
  }

  _togglePanel() {
    this.panelOpen = !this.panelOpen
    this.root.classList.toggle('is-open', this.panelOpen)
    this.toggleBtn.classList.toggle('is-active', this.panelOpen)
  }

  _bindKeys() {
    this._onKey = (e) => {
      if (e.key === 'h' || e.key === 'H') this._togglePanel()
    }
    window.addEventListener('keydown', this._onKey)

    // 휠 줌 시 슬라이더 동기화
    this._onZoom = (e) => {
      if (!this._zoomInput) return
      this._zoomInput.value = e.detail
      this._zoomVal.textContent = e.detail.toFixed(2)
    }
    window.addEventListener('forest:zoom', this._onZoom)
  }

  dispose() {
    window.removeEventListener('keydown', this._onKey)
    window.removeEventListener('forest:zoom', this._onZoom)
    this.toggleBtn.remove()
    this.root.remove()
  }
}
