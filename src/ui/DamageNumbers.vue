<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import type { Decimal, Hit, HitSource } from '../engine'
import { fmt, onHit, state } from './game'

interface Floater {
  id: number
  text: string
  source: HitSource
  crit: boolean
  /** Start position, % of the enemy card. */
  x: number
  y: number
}

const MAX = 12
/** DPS sources tick 20×/s; show each as one number per second. */
const FLUSH_MS = 1000

const floaters = ref<Floater[]>([])
let nextId = 0
const sums: Partial<Record<HitSource, Decimal>> = {}

function add(source: HitSource, amount: Decimal, crit: boolean) {
  if (!state.settings.damageNumbers) return
  const x = 15 + Math.random() * 70
  // Ghouls below, bites above the name: sources don't collide.
  const y = source === 'ghoul' || source === 'wraith' ? 45 + Math.random() * 10 : 4 + Math.random() * 18
  const text = (crit ? 'CRIT ' : '') + fmt(amount)
  floaters.value = [...floaters.value.slice(-(MAX - 1)), { id: nextId++, text, source, crit, x, y }]
}

const remove = (id: number) => {
  floaters.value = floaters.value.filter((f) => f.id !== id)
}

const off = onHit((hit: Hit) => {
  if (hit.source === 'ghoul' || hit.source === 'wraith') {
    sums[hit.source] = sums[hit.source]?.add(hit.amount) ?? hit.amount
  } else add(hit.source, hit.amount, hit.crit)
})

const timer = setInterval(() => {
  for (const source of ['ghoul', 'wraith'] as const) {
    if (sums[source]?.gt(0)) add(source, sums[source], false)
    delete sums[source]
  }
}, FLUSH_MS)

onBeforeUnmount(() => {
  off()
  clearInterval(timer)
})
</script>

<template>
  <div class="layer" aria-hidden="true">
    <span
      v-for="f in floaters"
      :key="f.id"
      class="num"
      :class="[f.source, { crit: f.crit }]"
      :style="{ left: f.x + '%', top: f.y + '%' }"
      @animationend="remove(f.id)"
      >{{ f.text }}</span
    >
  </div>
</template>

<style scoped>
.layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: visible;
}
.num {
  position: absolute;
  transform: translateX(-50%);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  text-shadow:
    0 0 3px #000,
    0 1px 2px #000;
  animation: float 0.9s ease-out forwards;
}
.tap {
  color: var(--text);
  font-size: 16px;
}
.bat {
  color: #c4a3ff;
  font-size: 15px;
}
.ghoul {
  color: #8fcf9a;
  font-size: 13px;
}
.wraith {
  color: #9fd3ff;
  font-size: 13px;
}
.crit {
  color: #ff4d6a;
  font-size: 19px;
}
@keyframes float {
  from {
    opacity: 1;
    translate: 0 0;
  }
  to {
    opacity: 0;
    translate: 0 -48px;
  }
}
@media (prefers-reduced-motion: reduce) {
  @keyframes float {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }
}
</style>
