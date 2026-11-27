interface Props {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  hint?: string
  disabled?: boolean
}

/** 開關:以「開 / 關」文字與滑塊位置表示狀態 */
export default function Switch({ checked, onChange, label, hint, disabled }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex min-h-[44px] items-center gap-2 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span
        className={`relative h-6 w-14 shrink-0 rounded-full border text-xs font-bold leading-[22px] ${checked ? 'border-cyan bg-cyan text-bg shadow-glow' : 'border-muted/60 bg-bg text-muted'}`}
        aria-hidden
      >
        <span className={`absolute ${checked ? 'left-2' : 'right-2'}`}>{checked ? '開' : '關'}</span>
        <span className={`absolute top-[3px] h-4 w-4 rounded-full transition-[left] ${checked ? 'left-[35px] bg-bg' : 'left-[3px] bg-muted'}`} />
      </span>
      <span className="leading-tight">
        <span className={`block text-sm font-semibold ${checked ? 'text-cyan' : 'text-ink'}`}>{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
    </button>
  )
}
