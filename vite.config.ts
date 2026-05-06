import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: 'app',
  base: '/myprofile-/',
  plugins: [react()],
  build: {
    outDir: '../docs',
    emptyOutDir: true,
    sourcemap: false
  }
});
