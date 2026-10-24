import { markRaw, ref, shallowRef } from 'vue'
import { AUTOSAVE_SECONDS, OFFLINE } from '../data/offline'
import type { PrestigeLayer } from '../data/prestige'
import type { UpgradeDef } from '../data/upgrades'
import {
  bite,
  buyUpgrade,
  createInitialState,
  createLoop,
  D,
  formatNumber,
  prestige,
  simulateOffline,
  tick,
  TICK_SECONDS,
  type BuyMode,
  type Decimal,
  type DecimalSource,
  type GameState,
  type OfflineReport,
} from '../engine'
import { clearLocal, exportSave, importSave, loadLocal, saveLocal } from '../save'

const UI_REFRESH_MS = 100
/** Loop gaps above this (s) go through offline simulation (background tab). */
const MAX_CATCH_UP = 5
/** Income rates average over this window. */
const RATE_WINDOW_S = 10

// Engine state stays non-reactive; UI re-reads it when `frame` bumps.
export const state = markRaw(createInitialState())
export const frame = ref(0)
export const offlineReport = shallowRef<OfflineReport | null>(null)

export type Tab = 'combat' | 'upgrades' | 'automation' | 'prestige' | 'settings'
export const activeTab = ref<Tab>('upgrades')

/** Format using the player's notation setting. */
export const fmt = (x: DecimalSource): string => formatNumber(x, state.settings.notation)

// Income per second from lifetime-earned counters (spending doesn't skew it).
type Sample = { t: number; blood: Decimal; bones: Decimal }
let samples: Sample[] = []
export const rates = shallowRef({ blood: D(0), bones: D(0) })

function sampleRates(): void {
  const t = performance.now() / 1000
  samples.push({ t, blood: state.stats.bloodEarnedTotal, bones: state.stats.bonesEarnedTotal })
  while (samples.length > 1 && t - samples[0].t > RATE_WINDOW_S) samples.shift()
  const first = samples[0]
  const dt = t - first.t
  if (dt <= 0) return
  rates.value = {
    blood: state.stats.bloodEarnedTotal.sub(first.blood).div(dt),
    bones: state.stats.bonesEarnedTotal.sub(first.bones).div(dt),
  }
}

function replaceState(next: GameState): void {
  Object.assign(state, next)
  samples = []
  rates.value = { blood: D(0), bones: D(0) }
  frame.value++
}

function runOffline(seconds: number): void {
  const report = simulateOffline(state, seconds)
  if (report.away >= OFFLINE.reportMinSeconds) offlineReport.value = report
  samples = []
  frame.value++
}

const loop = createLoop({
  step: (dt) => tick(state, dt),
  maxCatchUp: MAX_CATCH_UP,
  onGap: runOffline,
})

export const save = () => saveLocal(state)

let started = false

export function startGame(): void {
  if (started) return
  started = true

  const loaded = loadLocal()
  if (loaded) {
    replaceState(loaded.state)
    runOffline((Date.now() - loaded.savedAt) / 1000)
  }

  const now = () => performance.now() / 1000
  loop.advance(now())
  setInterval(() => loop.advance(now()), TICK_SECONDS * 1000)
  setInterval(() => frame.value++, UI_REFRESH_MS)
  setInterval(sampleRates, 1000)
  setInterval(save, AUTOSAVE_SECONDS * 1000)
  // pagehide covers mobile where beforeunload often doesn't fire.
  addEventListener('pagehide', save)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') save()
  })
}

export function playerBite(): void {
  bite(state)
  frame.value++
}

export const buyMode = ref<BuyMode>(1)

export function playerBuy(def: UpgradeDef): void {
  if (buyUpgrade(state, def, buyMode.value) > 0) frame.value++
}

export function playerPrestige(layer: PrestigeLayer): void {
  if (prestige(state, layer).gt(0)) {
    loop.reset()
    save()
    frame.value++
  }
}

export const exportGame = (): string => exportSave(state)

/** Throws on invalid input. Imported save's offline time is not granted. */
export function importGame(text: string): void {
  replaceState(importSave(text).state)
  loop.reset()
  save()
}

export function hardReset(): void {
  clearLocal()
  replaceState(createInitialState())
  loop.reset()
  save()
}
