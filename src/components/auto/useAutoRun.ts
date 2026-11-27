import { useEffect, useRef, useState } from 'react'
import type { StarOutcome } from '../../types'

export type StopReason = 'goal' | 'stone' | 'turns' | 'manual'

/** 單步結果:停止,或回報本次消耗與下一步前的間隔 */
export type StepResult = { stop: StopReason } | { used: number; delay: number; outcome?: StarOutcome }

export interface AutoRun {
  /** null = 進行中 */
  reason: StopReason | null
  /** 已按中斷,等本次動畫播完 */
  stopping: boolean
  tries: number
  used: number
  counts: Record<StarOutcome, number>
  last: StarOutcome | null
  delay: number
}

const fresh = (): AutoRun => ({
  reason: null, stopping: false, tries: 0, used: 0,
  counts: { success: 0, evolve: 0, keep: 0, drop: 0, reset: 0 }, last: null, delay: 0,
})

/** 自動流程計時器:每一步等上一步的間隔結束才執行,中斷也等動畫播完 */
export function useAutoRun(step: () => StepResult) {
  const [run, setRun] = useState<AutoRun | null>(null)
  const latest = useRef({ step, run })
  latest.current = { step, run }
  const running = !!run && !run.reason

  useEffect(() => {
    if (!running) return
    const t = window.setTimeout(() => {
      const { step, run } = latest.current
      if (!run) return
      if (run.stopping) return setRun({ ...run, reason: 'manual' })
      const r = step()
      if ('stop' in r) return setRun((c) => c && { ...c, reason: r.stop })
      setRun((c) => c && {
        ...c,
        tries: c.tries + 1,
        used: c.used + r.used,
        delay: r.delay,
        last: r.outcome ?? null,
        counts: r.outcome ? { ...c.counts, [r.outcome]: c.counts[r.outcome] + 1 } : c.counts,
      })
    }, latest.current.run!.delay)
    return () => clearTimeout(t)
  }, [running, run?.tries])

  return {
    run,
    running,
    start: () => setRun(fresh()),
    stop: () => setRun((c) => c && { ...c, stopping: true }),
    close: () => setRun(null),
  }
}
