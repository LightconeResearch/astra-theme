import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./packages/astra/tests/setup.ts'],
    include: ['packages/astra/tests/**/*.test.{ts,tsx}'],
  },
});
