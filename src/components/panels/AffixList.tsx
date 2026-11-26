import type { AffixSlot, WeaponEvent } from '../../types'
import { AFFIX_MAP, TIER_NAME, affixValue, tierOfLv } from '../../config/affixes'
import { TIER_BG, TIER_BORDER, TIER_TEXT } from '../tierStyle'

export function affixText(s: AffixSlot): string {
  if (!s) return '(空欄)'
  const d = AFFIX_MAP[s.id]
  return `${d.name} +${affixValue(d, s.lv)}${d.unit}`
}

export function AffixRow({ slot, burst, compact = false }: { slot: AffixSlot; burst?: boolean; compact?: boolean }) {
  if (!slot) {
    return (
      <div className="flex min-h-[44px] items-center border border-dashed border-muted/50 px-3 text-muted">
        (空欄)
      </div>
    )
  }
  const t = tierOfLv(slot.lv)
  return (
    <div
      className={`flex min-h-[44px] items-center justify-between gap-2 border px-3 py-1 ${TIER_BORDER[t]} ${TIER_BG[t]} ${burst ? 'fx-red-burst' : ''}`}
    >
      <span className={`font-semibold ${TIER_TEXT[t]}`}>{affixText(slot)}</span>
      <span className={`text-sm ${TIER_TEXT[t]}`}>
        Lv{slot.lv}{compact ? '' : ` · ${TIER_NAME[t]}`}
      </span>
    </div>
  )
}

export default function AffixList({ slots, fx }: { slots: AffixSlot[]; fx: WeaponEvent | null }) {
  return (
    <ul className="mx-auto mt-4 w-full max-w-md space-y-2">
      {slots.map((s, i) => (
        <li key={`${i}-${fx?.kind === 'red' && fx.slot === i ? fx.n : 0}`}>
          <div className="mb-0.5 text-xs text-muted">詞條 {i + 1}</div>
          <AffixRow slot={s} burst={fx?.kind === 'red' && fx.slot === i} />
        </li>
      ))}
    </ul>
  )
}
