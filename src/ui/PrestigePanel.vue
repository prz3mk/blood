<script setup lang="ts">
import { computed } from 'vue'
import { ESSENCE_DAMAGE_PER, PRESTIGE_LAYERS } from '../data/prestige'
import { formatNumber, level, prestigeReward } from '../engine'
import { frame, playerPrestige, state } from './game'

const layer = PRESTIGE_LAYERS[0]

const view = computed(() => {
  void frame.value
  const reward = prestigeReward(state, layer)
  const basis = state.stats[layer.basis]
  return {
    reward: formatNumber(reward),
    ready: reward.gte(1),
    progress: `${formatNumber(basis)} / ${formatNumber(layer.threshold)}`,
    pct: Math.min(100, basis.div(layer.threshold).toNumber() * 100),
    bonus: formatNumber(state.resources.essence.mul(ESSENCE_DAMAGE_PER * 100)),
    hasThrall: level(state, 'bloodThrall') > 0,
    // Only show once the player is close or has prestiged before.
    visible: basis.gte(layer.threshold / 10) || (state.stats.prestiges[layer.id] ?? 0) > 0,
  }
})

function confirmPrestige() {
  if (confirm(`${layer.name}? Blood, Bones, their upgrades and stage reset. You gain ${view.value.reward} Essence.`)) {
    playerPrestige(layer)
  }
}
</script>

<template>
  <section v-if="view.visible" class="panel">
    <h2>Prestige</h2>
    <div class="card">
      <div class="title">{{ layer.name }}</div>
      <div class="muted">Blood earned this run: {{ view.progress }}</div>
      <div class="bar"><span class="fill" :style="{ width: view.pct + '%' }" /></div>
      <div class="muted">Essence: +{{ view.bonus }}% damage (2% each, spending lowers it)</div>
      <label v-if="view.hasThrall" class="muted toggle">
        <input v-model="state.settings.autoBuyBlood" type="checkbox" @change="frame++" />
        Blood Thrall auto-buy
      </label>
      <button :disabled="!view.ready" @click="confirmPrestige">
        <template v-if="view.ready">Sleep · +{{ view.reward }} Essence</template>
        <template v-else>Needs {{ formatNumber(layer.threshold) }} Blood earned</template>
      </button>
    </div>
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
h2 {
  margin: 8px 0 0;
  font-size: 13px;
  font-weight: 500;
  color: var(--muted);
}
.card {
  display: grid;
  gap: 8px;
  padding: 12px;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 8px;
}
.title {
  font-size: 17px;
}
.muted {
  color: var(--muted);
  font-size: 13px;
}
.toggle {
  display: flex;
  gap: 6px;
  align-items: center;
}
.bar {
  height: 8px;
  background: var(--line);
  border-radius: 4px;
  overflow: hidden;
}
.fill {
  display: block;
  height: 100%;
  background: var(--blood);
}
button {
  font: inherit;
  color: inherit;
  background: var(--blood);
  border: 0;
  border-radius: 6px;
  padding: 10px;
  cursor: pointer;
}
button:disabled {
  background: var(--line);
  opacity: 0.7;
  cursor: default;
}
</style>
