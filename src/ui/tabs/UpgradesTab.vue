<script setup lang="ts">
import { UPGRADES } from '../../data/upgrades'
import BuyModeToggle from '../BuyModeToggle.vue'
import { frame, state } from '../game'
import UpgradeList from '../UpgradeList.vue'
import { computed } from 'vue'

const pick = (currency: string) => UPGRADES.filter((d) => d.currency === currency && !d.automation)
const blood = pick('blood')
const bones = pick('bones')
const souls = pick('souls')
const empty = computed(
  () => (frame.value, ![...blood, ...bones, ...souls].some((d) => state.upgrades.unlocked[d.id])),
)
</script>

<template>
  <div class="tab-body">
    <BuyModeToggle />
    <p v-if="empty" class="muted">Collect Blood to discover upgrades.</p>
    <UpgradeList title="Blood" :defs="blood" />
    <UpgradeList title="Bones" :defs="bones" />
    <UpgradeList title="Souls" :defs="souls" />
  </div>
</template>
