import { describe, it, expect } from 'vitest';
import { keyWords } from '@/lib/site-words/words';
import { INTAKE_WORD_SPOTS } from './words';
import { composeReadyEmail, SIGN_IN_URL } from './ready-email';

describe('composeReadyEmail', () => {
  it('says where to sign in, in the form’s words, with no link that expires', () => {
    const words = keyWords(INTAKE_WORD_SPOTS, 'intake');
    const real = { ...words, ready: { ...words.ready, subject: '{business} is ready', greeting: 'Hi {name},', body: 'Your site for {business}.', signIn: 'Sign in with {email}.' } };
    const e = composeReadyEmail({ makerName: 'Lena', businessName: 'Salt & <Lace>', email: 'lena@example.com', words: real });
    expect(e.subject).toBe('Salt & <Lace> is ready');
    expect(e.text).toContain('Hi Lena,');
    expect(e.text).toContain('Sign in with lena@example.com.');
    expect(e.text).toContain(`intake.ready.button: ${SIGN_IN_URL}`);
    expect(e.html).toContain(`<a href="${SIGN_IN_URL}">intake.ready.button</a>`);
    expect(e.html).toContain('Salt &amp; &lt;Lace&gt;');
    expect(SIGN_IN_URL).toBe('https://app.bohdiai.com/signin');
  });
});
