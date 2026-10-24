import { COMBAT, ZONES } from '../data/combat'
import { D, type Decimal } from './decimal'
import type { GameState } from './state'

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

// Upgrades (step 4) plug in here.
export const biteDamage = (_state: GameState): Decimal => D(COMBAT.baseBiteDamage)
export const autoDps = (_state: GameState): Decimal => D(0)

function spawn(state: GameState): void {
  const c = state.combat
  c.enemyHp = enemyMaxHp(c.stage, isBoss(c.enemyIndex))
}

function kill(state: GameState): void {
  const c = state.combat
  const { resources: r, stats } = state
  const blood = bloodDrop(c.stage)
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

export function bite(state: GameState): void {
  state.stats.clicks++
  dealDamage(state, biteDamage(state))
}
