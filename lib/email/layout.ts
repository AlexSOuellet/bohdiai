/**
 * The look of every email BohdiAI sends a maker (Alex, 2026-11-06): the site's dark
 * ember, one big honey heading, one honey button, and Alex's face and name at the
 * bottom, because the maker is hearing from a person. Email clients ignore style
 * sheets and layout, so this is tables and inline styles on purpose; the rule
 * against inline styles is for sites.
 *
 * Every new email to a maker uses this, and joins the samples on the admin's Emails
 * tab (lib/founder/email-samples.ts). Alex, 2026-11-06: all future emails keep this look.
 */
import { SITE_CONTACT_EMAIL } from '@/lib/site/contact';

export const EMAIL_ASSET_BASE = 'https://bohdiai.com';

export type EmailButton = { label: string; url: string };

export type EmailContent = {
  heading: string;
  /** The body, one paragraph each. */
  paragraphs: readonly string[];
  button?: EmailButton | undefined;
  /** Small print under the button: how long a link lasts, who can ignore this. */
  small?: readonly string[] | undefined;
  /** Where the images come from; the admin's preview uses its own address. */
  assetBase?: string | undefined;
};

const INK = '#0a0805';
const PANEL = '#15110a';
const TEXT = '#f3ede0';
const SOFT = '#d8d2c4';
const MUTED = '#a89d8a';
const HONEY = '#f3c97a';
const FONT = "Manrope,'Segoe UI',Helvetica,Arial,sans-serif";

export const escapeHtml = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function button({ label, url }: EmailButton): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 8px"><tr><td bgcolor="${HONEY}" style="border-radius:999px"><a href="${escapeHtml(url)}" style="display:inline-block;padding:15px 32px;border-radius:999px;background:${HONEY};color:${INK};font-family:${FONT};font-size:16px;font-weight:700;text-decoration:none">${escapeHtml(label)}</a></td></tr></table>`;
}

const paragraph = (text: string): string => `<p style="margin:0 0 16px;color:${SOFT};font-family:${FONT};font-size:16px;line-height:1.65">${escapeHtml(text)}</p>`;
const smallPrint = (text: string): string => `<p style="margin:12px 0 0;color:${MUTED};font-family:${FONT};font-size:13px;line-height:1.55">${escapeHtml(text)}</p>`;

function signature(assets: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td width="68" valign="middle" style="padding-right:14px"><img src="${assets}/email/alex.png" width="68" height="68" alt="Alex Ouellet" style="display:block;width:68px;height:68px;border:0;border-radius:50%"></td>
<td valign="middle" style="font-family:${FONT}"><div style="color:${TEXT};font-size:16px;font-weight:700;line-height:1.3">Alex Ouellet</div><div style="color:${MUTED};font-size:14px;line-height:1.4">Founder of BohdiAI</div><a href="mailto:${SITE_CONTACT_EMAIL}" style="color:${HONEY};font-size:14px;line-height:1.5;text-decoration:none">${SITE_CONTACT_EMAIL}</a></td>
</tr></table>`;
}

/** The whole email. Words are escaped here, so callers pass plain text. */
export function renderEmail(content: EmailContent): string {
  const assets = content.assetBase ?? EMAIL_ASSET_BASE;
  const preview = content.paragraphs[0] ?? content.heading;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark"><title>${escapeHtml(content.heading)}</title></head>
<body style="margin:0;padding:0;background:${INK}" bgcolor="${INK}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${INK}">${escapeHtml(preview)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${INK}" style="background:${INK}"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px">
<tr><td style="padding:0 8px 28px"><img src="${assets}/email/wordmark.png" width="146" height="44" alt="BohdiAI" style="display:block;width:146px;height:44px;border:0;color:${HONEY};font-family:${FONT};font-size:22px;font-weight:800"></td></tr>
<tr><td bgcolor="${PANEL}" style="background:${PANEL};border-radius:20px;padding:36px 32px 32px">
<h1 style="margin:0 0 20px;color:${HONEY};font-family:${FONT};font-size:32px;font-weight:800;line-height:1.15;letter-spacing:-0.02em">${escapeHtml(content.heading)}</h1>
${content.paragraphs.map(paragraph).join('')}
${content.button === undefined ? '' : button(content.button)}
${(content.small ?? []).map(smallPrint).join('')}
</td></tr>
<tr><td style="padding:28px 8px 0">${signature(assets)}</td></tr>
</table></td></tr></table></body></html>`;
}
