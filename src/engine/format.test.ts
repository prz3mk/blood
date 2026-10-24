import { describe, expect, it } from 'vitest'
import { D } from './decimal'
import { formatNumber } from './format'

describe('formatNumber', () => {
  it('small numbers plain', () => {
    expect(formatNumber(0)).toBe('0')
    expect(formatNumber(42)).toBe('42')
    expect(formatNumber(1.5)).toBe('1.5')
    expect(formatNumber(12.34)).toBe('12.3')
    expect(formatNumber(999)).toBe('999')
  })

  it('scientific', () => {
    expect(formatNumber(1000)).toBe('1.00e3')
    expect(formatNumber(1.5e6)).toBe('1.50e6')
    expect(formatNumber(999_999)).toBe('9.99e5')
    expect(formatNumber(1e100)).toBe('1.00e100')
    expect(formatNumber(D('1e1000'))).toBe('1.00e1000')
  })

  it('suffix', () => {
    expect(formatNumber(1500, 'suffix')).toBe('1.50K')
    expect(formatNumber(1.5e6, 'suffix')).toBe('1.50M')
    expect(formatNumber(15e6, 'suffix')).toBe('15.0M')
    expect(formatNumber(150e6, 'suffix')).toBe('150M')
    expect(formatNumber(999_999, 'suffix')).toBe('999K')
    expect(formatNumber(1e36, 'suffix')).toBe('1.00e36')
  })

  it('exact powers of ten never show 0.99 or 10.00', () => {
    for (let e = 3; e < 300; e++) {
      const s = formatNumber(D(10).pow(e))
      expect(s).toBe(`1.00e${e}`)
    }
  })

  it('huge and negative', () => {
    expect(formatNumber(D('ee12'))).toBe('e1.00e12')
    expect(formatNumber(-1500, 'suffix')).toBe('-1.50K')
  })
})
