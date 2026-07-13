import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks: {
          'firebase-app': ['firebase/app', 'firebase/auth'],
          'firebase-data': ['firebase/firestore', 'firebase/storage'],
          motion: ['framer-motion'],
          react: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'icons/*.png'],
      manifest: {
        name: 'תכנון החתונה שלנו',
        short_name: 'החתונה שלנו',
        description: 'אפליקציה לתכנון חתונה - מוזמנים, תקציב, ספקים, משימות ועוד',
        lang: 'he',
        dir: 'rtl',
        theme_color: '#15616D',
        background_color: '#FDF6EC',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        categories: ['lifestyle', 'productivity'],
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // הגשת מעטפת האפליקציה (index.html) לכל ניווט - כך האפליקציה עולה גם אופליין
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/__/],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: ({ url }) => url.host.includes('firebasestorage.googleapis.com'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'firebase-storage',
              expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
})
