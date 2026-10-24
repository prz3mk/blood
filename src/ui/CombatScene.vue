<script setup lang="ts">
import { computed } from 'vue'
import { COMBAT } from '../data/combat'
import { autoBitesPerSecond, autoDps, biteDamage, enemyMaxHp, enemyName, isBoss } from '../engine'
import { fmt, frame, playerBite, state } from './game'

const view = computed(() => {
  void frame.value
  const c = state.combat
  const boss = isBoss(c.enemyIndex)
  const max = enemyMaxHp(c.stage, boss)
  return {
    stage: c.stage,
    boss,
    progress: boss ? 'BOSS' : `Enemy ${c.enemyIndex + 1} / ${COMBAT.enemiesPerStage}`,
    name: enemyName(state),
    hp: fmt(c.enemyHp),
    maxHp: fmt(max),
    pct: c.enemyHp.div(max).toNumber() * 100,
    bite: fmt(biteDamage(state)),
    dps: fmt(autoDps(state)),
    bats: autoBitesPerSecond(state),
  }
})
</script>

<template>
  <section class="scene">
    <div class="meta">Stage {{ view.stage }} · {{ view.progress }}</div>
    <button class="enemy" :class="{ boss: view.boss }" @pointerdown.prevent="playerBite">
      <span class="name">{{ view.name }}</span>
      <span class="bar hp-bar"><span class="fill" :style="{ width: view.pct + '%' }" /></span>
      <span class="hp">{{ view.hp }} / {{ view.maxHp }}</span>
    </button>
    <div class="meta">
      Bite {{ view.bite }} · DPS {{ view.dps }}<template v-if="view.bats"> · Bats {{ view.bats }}/s</template>
    </div>
  </section>
</template>

<style scoped>
.scene {
  padding: 12px 16px;
  display: grid;
  gap: 8px;
  justify-items: center;
}
.meta {
  color: var(--muted);
  font-size: 14px;
}
.enemy {
  width: min(100%, 420px);
  padding: 28px 16px;
  display: grid;
  gap: 8px;
  border-radius: 8px;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
}
.enemy:active {
  transform: scale(0.98);
}
.enemy.boss {
  border-color: var(--blood);
}
.name {
  font-size: 20px;
}
.hp-bar {
  height: 12px;
  border-radius: 6px;
}
.hp {
  font-size: 14px;
  font-variant-numeric: tabular-nums;
}
</style>
