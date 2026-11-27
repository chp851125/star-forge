import type { AffixSlot, Tier, ZoneKind } from '../types'
import { getTier } from '../core/reroll'

export const TIER_TEXT: Record<Tier, string> = {
  blue: 'text-tier-blue', purple: 'text-tier-purple', gold: 'text-tier-gold', red: 'text-tier-red',
}
export const TIER_BORDER: Record<Tier, string> = {
  blue: 'border-tier-blue/70', purple: 'border-tier-purple/70', gold: 'border-tier-gold/70', red: 'border-tier-red/80',
}
export const TIER_BG: Record<Tier, string> = {
  blue: 'bg-tier-blue/10', purple: 'bg-tier-purple/10', gold: 'bg-tier-gold/10', red: 'bg-tier-red/15',
}
export const ZONE_TEXT: Record<ZoneKind, string> = {
  safe: 'text-zone-safe', drop: 'text-zone-drop', reset: 'text-zone-reset',
}
export const ZONE_BG: Record<ZoneKind, string> = {
  safe: 'bg-zone-safe/10', drop: 'bg-zone-drop/10', reset: 'bg-zone-reset/10',
}
export const ZONE_BORDER: Record<ZoneKind, string> = {
  safe: 'border-zone-safe/70', drop: 'border-zone-drop/70', reset: 'border-zone-reset/70',
}

/** 光環色(--aura),null = 預設青色 */
export const AURA_CLASS = (t: Tier | null) => `aura-${t ?? 'cyan'}`

const RANK: Tier[] = ['blue', 'purple', 'gold', 'red']

export const slotTier = (s: AffixSlot): Tier | null => (s ? getTier(s.lv) : null)

export function highestTier(tiers: (Tier | null)[]): Tier | null {
  let best = -1
  for (const t of tiers) if (t && RANK.indexOf(t) > best) best = RANK.indexOf(t)
  return best < 0 ? null : RANK[best]
}
