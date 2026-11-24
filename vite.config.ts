import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react({
      exclude: [/index-COMOowaA\.jsx$/],
    }),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,
      manifest: false,
      includeAssets: [
        'favicon.svg',
        'favicon.ico',
        'favicon-devspark.jpg',
        'favicon-192x192.png',
        'favicon-512x512.png',
        'apple-touch-icon.png',
        'devspark-header-logo.svg',
        'manifest.json',
        'offline.html',
      ],
      workbox: {
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,svg,woff,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [
          /^\/api\//,
          /^\/robots\.txt$/i,
          /^\/sitemap\.xml$/i,
          /^\/manifest\.json$/i,
          /^\/(bn|my|zh-hans)(\/|$)/i,
        ],
        runtimeCaching: [
          {
            // Localized & public pages: fast network-first with 3s fallback to cache on unstable connections
            urlPattern: ({ request, url }) =>
              request.mode === 'navigate' &&
              /^\/($|bn|my|zh-hans|rental|promos|legal|rental-policy|kits|packages)/i.test(url.pathname),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'dslink-pages-cache',
              networkTimeoutSeconds: 3,
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Starlink hardware images & local media assets
            urlPattern: ({ request, url }) =>
              request.destination === 'image' ||
              url.hostname === 'starlink.com' ||
              url.pathname.startsWith('/assets/'),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'dslink-images-cache',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
        type: 'module',
      },
    }),
  ],
  server: {
    port: 3000,
    host: true,
    allowedHosts: true,
    hmr: false,
  },
  build: {
    minify: false,
  },
});
