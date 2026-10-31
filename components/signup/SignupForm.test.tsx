import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { keyWords } from '@/lib/site-words/words';
import { INTAKE_WORD_SPOTS } from '@/lib/intake/words';
import { SIGNUP_FIELD } from '@/lib/signup/request';
import { SignupForm, type SignupPlan } from './SignupForm';

const words = keyWords(INTAKE_WORD_SPOTS, 'intake');
const plans: SignupPlan[] = [
  { plan: 'free', name: 'Maker Free', monthly: 0, yearly: 0 },
  { plan: 'showcase', name: 'Maker Showcase', monthly: 5, yearly: 50 },
  { plan: 'lite', name: 'Maker Market', monthly: 15, yearly: 150 },
  { plan: 'full', name: 'Maker Full', monthly: 25, yearly: 250 },
];
const fetchMock = vi.fn();
const assign = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  assign.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  vi.stubGlobal('location', { ...window.location, assign });
});
afterEach(() => vi.unstubAllGlobals());

function setup(initialPlan: SignupPlan['plan'] | null = 'full', back = false) {
  const u = userEvent.setup({ delay: null });
  render(<SignupForm words={words} plans={plans} initialPlan={initialPlan} initialBilling="yearly" back={back} contactEmail="alex@example.com" />);
  return u;
}

async function fillIn(u: ReturnType<typeof userEvent.setup>): Promise<void> {
  await u.type(screen.getByLabelText('intake.you.name'), 'Lena');
  await u.type(screen.getByLabelText('intake.you.business'), 'Saltmarsh');
  await u.type(screen.getByLabelText('intake.you.email'), 'lena@example.com');
  await u.type(screen.getByLabelText('intake.you.password'), 'tide pools 22');
}

describe('SignupForm', () => {
  it('shows every plan, Free included, with the one picked on the pricing page chosen', () => {
    setup('full');
    for (const p of plans) expect(screen.getByRole('radio', { name: new RegExp(p.name) })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Maker Full/ })).toBeChecked();
    expect(screen.getByText('intake.signup.free')).toBeInTheDocument();
  });

  it('has no monthly or yearly choice on Free', async () => {
    const u = setup('full');
    expect(screen.getByRole('radio', { name: 'intake.plan.yearly' })).toBeInTheDocument();
    await u.click(screen.getByRole('radio', { name: /Maker Free/ }));
    expect(screen.queryByRole('radio', { name: 'intake.plan.yearly' })).toBeNull();
  });

  it('sends the plan and account, then goes straight to Stripe’s page', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ url: 'https://checkout.stripe.com/c/cs_1' }), { status: 200 }));
    const u = setup('full');
    await fillIn(u);
    await u.click(screen.getByRole('button', { name: 'intake.signup.button' }));
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/signup');
    expect(JSON.parse(String(init.body))).toMatchObject({
      [SIGNUP_FIELD.plan]: 'full',
      [SIGNUP_FIELD.billing]: 'yearly',
      [SIGNUP_FIELD.email]: 'lena@example.com',
      [SIGNUP_FIELD.password]: 'tide pools 22',
    });
    expect(assign).toHaveBeenCalledWith('https://checkout.stripe.com/c/cs_1');
  });

  it('names what’s missing before sending anything', async () => {
    const u = setup(null);
    await u.click(screen.getByRole('button', { name: 'intake.signup.button' }));
    expect(screen.getByRole('alert')).toHaveTextContent('intake.errors.plan');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('shows the route’s problem in the form’s own words', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ problem: { spot: 'accountExists', values: {} } }), { status: 400 }));
    const u = setup('lite');
    await fillIn(u);
    await u.click(screen.getByRole('button', { name: 'intake.signup.button' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('intake.errors.accountExists');
    expect(assign).not.toHaveBeenCalled();
  });

  it('says it didn’t send when the network fails', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    const u = setup('lite');
    await fillIn(u);
    await u.click(screen.getByRole('button', { name: 'intake.signup.button' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('intake.errors.failed');
  });

  it('tells someone back from Stripe how to pick up where they left off', () => {
    setup('full', true);
    expect(screen.getByRole('status')).toHaveTextContent('intake.signup.back');
  });
});
