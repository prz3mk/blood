<script setup lang="ts">
import { ref } from 'vue'
import type { Notation } from '../../engine'
import { exportGame, frame, hardReset, importGame, state } from '../game'
import { canInstall, promptInstall } from '../install'

const notations: { value: Notation; label: string }[] = [
  { value: 'scientific', label: 'Scientific (1.50e6)' },
  { value: 'suffix', label: 'Suffixes (1.50M)' },
]

function setNotation(n: Notation) {
  state.settings.notation = n
  frame.value++
}

const text = ref('')
const message = ref('')

async function doExport() {
  text.value = exportGame()
  try {
    await navigator.clipboard.writeText(text.value)
    message.value = 'Copied to clipboard.'
  } catch {
    message.value = 'Copy the text above.'
  }
}

function doImport() {
  try {
    importGame(text.value)
    message.value = 'Save loaded.'
    text.value = ''
  } catch (e) {
    message.value = e instanceof Error ? e.message : 'Invalid save.'
  }
}

function doReset() {
  if (!confirm('Hard reset? This deletes ALL progress, including Essence and stats.')) return
  if (!confirm('Really? This cannot be undone. Export a save first if unsure.')) return
  hardReset()
  message.value = 'Progress reset.'
}
</script>

<template>
  <div class="tab-body">
    <h2 class="section-title">Number notation</h2>
    <div class="card" role="radiogroup" aria-label="Number notation">
      <label v-for="n in notations" :key="n.value" class="radio">
        <input
          type="radio"
          name="notation"
          :checked="(frame, state.settings.notation === n.value)"
          @change="setNotation(n.value)"
        />
        {{ n.label }}
      </label>
    </div>

    <h2 class="section-title">Display</h2>
    <label class="card radio">
      <input v-model="state.settings.damageNumbers" type="checkbox" @change="frame++" />
      Damage numbers
      <span class="muted legend">
        <span class="k tap">tap</span> · <span class="k bat">bat</span> · <span class="k ghoul">ghoul/s</span> · <span class="k wraith">wraith/s</span> ·
        <span class="k crit">CRIT</span>
      </span>
    </label>

    <h2 class="section-title">Save</h2>
    <div class="card">
      <textarea v-model="text" rows="3" placeholder="Paste a save string to import" spellcheck="false" />
      <div class="actions">
        <button @click="doExport">Export</button>
        <button :disabled="!text.trim()" @click="doImport">Import</button>
      </div>
      <p v-if="message" class="muted msg">{{ message }}</p>
    </div>

    <template v-if="canInstall">
      <h2 class="section-title">App</h2>
      <div class="card">
        <button @click="promptInstall">Install Blood</button>
        <p class="muted msg">Plays offline, launches from your home screen.</p>
      </div>
    </template>

    <h2 class="section-title">Danger zone</h2>
    <div class="card">
      <button class="danger" @click="doReset">Hard reset</button>
    </div>
  </div>
</template>

<style scoped>
.radio {
  display: flex;
  gap: 8px;
  align-items: center;
  cursor: pointer;
}
textarea {
  font: 12px ui-monospace, monospace;
  color: inherit;
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 8px;
  resize: vertical;
  word-break: break-all;
}
.actions {
  display: flex;
  gap: 8px;
}
.legend {
  margin-left: auto;
}
.k.tap {
  color: var(--text);
}
.k.bat {
  color: #c4a3ff;
}
.k.ghoul {
  color: #8fcf9a;
}
.k.wraith {
  color: #9fd3ff;
}
.k.crit {
  color: #ff4d6a;
}
.msg {
  margin: 0;
}
</style>
