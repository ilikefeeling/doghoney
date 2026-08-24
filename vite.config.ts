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
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true, // Enable in dev mode for testing Share Target
        },
        manifest: {
          name: "개꿀 Doghoney",
          short_name: "개꿀",
          description: "당근마켓 가구/가전 사진 AI 분석 → 내 차 트렁크 3D 적재 시뮬레이션. 100% 무료!",
          theme_color: "#FF7E36",
          background_color: "#F8F9FC",
          display: "standalone",
          start_url: "https://www.doghoney.xyz/",
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
            action: "/",
            method: "GET",
            enctype: "application/x-www-form-urlencoded",
            params: {
              title: "title",
              text: "text",
              url: "url"
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
