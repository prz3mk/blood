<script setup lang="ts">
import { computed } from 'vue'
import { UPGRADES } from '../../data/upgrades'
import { level } from '../../engine'
import BuyModeToggle from '../BuyModeToggle.vue'
import { frame, state } from '../game'
import UpgradeList from '../UpgradeList.vue'

const pick = (currency: string) => UPGRADES.filter((d) => d.currency === currency && d.automation)
const blood = pick('blood')
const bones = pick('bones')
const souls = pick('souls')
const essence = pick('essence')
const empty = computed(
  () => (frame.value, ![...blood, ...bones, ...souls, ...essence].some((d) => state.upgrades.unlocked[d.id])),
)
const hasThrall = computed(() => (frame.value, level(state, 'bloodThrall') > 0))
</script>

<template>
  <div class="tab-body">
    <BuyModeToggle />
    <p v-if="empty" class="muted">Servants appear as you collect Blood.</p>
    <UpgradeList title="Ghouls · Blood" :defs="blood" />
    <UpgradeList title="Bats · Bones" :defs="bones" />
    <UpgradeList title="Spirits · Souls" :defs="souls" />
    <UpgradeList title="Thralls · Essence" :defs="essence" />
    <label v-if="hasThrall" class="card toggle">
      <input v-model="state.settings.autoBuyBlood" type="checkbox" @change="frame++" />
      Blood Thrall buys Blood upgrades
    </label>
  </div>
</template>

<style scoped>
.toggle {
  display: flex;
  gap: 8px;
  align-items: center;
  cursor: pointer;
}
</style>
