import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Forward API calls to the FastAPI backend (backend/, port 8001) so the
    // frontend can use same-origin `/api/...` paths — no CORS in dev.
    proxy: {
      '/api': 'http://localhost:8001',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    css: true,
  },
});
