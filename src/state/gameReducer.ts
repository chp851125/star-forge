import type {
  AutoStopReason, EnhanceOutcome, GameMode, RerollMode, RerollPhase, Resources, RunStats, Weapon, WeaponEvent,
} from '../types'
import { MAX_STAR } from '../config/balance'
import { LOCK_COST } from '../config/reroll'
import { stageOf } from '../config/weapons'
import { describeEnhance, nextConsecutiveDrops, rollEnhance, type EnhanceResult } from '../core/enhance'
import {
  canAffixChange, canValueReroll, countLocked, getRerollCost, getTier, rollAffixChange, rolledSlots, rollValueReroll,
} from '../core/reroll'
import { addEnhance, addLock, addReroll, emptyStats } from '../core/stats'

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
  rerollPhase: RerollPhase
  /** 尚未決定的洗練結果 */
  pendingReroll: { kind: RerollMode; candidate: Weapon['slots'] } | null
  lastRerollKind: RerollMode | null
  /** 本次洗練的決定,僅 decided 時有值 */
  lastDecision: 'adopt' | 'keep' | null
}

export type GameAction =
  | { type: 'START_RUN'; mode: GameMode; slots?: Weapon['slots'] }
  /** roll:呼叫端提供的 [0, 1) 亂數,讓 reducer 保持純函式 */
  | { type: 'ENHANCE'; protect: boolean; roll: number }
  | { type: 'AUTO_START'; target: number; protect: boolean }
  | { type: 'AUTO_STOP'; reason: AutoStopReason }
  | { type: 'AUTO_CANCEL' }
  | { type: 'AUTO_CLOSE' }
  /** SET_STARS / PREVIEW_FX 供開發面板與特效預覽,不計入統計 */
  | { type: 'SET_STARS'; stars: number }
  | { type: 'PREVIEW_FX'; kind: WeaponEvent['kind']; to?: number; slot?: number }
  /** rolls:呼叫端提供的 [0, 1) 亂數(RANDOMS_PER_REROLL 個) */
  | { type: 'REROLL'; kind: RerollMode; rolls: number[] }
  | { type: 'CONTINUE'; rolls: number[] }
  | { type: 'DECIDE_ADOPT' }
  | { type: 'DECIDE_KEEP' }
  | { type: 'CLOSE_REROLL' }
  | { type: 'TOGGLE_LOCK'; slotIndex: number }
  /** 供開發面板使用 */
  | { type: 'SET_SLOTS'; slots: Weapon['slots'] }

/** 石頭是否不限量(無限模式與次數制) */
export const isUnlimited = (m: GameMode) => m.kind === 'infinite' || m.preset === 'turns'

const MODE_LABEL: Record<RerollMode, string> = { affix: '詞條變更', lv: '數值重洗' }

export function createGame(mode: GameMode, slots: Weapon['slots'] = [null, null, null]): GameState {
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
    rerollPhase: 'idle',
    pendingReroll: null,
    lastRerollKind: null,
    lastDecision: null,
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

/** 洗出紅詞條時發出紅光爆發事件 */
function redEvent(s: GameState, rolled: Weapon['slots'][number][]): GameEvent | null {
  const slot = rolled.findIndex((a) => a && getTier(a.lv) === 'red')
  if (slot < 0) return s.lastEvent
  const { stars } = s.weapon
  return nextEvent(s, { kind: 'red', from: stars, to: stars, evolved: false, auto: false, slot })
}

function reroll(s: GameState, kind: RerollMode, rolls: number[]): GameState {
  const { slots } = s.weapon
  if (s.rerollPhase === 'pending') return s
  if (s.turnsLeft !== undefined && s.turnsLeft <= 0) return s
  if (!(kind === 'affix' ? canAffixChange(slots) : canValueReroll(slots))) return s
  const lockedCount = countLocked(slots)
  const cost = getRerollCost(lockedCount)
  const unlimited = isUnlimited(s.mode)
  if (!unlimited && s.resources.rerollStone < cost) return s

  let i = 0
  const rng = () => rolls[i++]
  const candidate = kind === 'affix' ? rollAffixChange({ slots, rng }) : rollValueReroll({ slots, rng })
  const rolled = rolledSlots(slots, candidate)
  return {
    ...s,
    resources: unlimited ? s.resources : { ...s.resources, rerollStone: s.resources.rerollStone - cost },
    turnsLeft: spendTurn(s.turnsLeft),
    stats: addReroll(s.stats, { cost, lockedCount, rolled }),
    log: [`洗練 ${MODE_LABEL[kind]}`, ...s.log],
    lastEvent: redEvent(s, rolled),
    rerollPhase: 'pending',
    pendingReroll: { kind, candidate },
    lastRerollKind: kind,
    lastDecision: null,
  }
}

function decide(s: GameState, adopt: boolean): GameState {
  const p = s.pendingReroll
  if (s.rerollPhase !== 'pending' || !p) return s
  return {
    ...s,
    weapon: adopt ? { ...s.weapon, slots: p.candidate } : s.weapon,
    log: [`洗練 ${MODE_LABEL[p.kind]}(${adopt ? '效果變更' : '效果維持'})`, ...s.log],
    lastEvent: adopt ? redEvent(s, rolledSlots(s.weapon.slots, p.candidate)) : s.lastEvent,
    rerollPhase: 'decided',
    pendingReroll: null,
    lastDecision: adopt ? 'adopt' : 'keep',
  }
}

function toggleLock(s: GameState, index: number): GameState {
  const slot = s.weapon.slots[index]
  if (s.rerollPhase !== 'idle' || !slot) return s
  const lock = !slot.locked
  const unlimited = isUnlimited(s.mode)
  if (lock && s.turnsLeft !== undefined && s.turnsLeft <= 0) return s
  if (lock && !unlimited && s.resources.rerollStone < LOCK_COST) return s
  const slots = [...s.weapon.slots] as Weapon['slots']
  slots[index] = { ...slot, locked: lock }
  const next = { ...s, weapon: { ...s.weapon, slots } }
  if (!lock) return { ...next, log: [`解除鎖定詞條 ${index + 1}`, ...s.log] }
  return {
    ...next,
    resources: unlimited ? s.resources : { ...s.resources, rerollStone: s.resources.rerollStone - LOCK_COST },
    turnsLeft: spendTurn(s.turnsLeft),
    stats: addLock(s.stats, LOCK_COST),
    log: [`鎖定詞條 ${index + 1}`, ...s.log],
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
    case 'REROLL':
      return reroll(s, a.kind, a.rolls)
    case 'CONTINUE':
      return s.rerollPhase === 'decided' && s.lastRerollKind ? reroll(s, s.lastRerollKind, a.rolls) : s
    case 'DECIDE_ADOPT':
      return decide(s, true)
    case 'DECIDE_KEEP':
      return decide(s, false)
    case 'CLOSE_REROLL':
      return s.rerollPhase === 'decided' ? { ...s, rerollPhase: 'idle', lastDecision: null } : s
    case 'TOGGLE_LOCK':
      return toggleLock(s, a.slotIndex)
  }
}
