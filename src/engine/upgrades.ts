import { UNLOCK_FRACTION, UPGRADES, type UpgradeDef, type UpgradeStat } from '../data/upgrades'
import { D, Decimal } from './decimal'
import type { GameState } from './state'

export type BuyMode = 1 | 10 | 'max'

export const level = (state: GameState, id: string): number => state.upgrades.levels[id] ?? 0

// growth 1 = fixed price; geometric-series formulas divide by (growth - 1).
export function upgradeCost(def: UpgradeDef, owned: number, count = 1): Decimal {
  if (def.growth === 1) return D(def.base).mul(count)
  return Decimal.sumGeometricSeries(count, def.base, def.growth, owned)
}

function affordable(def: UpgradeDef, money: Decimal, owned: number): number {
  if (def.growth === 1) return money.div(def.base).floor().toNumber()
  return Decimal.affordGeometricSeries(money, def.base, def.growth, owned).toNumber()
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
  let n = affordable(def, money, owned)
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

/** Blood Thrall: repeatedly buy the cheapest affordable Blood upgrade level. */
export function autoBuyBlood(state: GameState, maxBuys = 100): void {
  if (!state.settings.autoBuyBlood || statBonus(state, 'autoBuyBlood') <= 0) return
  const defs = UPGRADES.filter((d) => d.currency === 'blood' && state.upgrades.unlocked[d.id])
  for (let i = 0; i < maxBuys; i++) {
    let best: UpgradeDef | null = null
    let bestCost: Decimal | null = null
    for (const def of defs) {
      const owned = level(state, def.id)
      if (def.max !== undefined && owned >= def.max) continue
      const cost = upgradeCost(def, owned)
      if (!bestCost || cost.lt(bestCost)) {
        best = def
        bestCost = cost
      }
    }
    if (!best || !bestCost || bestCost.gt(state.resources.blood)) return
    buyUpgrade(state, best, 1)
  }
}
