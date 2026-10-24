<script setup lang="ts">
import { computed } from 'vue'
import { formatDuration, formatNumber } from '../engine'
import { offlineReport } from './game'

const r = computed(() => {
  const o = offlineReport.value
  if (!o) return null
  return {
    away: formatDuration(o.away),
    capped: o.simulated < o.away ? formatDuration(o.simulated) : null,
    gains: [
      { name: 'Blood', value: formatNumber(o.blood) },
      { name: 'Bones', value: formatNumber(o.bones) },
      { name: 'Enemies slain', value: formatNumber(o.kills) },
      { name: 'Stages', value: formatNumber(o.stages) },
    ],
  }
})
</script>

<template>
  <div v-if="r" class="backdrop" @click.self="offlineReport = null">
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="offline-title">
      <h2 id="offline-title">While you slept...</h2>
      <p class="muted">
        Away for {{ r.away }}<template v-if="r.capped"> · counted {{ r.capped }} (limit)</template>
      </p>
      <dl>
        <template v-for="g in r.gains" :key="g.name">
          <dt>{{ g.name }}</dt>
          <dd>+{{ g.value }}</dd>
        </template>
      </dl>
      <button @click="offlineReport = null">Collect</button>
    </div>
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;
  inset: 0;
  background: rgb(0 0 0 / 0.7);
  display: grid;
  place-items: center;
  padding: 16px;
}
.modal {
  width: min(100%, 340px);
  background: var(--panel);
  border: 1px solid var(--blood);
  border-radius: 10px;
  padding: 20px;
}
h2 {
  margin: 0 0 4px;
}
.muted {
  color: var(--muted);
  font-size: 14px;
  margin: 0 0 12px;
}
dl {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 6px 12px;
  margin: 0 0 16px;
}
dd {
  margin: 0;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
button {
  width: 100%;
  font: inherit;
  color: inherit;
  background: var(--blood);
  border: 0;
  border-radius: 6px;
  padding: 10px;
  cursor: pointer;
}
</style>
