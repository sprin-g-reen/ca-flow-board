import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173,
    // Dev proxy to avoid CORS during frontend development. Proxies any /api requests to backend.
    ...(mode === 'development'
      ? {
          proxy: {
            '/api': {
              target: process.env.BACKEND_URL || 'http://localhost:5000',
              changeOrigin: true,
              secure: false,
            },
          },
        }
      : {}),
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
