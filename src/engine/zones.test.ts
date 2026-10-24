import { describe, expect, it } from 'vitest'
import { COMBAT, zoneById } from '../data/combat'
import { PRESTIGE_LAYERS } from '../data/prestige'
import {
  autoDps,
  biteDamage,
  bloodDrop,
  currentDrops,
  dealDamage,
  enemyMaxHp,
  enemyName,
  goToStage,
  goToZone,
  setHitListener,
  setStage,
  wraithDps,
  zoneUnlocked,
  type Hit,
} from './combat'
import { D } from './decimal'
import { prestige } from './prestige'
import { createInitialState, type GameState } from './state'
import { tick } from './tick'

const graveyard = zoneById('graveyard')

function unlockGraveyard(s: GameState) {
  setStage(s, 51) // = boss of 50 beaten
}

describe('Graveyard', () => {
  it('locked until Village stage 50 boss is beaten', () => {
    const s = createInitialState()
    setStage(s, 50)
    expect(zoneUnlocked(s, graveyard)).toBe(false)
    expect(goToZone(s, 'graveyard')).toBe(false)
    expect(s.combat.zone).toBe('village')
    unlockGraveyard(s)
    expect(zoneUnlocked(s, graveyard)).toBe(true)
  })

  it('stage n plays like Village n+50 with x3 HP and Blood', () => {
    expect(enemyMaxHp(1, false, graveyard).toNumber()).toBeCloseTo(enemyMaxHp(51, false).toNumber() * 3)
    expect(bloodDrop(1, graveyard).toNumber()).toBeCloseTo(bloodDrop(51).toNumber() * 3)
  })

  it('each zone keeps its own stage progress', () => {
    const s = createInitialState()
    unlockGraveyard(s)
    goToStage(s, 40)
    expect(goToZone(s, 'graveyard')).toBe(true)
    expect(s.combat.stage).toBe(1)
    expect(s.combat.highestStage).toBe(1)
    expect(s.combat.enemyHp.toNumber()).toBeCloseTo(enemyMaxHp(1, false, graveyard).toNumber())
    setStage(s, 3)
    goToZone(s, 'village')
    expect(s.combat.stage).toBe(40)
    expect(s.combat.highestStage).toBe(51)
    goToZone(s, 'graveyard')
    expect(s.combat.stage).toBe(3)
    expect(s.stats.maxStage).toBe(51) // records count Village only
  })

  it('drops Souls (boss x10), names come from the zone', () => {
    const s = createInitialState()
    unlockGraveyard(s)
    goToZone(s, 'graveyard')
    expect(enemyName(s)).toBe('Skeleton')
    expect(currentDrops(s).souls.toNumber()).toBe(1)
    dealDamage(s, s.combat.enemyHp)
    expect(s.resources.souls.toNumber()).toBe(1)
    s.combat.enemyIndex = COMBAT.enemiesPerStage
    expect(currentDrops(s).souls.toNumber()).toBe(10)
    expect(currentDrops(s).bones.gt(0)).toBe(true)
  })

  it('Restless Spirit halves ghoul damage, not Wraith damage', () => {
    const s = createInitialState()
    s.upgrades.levels = { ghoulServant: 5, wraith: 4 }
    unlockGraveyard(s)
    goToZone(s, 'graveyard')
    s.combat.enemyIndex = 2 // (1 + 2) % 5 = 3 → Restless Spirit
    expect(enemyName(s)).toBe('Restless Spirit')
    const hits: Hit[] = []
    setHitListener((h) => hits.push(h))
    try {
      tick(s, 1)
    } finally {
      setHitListener(null)
    }
    const ghoul = hits.find((h) => h.source === 'ghoul')!
    const wraith = hits.find((h) => h.source === 'wraith')!
    expect(ghoul.amount.toNumber()).toBeCloseTo(autoDps(s).toNumber() / 2)
    expect(wraith.amount.toNumber()).toBeCloseTo(biteDamage(s).toNumber())
  })

  it('Soul Feast compounds; Wraith = 25% of Bite per level', () => {
    const s = createInitialState()
    s.upgrades.levels = { sharpFangs: 9, soulFeast: 2, wraith: 2 }
    expect(biteDamage(s).toNumber()).toBeCloseTo(10 * 1.21)
    expect(wraithDps(s).toNumber()).toBeCloseTo(10 * 1.21 * 0.5)
  })

  it('prestige returns to Village and wipes zone progress and Souls', () => {
    const s = createInitialState()
    unlockGraveyard(s)
    goToZone(s, 'graveyard')
    s.resources.souls = D(100)
    s.upgrades.levels = { soulFeast: 3 }
    s.stats.bloodEarnedRun = D(1e6)
    prestige(s, PRESTIGE_LAYERS[0])
    expect(s.combat.zone).toBe('village')
    expect(s.combat.zoneHighest).toEqual({})
    expect(zoneUnlocked(s, graveyard)).toBe(false)
    expect(s.resources.souls.toNumber()).toBe(0)
    expect(s.upgrades.levels.soulFeast).toBeUndefined()
  })
})
