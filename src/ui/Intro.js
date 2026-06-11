import { CONFIG } from '../config.js'

// ─────────────────────────────────────────────────────────────
// Intro — 메인 전 제목 인트로
// ─────────────────────────────────────────────────────────────
export class Intro {
  /** @param {() => void} onEnter */
  constructor(onEnter) {
    this.onEnter = onEnter
    this._buildDom()
  }

  _buildDom() {
    const cfg = CONFIG.intro
    this.root = document.createElement('div')
    this.root.id = 'intro'
    this.root.innerHTML = /* html */ `
      <style>
        #intro {
          position: fixed; inset: 0; z-index: 40;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          background: radial-gradient(ellipse at 50% 40%, #f3e5ab 0%, #e5c582 55%, #d4b870 100%);
          color: #3d4534;
          transition: opacity 1s ease, visibility 1s ease;
        }
        #intro.is-hidden {
          opacity: 0; visibility: hidden; pointer-events: none;
        }
        #intro .title {
          font: 300 clamp(2rem, 6vw, 3.4rem)/1.1 ui-serif, Georgia, 'Times New Roman', serif;
          letter-spacing: 0.14em; text-transform: uppercase;
          margin-bottom: 0.6rem;
        }
        #intro .subtitle {
          font: 400 0.85rem/1.5 ui-sans-serif, system-ui, sans-serif;
          letter-spacing: 0.28em; opacity: 0.65; margin-bottom: 2.4rem;
        }
        #intro .enter {
          font: 500 0.72rem/1 ui-sans-serif, system-ui, sans-serif;
          letter-spacing: 0.22em; text-transform: uppercase;
          padding: 14px 28px; border-radius: 999px;
          border: 1px solid rgba(45, 52, 38, 0.35);
          background: rgba(255, 252, 240, 0.35);
          color: #3d4534; cursor: pointer;
          transition: background 0.2s, transform 0.2s;
        }
        #intro .enter:hover {
          background: rgba(255, 252, 240, 0.65);
          transform: translateY(-1px);
        }
      </style>
      <h1 class="title">${cfg.title}</h1>
      <p class="subtitle">${cfg.subtitle}</p>
      <button type="button" class="enter">${cfg.enterLabel}</button>
    `

    document.body.appendChild(this.root)
    this.root.querySelector('.enter').addEventListener('click', () => this.hide())
  }

  show() {
    this.root.classList.remove('is-hidden')
  }

  hide() {
    if (this._done) return
    this._done = true
    this.root.classList.add('is-hidden')
    window.setTimeout(() => this.onEnter(), 900)
  }

  dispose() {
    this.root.remove()
  }
}
