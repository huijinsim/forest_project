import { CONFIG } from '../config.js'

// ─────────────────────────────────────────────────────────────
// FocusHint — 나무 포커스 후 상세 진입 안내
// ─────────────────────────────────────────────────────────────
export class FocusHint {
  constructor(label = CONFIG.interaction.treeEnterLabel) {
    this._buildDom(label)
  }

  _buildDom(label) {
    this.root = document.createElement('div')
    this.root.id = 'focus-hint'
    this.root.innerHTML = /* html */ `
      <style>
        #focus-hint {
          position: fixed; left: 50%; bottom: 96px;
          transform: translateX(-50%) translateY(8px);
          z-index: 46; display: none;
          pointer-events: none;
          padding: 10px 18px; border-radius: 999px;
          background: rgba(255, 255, 255, 0.82);
          border: 1px solid rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(10px);
          color: #2a3028;
          font: 11px/1.3 'Noto Sans KR', ui-sans-serif, system-ui, sans-serif;
          letter-spacing: 0.06em;
          opacity: 0;
          transition: opacity 0.35s ease, transform 0.35s ease;
        }
        #focus-hint.is-visible {
          display: block; opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      </style>
      <span>${label}</span>
    `
    document.body.appendChild(this.root)
  }

  show() {
    this.root.classList.add('is-visible')
  }

  hide() {
    this.root.classList.remove('is-visible')
  }

  dispose() {
    this.root.remove()
  }
}
