import { useEffect, useRef } from 'react'
import type { AffixSlot } from '../../types'
import { AffixRow } from '../panels/AffixList'

interface Props {
  title: string
  before: AffixSlot[]
  after: AffixSlot[]
  onKeep: () => void
  onApply: () => void
}

export default function CompareModal({ title, before, after, onKeep, onApply }: Props) {
  const ref = useRef<HTMLButtonElement>(null)
  useEffect(() => ref.current?.focus(), [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="panel max-h-full w-full max-w-md space-y-3 overflow-y-auto p-4">
        <h2 className="text-lg font-bold text-cyan">{title} · 新舊對照</h2>
        <div>
          <div className="mb-1 text-sm text-muted">目前效果</div>
          <div className="space-y-1">{before.map((s, i) => <AffixRow key={i} slot={s} compact />)}</div>
        </div>
        <div className="text-center text-cyan" aria-hidden>▼</div>
        <div>
          <div className="mb-1 text-sm text-muted">變更後效果</div>
          <div className="space-y-1">{after.map((s, i) => <AffixRow key={i} slot={s} compact />)}</div>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button ref={ref} className="btn" onClick={onKeep}>效果維持</button>
          <button className="btn-primary" onClick={onApply}>效果變更</button>
        </div>
      </div>
    </div>
  )
}
