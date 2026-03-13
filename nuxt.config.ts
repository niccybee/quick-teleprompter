export default defineNuxtConfig({
  compatibilityDate: '2025-12-01',
  devtools: { enabled: true },
  modules: ['@nuxt/ui', '@vite-pwa/nuxt', '@vueuse/nuxt'],
  css: ['~/assets/css/main.css'],
  nitro: {
    experimental: {
      websocket: true
    }
  },
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Teleprompter',
      short_name: 'Teleprompter',
      description: 'Realtime teleprompter with controller and display',
      theme_color: '#0f172a',
      background_color: '#0f172a',
      display: 'standalone',
      start_url: '/',
      icons: [
        {
          src: '/icon-192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png'
        }
      ]
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}']
    }
  }
})
