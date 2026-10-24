import type { GameState } from '../engine/state'
import { decode, encode, fromSaveData, toSaveData } from './serialize'

const KEY = 'blood-save'

export function saveLocal(state: GameState, now = Date.now()): void {
  try {
    localStorage.setItem(KEY, encode(toSaveData(state, now)))
  } catch {
    // Storage full or blocked: nothing to do; next autosave retries.
  }
}

export function loadLocal(): { state: GameState; savedAt: number } | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? fromSaveData(decode(raw)) : null
  } catch {
    return null
  }
}

export function clearLocal(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}

export const exportSave = (state: GameState): string => encode(toSaveData(state, Date.now()))

/** Throws with a readable message on bad input. */
export const importSave = (text: string) => fromSaveData(decode(text))
