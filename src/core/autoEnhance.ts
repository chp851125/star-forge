import type { AutoStopReason } from '../types'
import { MAX_STAR } from '../config/balance'

interface Input {
  star: number
  target: number
  stones: number
  /** 下一次的消耗(含防歸零加成) */
  nextCost: number
  unlimited: boolean
}

/** 下一次嘗試前判斷是否停止;null = 繼續 */
export function shouldStopAuto({ star, target, stones, nextCost, unlimited }: Input): AutoStopReason | null {
  if (star >= target || star >= MAX_STAR) return 'target'
  if (!unlimited && stones < nextCost) return 'noResource'
  return null
}
