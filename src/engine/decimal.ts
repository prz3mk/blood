import Decimal, { type DecimalSource } from 'break_eternity.js'

export { Decimal, type DecimalSource }

export const D = (x: DecimalSource): Decimal => Decimal.fromValue_noAlloc(x)
