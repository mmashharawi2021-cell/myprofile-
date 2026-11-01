import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
export default defineConfig({
  root: "app",
  base: "/myprofile-/",
  plugins: [react()],
  build: { outDir: "../docs", emptyOutDir: true, sourcemap: false,
    rollupOptions: { input: { main: resolve("app/index.html"), cv: resolve("app/cv/index.html") } },
  },
});
