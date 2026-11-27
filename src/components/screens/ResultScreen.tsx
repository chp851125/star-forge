import { useEffect, useState } from 'react'
import type { Settlement } from '../../types'
import { GRADE_COLOR } from '../../config/grading'
import { COPIED_MS } from '../../config/settle'
import { buildShareText } from '../../core/settlement'
import SwordStage from '../Sword/SwordStage'
import AffixList from '../panels/AffixList'
import { MilestoneList, StatGrid } from '../panels/StatsPanel'
import { modeLabel } from '../panels/TopBar'

interface Props { result: Settlement; onRestart: () => void }

export default function ResultScreen({ result, onRestart }: Props) {
  const { weapon, mode, stats, grade, score, affixScore, starScore, milestones } = result
  const [copy, setCopy] = useState<'idle' | 'copied' | 'failed'>('idle')
  const quota = mode.kind === 'limited' && mode.preset !== 'turns' ? mode.quota : null

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  useEffect(() => {
    if (copy !== 'copied') return
    const t = window.setTimeout(() => setCopy('idle'), COPIED_MS)
    return () => clearTimeout(t)
  }, [copy])

  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildShareText(result))
      setCopy('copied')
    } catch {
      setCopy('failed')
    }
  }

  const spent = (used: number, max?: number) => (max === undefined ? `${used}` : `${used} / ${max}`)

  return (
    <div className="lg:h-dvh lg:overflow-hidden">
      <main className="mx-auto flex max-w-6xl flex-col gap-3 p-3 lg:h-full">
        <h1 className="shrink-0 text-center text-2xl font-extrabold tracking-widest text-cyan">成品展示</h1>
        <div className="grid gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-2 lg:grid-rows-1">
          <section className="flex min-w-0 flex-col lg:min-h-0">
            <SwordStage fill stars={weapon.stars} slots={weapon.slots} fx={null} />
          </section>

          <section className="flex min-w-0 flex-col gap-2 lg:min-h-0 lg:overflow-y-auto">
            <div className="panel flex shrink-0 flex-wrap items-center justify-center gap-6 px-4 py-2">
              <div
                className={`fx-stamp flex h-24 w-24 items-center justify-center rounded-full border-4 border-current text-6xl font-black ${GRADE_COLOR[grade]}`}
                style={{ textShadow: '0 0 20px currentColor' }}
                role="img"
                aria-label={`評級 ${grade}`}
              >
                {grade}
              </div>
              <p className="text-lg font-bold">得分 {score} = 詞條 {affixScore} + 星級 {starScore}</p>
            </div>

            <AffixList slots={weapon.slots} fx={null} />

            <div className="panel shrink-0 space-y-2 p-3">
              <div className="text-sm font-semibold text-cyan">{modeLabel(mode)}</div>
              <StatGrid stats={stats} />
              <p className="text-sm">
                {quota ? '消耗(已用 / 額度)' : '累計消耗'}:升星石 {spent(stats.starStoneUsed, quota?.starStone)}、洗練石{' '}
                {spent(stats.rerollStoneUsed, quota?.rerollStone)}
              </p>
              <MilestoneList milestones={milestones} />
            </div>

            <div className="flex shrink-0 flex-wrap justify-center gap-3">
              <button className="btn-primary" onClick={doCopy} aria-live="polite">
                {copy === 'copied' ? '已複製 ✓' : '複製成績文字'}
              </button>
              <button className="btn" onClick={onRestart}>重新開始</button>
            </div>
            {copy === 'failed' && (
              <label className="block shrink-0 text-sm text-muted">
                無法自動複製,請手動選取複製
                <textarea
                  className="mt-1 h-36 w-full border border-cyan/50 bg-bg p-2 text-ink"
                  readOnly
                  value={buildShareText(result)}
                  ref={(el) => el?.select()}
                  onFocus={(e) => e.target.select()}
                />
              </label>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
