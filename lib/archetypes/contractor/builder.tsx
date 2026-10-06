/**
 * Contractor — the build spec. A HAND-BUILT layout: Claude writes a client's
 * content directly (no Bohdi authoring, no generated media), so it never appears
 * on the onboarding menu. It renders like any archetype from the stored envelope:
 * one home page plus the platform's plain content pages (privacy, terms).
 */
import { notFound } from 'next/navigation';
import type { ArchetypeBuildSpec } from '../builder';
import { deriveBrandPalette, type BrandPalette } from '@/lib/color/brand-palette';
import { ContractorContentSchema, type ContractorContent } from './schemas';
import { ContractorLanding, ContractorContentPage, ContractorShell } from './ContractorLanding';
import { StatementLanding, StatementContentPage, StatementShell } from './statement/StatementLanding';
import { SwatchLanding, SwatchContentPage, SwatchShell } from './swatch/SwatchLanding';
import { AtelierLanding, AtelierContentPage, AtelierShell } from './atelier/AtelierLanding';
import { HarborLanding, HarborContentPage, HarborShell } from './harbor/HarborLanding';
import { BlueprintLanding, BlueprintContentPage, BlueprintShell } from './blueprint/BlueprintLanding';
import { RidgeLanding, RidgeContentPage, RidgeShell } from './ridge/RidgeLanding';

export const CONTRACTOR_LOOK = 'contractor';

/** The palette a contractor site paints in when it has no brand palette of its own. */
const DEFAULT_BRAND: BrandPalette = { base: '#101210', accent: '#3dae3f' };

function paletteFor(brandPalette: BrandPalette | undefined) {
  return deriveBrandPalette(brandPalette ?? DEFAULT_BRAND).palette;
}

/** Stored content is validated on every render: a malformed envelope is a data
 *  error, so the page 404s rather than painting a half-broken site. */
function contentOf(raw: unknown): ContractorContent {
  const parsed = ContractorContentSchema.safeParse(raw);
  if (!parsed.success) notFound();
  return parsed.data;
}

export const CONTRACTOR_SPEC: ArchetypeBuildSpec<ContractorContent> = {
  key: 'contractor',
  label: 'Contractor',
  menuDescription:
    'A one-page site for a trade that sells on photos of real jobs and closes on an estimate request: their work, what customers said, who shows up, where they work, and the request form.',
  handBuilt: true,
  // A one-page trade site: no products, no collections.
  usesCatalog: false,
  pages: [],
  fitsCatalog: () => false,
  looks: [{ key: CONTRACTOR_LOOK, label: 'Contractor', description: 'The business’s own colors on a dark ground.' }],
  parseSubmission: (raw) => {
    const parsed = ContractorContentSchema.safeParse(raw);
    return parsed.success
      ? { ok: true, authored: parsed.data }
      : { ok: false, issues: parsed.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })) };
  },
  mediaJobs: () => [],
  applyMedia: (authored) => authored,
  toPayload: (authored) => ({ content: authored, products: [] }),
  // Each design is its own page; the content shape is shared (design: 'yard' | 'statement').
  render: ({ content, brandPalette, tenantId }) => {
    const c = contentOf(content);
    const palette = paletteFor(brandPalette);
    if (c.design === 'statement') return <StatementLanding content={c} palette={palette} tenantId={tenantId} />;
    if (c.design === 'swatch') return <SwatchLanding content={c} palette={palette} tenantId={tenantId} />;
    if (c.design === 'atelier') return <AtelierLanding content={c} palette={palette} tenantId={tenantId} />;
    if (c.design === 'harbor') return <HarborLanding content={c} palette={palette} tenantId={tenantId} />;
    if (c.design === 'blueprint') return <BlueprintLanding content={c} palette={palette} tenantId={tenantId} />;
    if (c.design === 'ridge') return <RidgeLanding content={c} palette={palette} tenantId={tenantId} />;
    return <ContractorLanding content={c} palette={palette} tenantId={tenantId} />;
  },
  renderContentPage: ({ content, brandPalette, html, title, body }) => {
    const c = contentOf(content);
    const palette = paletteFor(brandPalette);
    if (c.design === 'statement') {
      if (html !== undefined) return <StatementContentPage content={c} palette={palette} html={html} />;
      return (
        <StatementShell content={c} palette={palette}>
          <main className="st-paper st-section">
            <div className="st-wrap st-prose">
              {title !== undefined && <h1>{title}</h1>}
              {(body ?? []).map((p) => <p key={p.slice(0, 32)}>{p}</p>)}
            </div>
          </main>
        </StatementShell>
      );
    }
    if (c.design === 'ridge') {
      if (html !== undefined) return <RidgeContentPage content={c} palette={palette} html={html} />;
      return (
        <RidgeShell content={c} palette={palette}>
          <main className="rg-section rg-light">
            <div className="rg-wrap rg-prose">
              {title !== undefined && <h1>{title}</h1>}
              {(body ?? []).map((p) => <p key={p.slice(0, 32)}>{p}</p>)}
            </div>
          </main>
        </RidgeShell>
      );
    }
    if (c.design === 'blueprint') {
      if (html !== undefined) return <BlueprintContentPage content={c} palette={palette} html={html} />;
      return (
        <BlueprintShell content={c} palette={palette}>
          <main className="bp-section">
            <div className="bp-wrap bp-prose">
              {title !== undefined && <h1>{title}</h1>}
              {(body ?? []).map((p) => <p key={p.slice(0, 32)}>{p}</p>)}
            </div>
          </main>
        </BlueprintShell>
      );
    }
    if (c.design === 'harbor') {
      if (html !== undefined) return <HarborContentPage content={c} palette={palette} html={html} />;
      return (
        <HarborShell content={c} palette={palette}>
          <main className="hb-section">
            <div className="hb-wrap hb-prose">
              {title !== undefined && <h1>{title}</h1>}
              {(body ?? []).map((p) => <p key={p.slice(0, 32)}>{p}</p>)}
            </div>
          </main>
        </HarborShell>
      );
    }
    if (c.design === 'atelier') {
      if (html !== undefined) return <AtelierContentPage content={c} palette={palette} html={html} />;
      return (
        <AtelierShell content={c} palette={palette}>
          <main className="at-section">
            <div className="at-wrap at-prose">
              {title !== undefined && <h1>{title}</h1>}
              {(body ?? []).map((p) => <p key={p.slice(0, 32)}>{p}</p>)}
            </div>
          </main>
        </AtelierShell>
      );
    }
    if (c.design === 'swatch') {
      if (html !== undefined) return <SwatchContentPage content={c} palette={palette} html={html} />;
      return (
        <SwatchShell content={c} palette={palette}>
          <main className="sw-section">
            <div className="sw-wrap sw-prose">
              {title !== undefined && <h1>{title}</h1>}
              {(body ?? []).map((p) => <p key={p.slice(0, 32)}>{p}</p>)}
            </div>
          </main>
        </SwatchShell>
      );
    }
    if (html !== undefined) return <ContractorContentPage content={c} palette={palette} html={html} />;
    return (
      <ContractorShell content={c} palette={palette}>
        <main className="cp-section">
          <div className="cp-wrap cp-prose">
            {title !== undefined && <h1>{title}</h1>}
            {(body ?? []).map((p) => <p key={p.slice(0, 32)}>{p}</p>)}
          </div>
        </main>
      </ContractorShell>
    );
  },
};
