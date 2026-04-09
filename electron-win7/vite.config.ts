import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Electron loads the built files via file:// protocol — must use relative paths.
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: [],
  },
});
