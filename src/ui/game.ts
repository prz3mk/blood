import { markRaw, ref } from 'vue'
import type { UpgradeDef } from '../data/upgrades'
import {
  bite,
  buyUpgrade,
  createInitialState,
  createLoop,
  tick,
  TICK_SECONDS,
  type BuyMode,
} from '../engine'

const UI_REFRESH_MS = 100

// Engine state stays non-reactive; UI re-reads it when `frame` bumps.
export const state = markRaw(createInitialState())
export const frame = ref(0)

const loop = createLoop({
  step: (dt) => tick(state, dt),
  // TODO(step 6): simulate as offline progress.
  onGap: () => {},
})

let started = false

export function startGame(): void {
  if (started) return
  started = true
  const now = () => performance.now() / 1000
  loop.advance(now())
  setInterval(() => loop.advance(now()), TICK_SECONDS * 1000)
  setInterval(() => frame.value++, UI_REFRESH_MS)
}

export function playerBite(): void {
  bite(state)
  frame.value++
}

export const buyMode = ref<BuyMode>(1)

export function playerBuy(def: UpgradeDef): void {
  if (buyUpgrade(state, def, buyMode.value) > 0) frame.value++
}
