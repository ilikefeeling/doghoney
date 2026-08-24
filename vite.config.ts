import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true,
          type: 'module',
        },
        includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'icon-512x512.jpg'],
        manifest: {
          id: '/',
          name: "개꿀 Doghoney - 당근 가구 트렁크 적재 AI 시뮬레이터",
          short_name: "개꿀",
          description: "당근마켓 가구/가전 사진 AI 분석 → 내 차 트렁크 3D 적재 시뮬레이션. 100% 무료!",
          theme_color: "#FF7E36",
          background_color: "#F8F9FC",
          display: "standalone",
          orientation: "portrait",
          scope: "/",
          start_url: "/",
          categories: ["utilities", "shopping", "lifestyle"],
          icons: [
            {
              src: "/favicon.svg",
              sizes: "any",
              type: "image/svg+xml"
            },
            {
              src: "/icon-512x512.jpg",
              sizes: "192x192",
              type: "image/jpeg",
              purpose: "any maskable"
            },
            {
              src: "/icon-512x512.jpg",
              sizes: "512x512",
              type: "image/jpeg",
              purpose: "any maskable"
            }
          ],
          share_target: {
            action: "/share-target",
            method: "POST",
            enctype: "multipart/form-data",
            params: {
              title: "title",
              text: "text",
              url: "url",
              files: [
                {
                  name: "images",
                  accept: ["image/*", "image/jpeg", "image/png", "image/webp", "image/gif"]
                }
              ]
            }
          }
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
          },
        },
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
