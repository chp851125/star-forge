import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { FxQuality } from '../../types'

interface QualityValue {
  /** 使用者選擇 */
  chosen: FxQuality
  /** 實際套用(系統減少動態時一律 off) */
  quality: FxQuality
  reduced: boolean
  setQuality: (q: FxQuality) => void
}

const Ctx = createContext<QualityValue>({ chosen: 'medium', quality: 'medium', reduced: false, setQuality: () => {} })

const defaultQuality = (): FxQuality =>
  (navigator.hardwareConcurrency ?? 8) <= 4 || window.innerWidth < 480 ? 'low' : 'medium'

const REDUCED = '(prefers-reduced-motion: reduce)'

export function QualityProvider({ children }: { children: ReactNode }) {
  const [chosen, setQuality] = useState<FxQuality>(defaultQuality)
  const [reduced, setReduced] = useState(() => window.matchMedia(REDUCED).matches)
  const quality: FxQuality = reduced ? 'off' : chosen

  useEffect(() => {
    const mq = window.matchMedia(REDUCED)
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.fx = quality
  }, [quality])

  // 分頁隱藏時暫停動畫
  useEffect(() => {
    const onVis = () => document.documentElement.classList.toggle('fx-paused', document.hidden)
    onVis()
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  return <Ctx.Provider value={{ chosen, quality, reduced, setQuality }}>{children}</Ctx.Provider>
}

export const useQuality = () => useContext(Ctx)
