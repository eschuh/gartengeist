import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { API_CACHE, PHOTO_CACHE } from './src/cacheNames.ts'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Installierbar auf dem Homescreen; zuletzt geladene Daten sind auch bei schlechtem Netz im Garten lesbar
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Gartengeist',
        short_name: 'Gartengeist',
        description: 'Euer Gartenassistent',
        lang: 'de',
        start_url: '/',
        display: 'standalone',
        theme_color: '#3f6212',
        background_color: '#fbfaf5',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/health/],
        runtimeCaching: [
          {
            // Fotos ändern sich nie (zufällige Dateinamen)
            urlPattern: ({ url }) => url.pathname.startsWith('/api/fotos/'),
            handler: 'CacheFirst',
            options: {
              cacheName: PHOTO_CACHE,
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 90 },
            },
          },
          {
            // Daten: immer frisch vom Server, bei schlechtem Netz der zuletzt geladene Stand
            urlPattern: ({ url, request }) => url.pathname.startsWith('/api/') && request.method === 'GET',
            handler: 'NetworkFirst',
            options: {
              cacheName: API_CACHE,
              networkTimeoutSeconds: 6,
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5180,
    strictPort: true,
    // host: true macht den Dev-Server im WLAN erreichbar (Test auf dem Handy)
    host: true,
    proxy: {
      '/api': 'http://localhost:5101',
    },
  },
})
