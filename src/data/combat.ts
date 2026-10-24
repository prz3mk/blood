/**
 * See design doc "Zasoby i walka". Tuned in step 10 with src/balance
 * (npm run balance): Blood growth > HP growth so pushing stages pays off.
 */
export const COMBAT = {
  enemiesPerStage: 10,
  enemyHpBase: 10,
  enemyHpGrowth: 1.14,
  bloodBase: 1,
  bloodGrowth: 1.2,
  bossHpMult: 10,
  /** Bones = bonesBase + floor(stage / bonesEvery) */
  bossBonesBase: 1,
  bossBonesEvery: 5,
  baseBiteDamage: 1,
  /** Overkill chain limit per damage call; excess damage is dropped. */
  maxKillsPerHit: 100,
} as const

export interface Zone {
  id: string
  name: string
  enemies: readonly string[]
  boss: string
  /** Stage n here plays like stage n + stageOffset of the base formulas. */
  stageOffset: number
  hpMult: number
  bloodMult: number
  /** Souls per enemy at stage 1 (0 = none); boss gives bossSoulsMult×. */
  soulsBase: number
  /** Ghoul damage multiplier against this enemy (resist). */
  ghost?: { name: string; ghoulMult: number }
  /** Unlocked by beating the boss of `stage` in zone `zone` this run. */
  unlock?: { zone: string; stage: number }
}

export const SOULS = {
  growth: 1.15,
  bossMult: 10,
} as const

/** See design doc "Strefa 2 — Cmentarz". */
export const ZONES: readonly Zone[] = [
  {
    id: 'village',
    name: 'Village',
    enemies: ['Villager', 'Farmer', 'Drunkard', 'Watchman', 'Hunter'],
    boss: 'Village Priest',
    stageOffset: 0,
    hpMult: 1,
    bloodMult: 1,
    soulsBase: 0,
  },
  {
    id: 'graveyard',
    name: 'Graveyard',
    enemies: ['Gravedigger', 'Skeleton', 'Zombie', 'Restless Spirit', 'Grave Robber'],
    boss: 'Necromancer',
    stageOffset: 50,
    hpMult: 3,
    bloodMult: 3,
    soulsBase: 1,
    ghost: { name: 'Restless Spirit', ghoulMult: 0.5 },
    unlock: { zone: 'village', stage: 50 },
  },
]

export const zoneById = (id: string): Zone => ZONES.find((z) => z.id === id) ?? ZONES[0]
