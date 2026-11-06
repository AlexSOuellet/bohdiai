/**
 * The email a maker gets when their site is built: it's ready, sign in with the
 * email and password they chose on the form, and publish it when they're happy.
 * No link that expires; just where to sign in. Its words are the form's own.
 */
import { fill } from '@/lib/site-words/words';
import { renderEmail } from '@/lib/email/layout';
import type { IntakeWords } from './queries';

export const SIGN_IN_URL = 'https://app.bohdiai.com/signin';

export function composeReadyEmail(args: { makerName: string; businessName: string; email: string; words: IntakeWords; assetBase?: string }): { subject: string; text: string; html: string } {
  const r = args.words.ready;
  const greeting = fill(r.greeting, { name: args.makerName });
  const body = fill(r.body, { business: args.businessName });
  const signIn = fill(r.signIn, { email: args.email });
  const text = [greeting, '', body, '', signIn, `${r.button}: ${SIGN_IN_URL}`, '', r.signoff].join('\n');
  const html = renderEmail({ heading: fill(r.heading, { business: args.businessName }), paragraphs: [greeting, body, signIn], button: { label: r.button, url: SIGN_IN_URL }, assetBase: args.assetBase });
  return { subject: fill(r.subject, { business: args.businessName }), text, html };
}
