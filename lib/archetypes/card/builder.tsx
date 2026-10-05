/**
 * Business card — the build spec (card site spec). A one-page site whose words and
 * photos live in the owner's About you and gallery, not in the envelope. The
 * envelope says "this is a card", which design it uses (bulletin board spec;
 * pinned prints when it names none), and for pinned prints which family
 * (`mood`) and skin (`lookKey`) it paints in, or the shop's own brand palette.
 * Never on Bohdi's onboarding menu; built by scripts/build-card-site.ts.
 */
import type { ReactElement } from 'react';
import { notFound } from 'next/navigation';
import type { ArchetypeBuildSpec } from '../builder';
import { supabaseAdmin } from '@/lib/supabase';
import { CardLanding, CardContentPage } from './CardLanding';
import { BulletinLanding, BulletinContentPage } from './BulletinLanding';
import { ShowreelLanding, ShowreelContentPage } from './ShowreelLanding';
import { TorchLanding, TorchContentPage } from './TorchLanding';
import { CardContentSchema, cardDesign, type CardContent, type CardDesign } from './design';
import { loadCardData } from './data';
import { cardPaint, type CardPaint } from './paint';

export const CARD_LOOK = 'card';

export { CardContentSchema, type CardContent } from './design';

/** The design the envelope names; a malformed envelope is a missing page. */
function designOf(raw: unknown): CardDesign {
  const parsed = CardContentSchema.safeParse(raw);
  if (!parsed.success) notFound();
  return cardDesign(parsed.data);
}

async function CardSite({ tenantId, paint, design }: { tenantId: string; paint: CardPaint; design: CardDesign }): Promise<ReactElement> {
  const data = await loadCardData(supabaseAdmin(), tenantId);
  if (design === 'bulletin') return <BulletinLanding data={data} tenantId={tenantId} />;
  if (design === 'showreel') return <ShowreelLanding data={data} tenantId={tenantId} />;
  if (design === 'torch') return <TorchLanding data={data} tenantId={tenantId} />;
  return <CardLanding data={data} paint={paint} tenantId={tenantId} />;
}

async function CardPage({
  tenantId,
  paint,
  design,
  html,
  title,
  body,
}: {
  tenantId: string;
  paint: CardPaint;
  design: CardDesign;
  html?: string | undefined;
  title?: string | undefined;
  body?: string[] | undefined;
}): Promise<ReactElement> {
  const { name } = await loadCardData(supabaseAdmin(), tenantId);
  if (design === 'bulletin') return <BulletinContentPage name={name} html={html} title={title} body={body} />;
  if (design === 'showreel') return <ShowreelContentPage name={name} html={html} title={title} body={body} />;
  if (design === 'torch') return <TorchContentPage name={name} html={html} title={title} body={body} />;
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
  looks: [{ key: CARD_LOOK, label: 'Business card', description: 'Pinned prints paint in one of the family’s skins (the stored look key names the skin); the bulletin board has its own fixed look.' }],
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
    const design = designOf(content);
    if (tenantId === undefined) notFound();
    return <CardSite tenantId={tenantId} design={design} paint={cardPaint({ mood, lookKey, brandPalette })} />;
  },
  renderContentPage: ({ content, lookKey, mood, brandPalette, tenantId, html, title, body }) => {
    const design = designOf(content);
    if (tenantId === undefined) notFound();
    return <CardPage tenantId={tenantId} design={design} paint={cardPaint({ mood, lookKey, brandPalette })} html={html} title={title} body={body} />;
  },
};
