import { MAX_STAR } from '../../config/balance'
import { describeEnhance } from '../../core/enhance'
import type { AutoSession, GameState } from '../../state/gameReducer'
import type { AutoStopReason } from '../../types'
import NumberStepper from '../ui/NumberStepper'
import AutoSummary from './AutoSummary'

export interface AutoStarProps {
  session: AutoSession | null
  lastResult: GameState['lastResult']
  /** 已含下限 / 上限修正 */
  target: number
  onTarget: (n: number) => void
  disabled: boolean
  /** 次數制次數用完 */
  noTurns: boolean
  onStart: (target: number) => void
  onStop: () => void
  onClose: () => void
  /** 無限模式:摘要另顯示本局累計消耗 */
  totalNote?: string
}

export default function AutoStarPanel({ stars, ...p }: AutoStarProps & { stars: number }) {
  const maxed = stars >= MAX_STAR
  const { session } = p

  if (session?.stopReason) {
    const reason: Record<AutoStopReason, string> = {
      target: '達成目標',
      noResource: p.noTurns ? '操作次數用完' : '升星石不足',
      cancelled: '手動中斷',
    }
    return (
      <AutoSummary
        reason={reason[session.stopReason]}
        items={[
          ['嘗試次數', session.tries],
          ['成功', session.counts.success],
          ['維持', session.counts.keep],
          ['掉星', session.counts.drop],
          ['歸零', session.counts.reset],
          ['升星石消耗', session.used],
        ]}
        note={p.totalNote}
        onClose={p.onClose}
      />
    )
  }

  return (
    <section className="space-y-2 border border-cyan/40 bg-bg/40 p-2" aria-label="自動升星">
      {session ? (
        <>
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm" aria-live="polite">
            <span className="text-lg font-bold text-cyan">+{stars} → +{session.target}</span>
            <span>已嘗試 {session.tries} 次</span>
            <span>耗升星石 {session.used}</span>
            <span className="text-right text-muted">
              {session.tries && p.lastResult ? describeEnhance(p.lastResult.from, p.lastResult) : '準備中'}
            </span>
          </div>
          <button className="btn-danger min-h-[52px] w-full text-lg" onClick={p.onStop}>中斷</button>
        </>
      ) : maxed ? (
        <p className="text-center text-sm text-muted">已達上限,無法自動升星</p>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <NumberStepper label="目標星級" value={p.target} min={stars + 1} max={MAX_STAR} onChange={p.onTarget} />
          <button className="btn grow" disabled={p.disabled} onClick={() => p.onStart(p.target)}>開始自動升星</button>
        </div>
      )}
    </section>
  )
}
