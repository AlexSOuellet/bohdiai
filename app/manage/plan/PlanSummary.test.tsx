import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { planView } from '@/lib/backend/plan/plan';
import { PLANS } from '@/lib/site/plans';
import { PlanSummary, type PlanMode } from './PlanSummary';

const lite = PLANS.find((p) => p.id === 'maker-lite')!;
const full = PLANS.find((p) => p.id === 'maker-full')!;
const EMAIL: PlanMode = { kind: 'email', siteName: 'Saltmarsh & Lace', contactEmail: 'alex@bohdiai.com' };
const DEMO: PlanMode = { kind: 'demo' };

function show(tier: 'showcase' | 'lite' | 'full', mode: PlanMode = EMAIL, changed: string | null = null) {
  return render(<PlanSummary view={planView(tier)} mode={mode} changed={changed} />);
}

describe('Your plan', () => {
  it('shows where the site is now, with its price and what it already has', () => {
    show('showcase');
    const now = screen.getByRole('region', { name: 'Maker Showcase' });
    expect(within(now).getByText('$5 a month, or $50 a year')).toBeTruthy();
    expect(within(now).getByText('Up to 12 photos of your work, with captions')).toBeTruthy();
  });

  it('invites a move up to Lite and Full, each with its price, year deal and list', () => {
    show('showcase');
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['Maker Showcase', 'Maker Lite', 'Maker Full']);
    const up = screen.getByRole('region', { name: 'Maker Lite' });
    expect(up.getAttribute('data-tier')).toBe('lite');
    expect(within(up).getByText('$15')).toBeTruthy();
    expect(within(up).getByText('or $150 a year, two months free')).toBeTruthy();
    expect(within(up).getByText(lite.includes[0]!)).toBeTruthy();
    expect(within(up).getByText('What you’d add')).toBeTruthy();
  });

  it('emails Alex from a real site, and offers no move down', () => {
    show('lite');
    expect(screen.getByRole('link', { name: 'Upgrade to Maker Full' }).getAttribute('href')).toContain('mailto:alex@bohdiai.com');
    expect(screen.queryByRole('link', { name: /Move down/ })).toBeNull();
  });

  it('sends a demo site to checkout to move up, and to the confirm page to move down', () => {
    show('lite', DEMO);
    expect(screen.getByRole('link', { name: 'Upgrade to Maker Full' }).getAttribute('href')).toBe('/manage/plan/change?to=full');
    expect(screen.getByRole('link', { name: 'Move down to Maker Showcase' }).getAttribute('href')).toBe('/manage/plan/change?to=showcase');
  });

  it('opens Full’s list with Lite', () => {
    show('lite');
    const up = screen.getByRole('region', { name: 'Maker Full' });
    expect(within(up).getByText('Everything in Lite, plus')).toBeTruthy();
    expect(within(up).getByText(full.includes[0]!)).toBeTruthy();
  });

  it('shows nothing above Full, and always says moving down keeps everything', () => {
    show('full', DEMO);
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1);
    expect(screen.queryByText(/Ready for more/)).toBeNull();
    expect(screen.getAllByRole('link', { name: /Move down/ }).map((a) => a.textContent)).toEqual(['Move down to Maker Lite', 'Move down to Maker Showcase']);
    expect(screen.getByText(/Moving down a plan never deletes anything/)).toBeTruthy();
  });

  it('says where she is after a change', () => {
    show('lite', DEMO, 'You’re now on Maker Lite.');
    expect(screen.getByRole('status').textContent).toBe('You’re now on Maker Lite.');
  });
});
