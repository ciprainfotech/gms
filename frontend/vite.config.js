import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Automatically updates the app when you push new code
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'], // Add these to your public folder if you have them
      manifest: {
        name: 'CIPRA GMS',
        short_name: 'GMS',
        description: 'My Garage Management System',
        theme_color: '#ffffff', // The color of the top browser bar
        background_color: '#ffffff', // The color shown while the app is loading
        display: 'standalone', // This makes it look like a native app without browser tabs
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
})