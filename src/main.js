import { App } from './App.js'
import { Debug } from './ui/Debug.js'

// ─────────────────────────────────────────────────────────────
// main.js ─ 진입점
// DOM 요소를 찾아 App을 만들고 초기화한다.
// ─────────────────────────────────────────────────────────────
const app = new App({
  container: document.getElementById('app'),
  loaderEl: document.getElementById('loader'),
  hudEl: document.getElementById('hud'),
})

// 실시간 파라미터 패널 (프로덕션에서 빼려면 이 두 줄만 삭제)
const debug = new Debug()

app.init().catch((err) => {
  console.error('[forest] 초기화 실패:', err)
  const loader = document.getElementById('loader')
  if (loader) loader.querySelector('.pct').textContent = '로드 실패 😢'
})

// Vite HMR: 모듈 교체 시 기존 앱 정리(메모리 누수 방지)
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    app.dispose()
    debug.dispose()
  })
}
