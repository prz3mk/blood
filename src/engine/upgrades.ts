import { UNLOCK_FRACTION, UPGRADES, type UpgradeDef, type UpgradeStat } from '../data/upgrades'
import { D, Decimal } from './decimal'
import type { GameState } from './state'

export type BuyMode = 1 | 10 | 'max'

export const level = (state: GameState, id: string): number => state.upgrades.levels[id] ?? 0

export function upgradeCost(def: UpgradeDef, owned: number, count = 1): Decimal {
  return Decimal.sumGeometricSeries(count, def.base, def.growth, owned)
}

/** Sum over upgrades of perLevel · level for a stat. */
export function statBonus(state: GameState, stat: UpgradeStat): number {
  let total = 0
  for (const def of UPGRADES) if (def.stat === stat) total += def.perLevel * level(state, def.id)
  return total
}

/** How many to buy for a mode; 0 if none affordable. */
export function buyCount(state: GameState, def: UpgradeDef, mode: BuyMode): number {
  const owned = level(state, def.id)
  const room = (def.max ?? Infinity) - owned
  const money = state.resources[def.currency]
  let n = Decimal.affordGeometricSeries(money, def.base, def.growth, owned).toNumber()
  n = Math.min(n, room, mode === 'max' ? Infinity : mode)
  // Guard float error at the edge of affordability.
  while (n > 0 && upgradeCost(def, owned, n).gt(money)) n--
  return Math.max(0, Math.floor(n))
}

export function buyUpgrade(state: GameState, def: UpgradeDef, mode: BuyMode): number {
  const n = buyCount(state, def, mode)
  if (n === 0) return 0
  const owned = level(state, def.id)
  const cost = upgradeCost(def, owned, n)
  state.resources[def.currency] = Decimal.max(0, state.resources[def.currency].sub(cost))
  state.upgrades.levels[def.id] = owned + n
  return n
}

export function updateUnlocks(state: GameState): void {
  const { unlocked } = state.upgrades
  for (const def of UPGRADES) {
    if (unlocked[def.id]) continue
    if (state.resources[def.currency].gte(D(def.base).mul(UNLOCK_FRACTION))) unlocked[def.id] = true
  }
}
