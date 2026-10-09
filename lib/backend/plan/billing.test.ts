import { describe, it, expect } from 'vitest';
import { addDays, addMonths, daysLeft, timeLeft, isBilling, longDay, money, nextRenewal, periodLeft, priceCents, quoteUpgrade, renewalCharge, todayDay } from './billing';

describe('billing dates', () => {
  it('moves by months and holds to the month’s last day', () => {
    expect(addMonths('2026-10-09', 1)).toBe('2026-11-09');
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2026-03-31', -1)).toBe('2026-02-28');
    expect(addMonths('2026-10-09', 12)).toBe('2027-10-09');
    expect(nextRenewal('2026-10-09', 'yearly')).toBe('2027-10-09');
    expect(addDays('2026-10-09', 20)).toBe('2026-10-29');
    expect(addDays('2026-12-25', 10)).toBe('2027-01-04');
    expect(daysLeft('2026-10-09', '2027-04-09')).toBe(182);
    expect(daysLeft('2026-11-01', '2026-10-29')).toBe(0);
  });

  it('says the time left the way people do', () => {
    expect(timeLeft(182, 'yearly')).toBe('about 6 months (182 days)');
    expect(timeLeft(20, 'monthly')).toBe('20 days');
    expect(timeLeft(30, 'yearly')).toBe('30 days');
    expect(timeLeft(1, 'monthly')).toBe('1 day');
  });

  it('knows how much of the period is left', () => {
    expect(periodLeft('2026-10-09', '2026-10-29', 'monthly')).toBeCloseTo(20 / 30);
    expect(periodLeft('2026-09-29', '2026-10-29', 'monthly')).toBe(1);
    expect(periodLeft('2026-11-02', '2026-10-29', 'monthly')).toBe(0);
  });

  it('says days and money plainly', () => {
    expect(longDay('2026-10-29')).toBe('October 29, 2026');
    expect(money(1500)).toBe('$15');
    expect(money(667)).toBe('$6.67');
    expect(todayDay(new Date('2026-10-09T15:00:00Z'))).toBe('2026-10-09');
    expect(isBilling('yearly')).toBe(true);
    expect(isBilling('weekly')).toBe(false);
  });

  it('prices from the pricing list', () => {
    expect(priceCents('lite', 'monthly')).toBe(1500);
    expect(priceCents('full', 'yearly')).toBe(20000);
  });
});

describe('moving up, prorated', () => {
  const monthlyShowcase = { plan: 'showcase' as const, billing: 'monthly' as const, renewsOn: '2026-10-29' };

  it('charges the difference for the rest of the month and keeps the renewal day', () => {
    const q = quoteUpgrade(monthlyShowcase, 'lite', 'monthly', '2026-10-09');
    expect(q.partCents).toBe(1000);
    expect(q.prorated).toBe(true);
    expect(q.creditCents).toBe(333);
    expect(q.todayCents).toBe(1000 - 333);
    expect(q.renewsOn).toBe('2026-10-29');
    expect(q.renewalCents).toBe(1500);
  });

  it('charges the difference for the months left in a paid year', () => {
    const yearlyLite = { plan: 'lite' as const, billing: 'yearly' as const, renewsOn: '2027-04-09' };
    const q = quoteUpgrade(yearlyLite, 'full', 'yearly', '2026-10-09');
    const left = periodLeft('2026-10-09', '2027-04-09', 'yearly');
    expect(q.todayCents).toBe(Math.round(20000 * left) - Math.round(15000 * left));
    expect(q.renewsOn).toBe('2027-04-09');
    expect(q.renewalCents).toBe(20000);
  });

  it('starts a new year today when moving from monthly to yearly, less the unused month', () => {
    const q = quoteUpgrade(monthlyShowcase, 'lite', 'yearly', '2026-10-09');
    expect(q.creditCents).toBe(333);
    expect(q.prorated).toBe(false);
    expect(q.partCents).toBe(15000);
    expect(q.todayCents).toBe(15000 - 333);
    expect(q.renewsOn).toBe('2027-10-09');
  });

  it('turns the unused part of a year into credit when a yearly site goes monthly', () => {
    // Yearly Showcase ($50), half the year left: about $25 unused. Lite monthly is $15.
    const q = quoteUpgrade({ plan: 'showcase', billing: 'yearly', renewsOn: '2027-04-09' }, 'lite', 'monthly', '2026-10-09');
    const unused = Math.round(5000 * periodLeft('2026-10-09', '2027-04-09', 'yearly'));
    expect(q.creditCents).toBe(unused);
    expect(q.todayCents).toBe(0);
    expect(q.creditLeftCents).toBe(unused - 1500);
    expect(q.renewsOn).toBe('2026-11-09');
    expect(q.renewalCents).toBe(1500);
  });

  it('does the same from yearly Lite to monthly Full', () => {
    const q = quoteUpgrade({ plan: 'lite', billing: 'yearly', renewsOn: '2027-04-09' }, 'full', 'monthly', '2026-10-09');
    expect(q.todayCents).toBe(0);
    expect(q.creditLeftCents).toBe(Math.round(15000 * periodLeft('2026-10-09', '2027-04-09', 'yearly')) - 2000);
  });

  it('uses credit already on account before she pays anything', () => {
    const q = quoteUpgrade({ plan: 'showcase', billing: 'monthly', renewsOn: '2026-10-29', creditCents: 500 }, 'lite', 'monthly', '2026-10-09');
    expect(q.accountCreditUsedCents).toBe(500);
    expect(q.todayCents).toBe(667 - 500);
    expect(q.creditLeftCents).toBe(0);
  });

  it('pays a renewal from credit first', () => {
    expect(renewalCharge(1500, 1000)).toEqual({ paidCents: 500, creditLeftCents: 0 });
    expect(renewalCharge(1500, 2000)).toEqual({ paidCents: 0, creditLeftCents: 500 });
    expect(renewalCharge(1500, 0)).toEqual({ paidCents: 1500, creditLeftCents: 0 });
  });

  it('never charges less than nothing', () => {
    const q = quoteUpgrade({ plan: 'showcase', billing: 'monthly', renewsOn: '2026-10-01' }, 'lite', 'monthly', '2026-10-09');
    expect(q.todayCents).toBe(0);
  });
});
