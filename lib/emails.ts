import { serverEnv } from './env';

export function confirmationEmail(token: string): { subject: string; html: string; text: string } {
  const url = `${serverEnv().SITE_URL}/confirm?token=${encodeURIComponent(token)}`;
  const subject = 'Confirm your spot on the BohdiAI waitlist';
  const text = [
    'Thanks for signing up for the BohdiAI waitlist.',
    '',
    'One quick click confirms it’s really you:',
    url,
    '',
    'If you didn’t sign up, ignore this email and nothing happens.',
    '',
    '— Alex',
    'BohdiAI',
  ].join('\n');
  const html = baseTemplate(`
    <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-weight:400;font-size:24px;color:#1f1a14;">Confirm your spot</h1>
    <p style="margin:0 0 20px;color:#3a3127;">Thanks for signing up for the BohdiAI waitlist. One quick click confirms it&rsquo;s really you:</p>
    <p style="margin:0 0 28px;"><a href="${escapeHtml(url)}" style="display:inline-block;background:#1f1a14;color:#fbf8f2;padding:14px 22px;border-radius:999px;text-decoration:none;font-family:Arial,sans-serif;font-size:14px;letter-spacing:0.02em;">Confirm my email</a></p>
    <p style="margin:0 0 8px;color:#7a6a58;font-size:13px;">Or paste this link into your browser:</p>
    <p style="margin:0 0 28px;word-break:break-all;color:#7a6a58;font-size:13px;"><a href="${escapeHtml(url)}" style="color:#bf7a1f;">${escapeHtml(url)}</a></p>
    <p style="margin:0;color:#7a6a58;font-size:13px;">If you didn&rsquo;t sign up, you can ignore this email and nothing will happen.</p>
    <p style="margin:24px 0 0;color:#3a3127;">&mdash; Alex<br/>BohdiAI</p>
  `);
  return { subject, html, text };
}

export function welcomeEmail(type: 'founder' | 'notify'): {
  subject: string;
  html: string;
  text: string;
} {
  const subject =
    type === 'founder' ? 'You’re on the BohdiAI founder list' : 'You’re on the BohdiAI waitlist';
  const greeting =
    type === 'founder'
      ? 'You&rsquo;re on the founder list. That means you&rsquo;ll hear from me first when beta opens, and you&rsquo;ll have a real say in what gets built.'
      : 'You&rsquo;re on the waitlist. I&rsquo;ll send you a note when public access opens — and the occasional honest update on what we&rsquo;re building. No promo blasts.';
  const text = [
    type === 'founder'
      ? 'Welcome to the BohdiAI founder list.'
      : 'Welcome to the BohdiAI waitlist.',
    '',
    type === 'founder'
      ? 'You’ll hear from me first when beta opens, and you’ll have a real say in what gets built.'
      : 'I’ll send you a note when public access opens, plus the occasional honest update. No promo blasts.',
    '',
    'In the meantime, the Witsend Breakthroughs community on Skool is the best place to start: https://www.skool.com/wits-end-breakthrough-7869',
    '',
    'Reply to this email anytime — it goes to me directly.',
    '',
    '— Alex',
    'BohdiAI',
  ].join('\n');
  const html = baseTemplate(`
    <h1 style="margin:0 0 16px;font-family:Georgia,serif;font-weight:400;font-size:24px;color:#1f1a14;">${type === 'founder' ? 'Welcome to the founder list.' : 'You&rsquo;re on the waitlist.'}</h1>
    <p style="margin:0 0 20px;color:#3a3127;">${greeting}</p>
    <p style="margin:0 0 20px;color:#3a3127;">In the meantime, the <a href="https://www.skool.com/wits-end-breakthrough-7869" style="color:#bf7a1f;">Witsend Breakthroughs community</a> on Skool is the best place to start &mdash; live weekly sessions and real conversations with other small business owners thinking through the same things.</p>
    <p style="margin:0;color:#3a3127;">Reply to this email anytime &mdash; it goes to me directly.</p>
    <p style="margin:24px 0 0;color:#3a3127;">&mdash; Alex<br/>BohdiAI</p>
  `);
  return { subject, html, text };
}

function baseTemplate(inner: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f7f1e6;font-family:Arial,sans-serif;color:#2a241c;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f1e6;padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fbf8f2;border:1px solid #efe5d0;border-radius:16px;padding:32px;">
          <tr><td>${inner}</td></tr>
        </table>
      </td></tr>
    </table>
  </body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
