import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { keyWords } from '@/lib/site-words/words';
import { INTAKE_WORD_SPOTS } from '@/lib/intake/words';

const requireUser = vi.fn();
const onboardingSite = vi.fn();
vi.mock('@/lib/auth/session', () => ({ requireUser: () => requireUser() }));
vi.mock('@/lib/signup/onboarding', () => ({ onboardingSite: (...a: unknown[]) => onboardingSite(...a) }));
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: () => ({}) }));
vi.mock('@/lib/intake/queries', () => ({ getIntakeWords: async () => keyWords(INTAKE_WORD_SPOTS, 'intake') }));
vi.mock('next/navigation', () => ({
  redirect: (to: string): never => {
    throw new Error(`REDIRECT ${to}`);
  },
}));
vi.mock('@/components/Scene', () => ({ Scene: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock('@/components/intake/IntakeForm', () => ({ IntakeForm: () => <form aria-label="site form" /> }));

import WelcomePage from './page';

beforeEach(() => {
  requireUser.mockReset().mockResolvedValue({ id: 'u1' });
  onboardingSite.mockReset().mockResolvedValue({ tenantId: 't1', plan: 'lite', billing: 'monthly', businessName: 'Saltmarsh' });
});

describe('/welcome (onboarding)', () => {
  it('shows the site form to a maker whose paid site is waiting for it', async () => {
    render(await WelcomePage());
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('intake.page.title');
    expect(screen.getByRole('form', { name: 'site form' })).toBeInTheDocument();
    expect(onboardingSite).toHaveBeenCalledWith({}, 'u1');
  });

  it('sends anyone else to their backend', async () => {
    onboardingSite.mockResolvedValue(null);
    await expect(WelcomePage()).rejects.toThrow('REDIRECT /manage');
  });
});
