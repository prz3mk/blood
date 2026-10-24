import { describe, expect, it } from 'vitest'
import { COMBAT } from '../data/combat'
import { bite, bloodDrop, bonesDrop, currentDrops, dealDamage, enemyMaxHp, goToStage, setHitListener, spawn, type Hit } from './combat'
import { tick } from './tick'
import { D } from './decimal'
import { createInitialState } from './state'

describe('formulas', () => {
  it('enemy HP', () => {
    expect(enemyMaxHp(1, false).toNumber()).toBe(10)
    expect(enemyMaxHp(2, false).toNumber()).toBeCloseTo(11.4)
    expect(enemyMaxHp(1, true).toNumber()).toBe(100)
  })

  it('drops', () => {
    expect(bloodDrop(1).toNumber()).toBe(1)
    expect(bloodDrop(3).toNumber()).toBeCloseTo(1.44)
    expect(bonesDrop(1).toNumber()).toBe(1)
    expect(bonesDrop(5).toNumber()).toBe(2)
    expect(bonesDrop(12).toNumber()).toBe(3)
  })
})

describe('combat', () => {
  it('bite damages, kill drops blood and advances enemy', () => {
    const s = createInitialState()
    bite(s)
    expect(s.combat.enemyHp.toNumber()).toBe(9)
    for (let i = 0; i < 9; i++) bite(s)
    expect(s.combat.enemyIndex).toBe(1)
    expect(s.resources.blood.toNumber()).toBe(1)
    expect(s.stats.bloodEarnedRun.toNumber()).toBe(1)
    expect(s.stats.clicks).toBe(10)
  })

  it('overkill carries over', () => {
    const s = createInitialState()
    dealDamage(s, D(25))
    expect(s.combat.enemyIndex).toBe(2)
    expect(s.combat.enemyHp.toNumber()).toBe(5)
    expect(s.stats.kills).toBe(2)
  })

  it('boss after 10 enemies gives bones and next stage', () => {
    const s = createInitialState()
    dealDamage(s, D(100))
    expect(s.combat.enemyIndex).toBe(COMBAT.enemiesPerStage)
    expect(s.combat.enemyHp.toNumber()).toBe(100)
    dealDamage(s, D(100))
    expect(s.combat.stage).toBe(2)
    expect(s.combat.enemyIndex).toBe(0)
    expect(s.resources.bones.toNumber()).toBe(1)
    expect(s.resources.blood.toNumber()).toBe(11)
    expect(s.stats.maxStage).toBe(2)
  })

  it('overkill chain capped', () => {
    const s = createInitialState()
    dealDamage(s, D('1e100'))
    expect(s.stats.kills).toBe(COMBAT.maxKillsPerHit)
  })
})

describe('stage travel', () => {
  it('farm mode repeats stage after boss but unlocks the next', () => {
    const s = createInitialState()
    s.settings.autoAdvance = false
    dealDamage(s, D(200)) // 10 enemies + boss
    expect(s.combat.stage).toBe(1)
    expect(s.combat.enemyIndex).toBe(0)
    expect(s.combat.highestStage).toBe(2)
    expect(s.resources.bones.toNumber()).toBe(1)
  })

  it('auto-advance moves on and unlocks', () => {
    const s = createInitialState()
    dealDamage(s, D(200))
    expect(s.combat.stage).toBe(2)
    expect(s.combat.highestStage).toBe(2)
  })

  it('goToStage clamps to 1..highestStage and restarts at enemy 1', () => {
    const s = createInitialState()
    s.combat.highestStage = 5
    s.combat.stage = 5
    s.combat.enemyIndex = 7
    goToStage(s, 3)
    expect(s.combat.stage).toBe(3)
    expect(s.combat.enemyIndex).toBe(0)
    expect(s.combat.enemyHp.toNumber()).toBeCloseTo(enemyMaxHp(3, false).toNumber())
    goToStage(s, 99)
    expect(s.combat.stage).toBe(5)
    goToStage(s, 0)
    expect(s.combat.stage).toBe(1)
  })
})

describe('hit events', () => {
  it('reports source, crit and boss-multiplied amount', () => {
    const hits: Hit[] = []
    setHitListener((h) => hits.push(h))
    try {
      const s = createInitialState()
      s.upgrades.levels = { criticalBite: 1, batSwarm: 1, ghoulServant: 1, boneArmor: 5 }
      bite(s, () => 0) // crit
      tick(s, 1) // ghoul 2 dmg + one bat bite
      expect(hits[0]).toMatchObject({ source: 'tap', crit: true })
      expect(hits[0].amount.toNumber()).toBe(5)
      expect(hits.map((h) => h.source)).toContain('ghoul')
      expect(hits.map((h) => h.source)).toContain('bat')
      // On the boss, Bone Armor (x2) shows in the number.
      s.combat.enemyIndex = COMBAT.enemiesPerStage
      spawn(s)
      bite(s, () => 0.99)
      expect(hits.at(-1)!.amount.toNumber()).toBe(2)
    } finally {
      setHitListener(null)
    }
  })
})

describe('currentDrops', () => {
  it('normal enemy: Blood only; boss: Blood + Bones, with multipliers', () => {
    const s = createInitialState()
    s.upgrades.levels = { bloodSiphon: 2, ossuary: 4 }
    expect(currentDrops(s).blood.toNumber()).toBeCloseTo(1.1)
    expect(currentDrops(s).bones.toNumber()).toBe(0)
    s.combat.enemyIndex = COMBAT.enemiesPerStage
    expect(currentDrops(s).bones.toNumber()).toBe(2)
  })
})
