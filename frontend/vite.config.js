// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
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
