// ─────────────────────────────────────────────────────────────
// ButterflyCursor — 나비 PNG 커서 + 클릭마다 이미지 순환
// ─────────────────────────────────────────────────────────────

const DEFAULT_URLS = [
  '/butterfly/butterfly1.PNG',
  '/butterfly/butterfly2.PNG',
  '/butterfly/butterfly3.PNG',
]

export class ButterflyCursor {
  /** @param {string[]} [urls] @param {{ size?: number }} [opts] */
  constructor(urls = DEFAULT_URLS, opts = {}) {
    this.urls = urls
    this.size = opts.size ?? 100
    this.index = 0
    this.enabled = false
    this._mx = -9999
    this._my = -9999
    this._buildDom()
    this._onMove = (e) => this._move(e.clientX, e.clientY)
    this._onDown = () => this.cycle()
    window.addEventListener('pointermove', this._onMove, { passive: true })
    window.addEventListener('pointerdown', this._onDown)
  }

  _buildDom() {
    this.root = document.createElement('div')
    this.root.id = 'butterfly-cursor'
    this.root.innerHTML = /* html */ `
      <style>
        #butterfly-cursor {
          position: fixed; left: 0; top: 0;
          z-index: 100; pointer-events: none;
          visibility: hidden;
          transform: translate3d(-9999px, -9999px, 0);
          will-change: transform;
        }
        #butterfly-cursor img {
          display: block;
          width: var(--bf-size, 100px);
          height: auto;
          transform: translate(-42%, -38%);
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.12));
          user-select: none;
          -webkit-user-drag: none;
        }
      </style>
    `
    this.root.style.setProperty('--bf-size', `${this.size}px`)
    this.img = document.createElement('img')
    this.img.src = this.urls[0]
    this.img.alt = ''
    this.img.draggable = false
    this.root.appendChild(this.img)
    document.body.appendChild(this.root)
  }

  _move(x, y) {
    this._mx = x
    this._my = y
    if (!this.enabled) return
    this.root.style.transform = `translate3d(${x}px, ${y}px, 0)`
  }

  cycle() {
    if (!this.enabled) return
    this.index = (this.index + 1) % this.urls.length
    this.img.src = this.urls[this.index]
  }

  setEnabled(on) {
    this.enabled = on
    document.body.style.cursor = on ? 'none' : ''
    this.root.style.visibility = on ? 'visible' : 'hidden'
    if (on) this._move(this._mx, this._my)
  }

  dispose() {
    window.removeEventListener('pointermove', this._onMove)
    window.removeEventListener('pointerdown', this._onDown)
    document.body.style.cursor = ''
    this.root.remove()
  }
}
