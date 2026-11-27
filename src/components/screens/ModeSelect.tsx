import { useState } from 'react'
import type { GameMode } from '../../types'
import { DEFAULT_CUSTOM, DEFAULT_TURNS, QUOTA_PRESETS, STONE_INPUT, TURNS_INPUT } from '../../config/modes'
import NumberStepper from '../ui/NumberStepper'

type Choice = 'infinite' | 'easy' | 'normal' | 'hard' | 'custom' | 'turns'

interface OptProps {
  id: Choice
  title: string
  choice: Choice
  onSelect: (c: Choice) => void
  children?: React.ReactNode
}

/** 必須定義在父元件外:否則每次重繪都重掛子元件,輸入框會失焦、長按會中斷 */
function Opt({ id, title, choice, onSelect, children }: OptProps) {
  const on = choice === id
  return (
    <div className={`border p-3 ${on ? 'border-cyan bg-cyan/10 shadow-glow' : 'border-cyan/25'}`}>
      <button className="flex min-h-[44px] w-full items-center gap-2 text-left font-semibold" onClick={() => onSelect(id)} aria-pressed={on}>
        <span className={on ? 'text-cyan' : 'text-muted'}>{on ? '◉' : '○'}</span>
        {title}
      </button>
      {on && children && <div className="mt-2 space-y-3">{children}</div>}
    </div>
  )
}

export default function ModeSelect({ onStart }: { onStart: (m: GameMode) => void }) {
  const [choice, setChoice] = useState<Choice>('infinite')
  const [custom, setCustom] = useState(DEFAULT_CUSTOM)
  const [turns, setTurns] = useState(DEFAULT_TURNS)
  const opt = { choice, onSelect: setChoice }

  const start = () => {
    if (choice === 'infinite') return onStart({ kind: 'infinite' })
    if (choice === 'custom') return onStart({ kind: 'limited', preset: 'custom', quota: custom })
    if (choice === 'turns') return onStart({ kind: 'limited', preset: 'turns', quota: { starStone: 0, rerollStone: 0 }, turns })
    const p = QUOTA_PRESETS.find((q) => q.id === choice)!
    onStart({ kind: 'limited', preset: p.id, quota: p.quota })
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 p-4">
      <h1 className="text-center text-3xl font-extrabold tracking-widest text-cyan">星煉工坊</h1>
      <p className="text-center text-sm text-muted">Star &amp; Affix Forge · 選擇模式開始打造</p>

      <section className="panel space-y-3 p-4">
        <Opt {...opt} id="infinite" title="無限模式">
          <p className="bevel border border-cyan/40 bg-bg/60 px-4 py-3 text-sm">
            資源無限制。
          </p>
        </Opt>

        <div className="pt-1 text-sm text-muted">限定模式</div>
        {QUOTA_PRESETS.map((p) => (
          <Opt {...opt} key={p.id} id={p.id} title={`${p.label}(升星石 ${p.quota.starStone} / 洗練石 ${p.quota.rerollStone})`} />
        ))}
        <Opt {...opt} id="custom" title="自訂額度">
          <NumberStepper label="升星石" {...STONE_INPUT.starStone} value={custom.starStone} onChange={(n) => setCustom((c) => ({ ...c, starStone: n }))} />
          <NumberStepper label="洗練石" {...STONE_INPUT.rerollStone} value={custom.rerollStone} onChange={(n) => setCustom((c) => ({ ...c, rerollStone: n }))} />
        </Opt>
        <Opt {...opt} id="turns" title="次數制(限制操作次數)">
          <NumberStepper label="操作次數" {...TURNS_INPUT} value={turns} onChange={setTurns} />
        </Opt>
      </section>

      <button className="btn-primary text-lg" onClick={start}>開始打造</button>
    </main>
  )
}
