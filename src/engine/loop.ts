import { TICK_SECONDS } from './tick'

export interface LoopOptions {
  /** Runs one fixed step of dt seconds. */
  step: (dt: number) => void
  /** Gap longer than this (s) is handed to onGap instead of stepped (background tab). */
  maxCatchUp?: number
  onGap?: (seconds: number) => void
}

/**
 * Fixed-timestep accumulator. Call advance() with wall-clock seconds;
 * runs as many TICK_SECONDS steps as elapsed, carrying the remainder.
 */
export function createLoop({ step, maxCatchUp = 1, onGap }: LoopOptions) {
  let last: number | null = null
  let acc = 0

  return {
    advance(now: number): number {
      if (last === null) {
        last = now
        return 0
      }
      const elapsed = Math.max(0, now - last)
      last = now
      if (elapsed > maxCatchUp) {
        onGap?.(elapsed)
        return 0
      }
      acc += elapsed
      let steps = 0
      // Epsilon: float sums like 0.02 + 0.03 land just under one tick.
      while (acc >= TICK_SECONDS - 1e-9) {
        step(TICK_SECONDS)
        acc -= TICK_SECONDS
        steps++
      }
      return steps
    },
    reset(): void {
      last = null
      acc = 0
    },
  }
}
