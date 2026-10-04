import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { SampleBanner } from './SampleBanner';

afterEach(cleanup);

describe('SampleBanner', () => {
  it('links the plan label to the plans, says where it goes, and reserves its height', () => {
    const { container } = render(<SampleBanner banner={{ label: 'Showcase sample', href: 'https://bohdiai.com/makers#plans' }} />);
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('https://bohdiai.com/makers#plans');
    expect(link.textContent).toBe('Showcase sample→. See plans and prices at BohdiAI');
    expect(container.querySelector('style')?.innerHTML).toContain('--sample-bar-h:48px');
  });
});
