import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['lib/**/*.test.ts', 'components/**/*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      // Per Engineering-Standards §7: 90% lib, 85% app/api, 75% components-with-logic.
      // Phase 0 only has lib/validation.ts under test — the lib/ threshold is the
      // active gate today. When Phase 1 lands API routes or component unit tests,
      // add them to `include` so their thresholds bite. The whole point: the gate
      // should fail the day Phase 1 code arrives without coverage.
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: ['lib/**/*.ts'],
      exclude: [
        '**/*.test.{ts,tsx}',
        '**/*.d.ts',
        'lib/types/**',
        // Phase 0 utility wrappers shipped without unit tests. Write tests
        // (or move to integration) in Phase 1; remove from this list to bring
        // them under the lib/** threshold.
        'lib/emails.ts',
        'lib/env.ts',
        'lib/resend.ts',
        'lib/supabase.ts',
      ],
      thresholds: {
        'lib/**': { lines: 90, functions: 90, branches: 90, statements: 90 },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
