import type { GameMode, Resources } from '../../types'
import Switch from '../ui/Switch'

interface Props {
  mode: GameMode
  resources: Resources
  /** 本局累計消耗 */
  used: Resources
  turnsLeft?: number
  autoOn: boolean
  onAuto: (v: boolean) => void
  /** 自動流程進行中,不可切換 */
  autoLocked: boolean
  finishDisabled: boolean
  onFinish: () => void
  onRestart: () => void
}

export function modeLabel(m: GameMode): string {
  if (m.kind === 'infinite') return '無限模式'
  const names = { easy: '簡單', normal: '普通', hard: '困難', custom: '自訂額度', turns: '次數制' }
  return `限定模式 · ${names[m.preset]}`
}

function Res({ label, items }: { label: string; items: [string, string][] }) {
  return (
    <div className="border border-cyan/30 bg-bg/60 px-3 py-0.5">
      <div className="text-xs text-muted">{label}</div>
      <div className="flex flex-wrap gap-x-3 text-sm">
        {items.map(([k, v]) => (
          <span key={k} className="whitespace-nowrap">
            {k} <span className="text-base font-bold text-cyan">{v}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

export default function TopBar(p: Props) {
  const { mode, resources, used, turnsLeft } = p
  const quota = mode.kind === 'limited' && mode.preset !== 'turns' ? mode.quota : null
  return (
    <header className="panel flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 lg:h-16 lg:flex-nowrap">
      <span className="whitespace-nowrap border border-cyan/60 bg-cyan/10 px-3 py-1 text-sm font-semibold text-cyan">{modeLabel(mode)}</span>
      {quota ? (
        <Res
          label="剩餘 / 總額"
          items={[
            ['升星石', `${resources.starStone} / ${quota.starStone}`],
            ['洗練石', `${resources.rerollStone} / ${quota.rerollStone}`],
          ]}
        />
      ) : (
        <Res
          label="剩餘(本局累計消耗)"
          items={[
            ['升星石', `∞(${used.starStone})`],
            ['洗練石', `∞(${used.rerollStone})`],
          ]}
        />
      )}
      {mode.kind === 'limited' && turnsLeft !== undefined && (
        <Res label="剩餘 / 總次數" items={[['次數', `${turnsLeft} / ${mode.turns}`]]} />
      )}
      <div className="ml-auto flex flex-wrap items-center gap-2 lg:flex-nowrap">
        <Switch checked={p.autoOn} onChange={p.onAuto} disabled={p.autoLocked} label="自動功能" hint="自己慢慢衝,或交給自動" />
        <button className="btn-primary whitespace-nowrap" disabled={p.finishDisabled} onClick={p.onFinish}>完成打造</button>
        <button className="btn whitespace-nowrap" onClick={p.onRestart}>重新開始</button>
      </div>
    </header>
  )
}
