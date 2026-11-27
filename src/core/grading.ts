import type { AffixSlot, Grade, Weapon } from '../types'
import { GRADE_THRESHOLDS, SLOT_SCORES } from '../config/grading'
import { getTier } from './reroll'

export const scoreSlot = (slot: AffixSlot): number => SLOT_SCORES[slot ? getTier(slot.lv) : 'empty']

export const calcAffixScore = (slots: Weapon['slots']) => slots.reduce((sum, s) => sum + scoreSlot(s), 0)

export const calcScore = (weapon: Weapon) => calcAffixScore(weapon.slots) + weapon.stars

export const getGrade = (score: number): Grade =>
  GRADE_THRESHOLDS.find((g) => score >= g.min)?.grade ?? 'C'
