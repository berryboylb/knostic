import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import type { UserConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""), 
      },
    },
  },
  test: {
    environment: "jsdom", // simulate browser
    globals: true, // use global describe/it/expect
    setupFiles: "./src/setupTests.ts", // file to run before tests
    css: true, // allow importing CSS in tests
  },
} as UserConfig);
