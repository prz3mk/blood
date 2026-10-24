import { OFFLINE } from '../data/offline'
import type { Decimal } from './decimal'
import type { GameState } from './state'
import { tick } from './tick'
import { statBonus } from './upgrades'

export const offlineLimitHours = (state: GameState): number =>
  OFFLINE.baseHours + statBonus(state, 'offlineHours')

export interface OfflineReport {
  /** Real time away. */
  away: number
  /** Time actually simulated (capped by limit). */
  simulated: number
  blood: Decimal
  bones: Decimal
  stages: number
  kills: number
}

/** Simulate time away in fixed chunks, capped at the offline limit. */
export function simulateOffline(state: GameState, seconds: number): OfflineReport {
  const away = Math.max(0, seconds)
  const simulated = Math.min(away, offlineLimitHours(state) * 3600)
  const before = {
    blood: state.resources.blood,
    bones: state.resources.bones,
    stage: state.combat.stage,
    kills: state.stats.kills,
  }
  const chunk = Math.max(OFFLINE.chunkSeconds, simulated / OFFLINE.maxChunks)
  let left = simulated
  while (left > 0) {
    const dt = Math.min(chunk, left)
    tick(state, dt)
    left -= dt
  }
  return {
    away,
    simulated,
    // Spending can't happen offline, so deltas are gains.
    blood: state.resources.blood.sub(before.blood),
    bones: state.resources.bones.sub(before.bones),
    stages: state.combat.stage - before.stage,
    kills: state.stats.kills - before.kills,
  }
}
