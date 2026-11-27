import { useState } from 'react'
import { AFFIXES, TIER_NAME } from '../../config/affixes'
import { LEVEL_WEIGHTS, SLOT_APPEAR_RATES, TIER_LEVELS, TIER_TOTALS } from '../../config/reroll'
import { getAttributeValue } from '../../core/reroll'
import type { Tier } from '../../types'
import { TIER_BG, TIER_TEXT } from '../tierStyle'

const percent = (ratio: number) => `${Number((ratio * 100).toFixed(2))}%`
const TOTAL_WEIGHT = AFFIXES.reduce((sum, a) => sum + a.weight, 0)
const TIERS = Object.keys(TIER_LEVELS) as Tier[]

/** 可展開的詞條清單與 Lv 機率一覽 */
export default function AffixTable() {
  const [open, setOpen] = useState(false)
  return (
    <div>
      <button className="btn w-full" aria-expanded={open} onClick={() => setOpen(!open)}>
        詞條與機率一覽 {open ? '▲' : '▼'}
      </button>
      {open && (
        <div className="mt-2 space-y-3 text-sm">
          <p className="text-muted">
            第 1~{SLOT_APPEAR_RATES.length} 欄出現機率:{SLOT_APPEAR_RATES.map(percent).join(' / ')}
          </p>

          <section className="space-y-1">
            <h4 className="font-semibold text-cyan">Lv 機率</h4>
            {TIERS.map((t) => {
              const [lo, hi] = TIER_LEVELS[t]
              return (
                <div key={t} className={`px-2 py-1 ${TIER_BG[t]} ${TIER_TEXT[t]}`}>
                  <div className="text-xs font-semibold">{TIER_NAME[t]} · 合計 {percent(TIER_TOTALS[t])}</div>
                  <ul className="grid grid-cols-5 gap-x-2 text-center">
                    {LEVEL_WEIGHTS.slice(lo - 1, hi).map((w, i) => (
                      <li key={i}>Lv{lo + i} <span className="font-bold">{percent(w)}</span></li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </section>

          <section>
            <h4 className="font-semibold text-cyan">詞條清單(共 {AFFIXES.length} 種)</h4>
            <table className="w-full text-right">
              <thead className="text-muted">
                <tr>
                  <th className="py-1 text-left font-normal">屬性</th>
                  <th className="font-normal">抽中機率</th>
                  <th className="font-normal">Lv1 ~ Lv{LEVEL_WEIGHTS.length}</th>
                </tr>
              </thead>
              <tbody>
                {AFFIXES.map((a) => (
                  <tr key={a.id} className="border-t border-cyan/15">
                    <th scope="row" className="py-0.5 text-left font-semibold">{a.name}</th>
                    <td>{percent(a.weight / TOTAL_WEIGHT)}</td>
                    <td>+{getAttributeValue(a.id, 1)}% ~ +{getAttributeValue(a.id, LEVEL_WEIGHTS.length)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-1 text-xs text-muted">抽中機率以全部屬性計算;其他欄位已有的屬性不會重複出現,其餘機率隨之提高。</p>
          </section>
        </div>
      )}
    </div>
  )
}
