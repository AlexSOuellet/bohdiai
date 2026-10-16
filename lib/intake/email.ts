/** The email Alex gets when a maker sends the intake form. Its words are the form's own. */
import { fill } from '@/lib/site-words/words';
import type { IntakeWords } from './queries';
import type { IntakeFields, IntakePiece } from './request';

export type IntakeEmail = { subject: string; text: string; html: string };

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function money(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export function composeIntakeEmail(args: { id: string; fields: IntakeFields; pieces: readonly IntakePiece[]; hasPortrait: boolean; words: IntakeWords }): IntakeEmail {
  const { id, fields: f, pieces, hasPortrait, words } = args;
  const e = words.email;
  const mood = f.family === null ? words.mood.pick.label : words.families[f.family].label;
  const rows: [string, string][] = [
    [e.name, f.makerName],
    [e.business, f.businessName],
    [e.email, f.email],
    [e.makes, f.makes],
    [e.mood, mood],
    [e.portrait, hasPortrait ? e.portraitYes : e.portraitNo],
  ];
  const pieceLines = pieces.map((p) => {
    const price = p.priceCents === null ? e.priceAsk : money(p.priceCents);
    return { head: `${p.name} (${price})`, body: p.description };
  });
  const photos = fill(e.photos, { id });

  const text = [
    e.intro,
    '',
    ...rows.map(([k, v]) => `${k}: ${v}`),
    '',
    `${e.about}:`,
    f.about,
    '',
    `${e.pieces}:`,
    ...pieceLines.map((p) => (p.body === null ? `- ${p.head}` : `- ${p.head}: ${p.body}`)),
    '',
    photos,
  ].join('\n');

  const html = [
    `<p>${escapeHtml(e.intro)}</p>`,
    `<table cellpadding="4">${rows.map(([k, v]) => `<tr><td><strong>${escapeHtml(k)}</strong></td><td>${escapeHtml(v)}</td></tr>`).join('')}</table>`,
    `<p><strong>${escapeHtml(e.about)}</strong></p>`,
    `<p>${escapeHtml(f.about).replace(/\n/g, '<br>')}</p>`,
    `<p><strong>${escapeHtml(e.pieces)}</strong></p>`,
    `<ul>${pieceLines.map((p) => `<li>${escapeHtml(p.head)}${p.body === null ? '' : `: ${escapeHtml(p.body)}`}</li>`).join('')}</ul>`,
    `<p>${escapeHtml(photos)}</p>`,
  ].join('');

  return { subject: fill(e.subject, { business: f.businessName }), text, html };
}
