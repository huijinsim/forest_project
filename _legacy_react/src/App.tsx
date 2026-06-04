import { useState } from 'react'
import Experience from './scene/Experience'
import Hud from './ui/Hud'

export default function App() {
  const [entered, setEntered] = useState(false)

  return (
    <div className="app-root">
      {/* 3D 씬은 항상 마운트 — 진입 전에도 백그라운드에서 로드 */}
      <div className={`canvas-wrap ${entered ? 'is-visible' : ''}`}>
        <Experience />
      </div>

      {!entered && <Hud onEnter={() => setEntered(true)} />}
    </div>
  )
}
