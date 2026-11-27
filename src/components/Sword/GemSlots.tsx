import type { AffixSlot, WeaponEvent } from '../../types'
import { TIER_NAME } from '../../config/affixes'
import { TIER_TEXT, slotTier } from '../tierStyle'

const GEM = 'M20 3L34 14V28L20 41L6 28V14Z'

/** 詞條寶石欄:3 顆寶石對應 3 條詞條,空欄為暗孔 */
export default function GemSlots({ slots, fx }: { slots: AffixSlot[]; fx: WeaponEvent | null }) {
  return (
    <ul className="flex flex-col gap-4" aria-label="詞條寶石欄">
      {slots.map((s, i) => {
        const t = slotTier(s)
        const burst = fx?.kind === 'red' && fx.slot === i
        return (
          <li key={i} className={`relative h-11 w-11 ${t ? TIER_TEXT[t] : 'text-muted'}`}>
            <svg viewBox="0 0 40 44" className="h-full w-full" role="img" aria-label={`寶石 ${i + 1}:${t ? TIER_NAME[t] : '空欄'}`}>
              {t ? (
                <>
                  <path d={GEM} fill="currentColor" opacity=".3" stroke="currentColor" strokeWidth="6" />
                  <path d={GEM} fill="currentColor" className="stroke-ink" strokeWidth="1.2" />
                  <path d="M20 9L28 16L20 21L12 16Z" className="fill-ink" opacity=".55" />
                </>
              ) : (
                <>
                  <path d={GEM} className="fill-bg stroke-muted/60" strokeWidth="1.5" />
                  <circle cx="20" cy="22" r="7" className="fill-panel" />
                </>
              )}
            </svg>
            {burst && <span key={fx.n} className="fx-gem-burst pointer-events-none absolute inset-0 rounded-full bg-current" aria-hidden />}
          </li>
        )
      })}
    </ul>
  )
}
