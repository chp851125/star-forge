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

/** 詞條摘要:三列緊湊單行 */
export default function AffixList({ slots, fx }: { slots: AffixSlot[]; fx: WeaponEvent | null }) {
  return (
    <ul className="w-full shrink-0 space-y-1" aria-label="詞條摘要">
      {slots.map((s, i) => {
        const burst = fx?.kind === 'red' && fx.slot === i
        const t = s ? tierOfLv(s.lv) : null
        const d = s ? AFFIX_MAP[s.id] : null
        return (
          <li
            key={`${i}-${burst ? fx.n : 0}`}
            className={`flex h-9 items-center gap-2 border px-3 text-sm ${t ? `${TIER_BORDER[t]} ${TIER_BG[t]} ${TIER_TEXT[t]}` : 'border-dashed border-muted/50 text-muted'} ${burst ? 'fx-red-burst' : ''}`}
          >
            <span
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${t ? 'bg-current' : 'border border-current'}`}
              role="img"
              aria-label={t ? TIER_NAME[t] : '空欄'}
            />
            {s && d ? (
              <>
                <span className="flex-1 truncate font-semibold">{d.name}</span>
                <span className="font-bold">+{affixValue(d, s.lv)}{d.unit}</span>
                <span className="w-10 text-right">Lv{s.lv}</span>
              </>
            ) : (
              <span>(空欄)</span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
