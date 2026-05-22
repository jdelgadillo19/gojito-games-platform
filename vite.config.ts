import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    entries: ["index.html", "src/**/*.{ts,tsx,js,jsx}"],
  },
  resolve: {
    alias: {
      "@gojito/entitlements": path.resolve(__dirname, "../packages/entitlements/src/core.js"),
      "@gojito/shared": path.resolve(__dirname, "../packages/gojito-shared/src"),
    },
  },
  server: {
    port: 5173,
    watch: {
      ignored: ["**/cakerybakery/**", "**/calculatorcove/**", "**/dist/**"],
    },
    proxy: {
      "/api": {
        target: process.env.VITE_GOJITO_API_URL || "http://127.0.0.1:8787",
        changeOrigin: true,
      },
    },
    fs: {
      deny: [".env", ".env.*"],
    },
  },
});
