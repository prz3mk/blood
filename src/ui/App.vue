<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import CombatScene from './CombatScene.vue'
import { activeTab, startGame } from './game'
import OfflineModal from './OfflineModal.vue'
import ResourceBar from './ResourceBar.vue'
import TabBar from './TabBar.vue'
import AutomationTab from './tabs/AutomationTab.vue'
import CombatTab from './tabs/CombatTab.vue'
import PrestigeTab from './tabs/PrestigeTab.vue'
import SettingsTab from './tabs/SettingsTab.vue'
import UpgradesTab from './tabs/UpgradesTab.vue'

startGame()

// Dev-only; the import is dropped from production builds.
const DevPanel = import.meta.env.DEV ? defineAsyncComponent(() => import('./DevPanel.vue')) : null

const panels = {
  combat: CombatTab,
  upgrades: UpgradesTab,
  automation: AutomationTab,
  prestige: PrestigeTab,
  settings: SettingsTab,
}
</script>

<template>
  <div class="app">
    <div class="head">
      <ResourceBar class="top" />
      <CombatScene class="scene" />
    </div>
    <div class="side">
      <TabBar />
      <main id="panel" class="panel" role="tabpanel" :aria-labelledby="`tab-${activeTab}`">
        <component :is="panels[activeTab]" />
      </main>
    </div>
  </div>
  <OfflineModal />
  <DevPanel v-if="DevPanel" />
</template>

<style scoped>
.panel {
  padding: 12px 16px;
}

/* Mobile: scene stays at top, panel scrolls under it, tabs at bottom. */
@media (max-width: 799px) {
  .head {
    position: sticky;
    top: 0;
    z-index: 1;
    background: var(--bg);
    border-bottom: 1px solid var(--line);
  }
  .panel {
    padding-bottom: calc(var(--tabbar-h) + 16px + env(safe-area-inset-bottom));
  }
}

/* Desktop: scene left, tabs + panel right. */
@media (min-width: 800px) {
  .app {
    display: grid;
    grid-template-columns: minmax(320px, 1fr) minmax(380px, 520px);
    grid-template-rows: auto 1fr;
    grid-template-areas:
      'top top'
      'scene side';
    min-height: 100vh;
    max-width: 1100px;
    margin: 0 auto;
  }
  .head {
    display: contents;
  }
  .top {
    grid-area: top;
  }
  .scene {
    grid-area: scene;
    align-content: start;
    padding-top: 32px;
  }
  .side {
    grid-area: side;
    border-left: 1px solid var(--line);
  }
}
</style>
