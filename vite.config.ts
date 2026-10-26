import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
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
  build: { outDir: "../docs", emptyOutDir: true, sourcemap: false },
});
