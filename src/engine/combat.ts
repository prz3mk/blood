import { COMBAT, SOULS, zoneById, ZONES, type Zone } from '../data/combat'
import { ESSENCE_DAMAGE_PER } from '../data/prestige'
import { CRIT_MULT } from '../data/upgrades'
import { D, type Decimal } from './decimal'
import type { GameState } from './state'
import { statBonus, statCompound } from './upgrades'

export const isBoss = (enemyIndex: number) => enemyIndex >= COMBAT.enemiesPerStage

const VILLAGE = ZONES[0]

export const currentZone = (state: GameState): Zone => zoneById(state.combat.zone)

export function enemyMaxHp(stage: number, boss: boolean, zone: Zone = VILLAGE): Decimal {
  const n = stage + zone.stageOffset
  const hp = D(COMBAT.enemyHpGrowth).pow(n - 1).mul(COMBAT.enemyHpBase * zone.hpMult)
  return boss ? hp.mul(COMBAT.bossHpMult) : hp
}

export function bloodDrop(stage: number, zone: Zone = VILLAGE): Decimal {
  const n = stage + zone.stageOffset
  return D(COMBAT.bloodGrowth).pow(n - 1).mul(COMBAT.bloodBase * zone.bloodMult)
}

export function bonesDrop(stage: number, zone: Zone = VILLAGE): Decimal {
  const n = stage + zone.stageOffset
  return D(COMBAT.bossBonesBase + Math.floor(n / COMBAT.bossBonesEvery))
}

export function soulsDrop(stage: number, boss: boolean, zone: Zone): Decimal {
  if (!zone.soulsBase) return D(0)
  const souls = D(SOULS.growth).pow(stage - 1).mul(zone.soulsBase)
  return boss ? souls.mul(SOULS.bossMult) : souls
}

/** What the current enemy drops on death (with multipliers). */
export function currentDrops(state: GameState): { blood: Decimal; bones: Decimal; souls: Decimal } {
  const { stage, enemyIndex } = state.combat
  const zone = currentZone(state)
  const boss = isBoss(enemyIndex)
  return {
    blood: bloodDrop(stage, zone).mul(bloodMult(state)),
    bones: boss ? bonesDrop(stage, zone).mul(bonesMult(state)) : D(0),
    souls: soulsDrop(stage, boss, zone),
  }
}

export function enemyName(state: GameState): string {
  const zone = currentZone(state)
  const { stage, enemyIndex } = state.combat
  if (isBoss(enemyIndex)) return zone.boss
  return zone.enemies[(stage + enemyIndex) % zone.enemies.length]
}

/** Current enemy resists ghouls (Graveyard spirits). */
export function ghoulMultVsCurrent(state: GameState): number {
  const ghost = currentZone(state).ghost
  return ghost && enemyName(state) === ghost.name ? ghost.ghoulMult : 1
}

/** Applies to all damage: Essence (additive per Essence) × Soul Feast (compound). */
export const allDamageMult = (state: GameState): Decimal =>
  state.resources.essence
    .mul(ESSENCE_DAMAGE_PER)
    .add(1)
    .mul(statCompound(state, 'soulFeast'))

export const biteDamage = (state: GameState): Decimal =>
  D(COMBAT.baseBiteDamage + statBonus(state, 'biteFlat'))
    .mul(1 + statBonus(state, 'biteMult'))
    .mul(allDamageMult(state))

/** Ghoul DPS (resisted by spirits). */
export const autoDps = (state: GameState): Decimal =>
  D(statBonus(state, 'dpsFlat'))
    .mul(1 + statBonus(state, 'dpsMult'))
    .mul(allDamageMult(state))

/** Wraith DPS: a share of Bite damage; ignores spirit resistance. */
export const wraithDps = (state: GameState): Decimal => biteDamage(state).mul(statBonus(state, 'wraithBiteShare'))

export const critChance = (state: GameState): number => Math.min(1, statBonus(state, 'critChance'))

export const bloodMult = (state: GameState): number => 1 + statBonus(state, 'bloodMult')

export const bonesMult = (state: GameState): number => 1 + statBonus(state, 'bonesMult')

export const bossDmgMult = (state: GameState): number => 1 + statBonus(state, 'bossDmgMult')

export const autoBitesPerSecond = (state: GameState): number => statBonus(state, 'autoBites')

export type HitSource = 'tap' | 'bat' | 'ghoul' | 'wraith'

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
  c.enemyHp = enemyMaxHp(c.stage, isBoss(c.enemyIndex), currentZone(state))
}

function kill(state: GameState): void {
  const c = state.combat
  const { resources: r, stats } = state
  const drops = currentDrops(state)
  const blood = drops.blood
  r.blood = r.blood.add(blood)
  stats.bloodEarnedRun = stats.bloodEarnedRun.add(blood)
  stats.bloodEarnedTotal = stats.bloodEarnedTotal.add(blood)
  stats.kills++
  if (drops.souls.gt(0)) {
    r.souls = r.souls.add(drops.souls)
    stats.soulsEarnedTotal = stats.soulsEarnedTotal.add(drops.souls)
  }

  if (isBoss(c.enemyIndex)) {
    const bones = drops.bones
    r.bones = r.bones.add(bones)
    stats.bonesEarnedTotal = stats.bonesEarnedTotal.add(bones)
    stats.bossKills++
    c.highestStage = Math.max(c.highestStage, c.stage + 1)
    if (c.zone === VILLAGE.id) stats.maxStage = Math.max(stats.maxStage, c.highestStage)
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

/** Dev tool: jump anywhere in the current zone, unlocking it. */
export function setStage(state: GameState, stage: number): void {
  const c = state.combat
  c.highestStage = Math.max(c.highestStage, Math.floor(stage))
  if (c.zone === VILLAGE.id) state.stats.maxStage = Math.max(state.stats.maxStage, c.highestStage)
  goToStage(state, stage)
}

/** Highest unlocked stage of a zone this run (1 if never visited). */
export function zoneHighest(state: GameState, zoneId: string): number {
  const c = state.combat
  return zoneId === c.zone ? c.highestStage : (c.zoneHighest[zoneId] ?? 1)
}

export function zoneUnlocked(state: GameState, zone: Zone): boolean {
  if (!zone.unlock) return true
  // Beating the boss of stage s unlocks s + 1.
  return zoneHighest(state, zone.unlock.zone) > zone.unlock.stage
}

/** Switch zone, remembering each zone's stage progress. */
export function goToZone(state: GameState, zoneId: string): boolean {
  const c = state.combat
  const zone = zoneById(zoneId)
  if (zone.id === c.zone || !zoneUnlocked(state, zone)) return false
  c.zoneStage[c.zone] = c.stage
  c.zoneHighest[c.zone] = c.highestStage
  c.zone = zone.id
  c.highestStage = c.zoneHighest[zone.id] ?? 1
  c.stage = c.zoneStage[zone.id] ?? 1
  c.enemyIndex = 0
  spawn(state)
  return true
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

/** Ghoul DPS for one tick. Resist uses the enemy hit first (overkill isn't re-checked). */
export function ghoulAttack(state: GameState, dmg: Decimal): void {
  const hit = dmg.mul(ghoulMultVsCurrent(state))
  emitHit(state, 'ghoul', hit, false)
  dealDamage(state, hit)
}

/** Wraith DPS for one tick. */
export function wraithAttack(state: GameState, dmg: Decimal): void {
  emitHit(state, 'wraith', dmg, false)
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
