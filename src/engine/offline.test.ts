import { describe, expect, it } from 'vitest'
import { formatDuration } from './format'
import { simulateOffline } from './offline'
import { createInitialState } from './state'

describe('offline', () => {
  it('nothing happens without automation', () => {
    const s = createInitialState()
    const r = simulateOffline(s, 600)
    expect(r.kills).toBe(0)
    expect(r.simulated).toBe(600)
  })

  it('caps at limit and reports gains', () => {
    const s = createInitialState()
    s.upgrades.levels = { ghoulServant: 10 }
    const r = simulateOffline(s, 10 * 3600)
    expect(r.away).toBe(10 * 3600)
    expect(r.simulated).toBe(2 * 3600)
    expect(r.kills).toBeGreaterThan(0)
    expect(r.blood.gt(0)).toBe(true)
    expect(r.stages).toBe(s.combat.stage - 1)
  })

  it('negative time is zero', () => {
    expect(simulateOffline(createInitialState(), -50).simulated).toBe(0)
  })
})

describe('formatDuration', () => {
  it('formats', () => {
    expect(formatDuration(45)).toBe('45s')
    expect(formatDuration(125)).toBe('2m 5s')
    expect(formatDuration(3600)).toBe('1h')
    expect(formatDuration(3725)).toBe('1h 2m')
  })
})
