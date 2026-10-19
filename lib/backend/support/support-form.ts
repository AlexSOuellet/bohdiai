/**
 * Contact support (every backend, every plan; Alex, 2026-10-19): a maker writes to
 * BohdiAI from their backend. The site and their email are filled in for them.
 * Later replaced by an AI chatbot. Validation names what needs fixing.
 */
export const SUPPORT_MESSAGE_MAX = 4000;

export function checkSupportMessage(message: string): { ok: true; message: string } | { ok: false; error: string } {
  const text = message.trim();
  if (text === '') return { ok: false, error: 'Write your message first.' };
  if (text.length > SUPPORT_MESSAGE_MAX) return { ok: false, error: `Your message is ${text.length} characters. Keep it to ${SUPPORT_MESSAGE_MAX}.` };
  return { ok: true, message: text };
}

/** The email Alex gets. Plain text; the maker's address is the reply-to. */
export function supportEmail(input: { siteName: string; subdomain: string; email: string; message: string }): { subject: string; text: string } {
  return {
    subject: `Support: ${input.siteName}`,
    text: [`From: ${input.email}`, `Site: ${input.siteName} (${input.subdomain}.bohdiai.com)`, '', input.message].join('\n'),
  };
}
