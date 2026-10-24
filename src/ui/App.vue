<script setup lang="ts">
import CombatScene from './CombatScene.vue'
import { startGame } from './game'
import OfflineModal from './OfflineModal.vue'
import PrestigePanel from './PrestigePanel.vue'
import ResourceBar from './ResourceBar.vue'
import SavePanel from './SavePanel.vue'
import UpgradesPanel from './UpgradesPanel.vue'

startGame()
</script>

<template>
  <ResourceBar />
  <CombatScene />
  <UpgradesPanel />
  <PrestigePanel />
  <SavePanel />
  <OfflineModal />
</template>
