import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';
import Sitemap from 'vite-plugin-sitemap';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'C&B Services Formations',
        short_name: 'C&B',
        description: 'SaaS éducatif ultra-premium, immersif et intuitif.',
        theme_color: '#0a0a0a',
        icons: [
          {
            src: '/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      }
    }),
    Sitemap({
      hostname: 'https://formation.biteckethan.com',
      exclude: ['/admin', '/admin/*'],
      robots: [
        { userAgent: '*', allow: '/' },
        { userAgent: '*', disallow: ['/admin', '/admin/*'] },
      ],
      readable: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
});
