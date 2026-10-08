import { describe, it, expect, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { HeaderBackdrop, BACKDROP_AFTER } from './HeaderBackdrop';

const scrollTo = (y: number): void => {
  Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
  window.dispatchEvent(new Event('scroll'));
};

describe('HeaderBackdrop', () => {
  afterEach(() => {
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });
  });

  it('stays hidden at the top of the page', () => {
    const { container } = render(<HeaderBackdrop />);
    expect(container.firstElementChild?.getAttribute('data-scrolled')).toBe('false');
  });

  it('shows once the page scrolls past the threshold, and hides again at the top', () => {
    const { container } = render(<HeaderBackdrop />);
    const strip = container.firstElementChild;
    act(() => scrollTo(BACKDROP_AFTER + 1));
    expect(strip?.getAttribute('data-scrolled')).toBe('true');
    act(() => scrollTo(0));
    expect(strip?.getAttribute('data-scrolled')).toBe('false');
  });

  it('shows straight away when the page loads already scrolled', () => {
    Object.defineProperty(window, 'scrollY', { value: 900, configurable: true });
    const { container } = render(<HeaderBackdrop />);
    expect(container.firstElementChild?.getAttribute('data-scrolled')).toBe('true');
  });

  it('is decoration only', () => {
    const { container } = render(<HeaderBackdrop />);
    expect(container.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
  });
});
