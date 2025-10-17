// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
  build: {
    // Disable modulepreload for lazy chunks - we want true lazy loading
    modulePreload: false,

    // Optimize chunk sizes for better caching
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Let Vite handle React automatically - it knows how to handle shared dependencies
          // Only manually chunk heavy/specific libraries

          // Animation libraries (critical for landing page)
          if (id.includes('gsap') || id.includes('lenis')) {
            return 'animations';
          }

          // Mantine UI library (shared across app)
          if (id.includes('@mantine')) {
            return 'mantine-ui';
          }

          // Redux and RTK Query (only for authenticated app)
          if (
            id.includes('@reduxjs/toolkit') ||
            id.includes('react-redux') ||
            id.includes('redux')
          ) {
            return 'redux-stack';
          }

          // Socket.io (only for real-time features)
          if (id.includes('socket.io-client')) {
            return 'socket-io';
          }

          // Form libraries (only on certain pages)
          if (
            id.includes('react-hook-form') ||
            id.includes('zod') ||
            id.includes('@hookform')
          ) {
            return 'forms';
          }

          // Date libraries (only on certain pages)
          if (
            id.includes('date-fns') ||
            id.includes('dayjs')
          ) {
            return 'dates';
          }

          // Let Vite automatically handle React, React-DOM, React-Router and other core dependencies
          // They will be placed in appropriate vendor chunks automatically
        },
        // Optimize chunk naming for better debugging
        chunkFileNames: (chunkInfo) => {
          return `assets/${chunkInfo.name}-[hash].js`;
        },
      },
    },
    // Set chunk size warnings (optional but helpful)
    chunkSizeWarningLimit: 1000, // 1000kb = 1MB
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://traefik',
        changeOrigin: true,
        secure: false,
        headers: {
          Host: 'localhost',
        },
      },
      '/socket.io': {
        // Socket.io proxy configuration
        target: 'http://traefik',
        changeOrigin: true,
        secure: false,
        ws: true, // Critical for WebSockets
        headers: {
          Host: 'localhost',
        },
      },
    },
  },
}));
