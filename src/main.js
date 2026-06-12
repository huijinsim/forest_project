import { App } from './App.js'
import { Debug } from './ui/Debug.js'
import { Intro } from './ui/Intro.js'

// ─────────────────────────────────────────────────────────────
// main.js — 인트로 즉시 표시 → Enter 클릭 시 숲 로드
// ─────────────────────────────────────────────────────────────
const app = new App({
  container: document.getElementById('app'),
  loaderEl: document.getElementById('loader'),
})

const debug = new Debug()

const intro = new Intro(() => app.enterMain())

intro.show()

app
  .bootstrap()
  .catch((err) => {
    console.error('[forest] bootstrap 실패:', err)
  })

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    app.dispose()
    debug.dispose()
    intro.dispose()
  })
}
