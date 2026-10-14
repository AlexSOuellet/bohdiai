import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { keyWords } from '@/lib/site-words/words';
import { SHOP_WORD_SPOTS, SHOP_WORDS_PREFIX } from '@/lib/storefront/words';
import { SampleBanner } from './SampleBanner';

afterEach(cleanup);

const K = keyWords(SHOP_WORD_SPOTS, SHOP_WORDS_PREFIX);
const W = { ...K.sample, label: '[{plan}]' };

describe('SampleBanner', () => {
  it('links the plan label to the plans, says where it goes, and reserves its height', () => {
    const { container } = render(<SampleBanner banner={{ plan: 'Showcase', href: 'https://bohdiai.com/makers#plans' }} words={W} />);
    const link = screen.getByRole('link');
    expect(link.getAttribute('href')).toBe('https://bohdiai.com/makers#plans');
    expect(link.textContent).toBe(`[Showcase]${K.sample.arrow}${K.sample.linkHint}`);
    expect(container.querySelector('[aria-hidden="true"]')?.textContent).toBe(K.sample.arrow);
    expect(container.querySelector('.sr-only')?.textContent).toBe(K.sample.linkHint);
    expect(container.querySelector('style')?.innerHTML).toContain('--sample-bar-h:48px');
  });
});
