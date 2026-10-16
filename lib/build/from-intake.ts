/**
 * An intake submission (bohdiai.com/start) as the one builder's content file. Pure:
 * the maker's own words go in as they wrote them (their name, business, about,
 * pieces, prices); the words we write come from the drafts (lib/build/intake-drafts);
 * every button and label comes from a site of the same design. Showcase has no shop,
 * so its pieces become the gallery, with no prices.
 */
import { z } from 'zod/v4';
import type { FamilyKey } from '@/lib/archetypes/main-street/families';
import { EMPTY_PROFILE } from '@/lib/backend/profile/profile-form';
import { EMPTY_MOMENT } from '@/lib/backend/moment/moment-form';
import { SECTION_KEYS, type SectionKey, type SectionWords } from '@/lib/backend/sections/sections-form';
import { planLinkTargets } from '@/lib/backend/plan/plan-features';
import type { SitePlan } from '@/lib/backend/plan/plan';
import type { LinkTarget } from '@/lib/archetypes/main-street/links';
import { slugOf, type SiteFile } from './site-plan';

/** A submission as the builder needs it: each photo already saved under the build's media folder. */
export type IntakeForBuild = {
  plan: SitePlan;
  makerName: string;
  businessName: string;
  email: string;
  makes: string;
  about: string;
  pieces: { name: string; priceCents: number | null; description: string | null; file: string }[];
  portraitFile: string | null;
};

export type BuildSettings = { subdomain: string; family: FamilyKey; skin: string; niche?: string };

const SECTION_DRAFT = z.object({ kicker: z.string(), title: z.string(), lede: z.string(), moreLabel: z.string(), pageTitle: z.string() });

/** The drafts' shape, for the plan's link targets (Showcase can't point at the shop). */
export function draftsSchema(plan: SitePlan) {
  const targets = planLinkTargets(plan) as readonly [LinkTarget, ...LinkTarget[]];
  return z.object({
    profile: z.object({
      kicker: z.string(),
      headline: z.string(),
      aboutTitle: z.string(),
      makes: z.array(z.string()),
      /** A sentence copied word for word from their about. */
      quote: z.string(),
      marqueePhrases: z.array(z.string()),
    }),
    moment: z.object({
      kicker: z.string(),
      sub: z.string(),
      story: z.array(z.string()),
      ctaLabel: z.string(),
      ctaTarget: z.enum(targets),
      secondCtaLabel: z.string(),
      secondCtaTarget: z.enum(targets),
    }),
    sections: z.object(Object.fromEntries(SECTION_KEYS.map((k) => [k, SECTION_DRAFT])) as Record<SectionKey, typeof SECTION_DRAFT>),
    closeTarget: z.enum(targets),
    /** Groups of pieces by their place on the form, from 1. */
    collections: z.array(z.object({ name: z.string(), description: z.string(), pieces: z.array(z.number().int()) })),
    /** Descriptions for the pieces the maker left blank, from their photos. */
    pieceDescriptions: z.array(z.object({ piece: z.number().int(), description: z.string() })),
    /** The pieces on the home page, by place on the form. */
    homePieces: z.array(z.number().int()),
    /** The piece whose photo opens the site. */
    openingPiece: z.number().int(),
  });
}

export type IntakeDrafts = z.infer<ReturnType<typeof draftsSchema>>;

/** What's wrong with the drafts beyond their shape; empty when they can be used. */
export function checkDrafts(intake: IntakeForBuild, d: IntakeDrafts): string[] {
  const errors: string[] = [];
  const n = intake.pieces.length;
  const inRange = (i: number): boolean => i >= 1 && i <= n;
  if (!inRange(d.openingPiece)) errors.push(`openingPiece ${d.openingPiece} isn't a piece (1 to ${n})`);
  for (const i of d.homePieces) if (!inRange(i)) errors.push(`homePieces: ${i} isn't a piece (1 to ${n})`);
  if (d.homePieces.length === 0) errors.push('homePieces: pick the pieces for the home page');
  for (const c of d.collections) for (const i of c.pieces) if (!inRange(i)) errors.push(`collections: "${c.name}" names ${i}, which isn't a piece`);
  const blank = intake.pieces.flatMap((p, i) => (p.description === null ? [i + 1] : []));
  for (const i of blank) if (!d.pieceDescriptions.some((x) => x.piece === i)) errors.push(`pieceDescriptions: piece ${i} was left blank and needs one`);
  for (const x of d.pieceDescriptions) if (!blank.includes(x.piece)) errors.push(`pieceDescriptions: piece ${x.piece} has the maker's own description; leave it`);
  // Personal content is the maker's own: the quote is their sentence, word for word.
  if (d.profile.quote.trim() !== '' && !intake.about.includes(d.profile.quote.trim())) errors.push('profile.quote must be a sentence copied word for word from their about');
  return errors;
}

function section(d: IntakeDrafts['sections'][SectionKey], moreTarget: LinkTarget | ''): Partial<SectionWords> {
  return { kicker: d.kicker, title: d.title, lede: d.lede, moreLabel: d.moreLabel, moreTarget, pageTitle: d.pageTitle };
}

/** The content file for the one builder. planSite checks it whole before anything is written. */
export function siteFromIntake(intake: IntakeForBuild, d: IntakeDrafts, settings: BuildSettings, words: Readonly<Record<string, string>>): SiteFile {
  const showcase = !planLinkTargets(intake.plan).includes('shop');
  const described = (i: number): string => intake.pieces[i]?.description ?? d.pieceDescriptions.find((x) => x.piece === i + 1)?.description ?? '';
  const opening = intake.pieces[d.openingPiece - 1];
  const collections = showcase
    ? []
    : d.collections.filter((c) => c.pieces.length > 0).map((c) => ({ slug: slugOf(c.name), name: c.name, description: c.description }));
  return {
    site: { subdomain: settings.subdomain, businessName: intake.businessName, design: 'family', family: settings.family, skin: settings.skin, plan: intake.plan, contactEmail: intake.email, ...(settings.niche === undefined ? {} : { niche: settings.niche }) },
    profile: {
      ...EMPTY_PROFILE,
      kicker: d.profile.kicker,
      headline: d.profile.headline,
      aboutTitle: d.profile.aboutTitle,
      bio: intake.about,
      signature: intake.makerName,
      makes: d.profile.makes,
      quote: d.profile.quote.trim(),
      quoteAttribution: d.profile.quote.trim() === '' ? '' : intake.makerName,
      marqueePhrases: d.profile.marqueePhrases,
    },
    ...(intake.portraitFile === null ? {} : { portrait: { file: intake.portraitFile, alt: intake.makerName } }),
    moment: {
      ...EMPTY_MOMENT,
      kicker: d.moment.kicker,
      headline: intake.businessName,
      sub: d.moment.sub,
      story: d.moment.story,
      ctaLabel: d.moment.ctaLabel,
      ctaTarget: d.moment.ctaTarget,
      secondCtaLabel: d.moment.secondCtaLabel,
      secondCtaTarget: d.moment.secondCtaTarget,
      ...(opening === undefined ? {} : { media: { file: opening.file, alt: opening.name, kind: 'image' as const } }),
    },
    sections: Object.fromEntries(SECTION_KEYS.map((k) => [k, section(d.sections[k], k === 'close' ? d.closeTarget : '')])) as Record<SectionKey, Partial<SectionWords>>,
    ...(showcase
      ? { gallery: intake.pieces.map((p) => ({ file: p.file, caption: p.name })) }
      : {
          collections,
          products: intake.pieces.map((p, i) => ({
            name: p.name,
            priceCents: p.priceCents,
            description: described(i),
            photos: [{ file: p.file, alt: p.name }],
            onHome: d.homePieces.includes(i + 1),
            collections: d.collections.filter((c) => c.pieces.includes(i + 1)).map((c) => slugOf(c.name)),
          })),
        }),
    words,
  };
}
