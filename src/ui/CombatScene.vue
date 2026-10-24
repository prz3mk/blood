<script setup lang="ts">
import { computed } from 'vue'
import { COMBAT } from '../data/combat'
import { enemyMaxHp, enemyName, formatNumber, isBoss } from '../engine'
import { frame, playerBite, state } from './game'

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
    hp: formatNumber(c.enemyHp),
    maxHp: formatNumber(max),
    pct: c.enemyHp.div(max).toNumber() * 100,
  }
})
</script>

<template>
  <section class="scene">
    <div class="meta">Stage {{ view.stage }} · {{ view.progress }}</div>
    <button class="enemy" :class="{ boss: view.boss }" @pointerdown.prevent="playerBite">
      <span class="name">{{ view.name }}</span>
      <span class="bar"><span class="fill" :style="{ width: view.pct + '%' }" /></span>
      <span class="hp">{{ view.hp }} / {{ view.maxHp }}</span>
    </button>
    <div class="hint">Tap to bite</div>
  </section>
</template>

<style scoped>
.scene {
  padding: 16px;
  display: grid;
  gap: 8px;
  justify-items: center;
}
.meta,
.hint {
  color: var(--muted);
  font-size: 14px;
}
.enemy {
  width: min(100%, 360px);
  padding: 32px 16px;
  display: grid;
  gap: 8px;
  background: var(--panel);
  color: inherit;
  font: inherit;
  border: 1px solid var(--line);
  border-radius: 8px;
  cursor: pointer;
  user-select: none;
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
.bar {
  height: 12px;
  background: var(--line);
  border-radius: 6px;
  overflow: hidden;
}
.fill {
  display: block;
  height: 100%;
  background: var(--blood);
}
.hp {
  font-size: 14px;
  font-variant-numeric: tabular-nums;
}
</style>
