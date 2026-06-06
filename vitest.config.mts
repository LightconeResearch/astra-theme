import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Mirror tsconfig "paths": ~/* -> app/*
      '~': path.resolve(root, 'app'),
      // The workspace package resolves to its TS source (its package.json
      // "main" points at ./src/index.ts).
      '@astra-spec/store-types': path.resolve(
        root,
        'packages/store-types/src/index.ts',
      ),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
  },
});
