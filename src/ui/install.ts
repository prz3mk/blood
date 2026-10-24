import { ref } from 'vue'

// Chromium-only event; other browsers install via their own menu.
interface InstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferred: InstallPromptEvent | null = null
export const canInstall = ref(false)

addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  deferred = e as InstallPromptEvent
  canInstall.value = true
})

addEventListener('appinstalled', () => {
  deferred = null
  canInstall.value = false
})

export async function promptInstall(): Promise<void> {
  if (!deferred) return
  await deferred.prompt()
  await deferred.userChoice
  deferred = null
  canInstall.value = false
}
