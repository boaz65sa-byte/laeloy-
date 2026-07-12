import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pwa-192.png', 'pwa-512.png'],
      manifest: {
        name: 'עילוי ונשמה — תפילות, השכבות והילולות',
        short_name: 'עילוי ונשמה',
        description:
          'סידור אזכרה מלא לפי אותיות השם, בנק תפילות וסגולות, לוח הילולות צדיקים ותזכורות אזכרה — לפי הלוח העברי',
        lang: 'he',
        dir: 'rtl',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#0e1526',
        background_color: '#0e1526',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // אופליין מלא — כל התוכן (תפילות, תהילים, לוח) נטען מהמכשיר
        globPatterns: ['**/*.{js,css,html,png,json}'],
        runtimeCaching: [
          {
            // גופנים מגוגל — נשמרים לשימוש אופליין
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: { port: 5199 },
});
