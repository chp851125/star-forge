import type { Grade, Tier } from '../types'

/** 詞條依階級色給分;總分 = 三欄詞條分數 + 星級 */
export const SLOT_SCORES: Record<Tier | 'empty', number> = { blue: 1, purple: 2, gold: 3, red: 4, empty: 0 }

/** 由高到低排列,取第一個 score >= min */
export const GRADE_THRESHOLDS: { grade: Grade; min: number }[] = [
  { grade: 'S', min: 22 },
  { grade: 'A', min: 17 },
  { grade: 'B', min: 11 },
  { grade: 'C', min: 0 },
]

/** 評級顯示色(Tailwind theme token) */
export const GRADE_COLOR: Record<Grade, string> = {
  S: 'text-tier-gold', A: 'text-cyan', B: 'text-tier-purple', C: 'text-muted',
}
