import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import NavSplit from '@/blocks/nav-split';
import FooterClassic from '@/blocks/footer-classic';
import { BLOCKS_MANIFEST } from '@/lib/blocks-manifest.generated';
import { renderBlock } from '@/lib/block-registry';
import { loadStorefrontChrome } from '../_components/storefront-chrome';

// The /about page renders whichever about-section block the home page used —
// about-maker, about-founders-note, about-manifest, etc. The block component
// is whatever Bohdi picked at onboarding; this page just rebuilds that block
// in standalone context with nav + footer chrome.

export default async function StorefrontAboutPage() {
  const headerStore = await headers();
  const tenantId = headerStore.get('x-tenant-id');
  if (tenantId === null) notFound();

  const db = supabaseAdmin();

  // Find the home page.
  const { data: homePage } = await db
    .from('content_pages')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('slug', '/')
    .eq('status', 'published')
    .maybeSingle();

  if (homePage === null) notFound();

  // Look up which block keys map to the 'about' sectionType.
  const aboutBlockKeys = BLOCKS_MANIFEST
    .filter((b) => b.sectionType === 'about')
    .map((b) => b.key);

  // Find the about block the home page actually uses.
  const { data: aboutBlock } = await db
    .from('page_blocks')
    .select('block_key, position, content')
    .eq('page_id', homePage.id)
    .in('block_key', aboutBlockKeys)
    .eq('is_visible', true)
    .order('position', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (aboutBlock === null) notFound();

  const { shopName, sections } = await loadStorefrontChrome(tenantId);
  const sectionsJson = JSON.stringify(sections);

  return (
    <>
      <NavSplit content={{ shopName, sections: sectionsJson }} />
      <main className="bg-s-background pt-28 md:pt-32">
        {renderBlock(
          {
            block_key: aboutBlock.block_key,
            position: aboutBlock.position,
            content: aboutBlock.content as Record<string, unknown>,
          },
          tenantId,
        )}
      </main>
      <FooterClassic content={{ shopName, sections: sectionsJson }} />
    </>
  );
}
