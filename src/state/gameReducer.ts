import type { AutoStopReason, EnhanceOutcome, GameMode, Resources, RunStats, Weapon, WeaponEvent } from '../types'
import { MAX_STAR } from '../config/balance'
import { stageOf } from '../config/weapons'
import { describeEnhance, nextConsecutiveDrops, rollEnhance, type EnhanceResult } from '../core/enhance'
import { addEnhance, emptyStats } from '../core/stats'

export interface GameEvent {
  /** 遞增流水號,讓同一事件可重複觸發特效 */
  id: number
  kind: WeaponEvent['kind']
  from: number
  to: number
  /** 是否跨越武器階段(升星) */
  evolved: boolean
  /** 自動升星產生的事件 */
  auto: boolean
  slot?: number
}

export interface AutoSession {
  active: boolean
  target: number
  protect: boolean
  startStar: number
  tries: number
  counts: Record<EnhanceOutcome, number>
  /** 本次自動升星的升星石消耗 */
  used: number
  stopReason: AutoStopReason | null
}

export interface GameState {
  mode: GameMode
  weapon: Weapon
  resources: Resources
  /** 次數制剩餘次數 */
  turnsLeft?: number
  stats: RunStats
  /** 操作紀錄,新的在前 */
  log: string[]
  consecutiveDrops: number
  /** 最近一次衝星結果(就地顯示用) */
  lastResult: (EnhanceResult & { from: number }) | null
  lastEvent: GameEvent | null
  autoSession: AutoSession | null
}

export type GameAction =
  | { type: 'START_RUN'; mode: GameMode; slots: Weapon['slots'] }
  /** roll:呼叫端提供的 [0, 1) 亂數,讓 reducer 保持純函式 */
  | { type: 'ENHANCE'; protect: boolean; roll: number }
  | { type: 'AUTO_START'; target: number; protect: boolean }
  | { type: 'AUTO_STOP'; reason: AutoStopReason }
  | { type: 'AUTO_CANCEL' }
  | { type: 'AUTO_CLOSE' }
  /** SET_STARS / PREVIEW_FX 供開發面板與特效預覽,不計入統計 */
  | { type: 'SET_STARS'; stars: number }
  | { type: 'PREVIEW_FX'; kind: WeaponEvent['kind']; to?: number; slot?: number }
  /** 以下兩個供洗練(目前為假資料)使用 */
  | { type: 'SET_SLOTS'; slots: Weapon['slots'] }
  | { type: 'REROLL_RECORD'; message: string; stones?: number; rerolls?: number }

/** 石頭是否不限量(無限模式與次數制) */
export const isUnlimited = (m: GameMode) => m.kind === 'infinite' || m.preset === 'turns'

export function createGame(mode: GameMode, slots: Weapon['slots']): GameState {
  return {
    mode,
    weapon: { stars: 0, slots: [...slots] as Weapon['slots'] },
    resources: mode.kind === 'limited' ? { ...mode.quota } : { starStone: 0, rerollStone: 0 },
    turnsLeft: mode.kind === 'limited' ? mode.turns : undefined,
    stats: emptyStats(),
    log: [],
    consecutiveDrops: 0,
    lastResult: null,
    lastEvent: null,
    autoSession: null,
  }
}

const spendTurn = (t: number | undefined) => (t === undefined ? t : t - 1)

const nextEvent = (s: GameState, e: Omit<GameEvent, 'id'>): GameEvent => ({ id: (s.lastEvent?.id ?? 0) + 1, ...e })

const stopAuto = (s: GameState, reason: AutoStopReason): GameState =>
  s.autoSession?.active ? { ...s, autoSession: { ...s.autoSession, active: false, stopReason: reason } } : s

function enhance(s: GameState, protect: boolean, roll: number): GameState {
  if (s.turnsLeft !== undefined && s.turnsLeft <= 0) return s
  const from = s.weapon.stars
  const r = rollEnhance({ star: from, protect, consecutiveDrops: s.consecutiveDrops, rng: () => roll })
  if (!r) return s
  const unlimited = isUnlimited(s.mode)
  if (!unlimited && s.resources.starStone < r.cost) return s

  const auto = s.autoSession?.active ? s.autoSession : null
  const evolved = r.newStar > from && stageOf(r.newStar) !== stageOf(from)
  return {
    ...s,
    weapon: { ...s.weapon, stars: r.newStar },
    resources: unlimited ? s.resources : { ...s.resources, starStone: s.resources.starStone - r.cost },
    turnsLeft: spendTurn(s.turnsLeft),
    stats: addEnhance(s.stats, r),
    log: [`衝星 ${describeEnhance(from, r)}`, ...s.log],
    consecutiveDrops: nextConsecutiveDrops(s.consecutiveDrops, r.outcome),
    lastResult: { ...r, from },
    lastEvent: nextEvent(s, { kind: evolved ? 'evolve' : r.outcome, from, to: r.newStar, evolved, auto: !!auto }),
    autoSession: auto
      ? {
          ...auto,
          tries: auto.tries + 1,
          used: auto.used + r.cost,
          counts: { ...auto.counts, [r.outcome]: auto.counts[r.outcome] + 1 },
        }
      : s.autoSession,
  }
}

export function gameReducer(s: GameState, a: GameAction): GameState {
  switch (a.type) {
    case 'START_RUN':
      return createGame(a.mode, a.slots)
    case 'ENHANCE':
      return enhance(s, a.protect, a.roll)
    case 'AUTO_START':
      if (s.autoSession?.active || a.target <= s.weapon.stars || a.target > MAX_STAR) return s
      return {
        ...s,
        autoSession: {
          active: true, target: a.target, protect: a.protect, startStar: s.weapon.stars,
          tries: 0, counts: { success: 0, keep: 0, drop: 0, reset: 0 }, used: 0, stopReason: null,
        },
      }
    case 'AUTO_STOP':
      return stopAuto(s, a.reason)
    case 'AUTO_CANCEL':
      return stopAuto(s, 'cancelled')
    case 'AUTO_CLOSE':
      return s.autoSession ? { ...s, autoSession: null } : s
    case 'SET_STARS':
      return { ...s, weapon: { ...s.weapon, stars: Math.min(MAX_STAR, Math.max(0, a.stars)) }, lastResult: null }
    case 'PREVIEW_FX': {
      const from = s.weapon.stars
      const to = a.to ?? from
      return {
        ...s,
        weapon: { ...s.weapon, stars: to },
        lastResult: a.kind === 'red' ? s.lastResult : null,
        lastEvent: nextEvent(s, { kind: a.kind, from, to, evolved: a.kind === 'evolve', auto: false, slot: a.slot }),
      }
    }
    case 'SET_SLOTS':
      return { ...s, weapon: { ...s.weapon, slots: a.slots } }
    case 'REROLL_RECORD': {
      const stones = a.stones ?? 0
      return {
        ...s,
        resources: isUnlimited(s.mode) ? s.resources : { ...s.resources, rerollStone: s.resources.rerollStone - stones },
        turnsLeft: stones ? spendTurn(s.turnsLeft) : s.turnsLeft,
        stats: { ...s.stats, rerolls: s.stats.rerolls + (a.rerolls ?? 0), rerollStoneUsed: s.stats.rerollStoneUsed + stones },
        log: [a.message, ...s.log],
      }
    }
  }
}
