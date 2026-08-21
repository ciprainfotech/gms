import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [
    react(),
    basicSsl(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'favicon-32x32.png', 'favicon-16x16.png', 'apple-touch-icon.png', 'maskable-icon.png'],
      manifest: {
        name: 'Cipra GMS',
        short_name: 'Cipra GMS',
        description: 'Cipra GMS - Next-Gen SaaS Garage & Workshop Management System',
        theme_color: '#4F46E5',
        background_color: '#F8FAFC',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'maskable-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      }
    })
  ],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'bootstrap-vendor': ['bootstrap', 'react-bootstrap'],
          'chart-vendor': ['chart.js', 'react-chartjs-2'],
          'icons-vendor': ['react-icons', '@fortawesome/react-fontawesome', '@fortawesome/free-solid-svg-icons']
        }
      }
    }
  },
  server: {
    hmr: {
      protocol: 'wss',
      host: 'localhost'
    }
  }
})