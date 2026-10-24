<script setup lang="ts">
import CombatScene from './CombatScene.vue'
import { startGame } from './game'
import ResourceBar from './ResourceBar.vue'

startGame()
</script>

<template>
  <ResourceBar />
  <CombatScene />
</template>
