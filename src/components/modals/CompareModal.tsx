import { useEffect, useRef, type ReactNode } from 'react'
import type { AffixSlot, RerollMode, Weapon } from '../../types'
import { AFFIX_MAP, affixValue, tierOfLv } from '../../config/affixes'
import { TIER_BG, TIER_BORDER, TIER_TEXT } from '../tierStyle'

interface Props {
  mode: RerollMode
  before: Weapon['slots']
  after: Weapon['slots']
  onApply: () => void
  onKeep: () => void
}

const TITLE: Record<RerollMode, string> = { affix: '詞條變更', lv: '數值重洗' }

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

/** 洗練結果:新舊對照,只能選擇改變或維持 */
export default function CompareModal({ mode, before, after, onApply, onKeep }: Props) {
  const dialog = useRef<HTMLDivElement>(null)
  useEffect(() => dialog.current?.focus(), [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const el = e.target as HTMLElement
      // 以 Tab 聚焦在視窗按鈕上時,Enter / Space 交給原生行為
      if ((e.key === 'Enter' || e.key === ' ') && el.matches('button') && dialog.current?.contains(el)) return
      if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Escape') return
      e.preventDefault()
      if (e.repeat) return
      if (e.key === 'Escape') onKeep()
      else onApply()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 p-3">
      <div
        ref={dialog}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`${TITLE[mode]}結果`}
        className="max-h-full w-full max-w-xl space-y-3 overflow-y-auto border border-cyan bg-panel p-3 shadow-glowStrong outline-none"
      >
        <h2 className="text-lg font-bold text-cyan">{TITLE[mode]} · 新舊對照</h2>
        <ul className="space-y-2">
          {before.map((old, i) => {
            const next = after[i]
            // 鎖定列與沒有洗到的列不顯示新結果
            const rolled = next !== old
            const better = rolled && !!next && (!old || next.lv > old.lv)
            const diff = diffOf(old, next)
            const red = rolled && !!next && tierOfLv(next.lv) === 'red'
            return (
              <li key={i} className="grid h-16 grid-cols-[minmax(0,1fr)_1rem_minmax(0,1fr)] items-center gap-2">
                <Cell slot={old} />
                <span className="text-center text-cyan" aria-hidden>→</span>
                {rolled ? (
                  <div className={`fx-slide-in min-w-0 ${better ? 'fx-better' : ''}`}>
                    <Cell
                      slot={next}
                      className={red ? 'fx-red-burst' : ''}
                      extra={<span className={`font-bold ${diff.color}`}>{diff.text}</span>}
                    />
                  </div>
                ) : (
                  <div className="flex h-14 items-center justify-center border border-dashed border-muted/30 text-sm text-muted">
                    {old?.locked ? '🔒 已鎖定' : '—'}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-primary min-h-[52px]" onClick={onApply}>改變<Key k="Space" /></button>
          <button className="btn min-h-[52px]" onClick={onKeep}>維持<Key k="Esc" /></button>
        </div>
      </div>
    </div>
  )
}
