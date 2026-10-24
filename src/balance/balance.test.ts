import { describe, expect, it } from 'vitest'
import { simulateRun, type BotProfile } from './sim'

/** Design target: first prestige in ~45 min (doc: MVP step 10). */
const PROFILES: BotProfile[] = [
  { name: 'active', clicksPerSecond: 4 },
  { name: 'casual', clicksPerSecond: 1 },
  { name: 'idle', clicksPerSecond: 0.2 },
]

const short = (l: Record<string, number>) =>
  Object.entries(l)
    .map(([k, v]) => `${k.replace(/[a-z]/g, '')}${v}`)
    .join(' ')

describe('balance: time to first prestige', () => {
  const results = Object.fromEntries(PROFILES.map((p) => [p.name, simulateRun(p)]))

  for (const p of PROFILES) {
    const r = results[p.name]
    console.log(`\n[${p.name}] ${p.clicksPerSecond} clicks/s → prestige at ${r.prestigeAt === null ? 'never (3h)' : (r.prestigeAt / 60).toFixed(1) + ' min'}`)
    for (const m of r.milestones) console.log(`  ${String(m.minute).padStart(5)}m  stage ${String(m.stage).padStart(3)}  earned ${m.bloodEarned}  ${short(m.levels)}`)
  }

  it('casual player reaches first prestige in 35–55 min', () => {
    const t = results.casual.prestigeAt
    expect(t).not.toBeNull()
    expect(t! / 60).toBeGreaterThanOrEqual(35)
    expect(t! / 60).toBeLessThanOrEqual(55)
  })

  it('active player is faster but not trivially (>= 15 min)', () => {
    expect(results.active.prestigeAt! / 60).toBeGreaterThanOrEqual(15)
  })

  it('idle player still gets there within 2h', () => {
    expect(results.idle.prestigeAt).not.toBeNull()
    expect(results.idle.prestigeAt! / 60).toBeLessThanOrEqual(120)
  })
})
