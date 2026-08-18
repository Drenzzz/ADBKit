/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import wails from "@wailsio/runtime/plugins/vite";
import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: "127.0.0.1",
    port: Number(process.env.WAILS_VITE_PORT) || 9245,
    strictPort: true,
  },
  plugins: [react(), babel({ presets: [reactCompilerPreset()] }), wails("./bindings"), tailwindcss()],
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    css: false,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react-dom")) return "react-vendor";
          if (id.includes("node_modules/react") && !id.includes("react-router") && !id.includes("react-dom")) return "react-vendor";
          if (id.includes("node_modules/react-router")) return "router";
          if (
            id.includes("node_modules/motion") ||
            id.includes("node_modules/sonner") ||
            id.includes("node_modules/lucide-react") ||
            id.includes("node_modules/cmdk")
          ) return "ui-vendor";
        },
      },
    },
  },
});
