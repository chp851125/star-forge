import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { play } from '../../audio/engine'
import type { SoundId } from '../../types'

interface Props {
  /** 浮層貼近的元素 */
  anchor: HTMLElement
  message: string
  /** 有值時「確定」disabled 並顯示原因 */
  blocked?: string | null
  /** 預設焦點放在「取消」,避免連按 Enter 直接確定 */
  cautious?: boolean
  /** 按下「確定」的音效 */
  sound?: SoundId
  onConfirm: () => void
  onCancel: () => void
}

const GAP = 8

/** 輕量確認浮層:Enter 確定、Esc 取消 */
export default function ConfirmPopover({ anchor, message, blocked, cautious, sound = 'confirm', onConfirm, onCancel }: Props) {
  // 按鈕與快捷鍵共用:播音效後執行
  const accept = () => {
    play(sound)
    onConfirm()
  }
  const dismiss = () => {
    play('click')
    onCancel()
  }
  const box = useRef<HTMLDivElement>(null)
  const ok = useRef<HTMLButtonElement>(null)
  const cancel = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState({ left: 0, top: 0 })

  useLayoutEffect(() => {
    const place = () => {
      const a = anchor.getBoundingClientRect()
      const { offsetWidth: w, offsetHeight: h } = box.current!
      const below = a.bottom + GAP
      setPos({
        left: Math.max(GAP, Math.min(a.left, window.innerWidth - w - GAP)),
        top: below + h <= window.innerHeight - GAP ? below : Math.max(GAP, a.top - h - GAP),
      })
    }
    place()
    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [anchor])

  useEffect(() => (blocked || cautious ? cancel : ok).current?.focus(), [blocked, cautious])

  // capture 階段攔截,避免觸發底層視窗的快捷鍵
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') return
      e.stopPropagation()
      if (e.key !== 'Enter' && e.key !== 'Escape' && e.key !== ' ') return
      // 焦點在浮層按鈕上時,Space 交給原生行為
      if (e.key === ' ' && box.current?.contains(e.target as Node)) return
      e.preventDefault()
      if (e.repeat) return
      if (e.key === 'Escape' || (e.key === 'Enter' && e.target === cancel.current)) dismiss()
      else if (e.key === 'Enter' && !blocked) accept()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  })

  return createPortal(
    <>
      <div className="fixed inset-0 z-[60]" onClick={onCancel} aria-hidden />
      <div
        ref={box}
        role="alertdialog"
        aria-label={message}
        className="fixed z-[61] w-72 max-w-[calc(100vw-1rem)] space-y-2 border border-cyan bg-panel p-3 text-sm shadow-glowStrong"
        style={pos}
      >
        <p>{message}</p>
        {blocked && <p className="font-semibold text-tier-red">{blocked}</p>}
        <div className="grid grid-cols-2 gap-2">
          <button ref={ok} className="btn-primary" disabled={!!blocked} data-sound="none" onClick={accept}>確定</button>
          <button ref={cancel} className="btn" data-sound="none" onClick={dismiss}>取消</button>
        </div>
      </div>
    </>,
    document.body,
  )
}
