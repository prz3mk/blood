<script setup lang="ts">
import { computed } from 'vue'
import { UPGRADES } from '../data/upgrades'
import { buyCount, formatNumber, level, upgradeCost, type BuyMode } from '../engine'
import { buyMode, frame, playerBuy, state } from './game'

const modes: { value: BuyMode; label: string }[] = [
  { value: 1, label: '×1' },
  { value: 10, label: '×10' },
  { value: 'max', label: 'Max' },
]

const CURRENCIES = ['blood', 'bones', 'essence'] as const
const LABELS = { blood: 'Blood', bones: 'Bones', essence: 'Essence shop' }

const groups = computed(() => {
  void frame.value
  return CURRENCIES.map((currency) => ({
    currency,
    rows: rows(currency),
  })).filter((g) => g.rows.length)
})

function rows(currency: (typeof CURRENCIES)[number]) {
  return UPGRADES.filter((def) => def.currency === currency && state.upgrades.unlocked[def.id]).map((def) => {
    const owned = level(state, def.id)
    const maxed = def.max !== undefined && owned >= def.max
    const n = buyCount(state, def, buyMode.value)
    return {
      def,
      owned,
      maxed,
      n,
      // Unaffordable: show price of the next single level.
      cost: formatNumber(upgradeCost(def, owned, Math.max(n, 1))),
    }
  })
}
</script>

<template>
  <section class="panel">
    <div class="modes">
      <button
        v-for="m in modes"
        :key="m.label"
        :class="{ active: buyMode === m.value }"
        @click="buyMode = m.value"
      >
        {{ m.label }}
      </button>
    </div>
    <p v-if="!groups.length" class="empty">Collect Blood to discover upgrades.</p>
    <template v-for="g in groups" :key="g.currency">
      <h2>{{ LABELS[g.currency] }}</h2>
      <div v-for="r in g.rows" :key="r.def.id" class="row">
        <div class="info">
          <div>
            {{ r.def.name }} <span class="lvl">Lv {{ r.owned }}<template v-if="r.def.max"> / {{ r.def.max }}</template></span>
          </div>
          <div class="desc">{{ r.def.desc }}</div>
        </div>
        <button class="buy" :disabled="r.maxed || r.n === 0" @click="playerBuy(r.def)">
          <template v-if="r.maxed">Max</template>
          <template v-else>+{{ Math.max(r.n, 1) }} · {{ r.cost }} {{ r.def.currency }}</template>
        </button>
      </div>
    </template>
  </section>
</template>

<style scoped>
.panel {
  padding: 0 16px 16px;
  display: grid;
  gap: 8px;
  max-width: 560px;
  margin: 0 auto;
}
button {
  font: inherit;
  color: inherit;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 6px 10px;
  cursor: pointer;
}
button:disabled {
  opacity: 0.45;
  cursor: default;
}
h2 {
  margin: 8px 0 0;
  font-size: 13px;
  font-weight: 500;
  color: var(--muted);
}
.modes {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}
.modes .active {
  border-color: var(--blood);
}
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
.lvl,
.desc,
.empty {
  color: var(--muted);
  font-size: 13px;
}
.buy {
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.buy:not(:disabled) {
  border-color: var(--blood);
}
</style>
