import type { AffixSlot } from '../../types'
import { REROLL_BASE_COST } from '../../config/balance'
import { AffixRow } from './AffixList'

interface Props {
  slots: [AffixSlot, AffixSlot, AffixSlot]
  disabled: boolean
  onToggleLock: (i: number) => void
  onReroll: (mode: 'affix' | 'lv') => void
}

export default function RerollPanel({ slots, disabled, onToggleLock, onReroll }: Props) {
  const locked = slots.filter((s) => s?.locked).length
  const cost = REROLL_BASE_COST + locked

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {slots.map((s, i) => (
          <li key={i} className="flex items-center gap-2">
            <div className="flex-1"><AffixRow slot={s} compact /></div>
            <button
              className={`btn w-24 px-2 ${s?.locked ? 'bg-cyan text-bg' : ''}`}
              disabled={!s || disabled}
              aria-pressed={!!s?.locked}
              onClick={() => onToggleLock(i)}
              title={s ? '鎖定耗 1 洗練石,解除免費' : '空欄不能鎖定'}
            >
              {!s ? '不可鎖' : s.locked ? '🔒 已鎖' : '🔓 鎖定'}
            </button>
          </li>
        ))}
      </ul>

      <div className="text-sm text-muted">
        洗練消耗:洗練石 ×<span className="text-lg font-bold text-cyan">{cost}</span>(1 + 鎖定 {locked} 條)· 鎖定動作另耗 1 顆
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button className="btn-primary" disabled={disabled} onClick={() => onReroll('affix')}>詞條變更</button>
        <button className="btn-primary" disabled={disabled} onClick={() => onReroll('lv')}>數值重洗</button>
      </div>
    </div>
  )
}
