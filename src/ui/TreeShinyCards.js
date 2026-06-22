import gsap from 'gsap'
import { CONFIG } from '../config.js'

const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
const mapRange = (v, inMin, inMax, outMin, outMax) =>
  outMin + ((clamp(v, inMin, inMax) - inMin) / (inMax - inMin)) * (outMax - outMin)

// ─────────────────────────────────────────────────────────────
// TreeShinyCards — 나무 클릭 시 shiny 3D 카드 + 선택 시 확대
// ─────────────────────────────────────────────────────────────
export class TreeShinyCards {
  constructor(container) {
    this.container = container
    this.cfg = CONFIG.interaction.shinyCards ?? {}
    this.urls = this.cfg.urls ?? [
      '/card/card01.jpg',
      '/card/card02.jpg',
      '/card/card03.jpg',
      '/card/card04.jpg',
    ]
    this.dampen = this.cfg.dampen ?? 40
    this.cardWidth = this.cfg.width ?? 200
    this.expandedWidth = this.cfg.expandedWidth ?? 560
    this.titleUrl = this.cfg.titleUrl ?? '/title/menifesto.PNG'
    this.titleWidth = this.cfg.titleWidth ?? 300

    this.root = document.createElement('div')
    this.root.id = 'tree-shiny-cards'
    this.root.innerHTML = /* html */ `
      <style>
        #tree-shiny-cards {
          position: absolute; inset: 0;
          pointer-events: none;
          z-index: 14;
          display: none;
          align-items: center;
          justify-content: center;
          perspective: 1200px;
        }
        #tree-shiny-cards.is-active { display: flex; overflow-y: auto; }
        #tree-shiny-cards.is-expanded .shiny-cards-stack { opacity: 0; pointer-events: none; }
        #tree-shiny-cards .shiny-cards-stack {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: clamp(14px, 2.5vh, 28px);
          padding: clamp(36px, 7vh, 56px) 0 clamp(28px, 5vh, 40px);
          transition: opacity 0.35s ease;
          box-sizing: border-box;
        }
        #tree-shiny-cards .shiny-title {
          display: block;
          width: var(--title-w, 300px);
          height: auto;
          filter: drop-shadow(0 4px 12px rgba(30, 40, 28, 0.12));
          user-select: none;
          -webkit-user-drag: none;
        }
        #tree-shiny-cards .shiny-cards-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: center;
          gap: clamp(10px, 1.8vw, 24px);
          padding: 0 20px 12px;
          max-width: min(980px, 96vw);
        }
        #tree-shiny-cards.is-active .shiny-card-outer {
          pointer-events: auto;
          cursor: pointer;
        }
        #tree-shiny-cards .shiny-card-outer {
          perspective: 1000px;
          flex: 0 0 auto;
        }
        #tree-shiny-cards .shiny-card {
          position: relative;
          width: var(--card-w, 200px);
          border-radius: 16px;
          overflow: hidden;
          transform-style: preserve-3d;
          will-change: transform;
          box-shadow: 0 16px 36px rgba(24, 32, 22, 0.22);
          border: 1px solid rgba(255, 255, 255, 0.32);
          backdrop-filter: blur(4px) brightness(1.1);
          background: rgba(255, 255, 255, 0.04);
        }
        #tree-shiny-cards .shiny-card img {
          display: block;
          width: 100%;
          height: auto;
          user-select: none;
          -webkit-user-drag: none;
        }
        #tree-shiny-cards .shiny-card-sheen {
          position: absolute; inset: 0;
          pointer-events: none;
          z-index: 2;
          border-radius: inherit;
        }
        #tree-shiny-cards .shiny-expanded-layer {
          position: absolute; inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: clamp(40px, 7vh, 64px) 20px clamp(32px, 5vh, 48px);
          box-sizing: border-box;
          overflow-y: auto;
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
          background: rgba(235, 245, 250, 0.55);
          backdrop-filter: blur(8px);
          transition: opacity 0.35s ease, visibility 0.35s ease;
        }
        #tree-shiny-cards.is-expanded .shiny-expanded-layer {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
        }
        #tree-shiny-cards .shiny-expanded-outer {
          perspective: 1000px;
          max-height: 100%;
          flex-shrink: 0;
        }
        #tree-shiny-cards .shiny-expanded-card {
          position: relative;
          width: min(var(--expanded-w, 560px), 92vw);
          max-height: min(calc(100dvh - 88px), 780px);
          border-radius: 18px;
          overflow: hidden;
          transform-style: preserve-3d;
          box-shadow: 0 24px 48px rgba(24, 32, 22, 0.28);
          border: 1px solid rgba(255, 255, 255, 0.38);
          backdrop-filter: blur(4px) brightness(1.08);
        }
        #tree-shiny-cards .shiny-expanded-card img {
          display: block;
          width: 100%;
          height: auto;
          max-height: min(calc(100dvh - 88px), 780px);
          object-fit: contain;
        }
      </style>
      <div class="shiny-cards-stack">
        <img class="shiny-title" alt="Manifesto" draggable="false">
        <div class="shiny-cards-row"></div>
      </div>
      <div class="shiny-expanded-layer">
        <div class="shiny-expanded-outer">
          <div class="shiny-expanded-card">
            <div class="shiny-card-sheen"></div>
            <img alt="" draggable="false">
          </div>
        </div>
      </div>
    `
    container.appendChild(this.root)

    this.stack = this.root.querySelector('.shiny-cards-stack')
    this.titleEl = this.root.querySelector('.shiny-title')
    this.titleEl.src = this.titleUrl
    this.titleEl.style.setProperty('--title-w', `${this.titleWidth}px`)
    this.titleEl.style.width = `${this.titleWidth}px`

    this.row = this.root.querySelector('.shiny-cards-row')
    this.expandedLayer = this.root.querySelector('.shiny-expanded-layer')
    this.expandedCard = this.root.querySelector('.shiny-expanded-card')
    this.expandedSheen = this.expandedCard.querySelector('.shiny-card-sheen')
    this.expandedImg = this.expandedCard.querySelector('img')
    this.expandedCard.style.setProperty('--expanded-w', `${this.expandedWidth}px`)

    this.cards = []
    this.active = false
    this.expanded = false
    this._expandedIndex = -1
    this._pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    this.onActiveChange = null

    for (let i = 0; i < this.urls.length; i++) {
      const outer = document.createElement('div')
      outer.className = 'shiny-card-outer'
      outer.dataset.index = String(i)
      const card = document.createElement('div')
      card.className = 'shiny-card'
      card.style.setProperty('--card-w', `${this.cardWidth}px`)
      const sheen = document.createElement('div')
      sheen.className = 'shiny-card-sheen'
      const img = document.createElement('img')
      img.src = this.urls[i]
      img.alt = ''
      img.draggable = false
      card.appendChild(sheen)
      card.appendChild(img)
      outer.appendChild(card)
      this.row.appendChild(outer)
      const stop = (e) => e.stopPropagation()
      outer.addEventListener('pointerdown', stop)
      outer.addEventListener('pointerup', stop)
      outer.addEventListener('click', (e) => {
        e.stopPropagation()
        this.expand(i)
      })
      this.cards.push({ outer, card, sheen, img, tweens: [] })
    }
  }

  _applyTilt(el, sheen, clientX, clientY, maxTilt = 14) {
    const rect = el.getBoundingClientRect()
    let rotateX = -((clientY - rect.top - rect.height / 2) / this.dampen)
    let rotateY = (clientX - rect.left - rect.width / 2) / this.dampen
    rotateX = clamp(rotateX, -maxTilt, maxTilt)
    rotateY = clamp(rotateY, -maxTilt, maxTilt)
    el.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`

    const diagonal = rotateX + rotateY
    const sheenPos = mapRange(diagonal, -5, 5, -100, 200)
    const sheenOpacity = mapRange(Math.abs(diagonal), 0, 6, 0.02, 0.34)
    sheen.style.background = `linear-gradient(
      55deg,
      transparent,
      rgba(255, 255, 255, ${sheenOpacity}) ${sheenPos}%,
      transparent
    )`
  }

  _resetTilt(entry) {
    gsap.set(entry.card, { clearProps: 'transform' })
    entry.sheen.style.background = ''
  }

  isActive() {
    return this.active
  }

  isExpanded() {
    return this.expanded
  }

  _hitIndex(clientX, clientY) {
    for (let i = 0; i < this.cards.length; i++) {
      const rect = this.cards[i].outer.getBoundingClientRect()
      if (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      ) {
        return i
      }
    }
    return -1
  }

  selectAt(clientX, clientY) {
    if (!this.active || this.expanded) return false
    const idx = this._hitIndex(clientX, clientY)
    if (idx < 0) return false
    this.expand(idx)
    return true
  }

  expand(index) {
    if (!this.active || index < 0 || index >= this.cards.length) return

    this.expanded = true
    this._expandedIndex = index
    this.root.classList.add('is-expanded')
    this.expandedImg.src = this.urls[index]

    gsap.set(this.expandedCard, { scale: 0.82, rotateY: -16, opacity: 0 })
    gsap.to(this.expandedCard, {
      scale: 1,
      rotateY: 0,
      opacity: 1,
      duration: 0.62,
      ease: 'back.out(1.4)',
    })

    this.updatePointer(this._pointer.x, this._pointer.y)
  }

  closeExpanded() {
    if (!this.expanded) return false

    gsap.to(this.expandedCard, {
      scale: 0.88,
      opacity: 0,
      duration: 0.28,
      ease: 'power2.in',
      onComplete: () => {
        this.expanded = false
        this._expandedIndex = -1
        this.root.classList.remove('is-expanded')
        gsap.set(this.expandedCard, { clearProps: 'transform,opacity' })
        this.expandedSheen.style.background = ''
        this.updatePointer(this._pointer.x, this._pointer.y)
      },
    })
    return true
  }

  show() {
    this.closeExpanded()
    this.clear(false)
    this.active = true
    this.root.classList.add('is-active')

    const stagger = this.cfg.stagger ?? 0.12
    const duration = this.cfg.enterDuration ?? 0.72

    gsap.set(this.titleEl, { y: -12, opacity: 0 })
    gsap.to(this.titleEl, { y: 0, opacity: 1, duration: 0.55, ease: 'power2.out' })

    for (let i = 0; i < this.cards.length; i++) {
      const entry = this.cards[i]
      gsap.set(entry.card, { rotateY: -24, scale: 0.72, opacity: 0 })
      entry.tweens.push(
        gsap.to(entry.card, {
          rotateY: 0,
          scale: 1,
          opacity: 1,
          duration,
          delay: 0.08 + i * stagger,
          ease: 'back.out(1.55)',
        }),
      )
    }

    this.updatePointer(this._pointer.x, this._pointer.y)
    this.onActiveChange?.(true)
  }

  updatePointer(clientX, clientY) {
    if (!this.active) return
    this._pointer.x = clientX
    this._pointer.y = clientY

    if (this.expanded) {
      this._applyTilt(this.expandedCard, this.expandedSheen, clientX, clientY, 8)
      return
    }

    for (const entry of this.cards) this._applyTilt(entry.card, entry.sheen, clientX, clientY)
  }

  clear(animate = true) {
    if (!this.active && !this.expanded && !animate) return

    const wasActive = this.active

    this.expanded = false
    this._expandedIndex = -1
    this.root.classList.remove('is-expanded')
    gsap.set(this.expandedCard, { clearProps: 'transform,opacity' })
    this.expandedSheen.style.background = ''

    if (!wasActive && !animate) return

    this.active = false

    const list = this.cards
    for (const entry of list) {
      entry.tweens.forEach((t) => t.kill())
      entry.tweens = []
    }

    const finish = () => {
      this.root.classList.remove('is-active')
      gsap.set(this.titleEl, { clearProps: 'transform,opacity' })
      for (const entry of list) this._resetTilt(entry)
      if (wasActive) this.onActiveChange?.(false)
    }

    if (!animate) {
      finish()
      return
    }

    gsap.to(this.titleEl, { y: -8, opacity: 0, duration: 0.24, ease: 'power2.in' })
    gsap.to(
      list.map((e) => e.card),
      {
        scale: 0.82,
        opacity: 0,
        rotateY: 18,
        duration: 0.32,
        stagger: 0.04,
        ease: 'power2.in',
        onComplete: finish,
      },
    )
  }

  dispose() {
    this.clear(false)
    this.root.remove()
  }
}
