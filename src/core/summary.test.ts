import { describe, expect, it } from 'vitest'
import { LOG_MAX } from '../config/stats'
import { createGame, gameReducer, type GameAction, type GameState } from '../state/gameReducer'
import type { AffixSlot, GameMode, LogEntry, Weapon } from '../types'
import { addLog, formatLogEntry, rerollEntry } from './log'
import { RANDOMS_PER_REROLL } from './reroll'
import { emptyStats } from './stats'
import { buildRunSummary, formatRate, formatUsage } from './summary'

const infinite: GameMode = { kind: 'infinite' }
const quota: GameMode = { kind: 'limited', preset: 'normal', quota: { starStone: 4000, rerollStone: 1500 } }
const turns: GameMode = { kind: 'limited', preset: 'turns', quota: { starStone: 0, rerollStone: 0 }, turns: 80 }

describe('buildRunSummary', () => {
  const stats = {
    ...emptyStats(),
    starAttempts: 8, successes: 3, keeps: 1, drops: 3, resets: 1, pityCount: 1,
    maxSuccessStreak: 2, maxFailStreak: 3, highestStar: 13, starStoneUsed: 1234,
    rerolls: 5, affixRerolls: 3, lvRerolls: 2, lockedRerolls: 2, goldPlusRolled: 4, redRolled: 1,
    rerollAdopts: 2, rerollKeeps: 3, rerollStoneUsed: 9, lockStoneUsed: 2,
  }
  const build = (mode: GameMode) => buildRunSummary({ mode, stats, actionsUsed: 13, milestones: [] })

  it('彙總各數字', () => {
    const s = build(quota)
    expect(s.enhance).toEqual({
      attempts: 8, successes: 3, keeps: 1, drops: 3, resets: 1, pityCount: 1,
      maxSuccessStreak: 2, maxFailStreak: 3, highestStar: 13, successRate: 0.375,
    })
    expect(s.reroll).toEqual({
      total: 5, affix: 3, lv: 2, locked: 2, goldPlus: 4, red: 1, adopts: 2, keeps: 3,
    })
    expect(s.resources).toEqual({
      starStone: { used: 1234, limit: 4000 },
      rerollStone: { used: 9, limit: 1500 },
      lockStone: 2,
      actions: { used: 13, limit: undefined },
    })
  })

  it('各模式的上限與顯示格式', () => {
    expect(formatUsage(build(quota).resources.starStone)).toBe('1,234 / 4,000')
    expect(formatUsage(build(infinite).resources.starStone)).toBe('1,234')
    expect(formatUsage(build(turns).resources.starStone)).toBe('1,234')
    expect(formatUsage(build(turns).resources.actions)).toBe('13 / 80')
    expect(formatRate(build(infinite).enhance.successRate)).toBe('37.5%')
  })

  it('0 次衝星的成功率顯示「—」', () => {
    const s = buildRunSummary(createGame(infinite))
    expect(s.enhance.successRate).toBeNull()
    expect(formatRate(s.enhance.successRate)).toBe('—')
  })
})

/** mulberry32:固定種子亂數 */
function seeded(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function simulate(seed: number, count: number): GameState {
  const rng = seeded(seed)
  const rolls = () => Array.from({ length: RANDOMS_PER_REROLL }, rng)
  let s = createGame(infinite)
  for (let i = 0; i < count; i++) {
    const actions: GameAction[] = [
      { type: 'ENHANCE', protect: rng() < 0.5, roll: rng() },
      { type: 'REROLL', kind: rng() < 0.5 ? 'affix' : 'lv', rolls: rolls() },
      { type: 'CONTINUE', rolls: rolls() },
      { type: 'DECIDE_ADOPT' },
      { type: 'DECIDE_KEEP' },
      { type: 'CLOSE_REROLL' },
      { type: 'TOGGLE_LOCK', slotIndex: Math.floor(rng() * 3) },
    ]
    s = gameReducer(s, actions[Math.floor(rng() * actions.length)])
  }
  return s
}

describe('一致性', () => {
  it.each([1, 2, 3])('隨機 500 次動作(種子 %i)', (seed) => {
    const state = simulate(seed, 500)
    const { enhance: e, reroll: r, resources } = buildRunSummary(state)
    expect(e.attempts).toBeGreaterThan(0)
    expect(r.total).toBeGreaterThan(0)
    expect(e.attempts).toBe(e.successes + e.keeps + e.drops + e.resets)
    expect(r.total).toBe(r.affix + r.lv)
    expect(r.adopts + r.keeps).toBeLessThanOrEqual(r.total)
    expect(resources.rerollStone.used).toBeGreaterThanOrEqual(resources.lockStone)
    expect(e.maxSuccessStreak).toBeLessThanOrEqual(e.successes)
    expect(e.maxFailStreak).toBeLessThanOrEqual(e.attempts - e.successes)
    expect(resources.actions.used).toBe(e.attempts + r.total)
    expect(state.log.length).toBeLessThanOrEqual(LOG_MAX)
  })
})

describe('formatLogEntry', () => {
  const enhance = (from: number, to: number, outcome: 'success' | 'keep' | 'drop' | 'reset', extra = {}) =>
    formatLogEntry({ id: 1, type: 'enhance', auto: false, pity: false, from, to, outcome, ...extra })

  it('衝星各結果', () => {
    expect(enhance(6, 7, 'success')).toBe('衝星 +6 → +7 成功')
    expect(enhance(3, 3, 'keep')).toBe('衝星 +3 維持')
    expect(enhance(7, 6, 'drop')).toBe('衝星 +7 → +6 掉星')
    expect(enhance(13, 0, 'reset')).toBe('歸零!+13 → +0')
    expect(enhance(4, 5, 'success', { pity: true })).toBe('保底成功 +4 → +5')
    expect(enhance(6, 7, 'success', { auto: true })).toBe('自動衝星 +6 → +7 成功')
  })

  const crit = (lv: number): AffixSlot => ({ id: 'critRate', lv, locked: false })
  const reroll = (kind: 'affix' | 'lv', before: AffixSlot, after: AffixSlot, adopted: boolean) =>
    ({ id: 1, ...rerollEntry(kind, [before, null, null], [after, null, null], adopted) }) as LogEntry

  it('洗練改變與維持', () => {
    expect(formatLogEntry(reroll('lv', crit(5), crit(9), true))).toBe('數值重洗 暴擊率 Lv5 → Lv9 改變')
    expect(formatLogEntry(reroll('lv', crit(5), crit(9), false))).toBe('數值重洗 維持')
    expect(formatLogEntry(reroll('affix', crit(5), { id: 'attack', lv: 15, locked: false }, true)))
      .toBe('詞條變更 暴擊率 Lv5 → 攻擊力 Lv15 改變')
    expect(formatLogEntry(reroll('affix', crit(5), null, true))).toBe('詞條變更 暴擊率 Lv5 → 空欄 改變')
  })

  it('洗練顏色取本次洗出的最高階,鎖定欄不算', () => {
    const locked: AffixSlot = { id: 'attack', lv: 15, locked: true }
    const before: Weapon['slots'] = [locked, crit(1), null]
    expect(rerollEntry('lv', before, [locked, crit(7), null], false)).toMatchObject({ tier: 'purple' })
  })

  it('鎖定與解除', () => {
    const lock = (locked: boolean) => formatLogEntry({ id: 1, type: 'lock', slot: 0, locked, tier: 'blue' })
    expect([lock(true), lock(false)]).toEqual(['鎖定詞條 1', '解除鎖定詞條 1'])
  })

  it('超過 LOG_MAX 丟掉最舊的', () => {
    let log: LogEntry[] = []
    for (let i = 0; i < LOG_MAX + 5; i++) log = addLog(log, { type: 'lock', slot: 0, locked: true, tier: 'blue' })
    expect(log).toHaveLength(LOG_MAX)
    expect(log[0].id).toBe(LOG_MAX + 5)
    expect(log[LOG_MAX - 1].id).toBe(6)
  })
})

describe('重置', () => {
  it('START_RUN 後統計、紀錄、里程碑歸零', () => {
    let s = simulate(1, 200)
    for (let i = 0; i < 5; i++) s = gameReducer(s, { type: 'ENHANCE', protect: false, roll: 0 })
    expect(s.log.length).toBeGreaterThan(0)
    expect(s.milestones.length).toBeGreaterThan(0)
    s = gameReducer(gameReducer(s, { type: 'FINISH_RUN', reason: 'manual' }), { type: 'START_RUN', mode: infinite })
    expect(s.stats).toEqual(emptyStats())
    expect(s).toMatchObject({ log: [], milestones: [], actionsUsed: 0, settlement: null })
  })
})
