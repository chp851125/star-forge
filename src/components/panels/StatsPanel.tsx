import { useState } from 'react'
import type { RunStats } from '../../types'

export function StatGrid({ stats }: { stats: RunStats }) {
  const items: [string, number][] = [
    ['衝星次數', stats.starAttempts],
    ['成功', stats.successes],
    ['掉星', stats.drops],
    ['歸零', stats.resets],
    ['洗練次數', stats.rerolls],
    ['升星石累計消耗', stats.starStoneUsed],
    ['洗練石累計消耗', stats.rerollStoneUsed],
  ]
  return (
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map(([k, v]) => (
        <div key={k} className="border border-cyan/20 bg-bg/50 px-2 py-1">
          <dt className="text-xs text-muted">{k}</dt>
          <dd className="text-lg font-bold text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  )
}

export default function StatsPanel({ stats, log }: { stats: RunStats; log: string[] }) {
  const [open, setOpen] = useState(false)
  return (
    <section className="panel px-3 py-1">
      <button
        className="flex min-h-[44px] w-full items-center justify-between font-semibold text-cyan"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span>本局統計與紀錄</span>
        <span>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="mt-2 space-y-3">
          <StatGrid stats={stats} />
          <ol className="max-h-40 space-y-1 overflow-y-auto text-sm text-muted">
            {log.length === 0 && <li>尚無紀錄</li>}
            {log.map((l, i) => (
              <li key={i}>{log.length - i}. {l}</li>
            ))}
          </ol>
        </div>
      )}
    </section>
  )
}
