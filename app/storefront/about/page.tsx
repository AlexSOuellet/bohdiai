import Image from 'next/image';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import NavSplit from '@/blocks/nav-split';
import FooterClassic from '@/blocks/footer-classic';
import { loadStorefrontChrome } from '../_components/storefront-chrome';

// The /about page renders the full version of the about-maker block content
// that's already authored on the home page. The home shows an abbreviated
// teaser with a "Read more" link; this page shows the complete body + image.
// One source of truth (the home block) so the maker only edits once.

function bodyToText(raw: string): string {
  return raw
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .trim();
}

interface AboutBlockContent {
  headline?: string;
  body?: string;
  imageUrl?: string;
}

export default async function StorefrontAboutPage() {
  const headerStore = await headers();
  const tenantId = headerStore.get('x-tenant-id');
  if (tenantId === null) notFound();

  const db = supabaseAdmin();

  // Find the home page (slug = '/'), then the about-maker block on it.
  const { data: homePage } = await db
    .from('content_pages')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('slug', '/')
    .eq('status', 'published')
    .maybeSingle();

  if (homePage === null) notFound();

  const { data: aboutBlock } = await db
    .from('page_blocks')
    .select('content')
    .eq('page_id', homePage.id)
    .eq('block_key', 'about-maker')
    .eq('is_visible', true)
    .maybeSingle();

  if (aboutBlock === null) notFound();

  const content = aboutBlock.content as AboutBlockContent;
  const headline = content.headline ?? '';
  const body = bodyToText(content.body ?? '');
  const imageUrl = content.imageUrl;

  const { shopName, sections } = await loadStorefrontChrome(tenantId);
  const sectionsJson = JSON.stringify(sections);

  return (
    <>
      <NavSplit content={{ shopName, sections: sectionsJson }} />
      <main className="bg-s-background pt-28 pb-20 md:pt-32">
        <div className="max-w-5xl mx-auto px-6">
          <p className="font-s-body text-xs uppercase tracking-[0.2em] text-s-text/50 mb-4 text-center">
            About
          </p>
          <h1 className="font-s-heading text-4xl md:text-5xl lg:text-6xl text-s-text text-center mb-12">
            {headline}
          </h1>

          {imageUrl !== undefined && imageUrl !== '' && (
            <div className="relative aspect-[16/9] overflow-hidden mb-12 md:mb-16">
              <Image
                src={imageUrl}
                alt={headline}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 1024px"
                priority
              />
            </div>
          )}

          <div className="max-w-2xl mx-auto">
            <p className="whitespace-pre-line font-s-body text-lg text-s-text/80 leading-relaxed">
              {body}
            </p>
          </div>
        </div>
      </main>
      <FooterClassic content={{ shopName, sections: sectionsJson }} />
    </>
  );
}
