import { useState } from 'react'
import type { LogEntry, Milestone } from '../../types'
import { formatLogEntry } from '../../core/log'
import { formatMilestone } from '../../core/settlement'
import { formatCount as n, formatRate, formatUsage, type RunSummary } from '../../core/summary'
import { TIER_TEXT } from '../tierStyle'

type Item = [label: string, value: string]

function Section({ title, items, wide = false }: { title: string; items: Item[]; wide?: boolean }) {
  return (
    <section>
      <h4 className="text-sm font-semibold text-cyan">{title}</h4>
      <dl className={`grid grid-cols-2 gap-x-4 ${wide ? 'sm:grid-cols-3 xl:grid-cols-4' : ''}`}>
        {items.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-2 border-b border-cyan/15 py-0.5">
            <dt className="text-xs text-muted">{k}</dt>
            <dd className="text-sm font-bold text-ink">{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

/** compact:成品頁用,衝星與洗練改三 / 四欄以壓低高度 */
export function StatSections({ summary, compact = false }: { summary: RunSummary; compact?: boolean }) {
  const { enhance: e, reroll: r, resources: res } = summary
  // 限定額度:已用 / 額度;次數制:已用 / 次數上限;無限:只有累計
  const resourceTitle =
    res.starStone.limit !== undefined ? '資源(已用 / 額度)'
    : res.actions.limit !== undefined ? '資源(操作次數:已用 / 次數上限)'
    : '資源(累計消耗)'
  return (
    <div className={compact ? 'space-y-1' : 'space-y-2'}>
      <Section
        title="衝星"
        wide={compact}
        items={[
          ['衝星次數', n(e.attempts)], ['實測成功率', formatRate(e.successRate)],
          ['成功', n(e.successes)], ['維持', n(e.keeps)],
          ['掉星', n(e.drops)], ['歸零', n(e.resets)],
          ['最高連成', n(e.maxSuccessStreak)], ['最高連敗', n(e.maxFailStreak)],
          ['歷史最高星', `+${e.highestStar}`], ['保底觸發', n(e.pityCount)],
        ]}
      />
      <Section
        title="洗練"
        wide={compact}
        items={[
          ['洗練次數', n(r.total)], ['鎖定洗練', n(r.locked)],
          ['詞條變更', n(r.affix)], ['數值重洗', n(r.lv)],
          ['洗出金階以上', n(r.goldPlus)], ['洗出紅階', n(r.red)],
          ['改變', n(r.adopts)], ['維持', n(r.keeps)],
        ]}
      />
      <Section
        title={resourceTitle}
        items={[
          ['升星石', formatUsage(res.starStone)], ['洗練石', formatUsage(res.rerollStone)],
          ['已操作次數', formatUsage(res.actions)], ['洗練石鎖定花費', n(res.lockStone)],
        ]}
      />
    </div>
  )
}

export function MilestoneList({ milestones }: { milestones: Milestone[] }) {
  if (!milestones.length) return null
  return (
    <ul className="space-y-0.5 text-sm text-tier-gold" aria-label="里程碑">
      {milestones.map((m) => <li key={m.star}>{formatMilestone(m)}</li>)}
    </ul>
  )
}

type Filter = 'all' | 'enhance' | 'reroll'
const FILTERS: [Filter, string][] = [['all', '全部'], ['enhance', '衝星'], ['reroll', '洗練']]

const OUTCOME_TEXT = { success: 'text-cyan', keep: 'text-muted', drop: 'text-log-drop', reset: 'text-tier-red' }

function logColor(e: LogEntry): string {
  if (e.type === 'enhance') return OUTCOME_TEXT[e.outcome]
  return e.tier ? TIER_TEXT[e.tier] : 'text-muted'
}

function LogList({ log }: { log: LogEntry[] }) {
  const [filter, setFilter] = useState<Filter>('all')
  // 鎖定與解除歸在洗練
  const shown = log.filter((e) => filter === 'all' || (e.type === 'enhance') === (filter === 'enhance'))
  return (
    <section>
      <div className="flex items-center gap-2" role="group" aria-label="紀錄篩選">
        <h4 className="mr-auto text-sm font-semibold text-cyan">紀錄</h4>
        {FILTERS.map(([id, label]) => (
          <button
            key={id}
            className={`min-h-[44px] min-w-[56px] border px-3 text-sm font-semibold ${filter === id ? 'border-cyan bg-cyan/15 text-cyan' : 'border-muted/40 text-muted'}`}
            aria-pressed={filter === id}
            onClick={() => setFilter(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <ol className="mt-1 space-y-1 text-sm">
        {shown.length === 0 && <li className="text-muted">尚無紀錄</li>}
        {shown.map((e) => <li key={e.id} className={logColor(e)}>{formatLogEntry(e)}</li>)}
      </ol>
    </section>
  )
}

export default function StatsPanel({ summary, log }: { summary: RunSummary; log: LogEntry[] }) {
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
        <div className="mb-2 mt-1 max-h-[min(24rem,50dvh)] space-y-3 overflow-y-auto pr-1" tabIndex={0}>
          <StatSections summary={summary} />
          <MilestoneList milestones={summary.milestones} />
          <LogList log={log} />
        </div>
      )}
    </section>
  )
}
