import { defineConfig } from 'vitest/config';
import base from './vitest.config';
export default defineConfig({
  ...base,
  test: {
    ...base.test,
    include: ['tests/rules.test.ts'],
    exclude: [],
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
