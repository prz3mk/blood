<script setup lang="ts">
import { computed } from 'vue'
import type { UpgradeDef } from '../data/upgrades'
import { buyCount, level, upgradeCost } from '../engine'
import { buyMode, fmt, frame, playerBuy, state } from './game'

const props = defineProps<{ title: string; defs: readonly UpgradeDef[] }>()

const rows = computed(() => {
  void frame.value
  return props.defs
    .filter((def) => state.upgrades.unlocked[def.id])
    .map((def) => {
      const owned = level(state, def.id)
      const maxed = def.max !== undefined && owned >= def.max
      const n = buyCount(state, def, buyMode.value)
      return {
        def,
        owned,
        maxed,
        n,
        // Unaffordable: show price of the next single level.
        cost: fmt(upgradeCost(def, owned, Math.max(n, 1))),
      }
    })
})
</script>

<template>
  <template v-if="rows.length">
    <h2 class="section-title">{{ title }}</h2>
    <div v-for="r in rows" :key="r.def.id" class="row">
      <div class="info">
        <div>
          {{ r.def.name }}
          <span class="muted">Lv {{ r.owned }}<template v-if="r.def.max"> / {{ r.def.max }}</template></span>
        </div>
        <div class="muted">{{ r.def.desc }}</div>
      </div>
      <button class="buy" :disabled="r.maxed || r.n === 0" @click="playerBuy(r.def)">
        <template v-if="r.maxed">Max</template>
        <template v-else>+{{ Math.max(r.n, 1) }} · {{ r.cost }} {{ r.def.currency }}</template>
      </button>
    </div>
  </template>
</template>

<style scoped>
.row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
}
.info {
  flex: 1;
  min-width: 0;
}
.buy {
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.buy:not(:disabled) {
  border-color: var(--blood);
}
</style>
