<script setup lang="ts">
import type { BuyMode } from '../engine'
import { buyMode } from './game'

const modes: { value: BuyMode; label: string }[] = [
  { value: 1, label: '×1' },
  { value: 10, label: '×10' },
  { value: 'max', label: 'Max' },
]
</script>

<template>
  <div class="modes" role="group" aria-label="Buy amount">
    <button
      v-for="m in modes"
      :key="m.label"
      :class="{ active: buyMode === m.value }"
      :aria-pressed="buyMode === m.value"
      @click="buyMode = m.value"
    >
      {{ m.label }}
    </button>
  </div>
</template>

<style scoped>
.modes {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}
.active {
  border-color: var(--blood);
}
</style>
