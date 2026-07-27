// Empty stub aliased in place of the `server-only` package during Vitest runs.
// The real package throws if imported outside a React Server Component, which
// makes server modules impossible to unit-test. Under test we swap it for this
// no-op so server-only modules (draft.ts, load-envelope.ts, …) can be imported
// and their pure logic exercised. The server-only guarantee still holds in the
// real Next build, which uses the real package. See vitest.config.ts alias.
export {};
