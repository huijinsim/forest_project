interface HudProps {
  onEnter: () => void
}

export default function Hud({ onEnter }: HudProps) {
  return (
    <div className="hud">
      <p className="hud__eyebrow">Forest Project</p>
      <h1 className="hud__title">Silvan Whispers</h1>
      <p className="hud__sub">버튼을 눌러 메인페이지로 이동하세요</p>
      <button className="hud__btn" type="button" onClick={onEnter}>
        메인페이지 들어가기
      </button>
    </div>
  )
}
