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
    setupFiles: ["./src/setupTests.ts"],
    css: true,
    // Add these for better testing
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/setupTests.ts",
        "**/*.d.ts",
        "**/*.test.{ts,tsx}",
        "**/*.spec.{ts,tsx}",
      ],
    },
    // Handle static assets and imports
    assetsInclude: ["**/*.svg", "**/*.png", "**/*.jpg"],
    // Mock browser APIs
    server: {
      deps: {
        inline: ["@testing-library/user-event"],
      },
    },
  },
} as UserConfig);
