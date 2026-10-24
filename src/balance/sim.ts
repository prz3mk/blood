import { PRESTIGE_LAYERS } from '../data/prestige'
import { CRIT_MULT, UPGRADES, type UpgradeDef } from '../data/upgrades'
import {
  autoBitesPerSecond,
  autoDps,
  bite,
  biteDamage,
  bloodMult,
  bossDmgMult,
  critChance,
} from '../engine/combat'
import { createInitialState, type GameState } from '../engine/state'
import { tick } from '../engine/tick'
import { buyUpgrade, level, upgradeCost } from '../engine/upgrades'

export interface BotProfile {
  name: string
  /** Manual bites per second while playing. */
  clicksPerSecond: number
}

export interface Milestone {
  minute: number
  stage: number
  bloodEarned: string
  levels: Record<string, number>
}

export interface RunResult {
  /** Seconds until first prestige is possible; null if not within limit. */
  prestigeAt: number | null
  milestones: Milestone[]
  state: GameState
}

/** Rough income power: effective DPS (clicks + bats + ghouls, avg crits) × Blood mult. */
function power(state: GameState, clicksPerSecond: number): number {
  const bites = clicksPerSecond + autoBitesPerSecond(state)
  const avgCrit = 1 + critChance(state) * (CRIT_MULT - 1)
  const dps = biteDamage(state).toNumber() * bites * avgCrit + autoDps(state).toNumber()
  return dps * bloodMult(state) * bossDmgMult(state) ** 0.3
}

/**
 * Bot: per currency, buy the affordable level with best power gain per cost;
 * items with no modelled gain (offline, bones mult) only when nothing else is.
 */
function buyBest(state: GameState, clicksPerSecond: number): void {
  for (const currency of ['blood', 'bones'] as const) {
    const defs = UPGRADES.filter((d) => d.currency === currency && state.upgrades.unlocked[d.id])
    for (let i = 0; i < 200; i++) {
      const base = power(state, clicksPerSecond)
      let best: { def: UpgradeDef; score: number } | null = null
      for (const def of defs) {
        const owned = level(state, def.id)
        if (def.max !== undefined && owned >= def.max) continue
        const cost = upgradeCost(def, owned)
        if (cost.gt(state.resources[currency])) continue
        state.upgrades.levels[def.id] = owned + 1
        const gain = power(state, clicksPerSecond) - base
        if (owned) state.upgrades.levels[def.id] = owned
        else delete state.upgrades.levels[def.id]
        // Tiny floor so unmodelled items still get bought when cheap.
        const score = Math.max(gain / base, 1e-3) / cost.toNumber()
        if (!best || score > best.score) best = { def, score }
      }
      if (!best) break
      buyUpgrade(state, best.def, 1)
    }
  }
}

/** Deterministic run from a fresh save until first prestige or maxSeconds. */
export function simulateRun(profile: BotProfile, maxSeconds = 3 * 3600, dt = 0.25): RunResult {
  const state = createInitialState()
  const layer = PRESTIGE_LAYERS[0]
  const milestones: Milestone[] = []
  // Fixed rng: crits average out; keeps results reproducible.
  let seed = 1
  const rng = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  let clickAcc = 0
  let nextBuy = 0
  let nextMilestone = 0

  for (let t = 0; t < maxSeconds; t += dt) {
    clickAcc += profile.clicksPerSecond * dt
    for (; clickAcc >= 1; clickAcc--) bite(state, rng)
    tick(state, dt)
    if (t >= nextBuy) {
      buyBest(state, profile.clicksPerSecond)
      nextBuy += 1
    }
    if (t >= nextMilestone) {
      milestones.push(snapshot(state, t))
      nextMilestone += 300
    }
    if (state.stats[layer.basis].gte(layer.threshold)) {
      milestones.push(snapshot(state, t))
      return { prestigeAt: t, milestones, state }
    }
  }
  return { prestigeAt: null, milestones, state }
}

function snapshot(state: GameState, t: number): Milestone {
  return {
    minute: Math.round(t / 6) / 10,
    stage: state.combat.stage,
    bloodEarned: state.stats.bloodEarnedRun.toExponential(2),
    levels: { ...state.upgrades.levels },
  }
}
