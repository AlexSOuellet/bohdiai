import { describe, it, expect } from 'vitest';
import { EMPTY_PROFILE } from '@/lib/backend/profile/profile-form';
import { nameLines, tabTarget, datePieces, torchLines, halves, ringFill } from './bulletin';

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
    expect(datePieces({ id: 'd1', date: '2026-10-17', endDate: '', name: 'Harvest Craft Fair', town: 'Wickford' })).toEqual({
      day: 'Sat Oct 17',
      market: 'Harvest Craft Fair',
      town: 'Wickford',
    });
    expect(datePieces({ id: 'd2', date: '2026-12-05', endDate: '', name: 'Christmas on the Green', town: '' }).town).toBe('');
  });
});

describe('torchLines', () => {
  it('joins short words to the word after them', () => {
    expect(torchLines('Ember & Pine')).toEqual(['Ember', '& Pine']);
    expect(torchLines('Rustic Rhody')).toEqual(['Rustic', 'Rhody']);
    expect(torchLines('House of Oak')).toEqual(['House', 'of Oak']);
  });
  it('keeps a trailing short word on the last line, and a name of only short words', () => {
    expect(torchLines('Pine & Co')).toEqual(['Pine & Co']);
    expect(torchLines('Oak Co')).toEqual(['Oak Co']);
    expect(torchLines('JB')).toEqual(['JB']);
  });
});

describe('halves', () => {
  it('splits a heading near the middle by length', () => {
    expect(halves('Sawdust in everything I own')).toEqual(['Sawdust in', 'everything I own']);
    expect(halves('No two come out the same')).toEqual(['No two come', 'out the same']);
  });
  it('leaves a one-word heading whole', () => {
    expect(halves('Hello')).toEqual(['Hello', '']);
    expect(halves('')).toEqual(['', '']);
  });
});

describe('ringFill', () => {
  it('rings the name and tag line when they fit once around', () => {
    expect(ringFill('Rustic Rhody', 'Handmade in RI')).toBe('Rustic Rhody · Handmade in RI · ');
  });
  it('repeats the name when the tag line is too long, or missing', () => {
    expect(ringFill('Ember & Pine', 'Burned by hand on Aquidneck Island')).toBe('Ember & Pine · Ember & Pine · Ember & Pine · ');
    expect(ringFill('Ember & Pine', '')).toBe('Ember & Pine · Ember & Pine · Ember & Pine · ');
  });
});
