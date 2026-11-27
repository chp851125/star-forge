import { useEffect, useRef, useState } from 'react'
import type { RerollMode, Weapon } from '../../types'
import { LOCK_COST } from '../../config/reroll'
import { canAffixChange, canValueReroll, countLocked, getRerollCost } from '../../core/reroll'
import ConfirmPopover from '../ui/ConfirmPopover'
import { AffixRow } from './AffixList'

interface Props {
  slots: Weapon['slots']
  disabled: boolean
  /** 洗練石或次數不足以洗練的原因 */
  rerollBlocked: string | null
  /** 有值時鎖定的「確定」disabled 並顯示原因 */
  lockBlocked: string | null
  /** 洗練石資訊 */
  stoneText: string
  onToggleLock: (i: number) => void
  onReroll: (mode: RerollMode) => void
}

const Key = ({ k }: { k: string }) => (
  <kbd className="ml-2 hidden border border-current px-1 text-xs font-normal opacity-80 lg:inline">{k}</kbd>
)

export default function RerollPanel(props: Props) {
  const { slots, disabled } = props
  const locked = countLocked(slots)
  const cost = getRerollCost(locked)
  const can: Record<RerollMode, boolean> = {
    affix: !disabled && !props.rerollBlocked && canAffixChange(slots),
    lv: !disabled && !props.rerollBlocked && canValueReroll(slots),
  }
  const reasons = props.rerollBlocked
    ? [props.rerollBlocked]
    : [
        !canAffixChange(slots) && '詞條變更:所有欄位皆已鎖定',
        !canValueReroll(slots) && '數值重洗:沒有未鎖定的詞條',
      ].filter(Boolean)
  const lockBtns = useRef<(HTMLButtonElement | null)[]>([])
  const [lockAsk, setLockAsk] = useState<number | null>(null)
  const askLock = (i: number) => !disabled && slots[i] && setLockAsk(i)

  // 快捷鍵:Q / W 洗練、1~3 切換鎖定
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (lockAsk !== null || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return
      if ((e.target as HTMLElement).matches('input, textarea, select, [contenteditable="true"]')) return
      const k = e.key.toLowerCase()
      if (k === 'q') can.affix && props.onReroll('affix')
      else if (k === 'w') can.lv && props.onReroll('lv')
      else if (k === '1' || k === '2' || k === '3') askLock(Number(k) - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const asked = lockAsk === null ? null : slots[lockAsk]

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {slots.map((s, i) => (
          <li key={i} className="flex items-center gap-2">
            <div className="flex-1"><AffixRow slot={s} compact /></div>
            <button
              ref={(el) => { lockBtns.current[i] = el }}
              className={`btn w-28 px-2 ${s?.locked ? 'bg-cyan/40' : ''}`}
              disabled={!s || disabled}
              aria-pressed={!!s?.locked}
              title={s ? undefined : '空欄不能鎖定'}
              onClick={() => askLock(i)}
            >
              {!s ? '不可鎖' : s.locked ? '🔒 已鎖' : '🔓 鎖定'}
              <Key k={String(i + 1)} />
            </button>
          </li>
        ))}
      </ul>

      <div className="text-sm text-muted">
        洗練消耗:洗練石 ×<span className="text-lg font-bold text-cyan">{cost}</span>(1 + 鎖定 {locked} 條)· 鎖定動作另耗 {LOCK_COST} 顆
        <div>{props.stoneText}</div>
        {reasons.length > 0 && <div className="text-tier-red">{reasons.join(';')}</div>}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button className="btn-primary min-h-[52px]" disabled={!can.affix} onClick={() => props.onReroll('affix')}>
          詞條變更<Key k="Q" />
        </button>
        <button className="btn-primary min-h-[52px]" disabled={!can.lv} onClick={() => props.onReroll('lv')}>
          數值重洗<Key k="W" />
        </button>
      </div>

      {lockAsk !== null && asked && (
        <ConfirmPopover
          anchor={lockBtns.current[lockAsk]!}
          message={
            asked.locked
              ? '解除鎖定後,此詞條會在洗練時被重洗,每次洗練消耗 −1。確定解除?'
              : `鎖定此詞條將消耗 ${LOCK_COST} 洗練石,之後每次洗練消耗 +1。確定鎖定?`
          }
          blocked={asked.locked ? null : props.lockBlocked}
          sound={asked.locked ? 'unlock' : 'lock'}
          onConfirm={() => {
            props.onToggleLock(lockAsk)
            setLockAsk(null)
          }}
          onCancel={() => setLockAsk(null)}
        />
      )}
    </div>
  )
}
