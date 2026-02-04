import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['lib/**/*.ts'],
      exclude: [
        'lib/db/index.ts', // DB client setup
        'lib/db/schema.ts', // Schema definitions
        'lib/db/queries.ts', // DB queries - integration test territory
        'lib/stripe.ts', // Stripe client setup
        'lib/demo-seed.ts', // Demo data - not business logic
        'lib/env.ts', // Runtime config validation
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    },
  },
});
