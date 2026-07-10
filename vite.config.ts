import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // `npm run dev` serves the UI only. For the /api functions run `npm run dev:full`
    // (vercel dev), which serves the SPA + /api on one origin. This proxy forwards /api
    // to a local `vercel dev` on :3000 if you run both; when it's absent we answer 503
    // quietly instead of spamming ECONNREFUSED stack traces.
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        configure: (proxy) => {
          let warned = false;
          proxy.on('error', (_err, _req, res) => {
            if (!warned) {
              console.warn(
                '\n[dev] /api is offline — run `npm run dev:full` (vercel dev) for the backend.\n',
              );
              warned = true;
            }
            const r = res as unknown as {
              writeHead?: (s: number, h: Record<string, string>) => void;
              end?: (b: string) => void;
              headersSent?: boolean;
            };
            if (typeof r.writeHead === 'function' && !r.headersSent) {
              r.writeHead(503, { 'Content-Type': 'application/json' });
              r.end?.(JSON.stringify({ error: 'api_offline' }));
            }
          });
        },
      },
    },
  },
});
