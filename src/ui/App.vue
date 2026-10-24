<script setup lang="ts">
import { computed } from 'vue'
import { GAME_NAME } from '../data/meta'
import { formatNumber } from '../engine'
import { frame, startGame, state } from './game'

startGame()

const playTime = computed(() => (frame.value, formatNumber(Math.floor(state.stats.playTime))))
const blood = computed(() => (frame.value, formatNumber(state.resources.blood)))
</script>

<template>
  <main>
    <h1>{{ GAME_NAME }}</h1>
    <p>Blood: {{ blood }}</p>
    <p>Time: {{ playTime }}s</p>
  </main>
</template>
