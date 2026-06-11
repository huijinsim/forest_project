import { App } from './App.js'
import { Debug } from './ui/Debug.js'
import { Intro } from './ui/Intro.js'

// ─────────────────────────────────────────────────────────────
// main.js — 진입점
// 로드 → 인트로 → 메인(고정 시점 + 인터랙션)
// ─────────────────────────────────────────────────────────────
const app = new App({
  container: document.getElementById('app'),
  loaderEl: document.getElementById('loader'),
})

const debug = new Debug()

const intro = new Intro(() => app.enterMain())

app
  .init()
  .then(() => intro.show())
  .catch((err) => {
    console.error('[forest] 초기화 실패:', err)
    const loader = document.getElementById('loader')
    if (loader) loader.querySelector('.pct').textContent = '로드 실패 😢'
  })

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    app.dispose()
    debug.dispose()
    intro.dispose()
  })
}
