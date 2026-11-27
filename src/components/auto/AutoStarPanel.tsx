import type { StarOutcome } from '../../types'
import { MAX_STARS } from '../../config/balance'
import NumberStepper from '../ui/NumberStepper'
import AutoSummary from './AutoSummary'
import type { AutoRun, StopReason } from './useAutoRun'

export interface AutoStarProps {
  run: AutoRun | null
  target: number
  onTarget: (n: number) => void
  disabled: boolean
  onStart: (target: number) => void
  onStop: () => void
  onClose: () => void
  /** 無限模式等:摘要另顯示本局累計消耗 */
  totalNote?: string
}

const REASON: Record<StopReason, string> = {
  goal: '達成目標', stone: '升星石不足', turns: '操作次數用完', manual: '手動中斷',
}

const OUTCOME: Record<StarOutcome, string> = {
  success: '成功', evolve: '成功(進化)', keep: '維持', drop: '掉星', reset: '歸零',
}

export default function AutoStarPanel({ stars, ...p }: AutoStarProps & { stars: number }) {
  const maxed = stars >= MAX_STARS
  const target = Math.min(MAX_STARS, Math.max(stars + 1, p.target))
  const { run } = p

  if (run?.reason) {
    return (
      <AutoSummary
        reason={REASON[run.reason]}
        items={[
          ['嘗試次數', run.tries],
          ['成功', run.counts.success + run.counts.evolve],
          ['維持', run.counts.keep],
          ['掉星', run.counts.drop],
          ['歸零', run.counts.reset],
          ['升星石消耗', run.used],
        ]}
        note={p.totalNote}
        onClose={p.onClose}
      />
    )
  }

  return (
    <section className="space-y-2 border border-cyan/40 bg-bg/40 p-2" aria-label="自動升星">
      {run ? (
        <>
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm" aria-live="polite">
            <span className="text-lg font-bold text-cyan">+{stars} → +{p.target}</span>
            <span>已嘗試 {run.tries} 次</span>
            <span>耗升星石 {run.used}</span>
            <span className="w-24 text-right text-muted">{run.last ? OUTCOME[run.last] : '準備中'}</span>
          </div>
          <button className="btn-danger min-h-[52px] w-full text-lg" disabled={run.stopping} onClick={p.onStop}>
            {run.stopping ? '中斷中(播完本次動畫)' : '中斷'}
          </button>
        </>
      ) : maxed ? (
        <p className="text-center text-sm text-muted">已達最高星級,無法自動升星</p>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <NumberStepper label="目標星級" value={target} min={stars + 1} max={MAX_STARS} onChange={p.onTarget} />
          <button className="btn grow" disabled={p.disabled} onClick={() => p.onStart(target)}>開始自動升星</button>
        </div>
      )}
    </section>
  )
}
