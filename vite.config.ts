import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { IncomingMessage, ServerResponse } from "http";
import type { ViteDevServer } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  base: '',
  server: {
    host: '0.0.0.0',
    port: 4488,
    strictPort: true,
  },
  plugins: [
    react(),
    process.env.NODE_ENV === 'development' && componentTagger(),
    // モックAPI用のカスタムプラグイン
    {
      name: 'mock-api',
      configureServer(server: ViteDevServer) {
        server.middlewares.use('/api/hello', (req: IncomingMessage, res: ServerResponse) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ message: 'バックエンドAPIが正常に動作しています' }));
        });
      },
    },
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
