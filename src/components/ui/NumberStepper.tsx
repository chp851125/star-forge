import { useEffect, useId, useRef, useState } from 'react'

interface Props {
  value: number
  onChange: (n: number) => void
  min: number
  max: number
  step?: number
  label: string
  presets?: number[]
}

/** 長按:首次延遲、起始間隔、最短間隔(ms)與每次加速倍率 */
const HOLD_DELAY = 400
const HOLD_START = 160
const HOLD_MIN = 35
const HOLD_ACCEL = 0.85

export default function NumberStepper({ value, onChange, min, max, step = 1, label, presets }: Props) {
  const id = useId()
  const [draft, setDraft] = useState<string | null>(null)
  const latest = useRef(value)
  latest.current = value
  const stopHold = useRef<() => void>(() => {})
  useEffect(() => () => stopHold.current(), [])

  const clamp = (n: number) => Math.min(max, Math.max(min, n))

  /** 回傳是否還能繼續往同方向增減 */
  const bump = (dir: 1 | -1) => {
    const next = clamp(latest.current + dir * step)
    if (next === latest.current) return false
    latest.current = next
    setDraft(null)
    onChange(next)
    return next !== (dir > 0 ? max : min)
  }

  const startHold = (dir: 1 | -1) => {
    stopHold.current()
    if (!bump(dir)) return
    let timer = 0
    let interval = HOLD_START
    const stop = () => {
      clearTimeout(timer)
      window.removeEventListener('pointerup', stop)
      window.removeEventListener('pointercancel', stop)
      window.removeEventListener('blur', stop)
    }
    const tick = () => {
      if (!bump(dir)) return stop()
      interval = Math.max(HOLD_MIN, interval * HOLD_ACCEL)
      timer = window.setTimeout(tick, interval)
    }
    timer = window.setTimeout(tick, HOLD_DELAY)
    window.addEventListener('pointerup', stop)
    window.addEventListener('pointercancel', stop)
    window.addEventListener('blur', stop)
    stopHold.current = stop
  }

  const commit = () => {
    if (draft === null) return
    if (draft !== '') onChange(clamp(Number(draft)))
    setDraft(null)
  }

  const stepBtn = (dir: 1 | -1) => (
    <button
      type="button"
      className="stepper-btn"
      aria-label={`${label}${dir > 0 ? '增加' : '減少'}`}
      disabled={dir > 0 ? value >= max : value <= min}
      onPointerDown={(e) => e.button === 0 && startHold(dir)}
      onPointerLeave={() => stopHold.current()}
      // detail 0 = 鍵盤觸發;指標操作已在 pointerdown 處理
      onClick={(e) => e.detail === 0 && bump(dir)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {dir > 0 ? '+' : '−'}
    </button>
  )

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm">{label}</label>
        <div className="stepper">
          <div className="bevel flex border border-cyan/60 bg-bg">
            {stepBtn(-1)}
            <input
              id={id}
              type="text"
              inputMode="numeric"
              autoComplete="off"
              className="stepper-input"
              value={draft ?? value}
              onChange={(e) => setDraft(e.target.value.replace(/\D/g, ''))}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit()
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                  e.preventDefault()
                  bump(e.key === 'ArrowUp' ? 1 : -1)
                }
              }}
            />
            {stepBtn(1)}
          </div>
        </div>
      </div>
      {presets && (
        <div className="flex justify-end gap-2" role="group" aria-label={`${label}快速選項`}>
          {presets.map((n) => (
            <button
              key={n}
              type="button"
              className={`min-h-[44px] min-w-[56px] border px-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan ${
                value === n ? 'border-cyan bg-cyan/20 text-cyan' : 'border-cyan/30 text-muted hover:text-cyan'
              }`}
              aria-pressed={value === n}
              onClick={() => {
                setDraft(null)
                onChange(clamp(n))
              }}
            >
              {n}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
