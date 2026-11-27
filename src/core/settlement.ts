import type { AffixSlot, GameMode, Milestone, Resources, Settlement } from '../types'
import { AFFIX_MAP, TIER_COLOR_NAME } from '../config/affixes'
import { PRESET_LABEL } from '../config/modes'
import { REROLL_BASE_COST } from '../config/reroll'
import { WEAPON_STYLE, stageOf } from '../config/weapons'
import { getEnhanceCost } from './enhance'
import { getAttributeValue, getTier } from './reroll'
import { buildRunSummary, type Usage } from './summary'

/** 次數制的操作次數上限;其他模式為 undefined */
export const getActionLimit = (mode: GameMode): number | undefined =>
  mode.kind === 'limited' && mode.preset === 'turns' ? mode.turns : undefined

interface ExhaustInput {
  mode: GameMode
  resources: Resources
  star: number
  actionsUsed: number
  actionLimit?: number
}

export function isExhausted({ mode, resources, star, actionsUsed, actionLimit }: ExhaustInput): boolean {
  if (mode.kind === 'infinite') return false
  if (mode.preset === 'turns') return actionLimit !== undefined && actionsUsed >= actionLimit
  // null = 星級已達上限
  const cost = getEnhanceCost(star, false)
  const noEnhance = cost === null || resources.starStone < cost
  return noEnhance && resources.rerollStone < REROLL_BASE_COST
}

export const formatMilestone = (m: Milestone) =>
  `首次到達 +${m.star}:累計升星石 ${m.enhanceStoneSpent}、洗練石 ${m.rerollStoneSpent}、衝星 ${m.attempts} 次`

function slotText(s: AffixSlot): string {
  if (!s) return '空欄'
  return `${AFFIX_MAP[s.id].name} +${getAttributeValue(s.id, s.lv)}%(Lv${s.lv} ${TIER_COLOR_NAME[getTier(s.lv)]})`
}

/** 複製用成績文字 */
export function buildShareText(result: Settlement): string {
  const { weapon, mode, grade, score } = result
  const { enhance, resources } = buildRunSummary(result)
  const spent = ({ used, limit }: Usage) => (limit === undefined ? `${used}` : `${used}/${limit}`)
  return [
    `星煉工坊 評級 ${grade}(${score} 分)`,
    `劍:+${weapon.stars} ${WEAPON_STYLE.stages[stageOf(weapon.stars)].name}`,
    // 右括號後直接接斜線
    `詞條:${weapon.slots.map(slotText).reduce((line, t) => `${line}${line.endsWith(')') ? '' : ' '}/ ${t}`)}`,
    `模式:${mode.kind === 'infinite' ? '無限' : `限定・${PRESET_LABEL[mode.preset]}`}`,
    `衝星 ${enhance.attempts} 次(成功 ${enhance.successes}・掉星 ${enhance.drops}・歸零 ${enhance.resets})`,
    `消耗:升星石 ${spent(resources.starStone)}、洗練石 ${spent(resources.rerollStone)}`,
  ].join('\n')
}
