import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
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
