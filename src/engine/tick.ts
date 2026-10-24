import type { GameState } from './state'

export const TICKS_PER_SECOND = 20
export const TICK_SECONDS = 1 / TICKS_PER_SECOND

/** Advance game state by dt seconds. All systems scale by dt. */
export function tick(state: GameState, dt: number): void {
  state.stats.playTime += dt
}
