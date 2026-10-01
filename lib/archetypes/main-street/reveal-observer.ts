/**
 * Shared options for every scroll-in reveal observer.
 *
 * A ratio threshold (e.g. 0.2) means "fire once 20% of the element is visible".
 * An element taller than viewport / threshold can never reach that ratio, so
 * on a narrow screen a tall stacked section would stay hidden forever. A zero
 * threshold with a bottom rootMargin fires once the element's top has entered
 * the bottom 88% of the viewport, whatever the element's height.
 */
export const REVEAL_OBSERVER_OPTIONS: IntersectionObserverInit = {
  threshold: 0,
  rootMargin: '0px 0px -12% 0px',
};
