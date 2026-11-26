import type { WeaponStyle } from '../types'

export const WEAPON_STYLE: WeaponStyle = {
  id: 'star-forge-blade',
  name: '星煉劍',
  renderer: 'svg',
  stages: [
    { name: '鏽鐵劍', minStar: 0, maxStar: 2 },
    { name: '精鋼劍', minStar: 3, maxStar: 5 },
    { name: '冰紋劍', minStar: 6, maxStar: 8 },
    { name: '暗影劍', minStar: 9, maxStar: 11 },
    { name: '星熾巨劍', minStar: 12, maxStar: 14 },
    { name: '傳說終焉', minStar: 15, maxStar: 15 },
  ],
}

/** 星級 → 階段索引 0~5 */
export function stageOf(stars: number): number {
  const i = WEAPON_STYLE.stages.findIndex((s) => stars >= s.minStar && stars <= s.maxStar)
  return i < 0 ? 0 : i
}
