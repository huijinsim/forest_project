import { CONFIG } from '../config.js'

// ─────────────────────────────────────────────────────────────
// FocusCTA — 확대 후 상세 진입 버튼 (레퍼런스: Get This Album ↗)
// ─────────────────────────────────────────────────────────────
export class FocusCTA {
  /** @param {{ onEnter: () => void, onBack: () => void }} handlers */
  constructor({ onEnter, onBack }) {
    this._onEnter = onEnter
    this._onBack = onBack
    this._buildDom()
  }

  _buildDom() {
    const cfg = CONFIG.interaction
    this.root = document.createElement('div')
    this.root.id = 'focus-cta'
    this.root.innerHTML = /* html */ `
      <style>
        #focus-cta {
          position: fixed; inset: 0; z-index: 25;
          display: flex; flex-direction: column;
          align-items: center; justify-content: flex-end;
          padding-bottom: clamp(48px, 8vh, 88px);
          opacity: 0; visibility: hidden; pointer-events: none;
          transition: opacity 0.5s ease, visibility 0.5s ease;
        }
        #focus-cta.is-visible {
          opacity: 1; visibility: visible; pointer-events: auto;
        }
        #focus-cta .enter {
          font: 500 0.72rem/1 ui-sans-serif, system-ui, sans-serif;
          letter-spacing: 0.2em; text-transform: uppercase;
          padding: 14px 26px;
          border: 1px solid rgba(255, 255, 255, 0.75);
          background: rgba(20, 24, 18, 0.25);
          color: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
          cursor: pointer;
          transition: background 0.2s, transform 0.2s, border-color 0.2s;
        }
        #focus-cta .enter:hover {
          background: rgba(20, 24, 18, 0.42);
          border-color: rgba(255, 255, 255, 0.95);
          transform: translateY(-2px);
        }
        #focus-cta .back {
          position: absolute; top: 24px; left: 24px;
          font: 500 0.65rem/1 ui-sans-serif, system-ui, sans-serif;
          letter-spacing: 0.16em; text-transform: uppercase;
          padding: 10px 16px; border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.35);
          background: rgba(20, 24, 18, 0.2);
          color: rgba(255, 255, 255, 0.8);
          cursor: pointer;
        }
        #focus-cta .back:hover { background: rgba(20, 24, 18, 0.35); }
      </style>
      <button type="button" class="back">${cfg.backLabel}</button>
      <button type="button" class="enter"></button>
    `

    document.body.appendChild(this.root)
    this.enterBtn = this.root.querySelector('.enter')
    this.enterBtn.addEventListener('click', () => this._onEnter?.())
    this.root.querySelector('.back').addEventListener('click', () => this._onBack?.())
  }

  /** @param {'green'|'pink'} variant */
  show(variant) {
    const label =
      variant === 'green' ? CONFIG.interaction.treeEnterLabel : CONFIG.interaction.butterflyEnterLabel
    this.enterBtn.textContent = label
    this.root.classList.add('is-visible')
  }

  hide() {
    this.root.classList.remove('is-visible')
  }

  dispose() {
    this.root.remove()
  }
}
