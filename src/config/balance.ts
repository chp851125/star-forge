import type { EnhanceStep, ZoneKind } from '../types'

export const MAX_STAR = 15

const row = (success: number, keep: number, drop: number, reset: number, cost: number): EnhanceStep => ({
  rates: { success, keep, drop, reset },
  cost,
})

/** 佔位值:index = 目前星級(0~14);row(成功%, 維持%, 掉星%, 歸零%, 升星石消耗),機率加總須為 100 */
export const ENHANCE_TABLE: EnhanceStep[] = [
  row(100, 0, 0, 0, 1),
  row(95, 5, 0, 0, 1),
  row(90, 10, 0, 0, 1),
  row(85, 15, 0, 0, 2),
  row(80, 20, 0, 0, 2),
  row(70, 30, 0, 0, 3),
  row(65, 35, 0, 0, 3),
  row(60, 0, 40, 0, 4),
  row(55, 0, 45, 0, 5),
  row(50, 0, 50, 0, 6),
  row(45, 0, 55, 0, 8),
  row(40, 0, 60, 0, 10),
  row(40, 0, 35, 25, 12),
  row(35, 0, 30, 35, 15),
  row(30, 0, 25, 45, 20),
]

/** 星鐵護鑄:僅歸零機率 > 0 的星級生效;歸零改為維持(不防掉星),消耗乘上倍率。defaultOn = 開局是否勾選 */
export const PROTECTION = { name: '星鐵護鑄', enabled: true, defaultOn: true, costMultiplier: 2 }

/** 保底:連續掉星達指定次數,下一次衝星必定成功(消耗照算) */
export const PITY = { enabled: true, consecutiveDropsNeeded: 2 }

export const ZONE_LABEL: Record<ZoneKind, string> = {
  safe: '安全區:失敗維持星級',
  drop: '掉星區:失敗可能 -1 星',
  reset: '歸零區:失敗可能歸零回 +0',
}
