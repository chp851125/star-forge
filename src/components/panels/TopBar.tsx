import { useRef, useState } from 'react'
import type { GameMode, Resources } from '../../types'
import { LOW_REMAINING_RATIO, PRESET_LABEL } from '../../config/modes'
import ConfirmPopover from '../ui/ConfirmPopover'
import SoundControl from '../ui/SoundControl'
import Switch from '../ui/Switch'

interface Props {
  mode: GameMode
  /** 本局累計消耗 */
  used: Resources
  turnsLeft?: number
  autoOn: boolean
  onAuto: (v: boolean) => void
  /** 自動流程進行中,不可切換 */
  autoLocked: boolean
  /** 有值時「完成打造」disabled 並顯示原因 */
  finishBlocked: string | null
  onFinish: () => void
  onRestart: () => void
}

export function modeLabel(m: GameMode): string {
  if (m.kind === 'infinite') return '無限模式'
  return `限定模式 · ${PRESET_LABEL[m.preset]}`
}

const isLow = (left: number, total: number) => left < total * LOW_REMAINING_RATIO

/** items:[名稱, 值, 是否即將用完] */
function Res({ label, items }: { label: string; items: [string, string, boolean?][] }) {
  return (
    <div className="border border-cyan/30 bg-bg/60 px-3 py-0.5">
      <div className="text-xs text-muted">{label}</div>
      <div className="flex flex-wrap gap-x-3 text-sm">
        {items.map(([k, v, low]) => (
          <span key={k} className="whitespace-nowrap">
            {k} <span className={`text-base font-bold ${low ? 'text-zone-reset' : 'text-cyan'}`}>{v}{low ? ' ⚠' : ''}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

export default function TopBar(p: Props) {
  const { mode, used, turnsLeft } = p
  const quota = mode.kind === 'limited' && mode.preset !== 'turns' ? mode.quota : null
  const finishBtn = useRef<HTMLButtonElement>(null)
  const [asking, setAsking] = useState(false)
  const quotaItem = (name: string, spent: number, total: number): [string, string, boolean] =>
    [name, `${spent} / ${total}`, isLow(total - spent, total)]
  return (
    <header className="panel flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2 lg:h-16 lg:flex-nowrap">
      <span className="whitespace-nowrap border border-cyan/60 bg-cyan/10 px-3 py-1 text-sm font-semibold text-cyan">{modeLabel(mode)}</span>
      {quota ? (
        <Res
          label="已用 / 額度"
          items={[
            quotaItem('升星石', used.starStone, quota.starStone),
            quotaItem('洗練石', used.rerollStone, quota.rerollStone),
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
        <Res label={`共 ${mode.turns} 次`} items={[['剩餘次數', `${turnsLeft}`, isLow(turnsLeft, mode.turns ?? 0)]]} />
      )}
      <div className="ml-auto flex flex-wrap items-center gap-2 lg:flex-nowrap">
        <SoundControl />
        <Switch checked={p.autoOn} onChange={p.onAuto} disabled={p.autoLocked} label="自動功能" hint="自己慢慢衝,或交給自動" />
        <div className="text-center">
          <button
            ref={finishBtn} className="btn-primary whitespace-nowrap" disabled={!!p.finishBlocked}
            title={p.finishBlocked ?? undefined} onClick={() => setAsking(true)}
          >
            完成打造
          </button>
          {p.finishBlocked && <div className="text-xs leading-3 text-muted">{p.finishBlocked}</div>}
        </div>
        <button className="btn whitespace-nowrap" onClick={p.onRestart}>重新開始</button>
      </div>
      {asking && (
        <ConfirmPopover
          anchor={finishBtn.current!}
          message="完成後無法再修改,確定?"
          blocked={p.finishBlocked}
          onConfirm={() => {
            setAsking(false)
            p.onFinish()
          }}
          onCancel={() => setAsking(false)}
        />
      )}
    </header>
  )
}
