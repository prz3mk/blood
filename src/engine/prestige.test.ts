import { describe, expect, it } from 'vitest'
import { PRESTIGE_LAYERS } from '../data/prestige'
import { UPGRADES } from '../data/upgrades'
import { biteDamage } from './combat'
import { D } from './decimal'
import { offlineLimitHours } from './offline'
import { canPrestige, prestige, prestigeReward } from './prestige'
import { createInitialState } from './state'
import { tick } from './tick'
import { buyUpgrade } from './upgrades'

const coffin = PRESTIGE_LAYERS[0]
const def = (id: string) => UPGRADES.find((u) => u.id === id)!

describe('prestige: Sleep in the Coffin', () => {
  it('reward = floor(sqrt(bloodEarnedRun / 1e6))', () => {
    const s = createInitialState()
    s.stats.bloodEarnedRun = D(999_999)
    expect(canPrestige(s, coffin)).toBe(false)
    s.stats.bloodEarnedRun = D(1e6)
    expect(prestigeReward(s, coffin).toNumber()).toBe(1)
    s.stats.bloodEarnedRun = D(9e6)
    expect(prestigeReward(s, coffin).toNumber()).toBe(3)
  })

  it('resets run, keeps essence, essence upgrades, settings, stats', () => {
    const s = createInitialState()
    s.resources = { blood: D(500), bones: D(20), essence: D(2) }
    s.upgrades.levels = { sharpFangs: 10, boneArmor: 3, deepSleep: 1 }
    s.upgrades.unlocked = { sharpFangs: true }
    s.combat.stage = 40
    s.stats.maxStage = 40
    s.stats.kills = 400
    s.stats.bloodEarnedRun = D(4e6)
    s.settings.autoBuyBlood = false

    expect(prestige(s, coffin).toNumber()).toBe(2)
    expect(s.resources.blood.toNumber()).toBe(0)
    expect(s.resources.bones.toNumber()).toBe(0)
    expect(s.resources.essence.toNumber()).toBe(4)
    expect(s.upgrades.levels).toEqual({ deepSleep: 1 })
    expect(s.upgrades.unlocked.sharpFangs).toBe(true)
    expect(s.combat.stage).toBe(1)
    expect(s.combat.enemyHp.toNumber()).toBe(10)
    expect(s.stats.bloodEarnedRun.toNumber()).toBe(0)
    expect(s.stats.maxStage).toBe(40)
    expect(s.stats.kills).toBe(400)
    expect(s.stats.prestiges.coffin).toBe(1)
    expect(s.settings.autoBuyBlood).toBe(false)
  })

  it('refuses below threshold without changes', () => {
    const s = createInitialState()
    s.resources.blood = D(50)
    expect(prestige(s, coffin).toNumber()).toBe(0)
    expect(s.resources.blood.toNumber()).toBe(50)
  })

  it('Head Start begins run at stage 5 with matching HP', () => {
    const s = createInitialState()
    s.upgrades.levels = { headStart: 1 }
    s.stats.bloodEarnedRun = D(1e6)
    prestige(s, coffin)
    expect(s.combat.stage).toBe(5)
    expect(s.combat.enemyHp.toNumber()).toBeCloseTo(10 * 1.18 ** 4)
  })
})

describe('essence', () => {
  it('+2% damage per essence held', () => {
    const s = createInitialState()
    s.resources.essence = D(10)
    expect(biteDamage(s).toNumber()).toBeCloseTo(1.2)
  })

  it('shop items: fixed price, one level', () => {
    const s = createInitialState()
    s.resources.essence = D(10)
    expect(buyUpgrade(s, def('deepSleep'), 'max')).toBe(1)
    expect(s.resources.essence.toNumber()).toBe(8)
    expect(offlineLimitHours(s)).toBe(3)
  })

  it('Blood Thrall auto-buys cheapest, respects toggle', () => {
    const s = createInitialState()
    s.upgrades.levels = { bloodThrall: 1 }
    s.upgrades.unlocked = { sharpFangs: true, ghoulServant: true }
    s.resources.blood = D(80)
    s.settings.autoBuyBlood = false
    tick(s, 0.05)
    expect(s.upgrades.levels.sharpFangs).toBeUndefined()
    s.settings.autoBuyBlood = true
    tick(s, 0.05)
    // Fangs stay cheaper than Ghoul (50): 10+11.5+13.2+15.2+17.5 = 67.4, next 20.1 > 12.6 left
    expect(s.upgrades.levels.sharpFangs).toBe(5)
    expect(s.upgrades.levels.ghoulServant).toBeUndefined()
  })
})
