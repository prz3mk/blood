<script setup lang="ts">
import { ref } from 'vue'
import { PRESTIGE_LAYERS } from '../data/prestige'
import { prestigeReward } from '../engine'
import {
  devAdd,
  devForcePrestige,
  devOffline,
  devSetStage,
  fmt,
  frame,
  hardReset,
  state,
  timeScale,
} from './game'

const open = ref(false)
const speeds = [1, 2, 5, 10, 25, 100]
const amounts = ['1e3', '1e6', '1e9']
const resources = ['blood', 'bones', 'essence'] as const
const stage = ref(10)
const hours = ref(2)
const layer = PRESTIGE_LAYERS[0]

function reset() {
  if (confirm('Dev: wipe all progress?')) hardReset()
}
</script>

<template>
  <button class="toggle" :class="{ on: open }" aria-label="Dev panel" @click="open = !open">DEV</button>
  <aside v-if="open" class="dev" aria-label="Dev panel">
    <div class="row">
      <span class="label">Speed</span>
      <button v-for="x in speeds" :key="x" :class="{ active: timeScale === x }" @click="timeScale = x">×{{ x }}</button>
    </div>
    <div v-for="r in resources" :key="r" class="row">
      <span class="label">{{ r }}</span>
      <button v-for="a in amounts" :key="a" @click="devAdd(r, a)">+{{ a }}</button>
    </div>
    <form class="row" @submit.prevent="devSetStage(stage)">
      <span class="label">Stage</span>
      <input v-model.number="stage" type="number" min="1" />
      <button>Go</button>
    </form>
    <form class="row" @submit.prevent="devOffline(hours)">
      <span class="label">Offline (h)</span>
      <input v-model.number="hours" type="number" min="0" step="0.5" />
      <button>Simulate</button>
    </form>
    <div class="row">
      <span class="label">Prestige</span>
      <button @click="devForcePrestige(layer)">
        Force ({{ (frame, fmt(prestigeReward(state, layer))) }} Essence)
      </button>
      <button class="danger" @click="reset">Reset</button>
    </div>
  </aside>
</template>

<style scoped>
.toggle {
  position: fixed;
  right: 8px;
  bottom: calc(var(--tabbar-h) + 8px + env(safe-area-inset-bottom));
  z-index: 10;
  font: 600 11px ui-monospace, monospace;
  padding: 4px 8px;
  background: #1f3a1f;
  border-color: #3f7a3f;
  opacity: 0.8;
}
.toggle.on {
  opacity: 1;
}
@media (min-width: 800px) {
  .toggle {
    bottom: 8px;
  }
}
.dev {
  position: fixed;
  right: 8px;
  bottom: calc(var(--tabbar-h) + 44px + env(safe-area-inset-bottom));
  z-index: 10;
  box-sizing: border-box;
  width: min(calc(100vw - 16px), 380px);
  max-height: 60vh;
  overflow: auto;
  display: grid;
  gap: 6px;
  padding: 10px;
  background: #101810;
  border: 1px solid #3f7a3f;
  border-radius: 8px;
  font-size: 13px;
}
@media (min-width: 800px) {
  .dev {
    bottom: 44px;
  }
}
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}
.label {
  width: 72px;
  color: var(--muted);
  text-transform: capitalize;
}
button {
  font-size: 12px;
  padding: 4px 8px;
}
.active {
  border-color: #3f7a3f;
  background: #1f3a1f;
}
input {
  width: 72px;
  font: inherit;
  color: inherit;
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 4px 6px;
}
</style>
