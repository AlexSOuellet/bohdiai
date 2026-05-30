import { describe, it, expect } from 'vitest';
import { inferGenderFromName, personPhrase } from './name-gender';

describe('inferGenderFromName', () => {
  it('returns female default for undefined', () => {
    expect(inferGenderFromName(undefined)).toBe('female');
  });

  it('returns female default for empty string', () => {
    expect(inferGenderFromName('')).toBe('female');
  });

  it('returns female default for whitespace-only string', () => {
    expect(inferGenderFromName('   ')).toBe('female');
  });

  it('detects a clearly male name', () => {
    expect(inferGenderFromName('James')).toBe('male');
  });

  it('detects a clearly female name', () => {
    expect(inferGenderFromName('Sarah')).toBe('female');
  });

  it('is case insensitive', () => {
    expect(inferGenderFromName('JAMES')).toBe('male');
    expect(inferGenderFromName('sarah')).toBe('female');
  });

  it('uses only the first word of a multi-word name', () => {
    expect(inferGenderFromName('James Smith')).toBe('male');
    expect(inferGenderFromName('Sarah Johnson')).toBe('female');
  });

  it('falls back to female for unknown names', () => {
    expect(inferGenderFromName('Zxqwfgh')).toBe('female');
  });

  it('falls back to female for unisex names that appear in both sets', () => {
    // 'sam', 'chris', 'pat' all appear in both male and female lists.
    expect(inferGenderFromName('sam')).toBe('female');
    expect(inferGenderFromName('chris')).toBe('female');
    expect(inferGenderFromName('pat')).toBe('female');
  });

  it('trims surrounding whitespace', () => {
    expect(inferGenderFromName('  John  ')).toBe('male');
  });
});

describe('personPhrase', () => {
  it('returns male phrasing', () => {
    expect(personPhrase('male')).toEqual({ noun: 'a man', poss: 'his', subj: 'he' });
  });

  it('returns female phrasing', () => {
    expect(personPhrase('female')).toEqual({ noun: 'a woman', poss: 'her', subj: 'she' });
  });
});
