/**
 * Invite and password-reset emails for site owners (spec §1). The link carries a
 * Supabase hashed token to /auth/confirm on the app host, which verifies it and
 * starts the session. Setting a password only ever happens through such a link.
 * Dependencies are injected so this is testable without Supabase or Resend.
 */
export type AuthLinkKind = 'invite' | 'recovery';

export function confirmUrl(appOrigin: string, hashedToken: string, kind: AuthLinkKind): string {
  const u = new URL('/auth/confirm', appOrigin);
  u.searchParams.set('token_hash', hashedToken);
  u.searchParams.set('type', kind);
  return u.toString();
}

const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function composeAuthEmail(input: { kind: AuthLinkKind; siteName: string; link: string }): {
  subject: string;
  text: string;
  html: string;
} {
  const invite = input.kind === 'invite';
  const subject = invite ? `Your ${input.siteName} backend is ready` : `Reset your ${input.siteName} password`;
  const lead = invite
    ? `Your backend for ${input.siteName} is ready. Use the link below to set your password and sign in.`
    : `Someone asked to reset the password for ${input.siteName}. If it was you, use the link below to reset your password. If not, you can ignore this email.`;
  const action = invite ? 'Set your password' : 'Reset your password';
  const text = `${lead}\n\n${action}: ${input.link}\n\nThe link works once and expires in 24 hours.\n\n— BohdiAI`;
  const html = `<p>${escapeHtml(lead)}</p><p><a href="${escapeHtml(input.link)}">${action}</a></p><p>The link works once and expires in 24 hours.</p><p>— BohdiAI</p>`;
  return { subject, text, html };
}

type GenerateLink = (args: { type: AuthLinkKind; email: string }) => Promise<{
  data: { properties: { hashed_token: string } } | null;
  error: { message: string } | null;
}>;
type Send = (msg: { to: string; subject: string; text: string; html: string }) => Promise<{ error: { message: string } | null }>;

export async function sendAuthLink(input: {
  kind: AuthLinkKind;
  email: string;
  siteName: string;
  appOrigin: string;
  generateLink: GenerateLink;
  send: Send;
}): Promise<void> {
  const { data, error } = await input.generateLink({ type: input.kind, email: input.email });
  if (error !== null || data === null) throw new Error(`Could not create the sign-in link: ${error?.message ?? 'no link'}`);
  const link = confirmUrl(input.appOrigin, data.properties.hashed_token, input.kind);
  const mail = composeAuthEmail({ kind: input.kind, siteName: input.siteName, link });
  const sent = await input.send({ to: input.email, ...mail });
  if (sent.error !== null) throw new Error(`Could not send the email: ${sent.error.message}`);
}
