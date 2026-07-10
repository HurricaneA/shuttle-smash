import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // If you run `npm run dev` (vite) AND `vercel dev` (port 3000) in two terminals,
    // this proxies API calls to the functions. Simplest is to just run `npm run dev:full`
    // (vercel dev), which serves the SPA and /api together on one origin.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
