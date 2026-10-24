import { autoBitesPerSecond, autoDps, bite, dealDamage } from './combat'
import type { GameState } from './state'
import { updateUnlocks } from './upgrades'

export const TICKS_PER_SECOND = 20
export const TICK_SECONDS = 1 / TICKS_PER_SECOND

/** Advance game state by dt seconds. All systems scale by dt. */
export function tick(state: GameState, dt: number): void {
  state.stats.playTime += dt
  const dps = autoDps(state)
  if (dps.gt(0)) dealDamage(state, dps.mul(dt))

  const c = state.combat
  c.autoBiteProgress += autoBitesPerSecond(state) * dt
  while (c.autoBiteProgress >= 1 - 1e-9) {
    c.autoBiteProgress--
    bite(state, Math.random, true)
  }
  updateUnlocks(state)
}
