import { COMBAT, ZONES } from '../data/combat'
import { ESSENCE_DAMAGE_PER } from '../data/prestige'
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

/** What the current enemy drops on death (with multipliers). */
export function currentDrops(state: GameState): { blood: Decimal; bones: Decimal } {
  const { stage, enemyIndex } = state.combat
  return {
    blood: bloodDrop(stage).mul(bloodMult(state)),
    bones: isBoss(enemyIndex) ? bonesDrop(stage).mul(bonesMult(state)) : D(0),
  }
}

export function enemyName(state: GameState): string {
  const zone = ZONES[0]
  const { stage, enemyIndex } = state.combat
  if (isBoss(enemyIndex)) return zone.boss
  return zone.enemies[(stage + enemyIndex) % zone.enemies.length]
}

/** Applies to all damage. */
export const essenceDamageMult = (state: GameState): Decimal =>
  state.resources.essence.mul(ESSENCE_DAMAGE_PER).add(1)

export const biteDamage = (state: GameState): Decimal =>
  D(COMBAT.baseBiteDamage + statBonus(state, 'biteFlat'))
    .mul(1 + statBonus(state, 'biteMult'))
    .mul(essenceDamageMult(state))

export const autoDps = (state: GameState): Decimal =>
  D(statBonus(state, 'dpsFlat'))
    .mul(1 + statBonus(state, 'dpsMult'))
    .mul(essenceDamageMult(state))

export const critChance = (state: GameState): number => Math.min(1, statBonus(state, 'critChance'))

export const bloodMult = (state: GameState): number => 1 + statBonus(state, 'bloodMult')

export const bonesMult = (state: GameState): number => 1 + statBonus(state, 'bonesMult')

export const bossDmgMult = (state: GameState): number => 1 + statBonus(state, 'bossDmgMult')

export const autoBitesPerSecond = (state: GameState): number => statBonus(state, 'autoBites')

export type HitSource = 'tap' | 'bat' | 'ghoul'

/** Damage as it lands on the current enemy (boss multiplier included). */
export interface Hit {
  source: HitSource
  amount: Decimal
  crit: boolean
}

// UI hook for damage numbers; null (e.g. during offline sim) = no events.
let hitListener: ((hit: Hit) => void) | null = null

export function setHitListener(fn: ((hit: Hit) => void) | null): void {
  hitListener = fn
}

function emitHit(state: GameState, source: HitSource, raw: Decimal, crit: boolean): void {
  if (!hitListener) return
  const mult = isBoss(state.combat.enemyIndex) ? bossDmgMult(state) : 1
  hitListener({ source, amount: raw.mul(mult), crit })
}

export function spawn(state: GameState): void {
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
    const bones = bonesDrop(c.stage).mul(bonesMult(state))
    r.bones = r.bones.add(bones)
    stats.bonesEarnedTotal = stats.bonesEarnedTotal.add(bones)
    stats.bossKills++
    c.highestStage = Math.max(c.highestStage, c.stage + 1)
    stats.maxStage = Math.max(stats.maxStage, c.highestStage)
    if (state.settings.autoAdvance) c.stage++
    c.enemyIndex = 0
  } else {
    c.enemyIndex++
  }
  spawn(state)
}

/** Player travel: first enemy of any unlocked stage (1..highestStage). */
export function goToStage(state: GameState, stage: number): void {
  const c = state.combat
  c.stage = Math.min(c.highestStage, Math.max(1, Math.floor(stage)))
  c.enemyIndex = 0
  spawn(state)
}

/** Dev tool: jump anywhere, unlocking it. */
export function setStage(state: GameState, stage: number): void {
  const c = state.combat
  c.highestStage = Math.max(c.highestStage, Math.floor(stage))
  state.stats.maxStage = Math.max(state.stats.maxStage, c.highestStage)
  goToStage(state, stage)
}

/**
 * Apply raw damage; overkill carries to following enemies. Boss multiplier
 * applies only to the part spent on a boss.
 */
export function dealDamage(state: GameState, amount: Decimal): void {
  const c = state.combat
  let left = amount
  for (let kills = 0; left.gt(0) && kills < COMBAT.maxKillsPerHit; kills++) {
    const mult = isBoss(c.enemyIndex) ? bossDmgMult(state) : 1
    const effective = left.mul(mult)
    if (effective.lt(c.enemyHp)) {
      c.enemyHp = c.enemyHp.sub(effective)
      return
    }
    left = effective.sub(c.enemyHp).div(mult)
    kill(state)
  }
}

export function bite(state: GameState, rng: () => number = Math.random): void {
  state.stats.clicks++
  let dmg = biteDamage(state)
  const crit = rng() < critChance(state)
  if (crit) {
    dmg = dmg.mul(CRIT_MULT)
    state.stats.crits++
  }
  emitHit(state, 'tap', dmg, crit)
  dealDamage(state, dmg)
}

/** Ghoul DPS for one tick. */
export function ghoulAttack(state: GameState, dmg: Decimal): void {
  emitHit(state, 'ghoul', dmg, false)
  dealDamage(state, dmg)
}

/**
 * n Bat Swarm bites as one hit. A single bite rolls crit; batches (offline
 * chunks) use expected crit damage to stay cheap.
 */
export function autoBite(state: GameState, n: number, rng: () => number = Math.random): void {
  if (n <= 0) return
  state.stats.autoBites += n
  const chance = critChance(state)
  let mult: number
  let crit = false
  if (n === 1) {
    crit = rng() < chance
    if (crit) state.stats.crits++
    mult = crit ? CRIT_MULT : 1
  } else {
    state.stats.crits += Math.round(n * chance)
    mult = n * (1 + chance * (CRIT_MULT - 1))
  }
  const dmg = biteDamage(state).mul(mult)
  emitHit(state, 'bat', dmg, crit)
  dealDamage(state, dmg)
}
