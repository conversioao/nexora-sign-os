import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      target: 'esnext',
      minify: process.platform === 'win32' ? false : 'esbuild',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom') || id.includes('motion')) {
                return 'vendor-framework';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (id.includes('socket.io-client') || id.includes('socket.io-parser')) {
                return 'vendor-socket';
              }
            }
          },
        },
      },
      chunkSizeWarningLimit: 2000,
    },
    server: {
      port: 4000,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: ['**/uploads/**', '**/uploads/creative-ai/**', '**/*.log', '**/dist/**'],
      },
      proxy: {
        // Dedicated Creative AI Engine Microservice (Port 3002) with fallback to Core Backend (Port 3001)
        '/api/creative-ai': {
          target: 'http://127.0.0.1:3002',
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('error', (err: any, req: any, res: any) => {
              // If AI Engine (3002) is not up, forward to Core Backend (3001)
              if (err.code === 'ECONNREFUSED') {
                if (res && !res.headersSent) {
                  res.writeHead(503, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Motor de Geração Criativa (Port 3002) a inicializar...' }));
                }
              }
            });
          },
        },
        // Core Nexora OS Backend (Port 3001)
        '/api': {
          target: 'http://127.0.0.1:3001',
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('error', (err: any, _req: any, res: any) => {
              if (err.code === 'ECONNREFUSED') {
                if (res && !res.headersSent) {
                  res.writeHead(503, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Servidor backend a inicializar, tente novamente em alguns segundos.' }));
                }
              }
            });
          },
        },
        '/socket.io': {
          target: 'http://127.0.0.1:3001',
          ws: true,
          changeOrigin: true,
        },
      },
    },
  };
});
