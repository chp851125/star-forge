import { useState } from 'react'
import type { GameMode, Grade, RunStats, Weapon } from '../../types'
import SwordStage from '../Sword/SwordStage'
import { AffixRow, affixText } from '../panels/AffixList'
import { StatGrid } from '../panels/StatsPanel'
import { modeLabel } from '../panels/TopBar'
import { GRADE_THRESHOLDS } from '../../config/grading'
import { tierOfLv } from '../../config/affixes'

const PTS = { blue: 1, purple: 2, gold: 3, red: 4 }

/** 假評級:僅供預覽,真規則之後實作 */
function fakeGrade(w: Weapon): Grade {
  const score = w.stars + w.slots.reduce((a, s) => a + (s ? PTS[tierOfLv(s.lv)] : 0), 0)
  return GRADE_THRESHOLDS.find((g) => score >= g.min)!.grade
}

const GRADE_COLOR: Record<Grade, string> = { S: 'text-tier-red', A: 'text-tier-gold', B: 'text-tier-purple', C: 'text-tier-blue' }

interface Props { weapon: Weapon; stats: RunStats; mode: GameMode; onRestart: () => void }

export default function ResultScreen({ weapon, stats, mode, onRestart }: Props) {
  const [copied, setCopied] = useState(false)
  const grade = fakeGrade(weapon)

  const copy = async () => {
    const text = [
      `【星煉工坊】評級 ${grade} · +${weapon.stars}`,
      ...weapon.slots.map((s, i) => `詞條${i + 1}:${affixText(s)}${s ? ` (Lv${s.lv})` : ''}`),
      `模式:${modeLabel(mode)}`,
      `衝星 ${stats.starAttempts} 次(成功 ${stats.successes}/掉星 ${stats.drops}/歸零 ${stats.resets}),洗練 ${stats.rerolls} 次`,
      `消耗:升星石 ${stats.starStoneUsed}、洗練石 ${stats.rerollStoneUsed}`,
    ].join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <main className="mx-auto max-w-4xl space-y-4 p-4">
      <h1 className="text-center text-2xl font-extrabold tracking-widest text-cyan">成品展示</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <SwordStage stars={weapon.stars} slots={weapon.slots} fx={null} />
        </div>
        <div className="space-y-4">
          <div className="panel p-4 text-center">
            <div className="text-sm text-muted">評級(預覽假評級)</div>
            <div className={`text-8xl font-black ${GRADE_COLOR[grade]}`} style={{ textShadow: '0 0 24px currentColor' }}>{grade}</div>
          </div>
          <div className="panel space-y-2 p-4">
            {weapon.slots.map((s, i) => <AffixRow key={i} slot={s} />)}
          </div>
          <div className="panel p-4"><StatGrid stats={stats} /></div>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <button className="btn-primary" onClick={copy}>{copied ? '已複製 ✓' : '複製成績文字'}</button>
        <button className="btn" onClick={onRestart}>重新開始</button>
      </div>
    </main>
  )
}
