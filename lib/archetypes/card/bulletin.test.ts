import { describe, it, expect } from 'vitest';
import { EMPTY_PROFILE } from '@/lib/backend/profile/profile-form';
import { nameLines, tabTarget, datePieces } from './bulletin';

describe('nameLines', () => {
  it('puts each word of the name on its own line', () => {
    expect(nameLines('Rustic Rhody')).toEqual({ lines: ['Rustic', 'Rhody'], size: 'xl' });
    expect(nameLines('  Frank  ')).toEqual({ lines: ['Frank'], size: 'xl' });
  });

  it('steps the size down so the longest word still fits', () => {
    expect(nameLines('Driftwood Co').size).toBe('l');
    expect(nameLines('Frank’s Woodworking').size).toBe('m');
    expect(nameLines('Woodturningworks Studio').size).toBe('s');
  });
});

describe('tabTarget', () => {
  it('calls the owner when there is a phone number', () => {
    expect(tabTarget({ ...EMPTY_PROFILE, phone: '(401) 555-0100', signature: 'Alex' })).toEqual({
      kind: 'call',
      href: 'tel:+14015550100',
      label: '(401) 555-0100',
    });
  });

  it('sends people to the contact form otherwise, by the owner’s name', () => {
    expect(tabTarget({ ...EMPTY_PROFILE, signature: 'Alex' })).toEqual({ kind: 'message', href: '#touch', label: 'Message Alex' });
    expect(tabTarget(EMPTY_PROFILE)).toEqual({ kind: 'message', href: '#touch', label: 'Message me' });
  });
});

describe('datePieces', () => {
  it('splits a market date into the circled day, the market and the town', () => {
    expect(datePieces({ id: 'd1', date: '2026-10-17', name: 'Harvest Craft Fair', town: 'Wickford' })).toEqual({
      day: 'Sat Oct 17',
      market: 'Harvest Craft Fair',
      town: 'Wickford',
    });
    expect(datePieces({ id: 'd2', date: '2026-12-05', name: 'Christmas on the Green', town: '' }).town).toBe('');
  });
});
