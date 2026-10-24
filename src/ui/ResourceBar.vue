<script setup lang="ts">
import { computed } from 'vue'
import { fmt, frame, rates, state } from './game'

const items = computed(() => {
  void frame.value
  const r = state.resources
  return [
    { name: 'Blood', value: fmt(r.blood), rate: rates.value.blood },
    { name: 'Bones', value: fmt(r.bones), rate: rates.value.bones },
    { name: 'Essence', value: fmt(r.essence), rate: null },
  ].map((i) => ({ ...i, rate: i.rate && i.rate.gt(0) ? `+${fmt(i.rate)}/s` : '' }))
})
</script>

<template>
  <header class="resources">
    <div v-for="i in items" :key="i.name" class="res">
      <span class="name">{{ i.name }}</span>
      <span class="value">{{ i.value }}</span>
      <span class="rate">{{ i.rate }}</span>
    </div>
  </header>
</template>

<style scoped>
.resources {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--line);
}
.res {
  display: grid;
  min-width: 0;
}
.name,
.rate {
  color: var(--muted);
  font-size: 12px;
}
.value {
  font-variant-numeric: tabular-nums;
  font-size: 17px;
}
.rate {
  min-height: 1.2em;
  font-variant-numeric: tabular-nums;
}
</style>
