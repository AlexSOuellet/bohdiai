// Ticker content for the build screen. Mixes maker-relevant tips pulled from
// the niche markdown body with personalized encouragement using the maker's
// name. The SSE route picks from this pool and emits `tip` events on a timer
// while generation runs so the maker has something to read for 3-5 minutes.

import { supabaseAdmin } from '@/lib/supabase';

export interface TickerContent {
  /** Niche-relevant tips pulled from the niche prose. */
  nicheTips: string[];
  /** Encouragement lines, optionally personalized with the maker's name. */
  encouragement: string[];
}

/**
 * Pull short interesting sentences out of the niche body_markdown. Filters
 * out section headings, bullet markers, and very long paragraphs. The goal
 * is sentence-sized lines that read well in a rotating ticker.
 */
function extractTipsFromNicheBody(body: string): string[] {
  const lines = body.split('\n');
  const tips: string[] = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (line === '') continue;
    if (line.startsWith('#')) continue; // Headings.
    if (line.startsWith('---')) continue; // Frontmatter delimiters.
    if (line.startsWith('```')) continue; // Code fence.
    if (line.startsWith('|')) continue; // Tables.

    // Strip leading bullet markers.
    const stripped = line
      .replace(/^[-*]\s+/, '')
      .replace(/^\d+\.\s+/, '')
      .trim();
    if (stripped === '') continue;

    // Split into sentences. Keep ones of a usable length for ticker display.
    const sentences = stripped.split(/(?<=[.!?])\s+/);
    for (const s of sentences) {
      const sentence = s.trim();
      if (sentence.length < 40 || sentence.length > 240) continue;
      // Skip sentences that read like internal headings or labels.
      if (/^[A-Z][a-z]+ [A-Z][a-z]+:?\s*$/.test(sentence)) continue;
      tips.push(sentence);
    }
  }

  return dedupe(tips);
}

function dedupe(arr: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of arr) {
    if (seen.has(item)) continue;
    seen.add(item);
    out.push(item);
  }
  return out;
}

function buildEncouragement(
  makerName?: string,
  options?: { hasUploadedPhotos?: boolean },
): string[] {
  const name = makerName?.trim();
  const opener = name !== undefined && name !== '' ? `${name}, ` : '';

  const lines = [
    `${opener}this is the part that takes a few minutes. Worth it.`,
    `${opener}while we build — think about who your first customer is.`,
    `Your shop is being composed deliberately. Not picked from a template.`,
    `${opener}take a breath. Your store is coming together.`,
    `Every choice is being made with your craft in mind.`,
    `${opener}this will not look like every other AI-built site. That's the point.`,
    `Bohdi works the way a designer would. One choice at a time.`,
  ];

  if (options?.hasUploadedPhotos === true) {
    // Surfaced only when the maker uploaded photos — Bohdi notices their work.
    lines.unshift(`Studying your work…`);
  }

  return lines;
}

export async function loadTickerContent(
  nicheSlug: string,
  makerName?: string,
  options?: { hasUploadedPhotos?: boolean },
): Promise<TickerContent> {
  const { data } = await supabaseAdmin()
    .from('niches')
    .select('body_markdown')
    .eq('slug', nicheSlug)
    .single();

  const nicheTips =
    data?.body_markdown !== undefined && data?.body_markdown !== null
      ? extractTipsFromNicheBody(data.body_markdown).slice(0, 30)
      : [];

  return {
    nicheTips,
    encouragement: buildEncouragement(makerName, options),
  };
}
