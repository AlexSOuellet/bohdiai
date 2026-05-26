import { loadEnv } from 'vite';

export default function setup() {
  // Vite's loadEnv reads .env, .env.local, .env.test, .env.test.local and
  // returns a plain object. We inject everything into process.env so that
  // serverEnv() (which reads process.env) works in integration tests.
  // The empty-string prefix means "load ALL vars, not just VITE_-prefixed."
  // CI sets its own env vars via the workflow file; this is a no-op there
  // because .env.local doesn't exist in the CI runner.
  const env = loadEnv('test', process.cwd(), '');
  for (const [key, value] of Object.entries(env)) {
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}
