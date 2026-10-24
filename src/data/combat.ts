/** Starting balance assumptions; see design doc "Zasoby i walka". */
export const COMBAT = {
  enemiesPerStage: 10,
  enemyHpBase: 10,
  enemyHpGrowth: 1.18,
  bloodBase: 1,
  bloodGrowth: 1.15,
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
}

export const ZONES: readonly Zone[] = [
  {
    id: 'village',
    name: 'Village',
    enemies: ['Villager', 'Farmer', 'Drunkard', 'Watchman', 'Hunter'],
    boss: 'Village Priest',
  },
]
