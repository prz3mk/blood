import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  // Sub-path hosting (GitHub Pages sets /blood/); local dev stays at /.
  base: process.env.BASE_PATH ?? '/',
  plugins: [
    vue(),
    VitePWA({
      // New version activates on next load; game saves on pagehide.
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Blood',
        short_name: 'Blood',
        description: 'Idle vampire game',
        theme_color: '#0d0a0b',
        background_color: '#0d0a0b',
        display: 'standalone',
        orientation: 'any',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png}'],
      },
    }),
  ],
})
