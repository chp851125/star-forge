import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { AffixSlot, RerollMode, SlotChange, SoundId, Weapon } from '../../types'
import { play } from '../../audio/engine'
import { compareSlots, getTier } from '../../core/reroll'
import { affixText } from '../panels/AffixList'
import { TIER_BG, TIER_BORDER, TIER_TEXT } from '../tierStyle'
import ConfirmPopover from '../ui/ConfirmPopover'
import LockConfirm from '../ui/LockConfirm'

interface Props {
  /** 每洗一次遞增,只重播新結果列的動畫(視窗本身不重掛,避免閃爍) */
  rollId: number
  mode: RerollMode
  before: Weapon['slots']
  after: Weapon['slots']
  /** null = 尚未決定;之後按鈕換成繼續 / 關閉視窗 */
  applied: boolean | null
  /** 再洗一次的消耗 */
  cost: number
  stoneText: string
  canContinue: boolean
  /** 無法繼續的原因 */
  continueBlocked: string | null
  /** 有值時鎖定的「確定」disabled 並顯示原因 */
  lockBlocked: string | null
  /** 僅決定後可用 */
  onToggleLock: (i: number) => void
  onApply: () => void
  onKeep: () => void
  /** 以同一種洗練方式再洗一次 */
  onContinue: () => void
  onClose: () => void
}

const TITLE: Record<RerollMode, string> = { affix: '詞條變更', lv: '數值重洗' }

const DIFF: Record<SlotChange, { text: string; color: string }> = {
  up: { text: '▲', color: 'text-zone-safe' },
  down: { text: '▼', color: 'text-muted' },
  same: { text: '＝', color: 'text-muted' },
  changed: { text: '新', color: 'text-cyan' },
  added: { text: '新', color: 'text-cyan' },
  removed: { text: '消失', color: 'text-muted' },
}

function Cell({ slot, extra, className = '' }: { slot: AffixSlot; extra?: ReactNode; className?: string }) {
  const t = slot ? getTier(slot.lv) : null
  return (
    <div
      className={`flex h-14 min-w-0 flex-col justify-center border px-2 text-sm leading-tight ${t ? `${TIER_BORDER[t]} ${TIER_BG[t]} ${TIER_TEXT[t]}` : 'border-dashed border-muted/50 text-muted'} ${className}`}
    >
      <span className="truncate font-semibold">{affixText(slot)}</span>
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
  const changes = compareSlots(before, after)
  const dialog = useRef<HTMLDivElement>(null)
  useEffect(() => dialog.current?.focus(), [])

  // 按鈕與快捷鍵共用:播音效後執行
  const act = (sound: SoundId, run: () => void) => () => {
    play(sound)
    run()
  }
  const apply = act('confirm', props.onApply)
  const keepNow = act('click', props.onKeep)
  const keepBtn = useRef<HTMLButtonElement>(null)
  const [keepAsk, setKeepAsk] = useState(false)
  /** 本次洗出與原本不同的紅詞條,維持前需再確認 */
  const losingRed = !decided && after.some((next, i) => {
    const old = before[i]
    return !!next && next !== old && getTier(next.lv) === 'red' && (old?.id !== next.id || old.lv !== next.lv)
  })
  const keep = () => {
    if (!losingRed) return keepNow()
    play('click')
    setKeepAsk(true)
  }
  const closeAsk = () => {
    setKeepAsk(false)
    dialog.current?.focus()
  }
  const lockBtns = useRef<(HTMLButtonElement | null)[]>([])
  const [lockAsk, setLockAsk] = useState<number | null>(null)
  const askLock = (i: number) => {
    if (decided && before[i]) setLockAsk(i)
  }
  const asked = lockAsk === null ? null : before[lockAsk]
  const again = act('click', props.onContinue)
  const close = act('click', props.onClose)

  // 快捷鍵:決定前 改變 / 維持,決定後 繼續 / 關閉視窗 / 1~3 切換鎖定
  const primary = () => (!decided ? apply() : canContinue && again())
  const secondary = () => (decided ? close() : keep())

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // 確認浮層開啟時,按鍵交給浮層
      if (keepAsk || lockAsk !== null) return
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const el = e.target as HTMLElement
      // 以 Tab 聚焦在視窗按鈕上時,Enter / Space 交給原生行為
      if ((e.key === 'Enter' || e.key === ' ') && el.matches('button') && dialog.current?.contains(el)) return
      if (!e.repeat && (e.key === '1' || e.key === '2' || e.key === '3')) {
        play('click')
        return askLock(Number(e.key) - 1)
      }
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
        // overflow-x-hidden:新結果滑入時超出右緣,不可冒出水平捲軸讓視窗跳動
        className="max-h-full w-full max-w-xl space-y-3 overflow-y-auto overflow-x-hidden border border-cyan bg-panel p-3 shadow-glowStrong outline-none"
      >
        <div>
          <h2 className="text-lg font-bold text-cyan" aria-live="polite">
            {TITLE[mode]} · {decided ? (applied ? '已改變' : '已維持') : '新舊對照'}
          </h2>
          <p className="text-xs text-muted">
            {props.stoneText}
            {decided && props.continueBlocked && <span className="ml-2 text-tier-red">無法繼續:{props.continueBlocked}</span>}
          </p>
        </div>
        <ul className="space-y-2">
          {before.map((old, i) => {
            const next = after[i]
            // 決定後只顯示目前詞條,不再做新舊對照
            if (decided) {
              return (
                <li key={i} className="flex h-16 items-center gap-2">
                  <div className="min-w-0 flex-1"><Cell slot={old} /></div>
                  <button
                    ref={(el) => { lockBtns.current[i] = el }}
                    className={`btn w-28 shrink-0 px-2 ${old?.locked ? 'bg-cyan/40' : ''}`}
                    disabled={!old}
                    aria-pressed={!!old?.locked}
                    title={old ? undefined : '空欄不能鎖定'}
                    onClick={() => askLock(i)}
                  >
                    {!old ? '不可鎖' : old.locked ? '🔒 已鎖' : '🔓 鎖定'}
                    <Key k={String(i + 1)} />
                  </button>
                </li>
              )
            }
            // 鎖定列與沒有洗到的列不顯示新結果
            const rolled = next !== old
            const better = rolled && !!next && (!old || next.lv > old.lv)
            const diff = DIFF[changes[i]]
            const red = rolled && !!next && getTier(next.lv) === 'red'
            return (
              <li key={i} className="grid h-16 grid-cols-[minmax(0,1fr)_1rem_minmax(0,1fr)] items-center gap-2">
                <Cell slot={old} />
                <span className="text-center text-cyan" aria-hidden>→</span>
                {rolled ? (
                  <div key={props.rollId} className={`fx-slide-in min-w-0 ${better ? 'fx-better' : ''}`}>
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
          <button className="btn-primary min-h-[52px]" disabled={decided} data-sound="none" onClick={apply}>
            改變{!decided && <Key k="Space" />}
          </button>
          <button ref={keepBtn} className="btn min-h-[52px]" disabled={decided} data-sound="none" onClick={keep}>
            維持{!decided && <Key k="Esc" />}
          </button>
          <button className="btn-primary col-span-2 min-h-[52px]" disabled={!decided || !canContinue} data-sound="none" onClick={again}>
            繼續 · 耗 {props.cost}{decided && <Key k="Space" />}
          </button>
          <button className="btn col-span-2 min-h-[52px]" disabled={!decided} data-sound="none" onClick={close}>
            關閉視窗{decided && <Key k="Esc" />}
          </button>
        </div>
        {keepAsk && !decided && (
          <ConfirmPopover
            anchor={keepBtn.current!}
            message="本次洗出紅詞條!維持原詞條將放棄它,確定維持?"
            cautious
            sound="click"
            onConfirm={() => {
              closeAsk()
              props.onKeep()
            }}
            onCancel={closeAsk}
          />
        )}
        {lockAsk !== null && asked && (
          <LockConfirm
            anchor={lockBtns.current[lockAsk]!}
            locked={asked.locked}
            blocked={props.lockBlocked}
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
      </div>
    </div>
  )
}
