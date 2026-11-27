import type { AffixSlot } from '../../types'
import { REROLL_BASE_COST } from '../../config/balance'
import { AffixRow } from './AffixList'

interface Props {
  slots: [AffixSlot, AffixSlot, AffixSlot]
  disabled: boolean
  onOpen: () => void
}

export default function RerollPanel({ slots, disabled, onOpen }: Props) {
  const locked = slots.filter((s) => s?.locked).length
  const cost = REROLL_BASE_COST + locked

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {slots.map((s, i) => (
          <li key={i} className="flex items-center gap-2">
            <div className="flex-1"><AffixRow slot={s} compact /></div>
            <span className="w-8 text-center" role="img" aria-label={s?.locked ? '已鎖定' : '未鎖定'}>{s?.locked ? '🔒' : ''}</span>
          </li>
        ))}
      </ul>

      <div className="text-sm text-muted">
        洗練消耗:洗練石 ×<span className="text-lg font-bold text-cyan">{cost}</span>(1 + 鎖定 {locked} 條)· 鎖定動作另耗 1 顆
      </div>

      <button className="btn-primary min-h-[52px] w-full text-lg" disabled={disabled} onClick={onOpen}>開始洗練</button>
    </div>
  )
}
