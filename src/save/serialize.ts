import { compressToBase64, decompressFromBase64 } from 'lz-string'
import { D, Decimal } from '../engine/decimal'
import { createInitialState, type GameState } from '../engine/state'

export const SAVE_VERSION = 1

export interface SaveData {
  version: number
  /** Wall-clock ms (Date.now) at save. */
  savedAt: number
  state: unknown
}

type Json = Record<string, unknown>

/**
 * migrations[v] upgrades raw save data from version v to v+1.
 * Never edit an existing entry; append a new one and bump SAVE_VERSION.
 */
const migrations: Record<number, (data: Json) => Json> = {}

export function migrate(data: SaveData): SaveData {
  let d = data as unknown as Json
  for (let v = data.version; v < SAVE_VERSION; v++) {
    const m = migrations[v]
    if (m) d = m(d)
    d.version = v + 1
  }
  return d as unknown as SaveData
}

const isObj = (x: unknown): x is Json => typeof x === 'object' && x !== null && !Array.isArray(x)

/**
 * Overlay saved values onto a fresh default, using the default's shape for
 * types: Decimals revive from strings, missing fields keep defaults, unknown
 * fields drop. Empty default objects are records: copy primitive entries.
 */
function overlay<T>(def: T, saved: unknown): T {
  if (def instanceof Decimal) {
    try {
      const d = D(saved as string)
      return (Number.isNaN(d.mag) ? def : d) as T
    } catch {
      return def
    }
  }
  if (isObj(def)) {
    if (!isObj(saved)) return def
    const keys = Object.keys(def)
    if (keys.length === 0) {
      const out: Json = {}
      for (const [k, v] of Object.entries(saved)) {
        if (['number', 'boolean', 'string'].includes(typeof v)) out[k] = v
      }
      return out as T
    }
    const out: Json = {}
    for (const k of keys) out[k] = overlay(def[k], saved[k])
    return out as T
  }
  return (typeof saved === typeof def && !(typeof saved === 'number' && !Number.isFinite(saved)) ? saved : def) as T
}

export function toSaveData(state: GameState, now: number): SaveData {
  return { version: SAVE_VERSION, savedAt: now, state: JSON.parse(JSON.stringify(state)) }
}

export function fromSaveData(data: SaveData): { state: GameState; savedAt: number } {
  const migrated = migrate(data)
  return { state: overlay(createInitialState(), migrated.state), savedAt: migrated.savedAt }
}

export function encode(data: SaveData): string {
  return compressToBase64(JSON.stringify(data))
}

/** Throws on garbage input. */
export function decode(text: string): SaveData {
  const json = decompressFromBase64(text.trim())
  if (!json) throw new Error('Invalid save string')
  const data = JSON.parse(json)
  if (!isObj(data) || typeof data.version !== 'number' || typeof data.savedAt !== 'number') {
    throw new Error('Invalid save data')
  }
  if (data.version > SAVE_VERSION) throw new Error('Save is from a newer version')
  return data as unknown as SaveData
}
