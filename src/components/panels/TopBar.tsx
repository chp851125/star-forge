import type { GameMode, Resources } from '../../types'

interface Props {
  mode: GameMode
  resources: Resources
  turnsLeft?: number
  onFinish: () => void
  onRestart: () => void
}

export function modeLabel(m: GameMode): string {
  if (m.kind === 'infinite') return `無限模式${m.goal ? ` · 目標:${m.goal}` : ''}`
  const names = { easy: '簡單', normal: '普通', hard: '困難', custom: '自訂額度', turns: '次數制' }
  return `限定模式 · ${names[m.preset]}`
}

function Res({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2 border border-cyan/30 bg-bg/60 px-3 py-1">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-xl font-bold text-cyan">{value}</span>
    </div>
  )
}

export default function TopBar({ mode, resources, turnsLeft, onFinish, onRestart }: Props) {
  const inf = mode.kind === 'infinite' || mode.preset === 'turns'
  return (
    <header className="panel flex flex-wrap items-center gap-3 px-4 py-3">
      <span className="border border-cyan/60 bg-cyan/10 px-3 py-1 text-sm font-semibold text-cyan">{modeLabel(mode)}</span>
      <Res label="升星石" value={inf ? '∞' : String(resources.starStone)} />
      <Res label="洗練石" value={inf ? '∞' : String(resources.rerollStone)} />
      {turnsLeft !== undefined && <Res label="剩餘次數" value={String(turnsLeft)} />}
      <div className="ml-auto flex gap-2">
        <button className="btn-primary" onClick={onFinish}>完成打造</button>
        <button className="btn" onClick={onRestart}>重新開始</button>
      </div>
    </header>
  )
}
