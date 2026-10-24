import type { Resources } from '../engine/state'

/**
 * Stat an upgrade feeds. *Flat adds per level; *Mult adds +perLevel per level
 * to a multiplier starting at 1 (linear, e.g. 0.1 = +10%/level).
 */
export type UpgradeStat =
  | 'biteFlat'
  | 'biteMult'
  | 'dpsFlat'
  | 'dpsMult'
  | 'bloodMult'
  | 'critChance'
  | 'bossDmgMult'
  | 'bonesMult'
  | 'offlineHours'
  | 'autoBites'
  | 'startStage'
  | 'autoBuyBlood'
  | 'soulFeast'
  | 'wraithBiteShare'

export interface UpgradeDef {
  id: string
  name: string
  currency: keyof Resources
  base: number
  growth: number
  max?: number
  stat: UpgradeStat
  perLevel: number
  desc: string
  /** Listed on the Automation tab instead of Upgrades. */
  automation?: boolean
}

export const CRIT_MULT = 5

/** See design doc "Ulepszenia i automatyzacja". Cost(L) = base · growth^L */
export const UPGRADES: readonly UpgradeDef[] = [
  { id: 'sharpFangs', name: 'Sharp Fangs', currency: 'blood', base: 10, growth: 1.15, stat: 'biteFlat', perLevel: 1, desc: '+1 Bite dmg' },
  { id: 'bloodlust', name: 'Bloodlust', currency: 'blood', base: 100, growth: 1.25, stat: 'biteMult', perLevel: 0.1, desc: '+10% Bite dmg' },
  { id: 'ghoulServant', automation: true, name: 'Ghoul Servant', currency: 'blood', base: 50, growth: 1.15, stat: 'dpsFlat', perLevel: 2, desc: '+2 DPS' },
  { id: 'ghoulTraining', automation: true, name: 'Ghoul Training', currency: 'blood', base: 500, growth: 1.3, stat: 'dpsMult', perLevel: 0.15, desc: '+15% DPS' },
  { id: 'bloodSiphon', name: 'Blood Siphon', currency: 'blood', base: 250, growth: 1.4, stat: 'bloodMult', perLevel: 0.05, desc: '+5% Blood drop' },
  { id: 'criticalBite', name: 'Critical Bite', currency: 'blood', base: 1000, growth: 1.5, max: 25, stat: 'critChance', perLevel: 0.02, desc: `+2% crit chance (×${CRIT_MULT})` },
  { id: 'boneArmor', name: 'Bone Armor', currency: 'bones', base: 5, growth: 1.5, stat: 'bossDmgMult', perLevel: 0.2, desc: '+20% dmg vs boss' },
  { id: 'ossuary', name: 'Ossuary', currency: 'bones', base: 10, growth: 1.6, stat: 'bonesMult', perLevel: 0.25, desc: '+25% Bones from boss' },
  { id: 'nightEndurance', name: 'Night Endurance', currency: 'bones', base: 3, growth: 2, max: 22, stat: 'offlineHours', perLevel: 1, desc: '+1h offline limit' },
  { id: 'batSwarm', automation: true, name: 'Bat Swarm', currency: 'bones', base: 25, growth: 1.8, max: 10, stat: 'autoBites', perLevel: 1, desc: '+1 auto-bite/s' },
  { id: 'soulFeast', name: 'Soul Feast', currency: 'souls', base: 10, growth: 1.6, stat: 'soulFeast', perLevel: 0.1, desc: '×1.1 all damage (compounds)' },
  { id: 'wraith', automation: true, name: 'Wraith', currency: 'souls', base: 25, growth: 1.5, stat: 'wraithBiteShare', perLevel: 0.25, desc: 'DPS = +25% of Bite, ignores spirits' },
  { id: 'gravePact', name: 'Grave Pact', currency: 'souls', base: 15, growth: 1.5, stat: 'bonesMult', perLevel: 0.1, desc: '+10% Bones from boss' },
  { id: 'ectoplasm', automation: true, name: 'Ectoplasm', currency: 'souls', base: 50, growth: 2, max: 10, stat: 'autoBites', perLevel: 1, desc: '+1 auto-bite/s' },
  { id: 'headStart', name: 'Head Start', currency: 'essence', base: 3, growth: 1, max: 1, stat: 'startStage', perLevel: 4, desc: 'Start each run at stage 5' },
  { id: 'deepSleep', name: 'Deep Sleep', currency: 'essence', base: 2, growth: 1, max: 1, stat: 'offlineHours', perLevel: 1, desc: '+1h offline limit' },
  { id: 'bloodThrall', automation: true, name: 'Blood Thrall', currency: 'essence', base: 5, growth: 1, max: 1, stat: 'autoBuyBlood', perLevel: 1, desc: 'Auto-buys Blood upgrades' },
]

/** Upgrade appears once you first hold this fraction of its base cost. */
export const UNLOCK_FRACTION = 0.5
