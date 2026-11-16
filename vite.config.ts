import diagnosticsChannel from 'node:diagnostics_channel';

// Polyfill diagnostics_channel.tracingChannel for Node.js < 19.9.0
if (typeof (diagnosticsChannel as any).tracingChannel !== 'function') {
  (diagnosticsChannel as any).tracingChannel = function (name: string) {
    const ch = (suffix: string) => diagnosticsChannel.channel(typeof name === 'string' ? `${name}:${suffix}` : 'trace');
    return {
      name,
      hasSubscribers: false,
      start: ch('start'),
      end: ch('end'),
      asyncStart: ch('asyncStart'),
      asyncEnd: ch('asyncEnd'),
      error: ch('error'),
      traceSync<T>(fn: (...args: any[]) => T, _context?: any, thisArg?: any, ...args: any[]): T {
        return fn.apply(thisArg, args);
      },
      tracePromise<T>(fn: (...args: any[]) => Promise<T>, _context?: any, thisArg?: any, ...args: any[]): Promise<T> {
        return fn.apply(thisArg, args);
      },
      subscribe() {},
      unsubscribe() {},
    };
  };
}

import nodeCrypto from 'node:crypto';
if (typeof (globalThis as any).crypto === 'undefined' || !(globalThis as any).crypto.getRandomValues) {
  (globalThis as any).crypto = (nodeCrypto as any).webcrypto || nodeCrypto;
}
if (typeof (global as any).crypto === 'undefined' || !(global as any).crypto.getRandomValues) {
  (global as any).crypto = (nodeCrypto as any).webcrypto || nodeCrypto;
}

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'favicon.ico',
          'favicon.png',
          'apple-touch-icon.png',
          'logo-transparent.png',
          'amr-mohsen-hero.jpg',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'pwa-maskable-512x512.png',
        ],
        manifest: {
          id: '/',
          name: 'Mr. Amr Mohsen - Math AI Tutor',
          short_name: 'Amr Mohsen',
          description: 'المساعد الذكي للرياضيات للمرحلة الإعدادية - مستر عمرو محسن',
          theme_color: '#132346',
          background_color: '#132346',
          display: 'standalone',
          orientation: 'portrait-primary',
          start_url: '/',
          scope: '/',
          lang: 'ar',
          dir: 'rtl',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
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
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
      // Copies src/assets into dist/ so root-relative URLs like
      // "/src/assets/images/..." (e.g. generate_image output) still resolve
      // in production builds. Do not remove.
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build' as const,
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          const srcAssets = path.resolve(__dirname, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {recursive: true, force: true});
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
