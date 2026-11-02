import { defineConfig } from 'vitest/config';
import path from 'node:path';
export default defineConfig({
  resolve: {
    alias: { 'server-only': path.resolve('tests/server-only.ts'), '@': path.resolve('.') },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/rules.test.ts'],
    environment: 'node',
    pool: 'forks',
    maxWorkers: 1,
  },
});
