import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  base: '',
  server: {
    host: true,
    port: 8080,
    strictPort: false,
    hmr: {
      overlay: true
    },
    watch: {
      usePolling: true
    },
    middlewareMode: false,
    force: true
  },
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    reportCompressedSize: true,
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'PLUGIN_WARNING') {
          process.exit(1);
        }
      }
    }
  },
});
