/**
 * Claude drafts the words a maker doesn't give us (Modular Plan 24, "the AI writes
 * first drafts of the words"): the opening, the headings, the scrolling phrases,
 * the closing line, the groups their pieces go in, and a description for any piece
 * they left blank, from its photo. It reads their own words and looks at their
 * photos. Personal content stays theirs: their about goes in as written, and the
 * quote is one of their own sentences, word for word. The maker can change every
 * word afterwards in their backend.
 *
 * The prompt holds no sample wording (models copy examples); it describes what each
 * piece is for and the limits it must fit.
 */
import type Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { MOMENT_LIMITS } from '@/lib/backend/moment/moment-form';
import { MAKES_LIMIT, MARQUEE_LIMIT, PROFILE_LIMITS } from '@/lib/backend/profile/profile-form';
import { SECTION_LIMITS } from '@/lib/backend/sections/sections-form';
import { planLinkTargets } from '@/lib/backend/plan/plan-features';
import { checkDrafts, draftsSchema, type IntakeDrafts, type IntakeForBuild } from './from-intake';

export const DRAFT_MODEL = 'claude-opus-5-5';

/** A piece's photo as Claude sees it. */
export type PiecePhoto = { mediaType: 'image/webp' | 'image/jpeg' | 'image/png'; base64: string };


export function draftSystemPrompt(): string {
  return [
    'You write the first draft of every word on a maker’s new website, apart from the words the maker wrote themselves. The maker reads and edits all of it afterwards, so it should sound like them and be ready to publish as it stands.',
    'Ground everything in what the maker sent: their own description of what they make, their about, their pieces’ names and prices, and the photos. Never invent facts about the maker or the work: no years, places, awards, materials, techniques, ingredients or customers they didn’t mention or the photos don’t plainly show. When you don’t know something, write around it.',
    'Keep one voice across every field. Plain, warm and specific; no marketing filler and no superlatives.',
    'Headings, short lines above headings, opening story lines and scrolling phrases are phrases, not sentences: no full stops, exclamation marks or question marks in them.',
  ].join('\n\n');
}

/** What the maker sent, and what each field is for, as one message with their photos. */
export function draftRequest(intake: IntakeForBuild, mood: string, photos: readonly PiecePhoto[]): Anthropic.MessageParam {
  const targets = planLinkTargets(intake.plan).join(', ');
  const showcase = !planLinkTargets(intake.plan).includes('shop');
  const pieces = intake.pieces
    .map((p, i) => {
      const price = p.priceCents === null ? 'price on request' : `$${(p.priceCents / 100).toFixed(2)}`;
      return `Piece ${i + 1}: ${p.name} (${price})${p.description === null ? ' — no description; write one from its photo' : ` — the maker’s description: ${p.description}`}`;
    })
    .join('\n');
  const text = [
    `Business: ${intake.businessName}`,
    `Maker: ${intake.makerName}`,
    `What they make, in their words: ${intake.makes}`,
    `The site’s mood: ${mood}`,
    `Their about, in their words:\n${intake.about}`,
    `Their pieces (the photos above are in this order):\n${pieces}`,
    '',
    'Write the drafts:',
    `- profile.kicker (up to ${PROFILE_LIMITS.kicker} characters): a short line above the maker’s name on their about.`,
    `- profile.headline (up to ${PROFILE_LIMITS.headline}): the line beside their name on the about.`,
    `- profile.aboutTitle (up to ${PROFILE_LIMITS.aboutTitle}): the about page’s heading.`,
    `- profile.makes (up to ${MAKES_LIMIT} short phrases): what they make, from their own description.`,
    `- profile.quote (up to ${PROFILE_LIMITS.quote}): one sentence copied exactly, character for character, from their about, the one that says the most about them. If no sentence works on its own, leave it empty.`,
    `- profile.marqueePhrases (4 to ${MARQUEE_LIMIT}): short phrases that scroll across the page, about the work.`,
    `- moment.kicker (up to ${MOMENT_LIMITS.kicker}): the short line above the business name at the very top.`,
    `- moment.sub (up to ${MOMENT_LIMITS.sub}): the line under the business name.`,
    '- moment.story (3 to 5 short lines): lines that fade in one at a time over the opening photo and tell one small story together.',
    `- moment.ctaLabel and moment.secondCtaLabel (up to ${MOMENT_LIMITS.ctaLabel} each): the two buttons at the top. Each says where it goes. Their targets are pages on the site: ${targets}.`,
    `- sections: for each section, kicker (up to ${SECTION_LIMITS.kicker}, a short line above the heading, or empty), title (up to ${SECTION_LIMITS.title}, the heading), lede (up to ${SECTION_LIMITS.lede}, a line under the heading, or empty), moreLabel (up to ${SECTION_LIMITS.moreLabel}, the link at the bottom, or empty), pageTitle (up to ${SECTION_LIMITS.pageTitle}, the heading on that section’s own page, or empty). The sections: work (their pieces), collections (the groups of pieces), makes (what they make), about (the maker, with a link to the about page), reviews (what customers say; they have none yet, so write a heading that will fit when they do), markets (where to find them in person), close (the last line on the home page, with a button), contact (the contact page: a heading and a lede inviting people to write).`,
    `- closeTarget: where the closing button goes (${targets}); sections.close.moreLabel is its words.`,
    showcase
      ? '- collections: leave empty; this site shows its work as a gallery.'
      : '- collections: group the pieces the way a shopper would browse them, 2 to 4 groups of at least 2 pieces each, by their place in the list. If they don’t fall into groups naturally, leave it empty.',
    '- pieceDescriptions: one for each piece with no description, by its place in the list, describing only what its photo and name show. Leave out pieces the maker described.',
    '- homePieces: 3 to 5 pieces for the home page, the strongest photos, by place in the list.',
    '- openingPiece: the piece whose photo opens the site full width.',
  ].join('\n');
  return {
    role: 'user',
    content: [
      ...photos.map((p): Anthropic.ImageBlockParam => ({ type: 'image', source: { type: 'base64', media_type: p.mediaType, data: p.base64 } })),
      { type: 'text', text },
    ],
  };
}

export type DraftResult = { ok: true; drafts: IntakeDrafts } | { ok: false; error: string };

/** Drafts, checked; one more pass with the problems if the first misses. `client` is
 *  the Anthropic client (injected for tests). */
export async function draftIntake(client: Pick<Anthropic, 'messages'>, intake: IntakeForBuild, mood: string, photos: readonly PiecePhoto[], extraCheck: (d: IntakeDrafts) => string[] = () => []): Promise<DraftResult> {
  const schema = draftsSchema(intake.plan);
  const messages: Anthropic.MessageParam[] = [draftRequest(intake, mood, photos)];
  let last = '';
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await client.messages.parse({
      model: DRAFT_MODEL,
      max_tokens: 16000,
      system: draftSystemPrompt(),
      messages,
      output_config: { effort: 'high', format: zodOutputFormat(schema) },
    });
    if (response.stop_reason === 'refusal') return { ok: false, error: 'Claude declined to draft these words' };
    if (response.stop_reason === 'max_tokens') return { ok: false, error: 'the drafts ran out of room' };
    const drafts = response.parsed_output;
    if (drafts === null || drafts === undefined) return { ok: false, error: 'the drafts didn’t come back in shape' };
    const problems = [...checkDrafts(intake, drafts), ...extraCheck(drafts)];
    if (problems.length === 0) return { ok: true, drafts };
    last = problems.join('; ');
    // Keep the whole reply (thinking included) and ask for a corrected version.
    messages.push({ role: 'assistant', content: response.content }, { role: 'user', content: `Fix these and send the whole set again:\n- ${problems.join('\n- ')}` });
  }
  return { ok: false, error: `the drafts still have problems: ${last}` };
}
