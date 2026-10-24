<script setup lang="ts">
import { computed } from 'vue'
import { ESSENCE_DAMAGE_PER, PRESTIGE_LAYERS } from '../../data/prestige'
import { UPGRADES } from '../../data/upgrades'
import { prestigeReward } from '../../engine'
import BuyModeToggle from '../BuyModeToggle.vue'
import { fmt, frame, playerPrestige, state } from '../game'
import UpgradeList from '../UpgradeList.vue'

const layer = PRESTIGE_LAYERS[0]
const shop = UPGRADES.filter((d) => d.currency === 'essence' && !d.automation)

const view = computed(() => {
  void frame.value
  const reward = prestigeReward(state, layer)
  const basis = state.stats[layer.basis]
  return {
    reward: fmt(reward),
    ready: reward.gte(1),
    progress: `${fmt(basis)} / ${fmt(layer.threshold)}`,
    pct: Math.min(100, basis.div(layer.threshold).toNumber() * 100),
    bonus: fmt(state.resources.essence.mul(ESSENCE_DAMAGE_PER * 100)),
    count: state.stats.prestiges[layer.id] ?? 0,
    threshold: fmt(layer.threshold),
  }
})

function confirmPrestige() {
  if (confirm(`${layer.name}? Blood, Bones, their upgrades and stage reset. You gain ${view.value.reward} Essence.`)) {
    playerPrestige(layer)
  }
}
</script>

<template>
  <div class="tab-body">
    <div class="card">
      <div class="title">{{ layer.name }}</div>
      <div class="muted">Blood earned this run: {{ view.progress }}</div>
      <span class="bar"><span class="fill" :style="{ width: view.pct + '%' }" /></span>
      <div class="muted">
        Resets Blood, Bones, their upgrades and stage. Essence gives +{{ view.bonus }}% damage
        (2% each; spending lowers it).<template v-if="view.count"> Slept {{ view.count }}×.</template>
      </div>
      <button class="primary" :disabled="!view.ready" @click="confirmPrestige">
        <template v-if="view.ready">Sleep · +{{ view.reward }} Essence</template>
        <template v-else>Needs {{ view.threshold }} Blood earned</template>
      </button>
    </div>
    <BuyModeToggle />
    <UpgradeList title="Essence shop" :defs="shop" />
  </div>
</template>

<style scoped>
.title {
  font-size: 17px;
}
</style>
