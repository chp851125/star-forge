import { useEffect, useRef, useState } from 'react'
import type { AffixSlot, GameMode, RerollMode, Resources, RunStats, StarOutcome, Tier, Weapon, WeaponEvent } from '../../types'
import { MAX_STARS, REROLL_BASE_COST, STAR_COST } from '../../config/balance'
import { WEAPON_STYLE } from '../../config/weapons'
import { tierOfLv } from '../../config/affixes'
import { AUTO_STAR_DELAY, AUTO_STAR_SPEED } from '../../config/auto'
import { emptyStats, fakeReroll, fakeRoll, fakeStar, mockWeapon, rand } from '../../mock/mockState'
import SwordStage from '../Sword/SwordStage'
import { SHATTER_MS } from '../Sword/WeaponArt'
import { useQuality } from '../Sword/quality'
import TopBar from '../panels/TopBar'
import AffixList, { affixText } from '../panels/AffixList'
import StarPanel from '../panels/StarPanel'
import RerollPanel from '../panels/RerollPanel'
import StatsPanel from '../panels/StatsPanel'
import DevPanel from '../panels/DevPanel'
import CompareModal from '../modals/CompareModal'
import { useAutoRun, type StepResult } from '../auto/useAutoRun'

interface Props {
  mode: GameMode
  onFinish: (w: Weapon, s: RunStats) => void
  onRestart: () => void
}

type Slots = Weapon['slots']
type Counter = Exclude<keyof RunStats, 'log'>

const STAR_LABEL: Record<StarOutcome, string> = {
  success: '成功', evolve: '成功(進化)', keep: '維持', drop: '掉星', reset: '歸零',
}
const STAR_COUNTER: Record<StarOutcome, Counter | null> = {
  success: 'successes', evolve: 'successes', keep: null, drop: 'drops', reset: 'resets',
}
const MODE_LABEL: Record<RerollMode, string> = { affix: '詞條變更', lv: '數值重洗' }

export default function MainScreen({ mode, onFinish, onRestart }: Props) {
  const unlimited = mode.kind === 'infinite' || mode.preset === 'turns'
  const [weapon, setWeapon] = useState<Weapon>({ ...mockWeapon, slots: [...mockWeapon.slots] as Slots })
  const [res, setRes] = useState<Resources>(mode.kind === 'limited' ? mode.quota : { starStone: 0, rerollStone: 0 })
  const [turns, setTurns] = useState(mode.kind === 'limited' ? mode.turns : undefined)
  const [stats, setStats] = useState<RunStats>(emptyStats())
  const [tab, setTab] = useState<'star' | 'reroll'>('star')
  const [fx, setFx] = useState<WeaponEvent | null>(null)
  /** 開發面板的階級色預覽;undefined = 跟隨詞條 */
  const [auraPreview, setAuraPreview] = useState<Tier | null | undefined>(undefined)
  const { quality } = useQuality()
  const main = useRef<HTMLElement>(null)
  const [busy, setBusy] = useState(false)
  /** 洗練視窗內容;applied null = 尚未決定 */
  const [roll, setRoll] = useState<{ id: number; mode: RerollMode; before: Slots; after: Slots; applied: boolean | null } | null>(null)
  const rolls = useRef(0)
  /** 自動功能總開關(只存在記憶體) */
  const [autoOn, setAutoOn] = useState(false)
  const [starTarget, setStarTarget] = useState(0)
  const n = useRef(0)
  const timer = useRef<number>(0)
  useEffect(() => () => clearTimeout(timer.current), [])

  const log = (msg: string, add: Partial<Record<Counter, number>> = {}) =>
    setStats((s) => {
      const next = { ...s, log: [msg, ...s.log] }
      for (const k of Object.keys(add) as Counter[]) next[k] += add[k]!
      return next
    })

  const spend = (star: number, reroll: number) => {
    if (!unlimited) setRes((r) => ({ starStone: r.starStone - star, rerollStone: r.rerollStone - reroll }))
    if (turns !== undefined) setTurns((t) => (t ?? 1) - 1)
  }

  /** 播放特效並更新星級(歸零延後到碎裂動畫結束) */
  const play = (kind: WeaponEvent['kind'], to: number, slot?: number, speed = 1) => {
    setFx({ kind, n: ++n.current, slot, speed })
    if (kind === 'reset' && quality !== 'off') {
      setBusy(true)
      main.current?.animate(
        [0, -10, 9, -8, 6, -4, 0].map((x, i) => ({ transform: `translate(${x}px, ${i % 2 ? 4 : x ? -4 : 0}px)` })),
        { duration: 600 / speed },
      )
      timer.current = window.setTimeout(() => {
        setWeapon((w) => ({ ...w, stars: to }))
        setBusy(false)
      }, SHATTER_MS / speed)
    } else if (kind !== 'red') setWeapon((w) => ({ ...w, stars: to }))
  }

  const locked = weapon.slots.filter((s) => s?.locked).length
  const rerollCost = REROLL_BASE_COST + locked
  const noStone = !unlimited && res.starStone < STAR_COST
  const noReroll = !unlimited && res.rerollStone < rerollCost
  const noTurns = turns !== undefined && turns <= 0
  const exhausted = noTurns || (mode.kind === 'limited' && mode.preset !== 'turns' && noStone && res.rerollStone < 1)

  const doStar = (speed = 1): StarOutcome => {
    const from = weapon.stars
    const { outcome, to } = fakeStar(from)
    spend(STAR_COST, 0)
    if (outcome !== 'keep') play(outcome, to, undefined, speed)
    const key = STAR_COUNTER[outcome]
    log(`衝星 +${from}→+${to} ${STAR_LABEL[outcome]}`, {
      starAttempts: 1,
      starStoneUsed: STAR_COST,
      ...(key && { [key]: 1 }),
    })
    return outcome
  }

  const toggleLock = (i: number) => {
    const s = weapon.slots[i]
    if (!s) return
    const lock = !s.locked
    if (lock && (noTurns || (!unlimited && res.rerollStone < 1))) return
    const slots = [...weapon.slots] as Slots
    slots[i] = { ...s, locked: lock }
    setWeapon({ ...weapon, slots })
    if (lock) {
      spend(0, 1)
      log(`鎖定詞條 ${i + 1}`, { rerollStoneUsed: 1 })
    } else log(`解除鎖定詞條 ${i + 1}`)
  }

  /** 洗出紅詞條時,展示台紅光爆發 */
  const burstRed = (before: Slots, after: Slots) => {
    const i = after.findIndex((s, i) => s && s !== before[i] && tierOfLv(s.lv) === 'red')
    if (i < 0) return
    setAuraPreview(undefined)
    setFx({ kind: 'red', n: ++n.current, slot: i })
  }

  const canReroll = (m: RerollMode) =>
    !noReroll && !exhausted && weapon.slots.some((s) => (m === 'affix' ? !s?.locked : s && !s.locked))

  const doReroll = (m: RerollMode) => {
    const after = fakeReroll(weapon.slots, m)
    spend(0, rerollCost)
    log(`洗練 ${MODE_LABEL[m]}`, { rerolls: 1, rerollStoneUsed: rerollCost })
    setRoll({ id: ++rolls.current, mode: m, before: weapon.slots, after, applied: null })
    burstRed(weapon.slots, after)
  }

  const resolve = (apply: boolean) => {
    if (!roll || roll.applied !== null) return
    if (apply) {
      setWeapon((w) => ({ ...w, slots: roll.after }))
      burstRed(roll.before, roll.after)
    }
    log(`洗練 ${MODE_LABEL[roll.mode]}(${apply ? '效果變更' : '效果維持'})`)
    setRoll({ ...roll, applied: apply })
  }

  const autoStarGoal = useRef(0)
  const autoStar = useAutoRun((): StepResult => {
    if (weapon.stars >= autoStarGoal.current) return { stop: 'goal' }
    if (noTurns) return { stop: 'turns' }
    if (noStone) return { stop: 'stone' }
    const outcome = doStar(AUTO_STAR_SPEED)
    return { used: STAR_COST, outcome, delay: AUTO_STAR_DELAY[outcome === 'success' || outcome === 'keep' ? 'normal' : outcome] }
  })
  const autoRunning = autoStar.running

  const toggleAuto = (v: boolean) => {
    setAutoOn(v)
    autoStar.close()
  }

  // 開發面板
  const devSet = (v: number) => setWeapon((w) => ({ ...w, stars: v }))
  const devFx = (k: WeaponEvent['kind']) => {
    const s = weapon.stars
    if (k === 'success') play('success', Math.min(MAX_STARS, s + 1))
    else if (k === 'evolve') {
      const nxt = WEAPON_STYLE.stages.find((t) => t.minStar > s)?.minStar ?? MAX_STARS
      play('evolve', nxt)
    } else if (k === 'drop') play('drop', Math.max(0, s - 1))
    else if (k === 'reset') play('reset', 0)
    else {
      const slots = [...weapon.slots] as Slots
      const i = rand(3)
      slots[i] = { ...(slots[i] ?? fakeRoll(null, 'affix')!), lv: 15 } as AffixSlot
      setWeapon({ ...weapon, slots })
      setAuraPreview(undefined)
      play('red', s, i)
    }
  }

  // 洗練視窗或自動摘要還開著時,先不結算
  const holding = busy || !!roll || !!autoStar.run
  useEffect(() => {
    if (exhausted && !holding) {
      const t = setTimeout(() => onFinish(weapon, stats), 1200)
      return () => clearTimeout(t)
    }
  }, [exhausted, holding]) // eslint-disable-line react-hooks/exhaustive-deps

  const used: Resources = { starStone: stats.starStoneUsed, rerollStone: stats.rerollStoneUsed }
  const totalNote = mode.kind === 'infinite' ? `本局累計消耗:升星石 ${used.starStone} / 洗練石 ${used.rerollStone}` : undefined
  const stoneText = unlimited
    ? `本局累計消耗洗練石 ${used.rerollStone}${turns !== undefined ? ` · 剩餘次數 ${turns}` : ''}`
    : `洗練石剩餘 ${res.rerollStone}${noReroll ? `(本次需 ${rerollCost},不足)` : ''}`

  const tabBtn = (id: 'star' | 'reroll', label: string) => (
    <button
      role="tab" aria-selected={tab === id}
      className={`min-h-[44px] flex-1 border-b-2 font-semibold ${tab === id ? 'border-cyan text-cyan' : 'border-transparent text-muted'}`}
      onClick={() => setTab(id)}
    >
      {label}
    </button>
  )

  return (
    <div className="lg:h-dvh lg:overflow-hidden">
    <main ref={main} className="mx-auto flex max-w-6xl flex-col gap-3 p-3 lg:h-full">
      <TopBar
        mode={mode} resources={res} used={used} turnsLeft={turns}
        autoOn={autoOn} onAuto={toggleAuto} autoLocked={autoRunning}
        finishDisabled={busy || autoRunning}
        onFinish={() => onFinish(weapon, stats)} onRestart={onRestart}
      />
      {exhausted && <div className="border border-tier-red bg-tier-red/10 p-2 text-center text-tier-red" role="alert">資源已耗盡,即將結算…</div>}

      <div className="grid gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-2 lg:grid-rows-1">
        <section className="flex min-w-0 flex-col gap-2 lg:min-h-0">
          <SwordStage fill stars={weapon.stars} slots={weapon.slots} fx={fx} auraTier={auraPreview} />
          <AffixList slots={weapon.slots} fx={fx} />
        </section>

        {/* 展開收合區塊時只在右欄內捲動 */}
        <section className="min-w-0 space-y-2 lg:min-h-0 lg:overflow-y-auto">
          <div className="panel p-3">
            <div role="tablist" className="mb-2 flex border-b border-cyan/30">
              {tabBtn('star', '衝星台')}
              {tabBtn('reroll', '洗練台')}
            </div>
            {tab === 'star' ? (
              <StarPanel
                stars={weapon.stars}
                disabled={busy || autoRunning || noStone || exhausted}
                onStar={() => doStar()}
                auto={autoOn ? {
                  run: autoStar.run,
                  target: starTarget,
                  onTarget: setStarTarget,
                  disabled: busy || noStone || exhausted,
                  onStart: (t) => {
                    setStarTarget(t)
                    autoStarGoal.current = t
                    autoStar.start()
                  },
                  onStop: autoStar.stop,
                  onClose: autoStar.close,
                  totalNote,
                } : undefined}
              />
            ) : (
              <RerollPanel
                slots={weapon.slots}
                disabled={busy || autoRunning || exhausted || !!roll}
                noReroll={noReroll}
                lockBlocked={noTurns ? '操作次數已用完' : !unlimited && res.rerollStone < 1 ? '洗練石不足,無法鎖定' : null}
                stoneText={stoneText}
                onToggleLock={toggleLock}
                onReroll={doReroll}
              />
            )}
          </div>
          <StatsPanel stats={stats} />
          <DevPanel
            stars={weapon.stars} disabled={busy || autoRunning} onSetStars={devSet} onFx={devFx}
            auraPreview={auraPreview} onAuraPreview={setAuraPreview}
          />
        </section>
      </div>

      <span className="sr-only">{weapon.slots.map(affixText).join(',')}</span>
    </main>

      {roll && (
        <CompareModal
          key={roll.id}
          mode={roll.mode}
          before={roll.before}
          after={roll.after}
          applied={roll.applied}
          cost={rerollCost}
          stoneText={stoneText}
          canContinue={canReroll(roll.mode)}
          onApply={() => resolve(true)}
          onKeep={() => resolve(false)}
          onContinue={() => doReroll(roll.mode)}
          onClose={() => setRoll(null)}
        />
      )}
    </div>
  )
}
