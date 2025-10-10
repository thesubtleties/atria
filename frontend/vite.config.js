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
    // Optimize chunk sizes for better caching
    rollupOptions: {
      output: {
        manualChunks: (id) => {
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

          // React Router (shared but small)
          if (id.includes('react-router-dom')) {
            return 'router';
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
            id.includes('dayjs') ||
            id.includes('@mantine/dates')
          ) {
            return 'dates';
          }

          // Core React (shared everywhere)
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/')
          ) {
            return 'react-vendor';
          }

          // Other node_modules
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        // Optimize chunk naming for better debugging
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop()
            : 'chunk';
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
        target: 'http://atria-api:5000',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        // Socket.io proxy configuration
        target: 'http://atria-api:5000',
        changeOrigin: true,
        secure: false,
        ws: true, // Critical for WebSockets
      },
    },
  },
}));
