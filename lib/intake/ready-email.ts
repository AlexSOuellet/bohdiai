/**
 * The email a maker gets when their site is built: it's ready, sign in with the
 * email and password they chose on the form, and publish it when they're happy.
 * No link that expires; just where to sign in. Its words are the form's own.
 */
import { fill } from '@/lib/site-words/words';
import type { IntakeWords } from './queries';

export const SIGN_IN_URL = 'https://app.bohdiai.com/signin';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function composeReadyEmail(args: { makerName: string; businessName: string; email: string; words: IntakeWords }): { subject: string; text: string; html: string } {
  const r = args.words.ready;
  const greeting = fill(r.greeting, { name: args.makerName });
  const body = fill(r.body, { business: args.businessName });
  const signIn = fill(r.signIn, { email: args.email });
  const text = [greeting, '', body, '', signIn, `${r.button}: ${SIGN_IN_URL}`, '', r.signoff].join('\n');
  const html = [
    `<p>${escapeHtml(greeting)}</p>`,
    `<p>${escapeHtml(body)}</p>`,
    `<p>${escapeHtml(signIn)}</p>`,
    `<p><a href="${SIGN_IN_URL}">${escapeHtml(r.button)}</a></p>`,
    `<p>${escapeHtml(r.signoff)}</p>`,
  ].join('');
  return { subject: fill(r.subject, { business: args.businessName }), text, html };
}
