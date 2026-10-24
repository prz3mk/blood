<script setup lang="ts">
import { computed } from 'vue'
import { PRESTIGE_LAYERS } from '../../data/prestige'
import {
  autoBitesPerSecond,
  autoDps,
  biteDamage,
  bloodMult,
  bonesMult,
  bossDmgMult,
  critChance,
  formatDuration,
  allDamageMult,
  offlineLimitHours,
  wraithDps,
} from '../../engine'
import { CRIT_MULT } from '../../data/upgrades'
import { fmt, frame, state } from '../game'

const pct = (x: number) => `${fmt(Math.round(x * 100))}%`

const groups = computed(() => {
  void frame.value
  const s = state.stats
  return [
    {
      title: 'Damage',
      rows: [
        ['Bite damage', fmt(biteDamage(state))],
        ['Crit chance', `${pct(critChance(state))} (×${CRIT_MULT})`],
        ['All damage', `×${fmt(allDamageMult(state))}`],
        ['Ghoul DPS', fmt(autoDps(state))],
        ['Wraith DPS', fmt(wraithDps(state))],
        ['Bat bites', `${autoBitesPerSecond(state)}/s`],
        ['Damage vs boss', `×${fmt(bossDmgMult(state))}`],
      ],
    },
    {
      title: 'Loot',
      rows: [
        ['Blood drop', `×${fmt(bloodMult(state))}`],
        ['Bones drop', `×${fmt(bonesMult(state))}`],
        ['Offline limit', `${offlineLimitHours(state)}h`],
      ],
    },
    {
      title: 'Records',
      rows: [
        ['Highest Village stage', fmt(s.maxStage)],
        ['Enemies slain', fmt(s.kills)],
        ['Bosses slain', fmt(s.bossKills)],
        ['Bites', fmt(s.clicks)],
        ['Bat bites', fmt(s.autoBites)],
        ['Crits', fmt(s.crits)],
        ['Blood earned', fmt(s.bloodEarnedTotal)],
        ['Bones earned', fmt(s.bonesEarnedTotal)],
        ['Souls earned', fmt(s.soulsEarnedTotal)],
        ...PRESTIGE_LAYERS.map((l) => [l.name, fmt(s.prestiges[l.id] ?? 0)]),
        ['Play time', formatDuration(s.playTime)],
      ],
    },
  ]
})
</script>

<template>
  <div class="tab-body">
    <template v-for="g in groups" :key="g.title">
      <h2 class="section-title">{{ g.title }}</h2>
      <dl class="card">
        <template v-for="[k, v] in g.rows" :key="k">
          <dt class="muted">{{ k }}</dt>
          <dd>{{ v }}</dd>
        </template>
      </dl>
    </template>
  </div>
</template>

<style scoped>
dl {
  grid-template-columns: 1fr auto;
  gap: 6px 12px;
  margin: 0;
}
dt {
  font-size: 14px;
}
dd {
  margin: 0;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
</style>
