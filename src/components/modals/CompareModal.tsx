import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { AffixSlot, RerollMode, RerollResult, Weapon } from '../../types'
import { AFFIX_MAP, affixValue, tierOfLv } from '../../config/affixes'
import { TIER_BG, TIER_BORDER, TIER_TEXT } from '../tierStyle'
import ConfirmPopover from '../ui/ConfirmPopover'
import Switch from '../ui/Switch'

interface Props {
  slots: Weapon['slots']
  result: RerollResult | null
  cost: number
  /** 標頭的洗練石資訊 */
  stoneText: string
  canReroll: Record<RerollMode, boolean>
  /** 有值時鎖定的「確定」disabled 並顯示原因 */
  lockBlocked: string | null
  autoDiscard: boolean
  onAutoDiscard: (v: boolean) => void
  /** 自動洗練進行中 */
  running: boolean
  onStop: () => void
  onReroll: (mode: RerollMode) => void
  onApply: () => void
  onKeep: () => void
  onToggleLock: (i: number) => void
  onClose: () => void
  /** 自動數值重洗區塊;自動功能關閉時不傳 */
  auto?: ReactNode
}

type Diff = { text: string; color: string }

function diffOf(a: AffixSlot, b: AffixSlot): Diff {
  const up = 'text-zone-safe'
  const flat = 'text-muted'
  if (!a && !b) return { text: '＝', color: flat }
  if (!a) return { text: '新增', color: up }
  if (!b) return { text: '消失', color: flat }
  if (a.id !== b.id) return { text: '變更', color: 'text-cyan' }
  if (b.lv > a.lv) return { text: '▲', color: up }
  if (b.lv < a.lv) return { text: '▼', color: flat }
  return { text: '＝', color: flat }
}

function Cell({ slot, extra, className = '' }: { slot: AffixSlot; extra?: ReactNode; className?: string }) {
  const t = slot ? tierOfLv(slot.lv) : null
  const d = slot ? AFFIX_MAP[slot.id] : null
  return (
    <div
      className={`flex h-14 min-w-0 flex-col justify-center border px-2 text-sm leading-tight ${t ? `${TIER_BORDER[t]} ${TIER_BG[t]} ${TIER_TEXT[t]}` : 'border-dashed border-muted/50 text-muted'} ${className}`}
    >
      <span className="truncate font-semibold">{slot && d ? `${d.name} +${affixValue(d, slot.lv)}${d.unit}` : '(空欄)'}</span>
      <span className="flex justify-between gap-1 text-xs">
        <span>{slot ? `Lv${slot.lv}` : ''}</span>
        {extra}
      </span>
    </div>
  )
}

const Key = ({ k }: { k: string }) => (
  <kbd className="ml-2 hidden border border-current px-1 text-xs font-normal opacity-80 lg:inline">{k}</kbd>
)

/** 洗練視窗:持續開啟,新舊對照就地顯示 */
export default function CompareModal(props: Props) {
  const { slots, result, cost, running, canReroll } = props
  const pending = result?.status === 'pending' ? result : null
  const dialog = useRef<HTMLDivElement>(null)
  const closeBtn = useRef<HTMLButtonElement>(null)
  const keepBtn = useRef<HTMLButtonElement>(null)
  const lockBtns = useRef<(HTMLButtonElement | null)[]>([])
  const [lockAsk, setLockAsk] = useState<number | null>(null)
  /** 放棄新結果的確認;close = 確認後一併關閉視窗 */
  const [discardAsk, setDiscardAsk] = useState<{ anchor: HTMLElement; close: boolean } | null>(null)
  useEffect(() => dialog.current?.focus(), [])

  const lockDisabled = (i: number) => !slots[i] || !!pending || running
  const askLock = (i: number) => !lockDisabled(i) && setLockAsk(i)

  const requestClose = () => {
    if (running) return
    if (pending) setDiscardAsk({ anchor: closeBtn.current!, close: true })
    else props.onClose()
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (lockAsk !== null || discardAsk || e.ctrlKey || e.metaKey || e.altKey) return
      const el = e.target as HTMLElement
      if (el.matches('input, textarea, select, [contenteditable="true"]')) return
      const k = e.key.toLowerCase()
      // 以 Tab 聚焦在按鈕上時,Enter / Space 交給原生行為
      if ((k === 'enter' || k === ' ') && el.matches('button') && dialog.current?.contains(el)) return
      if (!['q', 'w', ' ', 'enter', 'escape', '1', '2', '3'].includes(k)) return
      e.preventDefault()
      if (e.repeat) return
      if (k === 'escape') {
        if (running) props.onStop()
        else if (pending) setDiscardAsk({ anchor: keepBtn.current!, close: false })
        else props.onClose()
      } else if (running) return
      else if (k === 'q') canReroll.affix && props.onReroll('affix')
      else if (k === 'w') canReroll.lv && props.onReroll('lv')
      else if (k === ' ' || k === 'enter') pending && props.onApply()
      else askLock(Number(k) - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const asked = lockAsk === null ? null : slots[lockAsk]

  return (
    <>
      <div className="fixed inset-0 z-40 bg-bg/80" onClick={requestClose} aria-hidden />
      {/* 置中外框不攔截點擊,讓點外部落到背景 */}
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-3">
      <div
        ref={dialog}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="洗練視窗"
        // 滑鼠點按鈕不取走焦點,快捷鍵維持可用
        onMouseDown={(e) => (e.target as HTMLElement).closest('button') && e.preventDefault()}
        // 有自動區塊時固定高度,摘要卡切換時按鈕位置不動
        className={`pointer-events-auto flex max-h-full w-full max-w-xl flex-col border border-cyan bg-panel shadow-glowStrong outline-none ${props.auto ? 'h-[44rem]' : ''}`}
      >
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-cyan/30 px-3 py-1">
          <div>
            <h2 className="text-lg font-bold text-cyan">洗練視窗</h2>
            <p className="text-xs text-muted">{props.stoneText}</p>
          </div>
          <button ref={closeBtn} className="btn" aria-label="關閉洗練視窗" disabled={running} onClick={requestClose}>✕</button>
        </header>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
          <ul className="space-y-2">
            {slots.map((s, i) => {
              const old = result ? result.before[i] : s
              const next = result?.after[i] ?? null
              // 鎖定列與沒有洗到的列不顯示新結果
              const rolled = !!result && result.after[i] !== result.before[i]
              const better = rolled && !!next && (!old || next.lv > old.lv)
              const diff = rolled ? diffOf(old, next) : null
              const discarded = rolled && result.status === 'discarded'
              const red = rolled && !!next && tierOfLv(next.lv) === 'red'
              return (
                <li
                  key={i}
                  className="grid h-16 grid-cols-[2.75rem_minmax(0,1fr)_1rem_minmax(0,1fr)] items-center gap-1 sm:gap-2"
                >
                  <button
                    ref={(el) => { lockBtns.current[i] = el }}
                    className={`btn relative h-14 px-0 ${s?.locked ? 'bg-cyan/40' : ''}`}
                    disabled={lockDisabled(i)}
                    aria-pressed={!!s?.locked}
                    aria-label={`詞條 ${i + 1} ${!s ? '空欄不能鎖定' : s.locked ? '解除鎖定' : '鎖定'}`}
                    onClick={() => askLock(i)}
                  >
                    <span aria-hidden>{!s ? '—' : s.locked ? '🔒' : '🔓'}</span>
                    <span className="absolute bottom-0 right-1 hidden text-xs font-normal lg:inline" aria-hidden>{i + 1}</span>
                  </button>
                  {/* 目前效果永遠顯示實際詞條 */}
                  <div key={`old-${discarded ? result.n : 'x'}`} className={discarded ? 'fx-discard' : ''}>
                    <Cell slot={s} />
                  </div>
                  <span className="text-center text-cyan" aria-hidden>→</span>
                  {rolled ? (
                    <div key={result.n} className={`fx-slide-in min-w-0 ${better && !discarded ? 'fx-better' : ''}`}>
                      <Cell
                        slot={next}
                        className={`${red ? 'fx-red-burst' : ''} ${discarded ? 'opacity-60' : ''}`}
                        extra={
                          discarded
                            ? <span className="truncate text-muted">{old && next ? `Lv ${old.lv} → ${next.lv},` : ''}自動放棄</span>
                            : <span className={`font-bold ${diff!.color}`}>{diff!.text}</span>
                        }
                      />
                    </div>
                  ) : (
                    <div className="flex h-14 items-center justify-center border border-dashed border-muted/30 text-sm text-muted">
                      {s?.locked ? '已鎖定' : '—'}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>

          <div className="grid grid-cols-2 gap-2">
            <button className="btn-primary min-h-[52px]" disabled={running || !canReroll.affix} onClick={() => props.onReroll('affix')}>
              詞條變更 · 耗 {cost}<Key k="Q" />
            </button>
            <button className="btn-primary min-h-[52px]" disabled={running || !canReroll.lv} onClick={() => props.onReroll('lv')}>
              數值重洗 · 耗 {cost}<Key k="W" />
            </button>
            <button className="btn min-h-[52px]" disabled={!pending} onClick={props.onApply}>
              採用新結果<Key k="Space" />
            </button>
            <button ref={keepBtn} className="btn min-h-[52px]" disabled={!pending} onClick={props.onKeep}>
              維持舊的<Key k="Esc" />
            </button>
          </div>

          <Switch
            checked={props.autoDiscard}
            onChange={props.onAutoDiscard}
            disabled={running}
            label="自動放棄較差結果"
            hint="僅數值重洗:沒有任何一列更高就維持舊的"
          />
          {props.auto}
        </div>
      </div>
      </div>

      {lockAsk !== null && asked && (
        <ConfirmPopover
          anchor={lockBtns.current[lockAsk]!}
          message={
            asked.locked
              ? '解除鎖定後,此詞條會在洗練時被重洗,每次洗練消耗 −1。確定解除?'
              : '鎖定此詞條將消耗 1 洗練石,之後每次洗練消耗 +1。確定鎖定?'
          }
          blocked={asked.locked ? null : props.lockBlocked}
          onConfirm={() => {
            props.onToggleLock(lockAsk)
            setLockAsk(null)
            dialog.current?.focus()
          }}
          onCancel={() => {
            setLockAsk(null)
            dialog.current?.focus()
          }}
        />
      )}
      {discardAsk && (
        <ConfirmPopover
          anchor={discardAsk.anchor}
          message="放棄目前的新結果?"
          onConfirm={() => {
            props.onKeep()
            setDiscardAsk(null)
            if (discardAsk.close) props.onClose()
            else dialog.current?.focus()
          }}
          onCancel={() => {
            setDiscardAsk(null)
            dialog.current?.focus()
          }}
        />
      )}
    </>
  )
}
