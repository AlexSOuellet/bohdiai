import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

// Flat config for ESLint 9 + Next 16. Replaces the legacy .eslintrc.json:
// `next lint` was removed in Next 16, so we run ESLint directly (`eslint .`).
const config = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    // Storefronts render on tenant subdomains and are served by a middleware
    // rewrite (myshop.bohdiai.com/shop → /storefront/shop). Their links point
    // at tenant-relative paths that are NOT literal Next routes, so plain <a>
    // tags are intentional — `no-html-link-for-pages` is a false positive here,
    // and typedRoutes can't type these paths for <Link> either.
    files: ['app/storefront/**'],
    rules: {
      '@next/next/no-html-link-for-pages': 'off',
    },
  },
  {
    // scripts/ are internal dev tooling (CLI utilities, one-off generators),
    // not shipped product code. console output is their whole purpose, and the
    // legacy `next lint` never checked this folder. Product code keeps the
    // strict no-console / no-explicit-any rules above.
    files: ['scripts/**/*.{ts,mts,mjs}'],
    rules: {
      'no-console': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    ignores: [
      '.next/**',
      'tmp/**',
      'coverage/**',
      'dist/**',
      'playwright-report/**',
      'test-results/**',
      'next-env.d.ts',
    ],
  },
];

export default config;
