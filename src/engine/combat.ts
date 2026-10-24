import { COMBAT, ZONES } from '../data/combat'
import { CRIT_MULT } from '../data/upgrades'
import { D, type Decimal } from './decimal'
import type { GameState } from './state'
import { statBonus } from './upgrades'

export const isBoss = (enemyIndex: number) => enemyIndex >= COMBAT.enemiesPerStage

export function enemyMaxHp(stage: number, boss: boolean): Decimal {
  const hp = D(COMBAT.enemyHpGrowth).pow(stage - 1).mul(COMBAT.enemyHpBase)
  return boss ? hp.mul(COMBAT.bossHpMult) : hp
}

export function bloodDrop(stage: number): Decimal {
  return D(COMBAT.bloodGrowth).pow(stage - 1).mul(COMBAT.bloodBase)
}

export function bonesDrop(stage: number): Decimal {
  return D(COMBAT.bossBonesBase + Math.floor(stage / COMBAT.bossBonesEvery))
}

export function enemyName(state: GameState): string {
  const zone = ZONES[0]
  const { stage, enemyIndex } = state.combat
  if (isBoss(enemyIndex)) return zone.boss
  return zone.enemies[(stage + enemyIndex) % zone.enemies.length]
}

export const biteDamage = (state: GameState): Decimal =>
  D(COMBAT.baseBiteDamage + statBonus(state, 'biteFlat')).mul(1 + statBonus(state, 'biteMult'))

export const autoDps = (state: GameState): Decimal =>
  D(statBonus(state, 'dpsFlat')).mul(1 + statBonus(state, 'dpsMult'))

export const critChance = (state: GameState): number => Math.min(1, statBonus(state, 'critChance'))

export const bloodMult = (state: GameState): number => 1 + statBonus(state, 'bloodMult')

function spawn(state: GameState): void {
  const c = state.combat
  c.enemyHp = enemyMaxHp(c.stage, isBoss(c.enemyIndex))
}

function kill(state: GameState): void {
  const c = state.combat
  const { resources: r, stats } = state
  const blood = bloodDrop(c.stage).mul(bloodMult(state))
  r.blood = r.blood.add(blood)
  stats.bloodEarnedRun = stats.bloodEarnedRun.add(blood)
  stats.bloodEarnedTotal = stats.bloodEarnedTotal.add(blood)
  stats.kills++

  if (isBoss(c.enemyIndex)) {
    r.bones = r.bones.add(bonesDrop(c.stage))
    stats.bossKills++
    c.stage++
    c.enemyIndex = 0
    stats.maxStage = Math.max(stats.maxStage, c.stage)
  } else {
    c.enemyIndex++
  }
  spawn(state)
}

/** Apply damage; overkill carries to following enemies. */
export function dealDamage(state: GameState, amount: Decimal): void {
  const c = state.combat
  let left = amount
  for (let kills = 0; left.gt(0) && kills < COMBAT.maxKillsPerHit; kills++) {
    if (left.lt(c.enemyHp)) {
      c.enemyHp = c.enemyHp.sub(left)
      return
    }
    left = left.sub(c.enemyHp)
    kill(state)
  }
}

export function bite(state: GameState, rng: () => number = Math.random): void {
  state.stats.clicks++
  let dmg = biteDamage(state)
  if (rng() < critChance(state)) {
    dmg = dmg.mul(CRIT_MULT)
    state.stats.crits++
  }
  dealDamage(state, dmg)
}
