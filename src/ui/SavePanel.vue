<script setup lang="ts">
import { ref } from 'vue'
import { exportGame, importGame } from './game'

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
</script>

<template>
  <section class="panel">
    <h2>Save</h2>
    <textarea v-model="text" rows="3" placeholder="Paste a save string to import" spellcheck="false" />
    <div class="actions">
      <button @click="doExport">Export</button>
      <button :disabled="!text.trim()" @click="doImport">Import</button>
    </div>
    <p v-if="message" class="msg">{{ message }}</p>
  </section>
</template>

<style scoped>
.panel {
  padding: 0 16px 24px;
  display: grid;
  gap: 8px;
  max-width: 560px;
  margin: 0 auto;
}
h2 {
  margin: 8px 0 0;
  font-size: 13px;
  font-weight: 500;
  color: var(--muted);
}
textarea {
  font: 12px ui-monospace, monospace;
  color: inherit;
  background: var(--panel);
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
button {
  font: inherit;
  color: inherit;
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 6px 12px;
  cursor: pointer;
}
button:disabled {
  opacity: 0.45;
  cursor: default;
}
.msg {
  margin: 0;
  color: var(--muted);
  font-size: 13px;
}
</style>
