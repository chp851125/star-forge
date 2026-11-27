import { useRef, useState } from 'react'
import ConfirmPopover from './ConfirmPopover'

/** 重新開始(含確認,避免誤按),主畫面與成品頁共用 */
export default function RestartButton({ onRestart }: { onRestart: () => void }) {
  const button = useRef<HTMLButtonElement>(null)
  const [asking, setAsking] = useState(false)
  return (
    <>
      <button ref={button} className="btn whitespace-nowrap" onClick={() => setAsking(true)}>重新開始</button>
      {asking && (
        <ConfirmPopover
          anchor={button.current!}
          message="重新開始會清除本局的劍、詞條與統計,確定?"
          cautious
          onConfirm={onRestart}
          onCancel={() => setAsking(false)}
        />
      )}
    </>
  )
}
