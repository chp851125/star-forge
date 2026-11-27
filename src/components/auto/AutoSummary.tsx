interface Props {
  reason: string
  items: [string, string | number][]
  /** 額外一行(例如本局累計消耗) */
  note?: string
  onClose: () => void
}

/** 自動流程結束摘要卡 */
export default function AutoSummary({ reason, items, note, onClose }: Props) {
  return (
    <section className="space-y-2 border border-cyan bg-bg/60 p-2" role="status" aria-label="自動流程摘要">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-bold text-cyan">已停止:{reason}</h3>
        <button className="btn" onClick={onClose}>關閉摘要</button>
      </div>
      <dl className="grid grid-cols-3 gap-1">
        {items.map(([k, v]) => (
          <div key={k} className="border border-cyan/20 px-2 py-0.5">
            <dt className="text-xs text-muted">{k}</dt>
            <dd className="font-bold">{v}</dd>
          </div>
        ))}
      </dl>
      {note && <p className="text-sm text-muted">{note}</p>}
    </section>
  )
}
