import { describe, it, expect } from 'vitest';
import { answerStatus } from './answer';

describe('answerStatus', () => {
  it('a named problem shows in the form’s own words', () => {
    expect(answerStatus({ problem: { spot: 'piecePhoto', values: { n: 3, junk: { a: 1 } } } }, 'failed')).toEqual({
      kind: 'problem',
      problem: { spot: 'piecePhoto', values: { n: 3 } },
    });
    expect(answerStatus({ problem: { spot: 'photoUnread' } }, 'failed')).toEqual({ kind: 'problem', problem: { spot: 'photoUnread', values: {} } });
    expect(answerStatus({ problem: { spot: 'email', values: null } }, 'failed')).toEqual({ kind: 'problem', problem: { spot: 'email', values: {} } });
  });

  it('the limiter’s message shows as it came', () => {
    expect(answerStatus({ error: 'Please wait a minute.' }, 'failed')).toEqual({ kind: 'message', message: 'Please wait a minute.' });
  });

  it('anything else is "it didn’t send"', () => {
    for (const body of [null, 'oops', { failed: true }, { error: '' }, { problem: { spot: 'nope' } }, { problem: null }]) {
      expect(answerStatus(body, 'failed')).toEqual({ kind: 'message', message: 'failed' });
    }
  });
});
