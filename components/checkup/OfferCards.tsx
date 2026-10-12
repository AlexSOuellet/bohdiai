import Image from 'next/image';
import type { WriteUp } from '@/lib/checkup/schemas';

type Help = WriteUp['help'][number];
type Offer = Help['offer'];

/** What each of Alex's offers is called, a picture of it on a laptop and phone (public/checkup/, made by scripts/checkup-offer-shots.mjs + checkup-offer-compose.mjs), and where "Learn more" goes. */
const OFFERS: Readonly<Record<Offer, { name: string; href: string; shot: string; alt: string }>> = {
  showcase: {
    name: 'Showcase site',
    href: '/makers',
    shot: '/checkup/offer-showcase.webp',
    alt: 'A sample showcase site',
  },
  market: {
    name: 'Market site',
    href: '/makers',
    shot: '/checkup/offer-market.webp',
    alt: 'A sample market site',
  },
  full_shop: {
    name: 'Full shop site',
    href: '/makers',
    shot: '/checkup/offer-full_shop.webp',
    alt: 'A sample full shop site',
  },
};

/** "How I can help": a small product card per offer that fits, best fit first and lit. */
export function OfferCards({ help }: { help: readonly Help[] }): React.ReactElement {
  return (
    <div className="grid gap-5 [grid-template-columns:repeat(auto-fit,minmax(min(100%,210px),1fr))]">
      {help.map((h, i) => {
        const offer = OFFERS[h.offer];
        const best = i === 0;
        return (
          <article
            key={h.offer}
            aria-labelledby={`offer-${h.offer}`}
            className={[
              'relative flex flex-col overflow-hidden rounded-[18px] border backdrop-blur-[20px]',
              best
                ? 'border-honey-warm/40 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.85),0_0_60px_-24px_rgba(243,201,122,0.35)] [background:radial-gradient(120%_70%_at_100%_0%,rgba(243,201,122,0.14),transparent_60%),linear-gradient(180deg,rgba(32,24,16,0.92),rgba(12,9,6,0.85))]'
                : 'border-white/10 shadow-[0_30px_70px_-30px_rgba(0,0,0,0.85)] [background:linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015))]',
            ].join(' ')}
          >
            {best && (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-6 top-0 z-raised h-px [background:linear-gradient(90deg,transparent,var(--honey-warm),transparent)]"
              />
            )}
            <div className="relative aspect-[16/10] border-b border-white/10 bg-bg">
              <Image
                src={offer.shot}
                alt={offer.alt}
                fill
                sizes="(max-width: 720px) 100vw, 340px"
                className="object-cover object-top"
              />
            </div>
            <div className="flex flex-1 flex-col p-5 md:p-6">
              <h3
                id={`offer-${h.offer}`}
                className={`text-[19px] font-semibold tracking-[-0.015em] md:text-[20px] ${best ? 'text-honey-warm' : 'text-text'}`}
              >
                {offer.name}
              </h3>
              <p className="mt-2 flex-1 text-[15px] leading-[1.55] text-text-soft">{h.text}</p>
              <a
                href={offer.href}
                aria-label={`Learn more about the ${offer.name.toLowerCase()}`}
                className={[
                  'mt-5 inline-flex w-fit items-center rounded-pill px-5 py-2.5 text-[14px] font-semibold no-underline transition-transform hover:-translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-honey-warm',
                  best
                    ? 'bg-honey-warm text-bg shadow-[0_10px_30px_-10px_rgba(243,201,122,0.7)]'
                    : 'bg-text text-bg',
                ].join(' ')}
              >
                Learn more
              </a>
            </div>
          </article>
        );
      })}
    </div>
  );
}
