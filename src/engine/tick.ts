import { autoBite, autoBitesPerSecond, autoDps, ghoulAttack } from './combat'
import type { GameState } from './state'
import { autoBuyBlood, updateUnlocks } from './upgrades'

export const TICKS_PER_SECOND = 20
export const TICK_SECONDS = 1 / TICKS_PER_SECOND

/** Advance game state by dt seconds. All systems scale by dt. */
export function tick(state: GameState, dt: number): void {
  state.stats.playTime += dt
  const dps = autoDps(state)
  if (dps.gt(0)) ghoulAttack(state, dps.mul(dt))

  const c = state.combat
  c.autoBiteProgress += autoBitesPerSecond(state) * dt
  // Epsilon: float sums land just under whole bites.
  const n = Math.floor(c.autoBiteProgress + 1e-9)
  c.autoBiteProgress -= n
  autoBite(state, n)
  updateUnlocks(state)
  autoBuyBlood(state)
}
