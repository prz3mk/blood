import { OFFLINE } from '../data/offline'
import type { GameState } from './state'
import { statBonus } from './upgrades'

export const offlineLimitHours = (state: GameState): number =>
  OFFLINE.baseHours + statBonus(state, 'offlineHours')
