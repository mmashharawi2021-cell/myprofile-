import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
export default defineConfig({
  root: "app",
  base: "/myprofile-/",
  plugins: [react()],
  server: {
    proxy: {
      "/myprofile-/api": {
        target: "http://127.0.0.1:8080",
        changeOrigin: false,
      },
      "/myprofile-/media": {
        target: "http://127.0.0.1:8080",
        changeOrigin: false,
      },
    },
  },
  build: { outDir: "../docs", emptyOutDir: true, sourcemap: false,
    rollupOptions: { input: { main: resolve("app/index.html"), cv: resolve("app/cv/index.html") } },
  },
});
