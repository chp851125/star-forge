import { useEffect, useRef, useState } from 'react'
import type { AffixSlot, GameMode, RerollMode, RerollResult, Resources, RunStats, StarOutcome, Tier, Weapon, WeaponEvent } from '../../types'
import { MAX_STARS, REROLL_BASE_COST, STAR_COST } from '../../config/balance'
import { WEAPON_STYLE } from '../../config/weapons'
import { tierOfLv } from '../../config/affixes'
import { AUTO_REROLL_DELAY, AUTO_STAR_DELAY } from '../../config/auto'
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
import AutoRerollPanel, { type TargetTier } from '../auto/AutoRerollPanel'
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

/** 哪些欄位的新結果 Lv 比舊的高 */
const higher = (before: Slots, after: Slots) =>
  after.map((s, i) => !!s && !!before[i] && s.lv > before[i]!.lv)

/** 逐列「Lv 舊 → Lv 新」 */
const lvChanges = (before: Slots, after: Slots) =>
  after.flatMap((s, i) => (s && s !== before[i] ? [`Lv ${before[i]?.lv} → Lv ${s.lv}`] : [])).join('、')

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
  const [rerollOpen, setRerollOpen] = useState(false)
  const [result, setResult] = useState<RerollResult | null>(null)
  const [autoDiscard, setAutoDiscard] = useState(true)
  /** 自動功能總開關(只存在記憶體) */
  const [autoOn, setAutoOn] = useState(false)
  const [starTarget, setStarTarget] = useState(0)
  const [tierTarget, setTierTarget] = useState<TargetTier>('gold')
  const n = useRef(0)
  const rolls = useRef(0)
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
  const play = (kind: WeaponEvent['kind'], to: number, slot?: number) => {
    setFx({ kind, n: ++n.current, slot })
    if (kind === 'reset' && quality !== 'off') {
      setBusy(true)
      main.current?.animate(
        [0, -10, 9, -8, 6, -4, 0].map((x, i) => ({ transform: `translate(${x}px, ${i % 2 ? 4 : x ? -4 : 0}px)` })),
        { duration: 600 },
      )
      timer.current = window.setTimeout(() => {
        setWeapon((w) => ({ ...w, stars: to }))
        setBusy(false)
      }, SHATTER_MS)
    } else if (kind !== 'red') setWeapon((w) => ({ ...w, stars: to }))
  }

  const locked = weapon.slots.filter((s) => s?.locked).length
  const rerollCost = REROLL_BASE_COST + locked
  const noStone = !unlimited && res.starStone < STAR_COST
  const noReroll = !unlimited && res.rerollStone < rerollCost
  const noTurns = turns !== undefined && turns <= 0
  const exhausted = noTurns || (mode.kind === 'limited' && mode.preset !== 'turns' && noStone && res.rerollStone < 1)

  const doStar = (): StarOutcome => {
    const from = weapon.stars
    const { outcome, to } = fakeStar(from)
    spend(STAR_COST, 0)
    if (outcome !== 'keep') play(outcome, to)
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
    setResult(null)
    if (lock) {
      spend(0, 1)
      log(`鎖定詞條 ${i + 1}`, { rerollStoneUsed: 1 })
    } else log(`解除鎖定詞條 ${i + 1}`)
  }

  /** 採用範圍內洗出紅詞條時,展示台紅光爆發 */
  const burstRed = (before: Slots, after: Slots, apply: boolean[]) => {
    const i = after.findIndex((s, i) => apply[i] && s && s !== before[i] && tierOfLv(s.lv) === 'red')
    if (i < 0) return false
    setAuraPreview(undefined)
    setFx({ kind: 'red', n: ++n.current, slot: i })
    return true
  }

  const rollOnce = (m: RerollMode) => {
    const before = weapon.slots
    const after = fakeReroll(before, m)
    spend(0, rerollCost)
    log(`洗練 ${MODE_LABEL[m]}`, { rerolls: 1, rerollStoneUsed: rerollCost })
    return { n: ++rolls.current, mode: m, before, after }
  }

  const doReroll = (m: RerollMode) => {
    const roll = rollOnce(m)
    const { before, after } = roll
    const up = higher(before, after)
    if (m === 'lv' && autoDiscard && !up.some(Boolean)) {
      setResult({ ...roll, status: 'discarded', checks: up })
      log(`${lvChanges(before, after)},自動放棄`)
      return
    }
    const checks = m === 'lv' ? up : after.map((s, i) => !before[i] && !!s)
    setResult({ ...roll, status: 'pending', checks })
    burstRed(before, after, [true, true, true])
  }

  const resolve = (apply: boolean) => {
    if (result?.status !== 'pending') return
    const slots = weapon.slots.map((s, i) => (apply && result.checks[i] ? result.after[i] : s)) as Slots
    const changed = slots.some((s, i) => s !== weapon.slots[i])
    if (changed) {
      setWeapon((w) => ({ ...w, slots }))
      burstRed(weapon.slots, slots, result.checks)
    }
    log(`洗練 ${MODE_LABEL[result.mode]}(${changed ? '效果變更' : '效果維持'})`)
    setResult(null)
  }

  const autoStarGoal = useRef(0)
  const autoStar = useAutoRun((): StepResult => {
    if (weapon.stars >= autoStarGoal.current) return { stop: 'goal' }
    if (noTurns) return { stop: 'turns' }
    if (noStone) return { stop: 'stone' }
    const outcome = doStar()
    return { used: STAR_COST, outcome, delay: AUTO_STAR_DELAY[outcome === 'success' || outcome === 'keep' ? 'normal' : outcome] }
  })

  /** 自動洗練作用的欄位:未鎖定且有詞條 */
  const targets = weapon.slots.filter((s): s is NonNullable<AffixSlot> => !!s && !s.locked)
  const reached = targets.every((s) => tierOfLv(s.lv) === 'red' || tierOfLv(s.lv) === tierTarget)

  const autoReroll = useAutoRun((): StepResult => {
    if (reached) return { stop: 'goal' }
    if (noTurns) return { stop: 'turns' }
    if (noReroll) return { stop: 'stone' }
    const roll = rollOnce('lv')
    const { before, after } = roll
    const up = higher(before, after)
    const slots = before.map((s, i) => (up[i] ? after[i] : s)) as Slots
    setWeapon((w) => ({ ...w, slots }))
    const any = up.some(Boolean)
    setResult({ ...roll, status: any ? 'auto' : 'discarded', checks: up })
    if (!any) log(`${lvChanges(before, after)},自動放棄`)
    const red = burstRed(before, slots, up)
    return { used: rerollCost, delay: AUTO_REROLL_DELAY[red ? 'red' : 'normal'] }
  })

  const autoRunning = autoStar.running || autoReroll.running

  const closeReroll = () => {
    setRerollOpen(false)
    setResult(null)
    autoReroll.close()
  }

  const toggleAuto = (v: boolean) => {
    setAutoOn(v)
    autoStar.close()
    autoReroll.close()
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

  // 有待決結果或自動摘要還開著時,先不結算
  const holding = busy || result?.status === 'pending' || !!autoStar.run || !!autoReroll.run
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
                onStar={doStar}
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
              <RerollPanel slots={weapon.slots} disabled={busy || autoRunning || exhausted} onOpen={() => setRerollOpen(true)} />
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

      {rerollOpen && (
        <CompareModal
          slots={weapon.slots}
          result={result}
          cost={rerollCost}
          stoneText={stoneText}
          canReroll={{
            affix: !noReroll && !exhausted && locked < weapon.slots.length,
            lv: !noReroll && !exhausted && targets.length > 0,
          }}
          lockBlocked={noTurns ? '操作次數已用完' : !unlimited && res.rerollStone < 1 ? '洗練石不足,無法鎖定' : null}
          autoDiscard={autoDiscard}
          onAutoDiscard={setAutoDiscard}
          running={autoReroll.running}
          onStop={autoReroll.stop}
          onReroll={(m) => {
            autoReroll.close()
            doReroll(m)
          }}
          onToggleCheck={(i) => setResult((r) => r && { ...r, checks: r.checks.map((c, j) => (j === i ? !c : c)) })}
          onApply={() => resolve(true)}
          onKeep={() => resolve(false)}
          onToggleLock={toggleLock}
          onClose={closeReroll}
          auto={autoOn ? (
            <AutoRerollPanel
              run={autoReroll.run}
              target={tierTarget}
              onTarget={setTierTarget}
              blocked={
                result?.status === 'pending' ? '請先採用或維持目前的新結果'
                  : targets.length === 0 ? '沒有可洗的詞條(全部鎖定或為空欄)'
                    : reached ? '未鎖定的詞條都已達目標'
                      : noReroll || exhausted ? '洗練石或次數不足'
                        : null
              }
              onStart={autoReroll.start}
              onStop={autoReroll.stop}
              onClose={autoReroll.close}
              totalNote={totalNote}
            />
          ) : undefined}
        />
      )}
    </div>
  )
}
