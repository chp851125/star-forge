import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { getState, setMuted, setVolume } from '../../audio/engine'

const GAP = 8
const WIDTH = 224

/** 頂部列音效控制:喇叭鈕切換靜音,旁邊按鈕展開音量滑桿 */
export default function SoundControl() {
  const [sound, setSound] = useState(getState)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)
  const toggle = useRef<HTMLButtonElement>(null)
  const slider = useRef<HTMLInputElement>(null)
  const open = !!pos
  const percent = Math.round(sound.volume * 100)

  const close = () => {
    setPos(null)
    toggle.current?.focus()
  }

  useEffect(() => {
    if (!open) return
    slider.current?.focus()
    const dismiss = () => setPos(null)
    window.addEventListener('resize', dismiss)
    return () => window.removeEventListener('resize', dismiss)
  }, [open])

  return (
    <div className="flex">
      <button
        type="button"
        className={`btn w-11 px-0 ${sound.muted ? 'border-muted/60 bg-bg text-muted' : ''}`}
        aria-label={sound.muted ? '音效已關閉,按此開啟' : '音效已開啟,按此靜音'}
        title={sound.muted ? '開啟音效' : '靜音'}
        onClick={() => {
          setMuted(!sound.muted)
          setSound(getState())
        }}
      >
        <svg viewBox="0 0 24 24" className="mx-auto h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor" />
          <path d={sound.muted ? 'M16 9l6 6M22 9l-6 6' : 'M16 9q3 3 0 6M19 6q6 6 0 12'} />
        </svg>
      </button>
      <button
        ref={toggle}
        type="button"
        className="btn w-11 px-0"
        aria-label="調整音量"
        aria-expanded={open}
        onClick={() => {
          if (open) return setPos(null)
          const a = toggle.current!.getBoundingClientRect()
          setPos({ left: Math.max(GAP, Math.min(a.right - WIDTH, window.innerWidth - WIDTH - GAP)), top: a.bottom + GAP })
        }}
      >
        {open ? '▲' : '▼'}
      </button>
      {pos && createPortal(
        <>
          <div className="fixed inset-0 z-[60]" onClick={close} aria-hidden />
          <div
            role="dialog"
            aria-label="音量"
            className="fixed z-[61] border border-cyan bg-panel p-3 text-sm shadow-glowStrong"
            style={{ ...pos, width: WIDTH }}
            // 浮層內的按鍵不觸發遊戲快捷鍵;Esc / Tab 關閉並回到按鈕
            onKeyDown={(e) => {
              e.stopPropagation()
              if (e.key === 'Tab') e.preventDefault()
              if (e.key === 'Escape' || e.key === 'Tab') close()
            }}
          >
            <label className="block">
              音量 {percent}%{sound.muted && <span className="text-muted">(靜音中)</span>}
              <input
                ref={slider}
                type="range" min={0} max={100} step={5} value={percent}
                className="h-11 w-full accent-cyan"
                onChange={(e) => {
                  setVolume(Number(e.target.value) / 100)
                  setSound(getState())
                }}
              />
            </label>
          </div>
        </>,
        document.body,
      )}
    </div>
  )
}
