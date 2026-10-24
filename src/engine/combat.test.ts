import { describe, expect, it } from 'vitest'
import { COMBAT } from '../data/combat'
import { bite, bloodDrop, bonesDrop, dealDamage, enemyMaxHp, goToStage } from './combat'
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
