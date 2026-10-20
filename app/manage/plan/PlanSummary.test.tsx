import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { planView } from '@/lib/backend/plan/plan';
import { PLANS } from '@/lib/site/plans';
vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: vi.fn() }),
  unstable_rethrow: () => undefined,
}));
vi.mock('@/lib/backend/plan/actions', () => ({
  cancelScheduledChange: vi.fn(),
  skipToRenewal: vi.fn(),
  setDemoBilling: vi.fn(),
}));

const { PlanSummary } = await import('./PlanSummary');
import type { PlanMode } from './PlanSummary';

const lite = PLANS.find((p) => p.id === 'maker-lite')!;
const full = PLANS.find((p) => p.id === 'maker-full')!;
const EMAIL: PlanMode = {
  kind: 'email',
  siteName: 'Saltmarsh & Lace',
  contactEmail: 'alex@bohdiai.com',
};
const DEMO: PlanMode = { kind: 'demo' };

function show(
  tier: 'showcase' | 'lite' | 'full',
  mode: PlanMode = EMAIL,
  changed: string | null = null,
) {
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
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Maker Showcase',
      'Maker Market',
      'Maker Full',
    ]);
    const up = screen.getByRole('region', { name: 'Maker Market' });
    expect(up.getAttribute('data-tier')).toBe('lite');
    expect(within(up).getByText('$15')).toBeTruthy();
    expect(within(up).getByText('or $150 a year, two months free')).toBeTruthy();
    expect(within(up).getByText(lite.includes[0]!)).toBeTruthy();
    expect(within(up).getByText('What you’d add')).toBeTruthy();
  });

  it('emails Alex from a real site, and offers no move down', () => {
    show('lite');
    expect(
      screen.getByRole('link', { name: 'Upgrade to Maker Full' }).getAttribute('href'),
    ).toContain('mailto:alex@bohdiai.com');
    expect(screen.queryByRole('link', { name: /Downgrade to/ })).toBeNull();
  });

  it('sends a demo site to checkout to move up, and to the confirm page to move down', () => {
    show('lite', DEMO);
    expect(screen.getByRole('link', { name: 'Upgrade to Maker Full' }).getAttribute('href')).toBe(
      '/manage/plan/change?to=full',
    );
    expect(
      screen.getByRole('link', { name: 'Downgrade to Maker Showcase' }).getAttribute('href'),
    ).toBe('/manage/plan/change?to=showcase');
  });

  it('opens Full’s list with Lite', () => {
    show('lite');
    const up = screen.getByRole('region', { name: 'Maker Full' });
    expect(within(up).getByText('Everything in Maker Market, plus')).toBeTruthy();
    expect(within(up).getByText(full.includes[0]!)).toBeTruthy();
  });

  it('shows nothing above Full, and always says moving down keeps everything', () => {
    show('full', DEMO);
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1);
    expect(screen.queryByText(/Ready for more/)).toBeNull();
    expect(screen.getAllByRole('link', { name: /Downgrade to/ }).map((a) => a.textContent)).toEqual(
      ['Downgrade to Maker Market', 'Downgrade to Maker Showcase'],
    );
    expect(screen.getByText(/Downgrading never deletes anything/)).toBeTruthy();
  });

  it('says where she is after a change', () => {
    show('lite', DEMO, 'You’re now on Maker Market.');
    expect(screen.getByText('You’re now on Maker Market.').closest('[role="status"]')).not.toBeNull();
  });

  it('shows billing, renewal and credit, and on the demo the billing switch', () => {
    render(
      <PlanSummary
        view={planView('lite')}
        mode={DEMO}
        terms={{
          billing: 'monthly',
          renewsOn: '2026-11-09',
          next: null,
          nextBilling: null,
          creditCents: 1000,
        }}
      />,
    );
    expect(
      screen.getByText(/Billed monthly\. Renews November 9, 2026 for \$5, after credit\./),
    ).toBeTruthy();
    expect(
      screen.getByText('$10 credit on your account, used on your next bills first.'),
    ).toBeTruthy();
    const group = screen.getByRole('group', { name: 'Demo only: try monthly or yearly billing' });
    expect(
      within(group).getByRole('button', { name: 'Monthly' }).getAttribute('aria-pressed'),
    ).toBe('true');
    // Nothing is waiting, so there's no move to play out.
    expect(screen.queryByRole('note')).toBeNull();
  });

  it('shows a waiting move down with Keep, and hides the move-down links', () => {
    render(
      <PlanSummary
        view={planView('full')}
        mode={DEMO}
        terms={{
          billing: 'yearly',
          renewsOn: '2027-04-09',
          next: 'showcase',
          nextBilling: 'monthly',
          creditCents: 0,
        }}
      />,
    );
    expect(
      screen.getByRole('heading', { name: 'Downgrading to Maker Showcase on April 9, 2027' }),
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Keep Maker Full' })).toBeTruthy();
    expect(
      screen.getByText(/Renews April 9, 2027 as Maker Showcase, billed monthly, for \$5\./),
    ).toBeTruthy();
    expect(screen.queryByRole('link', { name: /Downgrade to/ })).toBeNull();
    // On the demo, a note says what a real site would do and plays the move out now.
    expect(screen.getByRole('note').textContent).toContain('On a real site, your move to Maker Showcase happens on April 9, 2027, when your plan renews.');
    expect(screen.getByRole('button', { name: 'Move to Maker Showcase now' })).toBeTruthy();
  });

  it('shows no demo buttons on a real site', () => {
    render(
      <PlanSummary
        view={planView('lite')}
        mode={EMAIL}
        terms={{
          billing: 'monthly',
          renewsOn: '2026-11-09',
          next: null,
          nextBilling: null,
          creditCents: 0,
        }}
      />,
    );
    expect(screen.queryByRole('button', { name: /demo/ })).toBeNull();
  });

  it('a free site says so, and shows the price of any plan it would pay for', () => {
    render(<PlanSummary view={planView('showcase')} mode={DEMO} terms={{ billing: 'monthly', renewsOn: '2026-11-09', next: null, nextBilling: null, creditCents: 0, comp: 'showcase' }} />);
    expect(screen.getByText('Free for you')).toBeTruthy();
    expect(screen.getByText('Nothing to pay.')).toBeTruthy();
    expect(screen.getAllByText('Free for you')).toHaveLength(1);
  });

  it('free on every plan marks the plans above as free too', () => {
    render(<PlanSummary view={planView('showcase')} mode={DEMO} terms={{ billing: 'monthly', renewsOn: '2026-11-09', next: null, nextBilling: null, creditCents: 0, comp: 'free' }} />);
    expect(screen.getAllByText('Free for you')).toHaveLength(3);
  });
});
