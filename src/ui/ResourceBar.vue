<script setup lang="ts">
import { computed } from 'vue'
import { formatNumber } from '../engine'
import { frame, state } from './game'

const items = computed(() => {
  void frame.value
  const r = state.resources
  return [
    { name: 'Blood', value: formatNumber(r.blood) },
    { name: 'Bones', value: formatNumber(r.bones) },
    { name: 'Essence', value: formatNumber(r.essence) },
  ]
})
</script>

<template>
  <header class="resources">
    <span v-for="i in items" :key="i.name"><b>{{ i.name }}</b> {{ i.value }}</span>
  </header>
</template>

<style scoped>
.resources {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  padding: 8px 16px;
  border-bottom: 1px solid var(--line);
}
b {
  color: var(--muted);
  font-weight: 500;
}
</style>
