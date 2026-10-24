import { D, type Decimal } from './decimal'

export interface Resources {
  blood: Decimal
  bones: Decimal
  essence: Decimal
}

export interface Stats {
  /** Seconds of simulated game time. */
  playTime: number
  /** Blood earned in current run (prestige basis). */
  bloodEarnedRun: Decimal
  bloodEarnedTotal: Decimal
}

export interface GameState {
  resources: Resources
  stats: Stats
}

export function createInitialState(): GameState {
  return {
    resources: { blood: D(0), bones: D(0), essence: D(0) },
    stats: { playTime: 0, bloodEarnedRun: D(0), bloodEarnedTotal: D(0) },
  }
}
