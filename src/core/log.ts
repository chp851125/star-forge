import type { AffixSlot, LogEntry, RerollMode, Tier, Weapon } from '../types'
import { AFFIX_MAP } from '../config/affixes'
import { LOG_MAX } from '../config/stats'
import { getTier, rolledSlots } from './reroll'

type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never
export type NewLogEntry = DistributiveOmit<LogEntry, 'id'>

const REROLL_LABEL: Record<RerollMode, string> = { affix: '詞條變更', lv: '數值重洗' }

/** 新的在前;超過 LOG_MAX 丟掉最舊的 */
export function addLog(log: LogEntry[], entry: NewLogEntry): LogEntry[] {
  return [{ ...entry, id: (log[0]?.id ?? 0) + 1 }, ...log].slice(0, LOG_MAX)
}

/** 洗練決定的紀錄:有變動的欄位與本次洗出的最高階 */
export function rerollEntry(
  kind: RerollMode, before: Weapon['slots'], after: Weapon['slots'], adopted: boolean,
): NewLogEntry {
  const changes = before.flatMap((b, i) => {
    const a = after[i]
    return b?.id === a?.id && b?.lv === a?.lv ? [] : [{ before: b, after: a }]
  })
  const levels = rolledSlots(before, after).flatMap((s) => (s ? [s.lv] : []))
  const tier: Tier | null = levels.length ? getTier(Math.max(...levels)) : null
  return { type: 'reroll', kind, adopted, changes, tier }
}

const slotName = (s: AffixSlot) => (s ? `${AFFIX_MAP[s.id].name} Lv${s.lv}` : '空欄')

function changeText({ before, after }: { before: AffixSlot; after: AffixSlot }): string {
  if (before && after && before.id === after.id) return `${slotName(before)} → Lv${after.lv}`
  return `${slotName(before)} → ${slotName(after)}`
}

export function formatLogEntry(e: LogEntry): string {
  if (e.type === 'lock') return `${e.locked ? '鎖定' : '解除鎖定'}詞條 ${e.slot + 1}`
  if (e.type === 'reroll') {
    const changes = e.adopted ? e.changes.map(changeText).join('、') : ''
    return [REROLL_LABEL[e.kind], changes, e.adopted ? '改變' : '維持'].filter(Boolean).join(' ')
  }
  const move = `+${e.from} → +${e.to}`
  const text =
    e.pity ? `保底成功 ${move}`
    : e.outcome === 'reset' ? `歸零!${move}`
    : e.outcome === 'keep' ? `衝星 +${e.from} 維持`
    : `衝星 ${move} ${e.outcome === 'success' ? '成功' : '掉星'}`
  return e.auto ? `自動${text}` : text
}
