import type { Tier } from '../../types'
import { TIER_NAME } from '../../config/affixes'
import { TIER_TEXT } from '../tierStyle'
import AutoSummary from './AutoSummary'
import type { AutoRun, StopReason } from './useAutoRun'

export type TargetTier = Extract<Tier, 'gold' | 'red'>

interface Props {
  run: AutoRun | null
  target: TargetTier
  onTarget: (t: TargetTier) => void
  /** 有值時無法開始,並顯示原因 */
  blocked: string | null
  onStart: () => void
  onStop: () => void
  onClose: () => void
  totalNote?: string
}

const REASON: Record<StopReason, string> = {
  goal: '達成目標', stone: '洗練石不足', turns: '操作次數用完', manual: '手動中斷',
}

const TARGETS: [TargetTier, string][] = [['gold', `金以上(${TIER_NAME.gold})`], ['red', `紅(${TIER_NAME.red})`]]

export default function AutoRerollPanel({ run, target, onTarget, blocked, onStart, onStop, onClose, totalNote }: Props) {
  if (run?.reason) {
    return (
      <AutoSummary
        reason={REASON[run.reason]}
        items={[['已洗次數', run.tries], ['洗練石消耗', run.used]]}
        note={totalNote}
        onClose={onClose}
      />
    )
  }

  return (
    <section className="space-y-2 border border-cyan/40 bg-bg/40 p-2" aria-label="自動數值重洗">
      <h3 className="font-semibold text-cyan">自動數值重洗</h3>
      <p className="text-xs text-muted">只作用於未鎖定的詞條;每次只保留更高的 Lv,洗到全部達標就停止</p>
      <div className="flex flex-wrap items-center gap-2 text-sm" role="group" aria-label="目標階級">
        目標階級
        {TARGETS.map(([t, label]) => (
          <button
            key={t}
            className={`min-h-[44px] border px-3 font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${TIER_TEXT[t]} ${target === t ? 'border-current bg-ink/10' : 'border-muted/40'}`}
            aria-pressed={target === t}
            disabled={!!run}
            onClick={() => onTarget(t)}
          >
            {label}
          </button>
        ))}
      </div>
      {run ? (
        <>
          <div className="flex justify-between text-sm" aria-live="polite">
            <span>已洗 {run.tries} 次</span>
            <span>本次耗洗練石 {run.used}</span>
          </div>
          <button className="btn-danger min-h-[52px] w-full text-lg" disabled={run.stopping} onClick={onStop}>
            {run.stopping ? '中斷中(播完本次動畫)' : '中斷'}
          </button>
        </>
      ) : (
        <>
          <button className="btn min-h-[52px] w-full" disabled={!!blocked} onClick={onStart}>開始自動洗練</button>
          {blocked && <p className="text-xs text-muted">{blocked}</p>}
        </>
      )}
    </section>
  )
}
