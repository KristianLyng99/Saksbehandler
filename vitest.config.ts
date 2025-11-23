import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  // Limit vitest to this repo's root instead of the client subfolder
  // specified in vite.config.ts.
  test: {
    include: ['shared/__tests__/**/*.test.ts', 'client/src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
    },
  },
});

