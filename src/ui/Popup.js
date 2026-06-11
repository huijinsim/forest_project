import { CONFIG } from '../config.js'

// ─────────────────────────────────────────────────────────────
// Popup — 나무(초록) / 나비(핑크) 상세 오버레이
// ─────────────────────────────────────────────────────────────
export class Popup {
  constructor() {
    this._buildDom()
    this._onClose = null
  }

  _buildDom() {
    this.root = document.createElement('div')
    this.root.id = 'detail-popup'
    this.root.innerHTML = /* html */ `
      <style>
        #detail-popup {
          position: fixed; inset: 0; z-index: 35;
          display: flex; align-items: center; justify-content: center;
          opacity: 0; visibility: hidden; pointer-events: none;
          transition: opacity 0.55s ease, visibility 0.55s ease;
        }
        #detail-popup.is-open {
          opacity: 1; visibility: visible; pointer-events: auto;
        }
        #detail-popup .backdrop {
          position: absolute; inset: 0;
          background: var(--popup-bg, #4a7a48);
          transition: background 0.4s ease;
        }
        #detail-popup .panel {
          position: relative; z-index: 1;
          max-width: min(420px, calc(100vw - 48px));
          padding: 48px 36px 36px;
          text-align: center; color: rgba(255, 255, 255, 0.95);
        }
        #detail-popup .panel h2 {
          font: 300 clamp(1.6rem, 4vw, 2.2rem)/1.2 ui-serif, Georgia, serif;
          letter-spacing: 0.08em; margin-bottom: 1rem;
        }
        #detail-popup .panel p {
          font: 400 0.95rem/1.7 ui-sans-serif, system-ui, sans-serif;
          opacity: 0.88; margin-bottom: 2rem;
        }
        #detail-popup .close {
          font: 500 0.68rem/1 ui-sans-serif, system-ui, sans-serif;
          letter-spacing: 0.18em; text-transform: uppercase;
          padding: 12px 22px; border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.45);
          background: rgba(255,255,255,0.12);
          color: #fff; cursor: pointer;
        }
        #detail-popup .close:hover { background: rgba(255,255,255,0.22); }
      </style>
      <div class="backdrop"></div>
      <div class="panel">
        <h2 class="title"></h2>
        <p class="body"></p>
        <button type="button" class="close">닫기</button>
      </div>
    `

    document.body.appendChild(this.root)
    this.titleEl = this.root.querySelector('.title')
    this.bodyEl = this.root.querySelector('.body')
    this.root.querySelector('.close').addEventListener('click', () => this.close())
    this.root.querySelector('.backdrop').addEventListener('click', () => this.close())
  }

  /** @param {'green'|'pink'} variant */
  open(variant, onClose) {
    const cfg = CONFIG.popups[variant]
    this._onClose = onClose
    this.root.style.setProperty('--popup-bg', cfg.bg)
    this.titleEl.textContent = cfg.title
    this.bodyEl.textContent = cfg.body
    this.root.classList.add('is-open')
  }

  close(silent = false) {
    if (!this.root.classList.contains('is-open')) return
    this.root.classList.remove('is-open')
    const cb = this._onClose
    this._onClose = null
    if (!silent) cb?.()
  }

  dispose() {
    this.root.remove()
  }
}
