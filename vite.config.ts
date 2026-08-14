import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "require-vite-source-index",
      transformIndexHtml: {
        order: "pre",
        handler(html: string) {
          if (!html.includes("src/main.tsx")) {
            throw new Error(
              "index.html is a published hashed hub bundle, not the Vite source. It must include /src/main.tsx so AuthContext compiles. Run npm run build / npm run dev (they restore the source entry).",
            );
          }
          return html;
        },
      },
    },
  ],
  build: {
    emptyOutDir: true,
  },
  optimizeDeps: {
    entries: ["index.html", "src/**/*.{ts,tsx,js,jsx}"],
  },
  resolve: {
    dedupe: ["react", "react-dom"],
    alias: {
      "@gojito/entitlements": path.resolve(__dirname, "../packages/entitlements/src/core.js"),
      "@gojito/nav": path.resolve(__dirname, "./packages/gojito-nav/src/GojitoNav.jsx"),
      "@gojito/nav-styles": path.resolve(__dirname, "./packages/gojito-nav/portal-chrome.css"),
      "@gojito/shared": path.resolve(__dirname, "../packages/gojito-shared/src"),
    },
  },
  server: {
    port: 5173,
    watch: {
      ignored: ["**/cakerybakery/**", "**/calculatorcove/**", "**/dist/**"],
    },
    fs: {
      deny: [".env", ".env.*"],
    },
  },
});
