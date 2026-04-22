import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      // server-only throws at import time outside a React Server Component
      // runtime; stub it to a noop for vitest.
      'server-only': path.resolve(__dirname, './tests/stubs/server-only.ts'),
    },
  },
});
