import { describe, expect, it } from 'vitest'
import { D } from '../engine/decimal'
import { createInitialState } from '../engine/state'
import { decode, encode, fromSaveData, SAVE_VERSION, toSaveData } from './serialize'

describe('save', () => {
  it('round-trips state including big Decimals and records', () => {
    const s = createInitialState()
    s.resources.blood = D('1e500')
    s.combat.stage = 42
    s.upgrades.levels = { sharpFangs: 7 }
    s.upgrades.unlocked = { sharpFangs: true }
    const text = encode(toSaveData(s, 1234))
    const { state, savedAt } = fromSaveData(decode(text))
    expect(savedAt).toBe(1234)
    expect(state.resources.blood.eq(D('1e500'))).toBe(true)
    expect(state.combat.stage).toBe(42)
    expect(state.upgrades.levels).toEqual({ sharpFangs: 7 })
    expect(state.upgrades.unlocked).toEqual({ sharpFangs: true })
  })

  it('fills missing fields with defaults, drops unknown and bad types', () => {
    const { state } = fromSaveData({
      version: SAVE_VERSION,
      savedAt: 0,
      state: { resources: { blood: '5', junk: 1 }, combat: { stage: 'x' }, stats: { kills: NaN } },
    })
    expect(state.resources.blood.toNumber()).toBe(5)
    expect(state.resources.bones.toNumber()).toBe(0)
    expect(state.combat.stage).toBe(1)
    expect(state.stats.kills).toBe(0)
    expect('junk' in state.resources).toBe(false)
  })

  it('migrates v1: stages up to current one count as unlocked', () => {
    const { state } = fromSaveData({ version: 1, savedAt: 0, state: { combat: { stage: 33 } } })
    expect(state.combat.stage).toBe(33)
    expect(state.combat.highestStage).toBe(33)
    expect(state.settings.autoAdvance).toBe(true)
  })

  it('rejects garbage and newer versions', () => {
    expect(() => decode('not a save')).toThrow()
    expect(() => decode(encode({ version: SAVE_VERSION + 1, savedAt: 0, state: {} }))).toThrow(/newer/)
  })
})
