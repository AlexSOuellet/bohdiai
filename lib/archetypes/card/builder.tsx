/**
 * Business card — the build spec (card site spec). A one-page site whose words and
 * photos live in the owner's About you and gallery, not in the envelope. The
 * envelope says "this is a card" and which family (`mood`) and skin (`lookKey`)
 * it paints in, or carries the shop's own brand palette. Always one of our
 * families. Never on Bohdi's onboarding menu; built by scripts/build-card-site.ts.
 */
import type { ReactElement } from 'react';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import type { ArchetypeBuildSpec } from '../builder';
import { supabaseAdmin } from '@/lib/supabase';
import { CardLanding, CardContentPage } from './CardLanding';
import { loadCardData } from './data';
import { cardPaint, type CardPaint } from './paint';

export const CARD_LOOK = 'card';

/** The envelope's content: nothing yet — everything the page shows is the owner's. */
export const CardContentSchema = z.object({}).strict();
export type CardContent = z.infer<typeof CardContentSchema>;

function checkContent(raw: unknown): void {
  if (!CardContentSchema.safeParse(raw).success) notFound();
}

async function CardSite({ tenantId, paint }: { tenantId: string; paint: CardPaint }): Promise<ReactElement> {
  const data = await loadCardData(supabaseAdmin(), tenantId);
  return <CardLanding data={data} paint={paint} tenantId={tenantId} />;
}

async function CardPage({
  tenantId,
  paint,
  html,
  title,
  body,
}: {
  tenantId: string;
  paint: CardPaint;
  html?: string | undefined;
  title?: string | undefined;
  body?: string[] | undefined;
}): Promise<ReactElement> {
  const { name } = await loadCardData(supabaseAdmin(), tenantId);
  return <CardContentPage name={name} paint={paint} html={html} title={title} body={body} />;
}

export const CARD_SPEC: ArchetypeBuildSpec<CardContent> = {
  key: 'card',
  label: 'Business card',
  menuDescription: 'A one-page online business card for a maker: who they are, a gallery of their work, and how to get in touch.',
  handBuilt: true,
  usesCatalog: false,
  pages: [],
  fitsCatalog: () => false,
  looks: [{ key: CARD_LOOK, label: 'Business card', description: 'Painted in one of the family’s skins; the stored look key names the skin.' }],
  parseSubmission: (raw) => {
    const parsed = CardContentSchema.safeParse(raw);
    return parsed.success
      ? { ok: true, authored: parsed.data }
      : { ok: false, issues: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) };
  },
  mediaJobs: () => [],
  applyMedia: (authored) => authored,
  toPayload: (authored) => ({ content: authored, products: [] }),
  render: ({ content, lookKey, mood, brandPalette, tenantId }) => {
    checkContent(content);
    if (tenantId === undefined) notFound();
    return <CardSite tenantId={tenantId} paint={cardPaint({ mood, lookKey, brandPalette })} />;
  },
  renderContentPage: ({ content, lookKey, mood, brandPalette, tenantId, html, title, body }) => {
    checkContent(content);
    if (tenantId === undefined) notFound();
    return <CardPage tenantId={tenantId} paint={cardPaint({ mood, lookKey, brandPalette })} html={html} title={title} body={body} />;
  },
};
