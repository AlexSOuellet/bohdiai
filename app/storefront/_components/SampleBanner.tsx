import type { ReactElement } from 'react';
import { SAMPLE_BANNER_STRINGS, type SampleBanner as Banner } from '@/lib/storefront/sample-banner';

/** Height the strip takes; fixed site headers sit below it via --sample-bar-h. */
const BAR_CSS = ':root{--sample-bar-h:48px}body{padding-top:var(--sample-bar-h)}';

/** A dark strip fixed across the top of a sample site, holding a bright red
 *  button with the plan it shows, linking to the plans. Above the site's own
 *  fixed header, below its full-screen layers (photo viewer, mobile menu). */
export function SampleBanner({ banner }: { banner: Banner }): ReactElement {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: BAR_CSS }} />
      <div className="fixed inset-x-0 top-0 z-[55] flex h-[var(--sample-bar-h)] items-center justify-center bg-bg shadow-[0_2px_12px_rgba(0,0,0,0.35)]">
        <a
          href={banner.href}
          className="flex items-center gap-2 rounded-pill bg-[#E8262B] px-5 py-1.5 font-sans text-[14px] font-bold uppercase tracking-[0.12em] text-white no-underline shadow-[0_2px_10px_rgba(232,38,43,0.5)] transition-colors hover:bg-[#FF3B3F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {banner.label}
          <span aria-hidden="true">→</span>
          <span className="sr-only">. {SAMPLE_BANNER_STRINGS.linkHint}</span>
        </a>
      </div>
    </>
  );
}
