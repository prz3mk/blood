<script setup lang="ts">
import { computed } from 'vue'
import { COMBAT, zoneById, ZONES } from '../data/combat'
import {
  autoBitesPerSecond,
  autoDps,
  biteDamage,
  currentDrops,
  currentZone,
  enemyMaxHp,
  enemyName,
  isBoss,
  wraithDps,
  zoneUnlocked,
} from '../engine'
import DamageNumbers from './DamageNumbers.vue'
import { fmt, frame, playerBite, playerGoToStage, playerGoToZone, state, toggleAutoAdvance } from './game'

const view = computed(() => {
  void frame.value
  const c = state.combat
  const boss = isBoss(c.enemyIndex)
  const max = enemyMaxHp(c.stage, boss, currentZone(state))
  const drops = currentDrops(state)
  return {
    dropBlood: fmt(drops.blood),
    dropBones: drops.bones.gt(0) ? fmt(drops.bones) : null,
    dropSouls: drops.souls.gt(0) ? fmt(drops.souls) : null,
    wraith: wraithDps(state).gt(0) ? fmt(wraithDps(state)) : null,
    zones: ZONES.map((z) => ({
      id: z.id,
      name: z.name,
      active: z.id === c.zone,
      unlocked: zoneUnlocked(state, z),
      hint: z.unlock ? `Unlocks after the ${zoneById(z.unlock.zone).name} stage ${z.unlock.stage} boss` : z.name,
    })),
    stage: c.stage,
    highest: c.highestStage,
    auto: state.settings.autoAdvance,
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
    <div class="nav">
      <button aria-label="First stage" :disabled="view.stage <= 1" @click="playerGoToStage(1)">«</button>
      <button aria-label="Previous stage" :disabled="view.stage <= 1" @click="playerGoToStage(view.stage - 1)">‹</button>
      <div class="where">
        <div>
          Stage {{ view.stage }}<span v-if="view.highest > view.stage" class="dim"> / {{ view.highest }}</span>
        </div>
        <div class="dim">{{ view.progress }}</div>
      </div>
      <button aria-label="Next stage" :disabled="view.stage >= view.highest" @click="playerGoToStage(view.stage + 1)">›</button>
      <button aria-label="Highest stage" :disabled="view.stage >= view.highest" @click="playerGoToStage(view.highest)">»</button>
    </div>
    <div class="controls">
      <div class="zones" role="group" aria-label="Zone">
        <button
          v-for="z in view.zones"
          :key="z.id"
          class="pill"
          :class="{ active: z.active }"
          :aria-pressed="z.active"
          :disabled="!z.unlocked"
          :title="z.hint"
          @click="playerGoToZone(z.id)"
        >
          <template v-if="!z.unlocked">🔒 </template>{{ z.name }}
        </button>
      </div>
      <button
        class="pill mode"
        :class="{ farm: !view.auto }"
        :aria-pressed="!view.auto"
        :title="view.auto ? 'After the boss: go to the next stage' : 'After the boss: repeat this stage'"
        @click="toggleAutoAdvance"
      >
        {{ view.auto ? '▶▶ Advance' : '⟳ Farm' }}
      </button>
    </div>
    <button class="enemy" :class="{ boss: view.boss }" @pointerdown.prevent="playerBite">
      <span class="name">{{ view.name }}</span>
      <span class="bar hp-bar"><span class="fill" :style="{ width: view.pct + '%' }" /></span>
      <span class="hp">{{ view.hp }} / {{ view.maxHp }}</span>
      <span class="drops">
        Drops <b class="blood">{{ view.dropBlood }} Blood</b
        ><template v-if="view.dropBones"> · <b class="bones">{{ view.dropBones }} Bones</b></template
        ><template v-if="view.dropSouls"> · <b class="souls">{{ view.dropSouls }} Souls</b></template>
      </span>
      <DamageNumbers />
    </button>
    <div class="meta">
      Bite {{ view.bite }} · DPS {{ view.dps }}<template v-if="view.wraith"> · Wraith {{ view.wraith }}</template
      ><template v-if="view.bats"> · Bats {{ view.bats }}/s</template>
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
.meta,
.dim {
  color: var(--muted);
  font-size: 14px;
}
.nav {
  width: min(100%, 420px);
  display: grid;
  grid-template-columns: auto auto 1fr auto auto;
  gap: 6px;
  align-items: center;
}
.nav > button {
  min-width: 40px;
  min-height: 40px;
  padding: 0 8px;
  font-size: 18px;
  line-height: 1;
}
.where {
  text-align: center;
  font-variant-numeric: tabular-nums;
}
.controls {
  width: min(100%, 420px);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.zones {
  display: flex;
  gap: 4px;
}
.pill {
  font-size: 13px;
  padding: 4px 12px;
  border-radius: 999px;
  color: var(--muted);
}
.pill.active {
  color: var(--text);
  border-color: var(--blood);
}
.mode.farm {
  color: var(--text);
  border-color: var(--blood);
}
.enemy {
  position: relative;
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
.drops {
  font-size: 13px;
  color: var(--muted);
}
.drops b {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.drops .blood {
  color: #ff8a9b;
}
.drops .bones {
  color: #e6dcc3;
}
.drops .souls {
  color: #9fd3ff;
}
.hp {
  font-size: 14px;
  font-variant-numeric: tabular-nums;
}
</style>
