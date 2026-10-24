import { COMBAT } from '../data/combat'
import { D, type Decimal } from './decimal'
import type { Notation } from './format'

export interface Resources {
  blood: Decimal
  bones: Decimal
  essence: Decimal
}

export interface Combat {
  /** Stage number, from 1. */
  stage: number
  /** Highest stage unlocked this run (boss of the one below beaten). */
  highestStage: number
  /** 0..enemiesPerStage-1 = normal enemies, enemiesPerStage = boss. */
  enemyIndex: number
  enemyHp: Decimal
  /** Fractional auto-bites accumulated (Bat Swarm). */
  autoBiteProgress: number
}

export interface Stats {
  /** Seconds of simulated game time. */
  playTime: number
  /** Blood earned in current run (prestige basis). */
  bloodEarnedRun: Decimal
  bloodEarnedTotal: Decimal
  bonesEarnedTotal: Decimal
  kills: number
  bossKills: number
  clicks: number
  crits: number
  autoBites: number
  maxStage: number
  /** Times each prestige layer was done, by layer id. */
  prestiges: Record<string, number>
}

/** Survive every prestige. */
export interface Settings {
  autoBuyBlood: boolean
  /** true: next stage after boss; false: farm (repeat current stage). */
  autoAdvance: boolean
  /** Floating damage numbers over the enemy. */
  damageNumbers: boolean
  notation: Notation
}

export interface Upgrades {
  levels: Record<string, number>
  /** Sticky: once shown, stays shown. */
  unlocked: Record<string, boolean>
}

export interface GameState {
  resources: Resources
  combat: Combat
  upgrades: Upgrades
  stats: Stats
  settings: Settings
}

export function createInitialState(): GameState {
  return {
    resources: { blood: D(0), bones: D(0), essence: D(0) },
    combat: { stage: 1, highestStage: 1, enemyIndex: 0, enemyHp: D(COMBAT.enemyHpBase), autoBiteProgress: 0 },
    upgrades: { levels: {}, unlocked: {} },
    stats: {
      playTime: 0,
      bloodEarnedRun: D(0),
      bloodEarnedTotal: D(0),
      bonesEarnedTotal: D(0),
      kills: 0,
      bossKills: 0,
      clicks: 0,
      crits: 0,
      autoBites: 0,
      maxStage: 1,
      prestiges: {},
    },
    settings: { autoBuyBlood: true, autoAdvance: true, damageNumbers: true, notation: 'scientific' },
  }
}
