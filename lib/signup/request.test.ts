import { describe, it, expect } from 'vitest';
import { checkSignup, parseSignup, SIGNUP_FIELD } from './request';

const good = {
  [SIGNUP_FIELD.plan]: 'full',
  [SIGNUP_FIELD.billing]: 'yearly',
  [SIGNUP_FIELD.name]: ' Lena ',
  [SIGNUP_FIELD.business]: ' Saltmarsh ',
  [SIGNUP_FIELD.email]: ' Lena@Example.com ',
  [SIGNUP_FIELD.password]: 'tide pools 22',
};

describe('parseSignup', () => {
  it('hands back the plan, who they are and the password', () => {
    const parsed = parseSignup(good);
    expect(parsed).toEqual({
      kind: 'ok',
      fields: { plan: 'full', billing: 'yearly', makerName: 'Lena', businessName: 'Saltmarsh', email: 'lena@example.com' },
      password: 'tide pools 22',
    });
  });

  it('takes Free, always monthly', () => {
    const parsed = parseSignup({ ...good, [SIGNUP_FIELD.plan]: 'free', [SIGNUP_FIELD.billing]: 'yearly' });
    expect(parsed.kind === 'ok' && parsed.fields).toMatchObject({ plan: 'free', billing: 'monthly' });
  });

  it('names the first thing wrong, top of the form first', () => {
    expect(parseSignup({ ...good, [SIGNUP_FIELD.plan]: 'gold' })).toEqual({ kind: 'invalid', problem: { spot: 'plan', values: {} } });
    expect(parseSignup({ ...good, [SIGNUP_FIELD.name]: ' ' })).toMatchObject({ problem: { spot: 'name' } });
    expect(parseSignup({ ...good, [SIGNUP_FIELD.business]: '' })).toMatchObject({ problem: { spot: 'business' } });
    expect(parseSignup({ ...good, [SIGNUP_FIELD.email]: 'lena' })).toMatchObject({ problem: { spot: 'email' } });
    expect(parseSignup({ ...good, [SIGNUP_FIELD.password]: 'short' })).toMatchObject({ problem: { spot: 'password', values: { min: 8, max: 72 } } });
    expect(parseSignup({ ...good, [SIGNUP_FIELD.business]: 'x'.repeat(121) })).toMatchObject({ problem: { spot: 'tooLong' } });
  });

  it('treats a filled honeypot as a bot', () => {
    expect(parseSignup({ ...good, [SIGNUP_FIELD.honeypot]: 'Acme' })).toEqual({ kind: 'spam' });
  });

  it('reads nothing from a body that isn’t an object', () => {
    expect(parseSignup(null)).toMatchObject({ kind: 'invalid', problem: { spot: 'plan' } });
  });
});

describe('checkSignup', () => {
  it('is happy with a ready draft', () => {
    expect(checkSignup({ plan: 'showcase', billing: 'monthly', makerName: 'A', businessName: 'B', email: 'a@b.co', password: '12345678' })).toBeNull();
  });
});
