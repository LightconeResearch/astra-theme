import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  publicDir: false,
  optimizeDeps: {
    entries: ['src/**/*.{ts,tsx}', '../../packages/astra/src/**/*.{ts,tsx}'],
    include: [
      '@babel/runtime/regenerator',
      'boolbase',
      'css-selector-parser',
      'lodash.throttle',
      'lowlight',
      'lowlight/lib/core',
      'refractor',
      'refractor/core',
      'spdx-correct',
      'use-sync-external-store/shim',
    ],
  },
  resolve: { dedupe: ['react', 'react-dom'] },
  build: { outDir: 'dist/client' },
  server: { port: 4173 },
  preview: { port: 4173 },
});
