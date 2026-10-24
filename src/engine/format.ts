import { D, type DecimalSource } from './decimal'

export type Notation = 'scientific' | 'suffix'

const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc']

// Truncate (not round) so 999,999 never shows as 1.00M; epsilon absorbs float noise.
const trunc = (x: number, digits: number) => {
  const f = 10 ** digits
  return (Math.floor(x * f + 1e-9) / f).toFixed(digits)
}

export function formatNumber(value: DecimalSource, notation: Notation = 'scientific'): string {
  const x = D(value)
  if (x.sign < 0) return '-' + formatNumber(x.neg(), notation)
  if (x.lt(1000)) {
    const n = x.toNumber()
    return Number.isInteger(n) ? String(n) : trunc(n, n < 10 ? 2 : 1).replace(/\.?0+$/, '')
  }
  const log = x.log10()
  // Exponent itself too big for a float-exact integer: format the exponent.
  if (log.gte(1e9)) return 'e' + formatNumber(log.floor(), notation)

  const e = Math.floor(log.toNumber() + 1e-12)
  if (notation === 'suffix') {
    const group = Math.floor(e / 3)
    if (group < SUFFIXES.length) {
      const m = x.div(D(10).pow(group * 3)).toNumber()
      const intDigits = e - group * 3 + 1
      return trunc(m, 3 - intDigits) + SUFFIXES[group]
    }
  }
  const m = x.div(D(10).pow(e)).toNumber()
  return `${trunc(m, 2)}e${e}`
}
