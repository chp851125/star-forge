import { useEffect, useRef, type ReactNode } from 'react'
import type { AffixSlot, RerollMode, Weapon } from '../../types'
import { AFFIX_MAP, affixValue, tierOfLv } from '../../config/affixes'
import { TIER_BG, TIER_BORDER, TIER_TEXT } from '../tierStyle'

interface Props {
  mode: RerollMode
  before: Weapon['slots']
  after: Weapon['slots']
  /** null = 尚未決定;之後按鈕換成繼續 / 關閉視窗 */
  applied: boolean | null
  /** 再洗一次的消耗 */
  cost: number
  stoneText: string
  canContinue: boolean
  onApply: () => void
  onKeep: () => void
  /** 以同一種洗練方式再洗一次 */
  onContinue: () => void
  onClose: () => void
}

const TITLE: Record<RerollMode, string> = { affix: '詞條變更', lv: '數值重洗' }

type Diff = { text: string; color: string }

function diffOf(a: AffixSlot, b: AffixSlot): Diff {
  const up = 'text-zone-safe'
  const flat = 'text-muted'
  if (!a && !b) return { text: '＝', color: flat }
  if (!a) return { text: '新', color: 'text-cyan' }
  if (!b) return { text: '消失', color: flat }
  if (a.id !== b.id) return { text: '新', color: 'text-cyan' }
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

/** 洗練結果:新舊對照,選擇改變或維持後可繼續洗或關閉 */
export default function CompareModal(props: Props) {
  const { mode, before, after, applied, canContinue } = props
  const decided = applied !== null
  const dialog = useRef<HTMLDivElement>(null)
  useEffect(() => dialog.current?.focus(), [])

  // 快捷鍵:決定前 改變 / 維持,決定後 繼續 / 關閉視窗
  const primary = () => (!decided ? props.onApply() : canContinue && props.onContinue())
  const secondary = () => (decided ? props.onClose() : props.onKeep())

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const el = e.target as HTMLElement
      // 以 Tab 聚焦在視窗按鈕上時,Enter / Space 交給原生行為
      if ((e.key === 'Enter' || e.key === ' ') && el.matches('button') && dialog.current?.contains(el)) return
      if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Escape') return
      e.preventDefault()
      if (e.repeat) return
      if (e.key === 'Escape') secondary()
      else primary()
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
        // 滑鼠點按鈕不取走焦點,快捷鍵維持一致
        onMouseDown={(e) => (e.target as HTMLElement).closest('button') && e.preventDefault()}
        className="max-h-full w-full max-w-xl space-y-3 overflow-y-auto border border-cyan bg-panel p-3 shadow-glowStrong outline-none"
      >
        <div>
          <h2 className="text-lg font-bold text-cyan" aria-live="polite">
            {TITLE[mode]} · {decided ? (applied ? '已改變' : '已維持') : '新舊對照'}
          </h2>
          <p className="text-xs text-muted">{props.stoneText}</p>
        </div>
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
        {/* 四顆按鈕永遠顯示、位置固定,不可用時 disabled */}
        <div className="grid grid-cols-2 gap-2">
          <button className="btn-primary min-h-[52px]" disabled={decided} onClick={props.onApply}>
            改變{!decided && <Key k="Space" />}
          </button>
          <button className="btn min-h-[52px]" disabled={decided} onClick={props.onKeep}>
            維持{!decided && <Key k="Esc" />}
          </button>
          <button className="btn-primary col-span-2 min-h-[52px]" disabled={!decided || !canContinue} onClick={props.onContinue}>
            繼續 · 耗 {props.cost}{decided && <Key k="Space" />}
          </button>
          <button className="btn col-span-2 min-h-[52px]" disabled={!decided} onClick={props.onClose}>
            關閉視窗{decided && <Key k="Esc" />}
          </button>
        </div>
      </div>
    </div>
  )
}
