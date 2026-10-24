import type { Resources } from '../engine/state'

/**
 * Tier of each resource. Prestige layer k resets every resource and upgrade
 * (by its currency) with tier < k, plus run progress (stage, run stats).
 */
export const RESOURCE_TIER: Record<keyof Resources, number> = {
  blood: 0,
  bones: 0,
  essence: 1,
}

export interface PrestigeLayer {
  /** 1-based; see RESOURCE_TIER. */
  tier: number
  id: string
  name: string
  currency: keyof Resources
  /** Reward = floor((basis / threshold) ^ exponent); 0 below threshold. */
  basis: 'bloodEarnedRun'
  threshold: number
  exponent: number
}

/** See design doc "Prestiż". Future layers append here. */
export const PRESTIGE_LAYERS: readonly PrestigeLayer[] = [
  {
    tier: 1,
    id: 'coffin',
    name: 'Sleep in the Coffin',
    currency: 'essence',
    basis: 'bloodEarnedRun',
    threshold: 1e6,
    exponent: 0.5,
  },
]

/** Passive: +2% all damage per Essence held. */
export const ESSENCE_DAMAGE_PER = 0.02
