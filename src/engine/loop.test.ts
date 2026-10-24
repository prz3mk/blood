import { describe, expect, it, vi } from 'vitest'
import { createLoop } from './loop'
import { TICK_SECONDS } from './tick'

describe('createLoop', () => {
  it('runs fixed steps and carries remainder', () => {
    const step = vi.fn()
    const loop = createLoop({ step })
    loop.advance(0)
    expect(loop.advance(0.12)).toBe(2)
    expect(loop.advance(0.15)).toBe(1) // 0.02 + 0.03 carried
    expect(step).toHaveBeenCalledWith(TICK_SECONDS)
  })

  it('hands long gaps to onGap', () => {
    const step = vi.fn()
    const onGap = vi.fn()
    const loop = createLoop({ step, onGap, maxCatchUp: 1 })
    loop.advance(0)
    expect(loop.advance(30)).toBe(0)
    expect(onGap).toHaveBeenCalledWith(30)
    expect(step).not.toHaveBeenCalled()
  })

  it('20 ticks per simulated second', () => {
    let steps = 0
    const loop = createLoop({ step: () => steps++ })
    for (let t = 0; t <= 10; t += 1 / 60) loop.advance(t)
    expect(steps).toBeGreaterThanOrEqual(199)
    expect(steps).toBeLessThanOrEqual(200)
  })
})
