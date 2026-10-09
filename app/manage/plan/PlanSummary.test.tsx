import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { planView } from '@/lib/backend/plan/plan';
import { PLANS } from '@/lib/site/plans';
import { PlanSummary } from './PlanSummary';

const lite = PLANS.find((p) => p.id === 'maker-lite')!;
const full = PLANS.find((p) => p.id === 'maker-full')!;

function show(tier: 'showcase' | 'lite' | 'full') {
  return render(<PlanSummary view={planView(tier)} siteName="Saltmarsh & Lace" contactEmail="alex@bohdiai.com" />);
}

describe('Your plan', () => {
  it('shows where the site is now, with its price and what it already has', () => {
    show('showcase');
    const now = screen.getByRole('region', { name: 'Maker Showcase' });
    expect(within(now).getByText('$5 a month, or $50 a year')).toBeTruthy();
    expect(within(now).getByText('Up to 12 photos of your work, with captions')).toBeTruthy();
  });

  it('invites a move up to Lite and Full, each with its price, year deal, list and a button', () => {
    show('showcase');
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['Maker Showcase', 'Maker Lite', 'Maker Full']);
    const up = screen.getByRole('region', { name: 'Maker Lite' });
    expect(up.getAttribute('data-tier')).toBe('lite');
    expect(within(up).getByText('$15')).toBeTruthy();
    expect(within(up).getByText('or $150 a year, two months free')).toBeTruthy();
    expect(within(up).getByText(lite.includes[0]!)).toBeTruthy();
    expect(within(up).getByText('What you’d add')).toBeTruthy();
    expect(within(up).getByRole('link', { name: 'Upgrade to Maker Lite' }).getAttribute('href')).toContain('mailto:alex@bohdiai.com');
  });

  it('opens Full’s list with Lite', () => {
    show('lite');
    const up = screen.getByRole('region', { name: 'Maker Full' });
    expect(within(up).getByText('Everything in Lite, plus')).toBeTruthy();
    expect(within(up).getByText(full.includes[0]!)).toBeTruthy();
  });

  it('shows nothing above Full, and always says moving down keeps everything', () => {
    show('full');
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1);
    expect(screen.queryByText(/Ready for more/)).toBeNull();
    expect(screen.getByText(/Moving down a plan never deletes anything/)).toBeTruthy();
  });
});
