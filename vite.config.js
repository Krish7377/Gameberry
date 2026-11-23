import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: 'client',
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            if (err.code === 'ECONNRESET') return;
            console.warn('[vite ws proxy]', err.message);
          });
        },
      },
    },
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  test: {
    environment: 'node',
    include: ['../client/src/**/*.test.js', '../server/**/*.test.js'],
    globals: true,
  },
});
