import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup, screen } from '@testing-library/react';
import FooterClassic from './index';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('FooterClassic', () => {
  it('renders the shop name in the wordmark', () => {
    render(<FooterClassic content={{ shopName: 'Flame Works' }} />);
    const wordmark = screen.getByLabelText('Flame Works — Home');
    expect(wordmark.textContent).toBe('Flame Works');
  });

  it('renders the current year in the credit line', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2027-03-15'));
    render(<FooterClassic content={{ shopName: 'Flame Works' }} />);
    expect(screen.getByText(/© 2027 Flame Works/)).toBeTruthy();
  });

  it('renders the BohdiAI credit link with the right href', () => {
    render(<FooterClassic content={{ shopName: 'Flame Works' }} />);
    const credit = screen.getByText('BohdiAI');
    expect(credit.getAttribute('href')).toBe('https://bohdiai.com');
  });

  it('always renders Terms and Privacy links', () => {
    render(<FooterClassic content={{ shopName: 'Flame Works' }} />);
    expect(screen.getByText('Terms').getAttribute('href')).toBe('/terms');
    expect(screen.getByText('Privacy').getAttribute('href')).toBe('/privacy');
  });

  it('renders nav links from the sections JSON', () => {
    render(
      <FooterClassic
        content={{ shopName: 'Flame Works', sections: JSON.stringify(['shop', 'contact', 'gallery']) }}
      />,
    );
    expect(screen.getByText('Shop').getAttribute('href')).toBe('/shop');
    expect(screen.getByText('Contact').getAttribute('href')).toBe('/contact');
    expect(screen.getByText('Gallery').getAttribute('href')).toBe('/gallery');
  });

  it('falls back to shop + contact when sections is empty', () => {
    render(<FooterClassic content={{ shopName: 'Flame Works' }} />);
    expect(screen.getByText('Shop')).toBeTruthy();
    // 'Contact' appears in nav, ensure it's at least one link
    expect(screen.getAllByText('Contact').length).toBeGreaterThan(0);
  });

  it('ignores invalid section keys', () => {
    render(
      <FooterClassic
        content={{ shopName: 'Flame Works', sections: JSON.stringify(['shop', 'bogus', 'about']) }}
      />,
    );
    expect(screen.getByText('Shop')).toBeTruthy();
    expect(screen.getByText('About')).toBeTruthy();
    expect(screen.queryByText('bogus')).toBeNull();
  });
});
