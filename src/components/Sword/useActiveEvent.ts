import { useEffect, useState } from 'react'
import type { WeaponEvent } from '../../types'

/** 事件在指定時間內視為進行中,之後回傳 null */
export function useActiveEvent(event: WeaponEvent | null, durations: Record<WeaponEvent['kind'], number>) {
  const [done, setDone] = useState(-1)
  const active = event && event.n !== done ? event : null
  const n = active?.n
  const ms = active ? durations[active.kind] : 0
  useEffect(() => {
    if (n === undefined) return
    const t = window.setTimeout(() => setDone(n), ms)
    return () => clearTimeout(t)
  }, [n, ms])
  return active
}
