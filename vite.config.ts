/// <reference types="vitest/config" />
// packages
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the app under the repository name; a self-hosted build passes BASE_PATH=/ instead.
const base = process.env.BASE_PATH ?? '/engineer-mentat-academy/';

export default defineConfig({
  base,
  plugins: [react()],
  optimizeDeps: {
    exclude: ['sql.js'],
  },
  worker: {
    format: 'es',
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/engine/**'],
      exclude: ['src/engine/runner/worker.ts', 'src/engine/sql/browserLoader.ts'],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
