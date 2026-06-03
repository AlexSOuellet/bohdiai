import '@testing-library/jest-dom/vitest';

// jsdom has no IntersectionObserver. Components that observe scroll (the moment
// hero's nav, the scroll-reveal wrapper) construct one in an effect; stub it so
// those render in tests. The callback never fires here — structural and
// timer-driven assertions don't depend on it.
if (typeof globalThis.IntersectionObserver === 'undefined') {
  class IO {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
    root = null;
    rootMargin = '';
    thresholds = [];
  }
  globalThis.IntersectionObserver = IO as unknown as typeof IntersectionObserver;
}
