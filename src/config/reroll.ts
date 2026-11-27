import type { Tier } from '../types'

/** 各欄出現詞條的機率(第 1~3 欄) */
export const SLOT_APPEAR_RATES = [1, 0.5, 0.3]

/** 各階級的總機率(加總須為 1) */
export const TIER_TOTALS: Record<Tier, number> = { blue: 0.6, purple: 0.3, gold: 0.09, red: 0.01 }

/** 各階級包含的 Lv 範圍 [最低, 最高],由低到高連續排列 */
export const TIER_LEVELS: Record<Tier, [number, number]> = {
  blue: [1, 5], purple: [6, 10], gold: [11, 14], red: [15, 15],
}

/** index = Lv − 1;階級內各 Lv 平均分配 */
export const LEVEL_WEIGHTS: number[] = (Object.keys(TIER_LEVELS) as Tier[]).flatMap((tier) => {
  const [lo, hi] = TIER_LEVELS[tier]
  const count = hi - lo + 1
  return Array<number>(count).fill(TIER_TOTALS[tier] / count)
})

/** 洗練消耗 = 基礎值 + 鎖定條數 */
export const REROLL_BASE_COST = 1
/** 鎖定動作消耗(解除免費) */
export const LOCK_COST = 1
