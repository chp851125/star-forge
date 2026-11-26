import { useState } from 'react'
import type { GameMode } from '../../types'
import { DEFAULT_CUSTOM, DEFAULT_TURNS, INFINITE_GOALS, QUOTA_PRESETS } from '../../config/modes'

type Choice = 'infinite' | 'easy' | 'normal' | 'hard' | 'custom' | 'turns'

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm">
      {label}
      <input
        type="number" min={1} value={value}
        onChange={(e) => onChange(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
        className="h-11 w-28 border border-cyan/50 bg-bg px-2 text-right text-ink"
      />
    </label>
  )
}

export default function ModeSelect({ onStart }: { onStart: (m: GameMode) => void }) {
  const [choice, setChoice] = useState<Choice>('infinite')
  const [goal, setGoal] = useState(INFINITE_GOALS[2])
  const [custom, setCustom] = useState(DEFAULT_CUSTOM)
  const [turns, setTurns] = useState(DEFAULT_TURNS)

  const start = () => {
    if (choice === 'infinite') return onStart({ kind: 'infinite', goal })
    if (choice === 'custom') return onStart({ kind: 'limited', preset: 'custom', quota: custom })
    if (choice === 'turns') return onStart({ kind: 'limited', preset: 'turns', quota: { starStone: 0, rerollStone: 0 }, turns })
    const p = QUOTA_PRESETS.find((q) => q.id === choice)!
    onStart({ kind: 'limited', preset: p.id, quota: p.quota })
  }

  const Opt = ({ id, title, children }: { id: Choice; title: string; children?: React.ReactNode }) => (
    <div
      className={`border p-3 ${choice === id ? 'border-cyan bg-cyan/10 shadow-glow' : 'border-cyan/25'}`}
    >
      <button className="flex min-h-[44px] w-full items-center gap-2 text-left font-semibold" onClick={() => setChoice(id)} aria-pressed={choice === id}>
        <span className={choice === id ? 'text-cyan' : 'text-muted'}>{choice === id ? '◉' : '○'}</span>
        {title}
      </button>
      {choice === id && children && <div className="mt-2 space-y-2">{children}</div>}
    </div>
  )

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 p-4">
      <h1 className="text-center text-3xl font-extrabold tracking-widest text-cyan">星煉工坊</h1>
      <p className="text-center text-sm text-muted">Star &amp; Affix Forge · 選擇模式開始打造</p>

      <section className="panel space-y-3 p-4">
        <Opt id="infinite" title="無限模式(資源不限,統計總消耗)">
          <label className="block text-sm">
            目標(選填)
            <input
              list="goals" value={goal} onChange={(e) => setGoal(e.target.value)}
              placeholder="例如 +15 且三條皆金以上"
              className="mt-1 h-11 w-full border border-cyan/50 bg-bg px-2 text-ink"
            />
            <datalist id="goals">{INFINITE_GOALS.filter(Boolean).map((g) => <option key={g} value={g} />)}</datalist>
          </label>
        </Opt>

        <div className="pt-1 text-sm text-muted">限定模式</div>
        {QUOTA_PRESETS.map((p) => (
          <Opt key={p.id} id={p.id} title={`${p.label}(升星石 ${p.quota.starStone} / 洗練石 ${p.quota.rerollStone})`} />
        ))}
        <Opt id="custom" title="自訂額度">
          <NumField label="升星石" value={custom.starStone} onChange={(n) => setCustom({ ...custom, starStone: n })} />
          <NumField label="洗練石" value={custom.rerollStone} onChange={(n) => setCustom({ ...custom, rerollStone: n })} />
        </Opt>
        <Opt id="turns" title="次數制(限制操作次數)">
          <NumField label="操作次數" value={turns} onChange={setTurns} />
        </Opt>
      </section>

      <button className="btn-primary text-lg" onClick={start}>開始打造</button>
    </main>
  )
}
