<script setup lang="ts">
import { activeTab, type Tab } from './game'

const tabs: { id: Tab; label: string; short?: string }[] = [
  { id: 'combat', label: 'Combat' },
  { id: 'upgrades', label: 'Upgrades' },
  { id: 'automation', label: 'Automation', short: 'Auto' },
  { id: 'prestige', label: 'Prestige' },
  { id: 'settings', label: 'Settings' },
]
</script>

<template>
  <nav class="tabbar" role="tablist" aria-label="Panels">
    <button
      v-for="t in tabs"
      :id="`tab-${t.id}`"
      :key="t.id"
      role="tab"
      :aria-label="t.label"
      :aria-selected="activeTab === t.id"
      aria-controls="panel"
      :class="{ active: activeTab === t.id }"
      @click="activeTab = t.id"
    >
      <span class="full">{{ t.label }}</span>
      <span class="short" aria-hidden="true">{{ t.short ?? t.label }}</span>
    </button>
  </nav>
</template>

<style scoped>
.tabbar {
  display: flex;
  background: var(--bg);
}
button {
  flex: 1;
  min-width: 0;
  border: 0;
  border-radius: 0;
  background: transparent;
  color: var(--muted);
  font-size: 13px;
  padding: 8px 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
button.active {
  color: var(--text);
  box-shadow: inset 0 -2px 0 var(--blood);
}

/* Mobile: fixed bottom bar, indicator on top edge. */
@media (max-width: 799px) {
  .tabbar {
    position: fixed;
    inset: auto 0 0;
    height: var(--tabbar-h);
    border-top: 1px solid var(--line);
    padding-bottom: env(safe-area-inset-bottom);
    z-index: 3;
  }
  button {
    font-size: 12px;
    padding: 8px 2px;
  }
  button.active {
    box-shadow: inset 0 2px 0 var(--blood);
  }
}
.short {
  display: none;
}
@media (max-width: 359px) {
  .full {
    display: none;
  }
  .short {
    display: inline;
  }
}
@media (min-width: 800px) {
  .tabbar {
    border-bottom: 1px solid var(--line);
  }
}
</style>
