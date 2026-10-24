import { describe, expect, it } from 'vitest'
import { UPGRADES } from '../data/upgrades'
import { autoDps, bite, biteDamage, dealDamage } from './combat'
import { D } from './decimal'
import { createInitialState } from './state'
import { tick } from './tick'
import { buyCount, buyUpgrade, updateUnlocks, upgradeCost } from './upgrades'

const def = (id: string) => UPGRADES.find((u) => u.id === id)!

describe('upgrades', () => {
  it('cost grows geometrically', () => {
    const f = def('sharpFangs')
    expect(upgradeCost(f, 0).toNumber()).toBeCloseTo(10)
    expect(upgradeCost(f, 1).toNumber()).toBeCloseTo(11.5)
    expect(upgradeCost(f, 0, 2).toNumber()).toBeCloseTo(21.5)
  })

  it('buy x1 / x10 / max', () => {
    const s = createInitialState()
    s.resources.blood = D(21.5)
    expect(buyCount(s, def('sharpFangs'), 10)).toBe(2)
    expect(buyUpgrade(s, def('sharpFangs'), 1)).toBe(1)
    expect(s.resources.blood.toNumber()).toBeCloseTo(11.5)
    expect(buyUpgrade(s, def('sharpFangs'), 'max')).toBe(1)
    expect(s.resources.blood.toNumber()).toBeCloseTo(0)
    expect(buyUpgrade(s, def('sharpFangs'), 1)).toBe(0)
    expect(s.upgrades.levels.sharpFangs).toBe(2)
  })

  it('respects max level', () => {
    const s = createInitialState()
    s.resources.blood = D('1e100')
    expect(buyUpgrade(s, def('criticalBite'), 'max')).toBe(25)
    expect(buyUpgrade(s, def('criticalBite'), 1)).toBe(0)
  })

  it('effects: bite, dps, blood mult', () => {
    const s = createInitialState()
    s.upgrades.levels = { sharpFangs: 4, bloodlust: 5, ghoulServant: 2, ghoulTraining: 2, bloodSiphon: 2 }
    expect(biteDamage(s).toNumber()).toBeCloseTo(7.5)
    expect(autoDps(s).toNumber()).toBeCloseTo(2.6)
    dealDamage(s, D(10))
    expect(s.resources.blood.toNumber()).toBeCloseTo(1.1)
  })

  it('crit multiplies bite', () => {
    const s = createInitialState()
    s.upgrades.levels = { criticalBite: 1 }
    bite(s, () => 0.01)
    expect(s.combat.enemyHp.toNumber()).toBe(5)
    bite(s, () => 0.5)
    expect(s.combat.enemyHp.toNumber()).toBe(4)
    expect(s.stats.crits).toBe(1)
  })

  it('ghoul DPS kills over time', () => {
    const s = createInitialState()
    s.upgrades.levels = { ghoulServant: 10 }
    for (let i = 0; i < 20; i++) tick(s, 0.05)
    expect(s.stats.kills).toBe(1)
  })

  it('unlocks at 50% of base cost, sticky', () => {
    const s = createInitialState()
    s.resources.blood = D(5)
    updateUnlocks(s)
    expect(s.upgrades.unlocked.sharpFangs).toBe(true)
    expect(s.upgrades.unlocked.ghoulServant).toBeUndefined()
    s.resources.blood = D(0)
    updateUnlocks(s)
    expect(s.upgrades.unlocked.sharpFangs).toBe(true)
  })
})
