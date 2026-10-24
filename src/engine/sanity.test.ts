import { describe, expect, it } from 'vitest'
import { GAME_NAME } from '../data/meta'

describe('setup', () => {
  it('runs tests', () => {
    expect(GAME_NAME).toBe('Blood')
  })
})
