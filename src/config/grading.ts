import type { Grade } from '../types'

/** 佔位:實際換算規則之後實作 */
export const GRADE_THRESHOLDS: { grade: Grade; min: number }[] = [
  { grade: 'S', min: 24 },
  { grade: 'A', min: 18 },
  { grade: 'B', min: 11 },
  { grade: 'C', min: 0 },
]
