import { RESOURCE_TIER, type PrestigeLayer } from '../data/prestige'
import { UPGRADES } from '../data/upgrades'
import { spawn } from './combat'
import { D, type Decimal } from './decimal'
import { createInitialState, type GameState, type Resources } from './state'
import { statBonus } from './upgrades'

export const startStage = (state: GameState): number => 1 + statBonus(state, 'startStage')

export function prestigeReward(state: GameState, layer: PrestigeLayer): Decimal {
  const basis = state.stats[layer.basis]
  if (basis.lt(layer.threshold)) return D(0)
  return basis.div(layer.threshold).pow(layer.exponent).floor()
}

export const canPrestige = (state: GameState, layer: PrestigeLayer): boolean =>
  prestigeReward(state, layer).gte(1)

/** Returns reward gained (0 = not allowed, nothing changed). */
export function prestige(state: GameState, layer: PrestigeLayer): Decimal {
  const reward = prestigeReward(state, layer)
  if (reward.lt(1)) return D(0)

  const fresh = createInitialState()
  for (const key of Object.keys(RESOURCE_TIER) as (keyof Resources)[]) {
    if (RESOURCE_TIER[key] < layer.tier) state.resources[key] = fresh.resources[key]
  }
  for (const def of UPGRADES) {
    if (RESOURCE_TIER[def.currency] < layer.tier) delete state.upgrades.levels[def.id]
  }
  state.resources[layer.currency] = state.resources[layer.currency].add(reward)
  state.stats.bloodEarnedRun = D(0)
  state.stats.prestiges[layer.id] = (state.stats.prestiges[layer.id] ?? 0) + 1

  // Stage last: start stage may come from kept upgrades.
  state.combat = { ...fresh.combat, stage: startStage(state) }
  spawn(state)
  return reward
}
