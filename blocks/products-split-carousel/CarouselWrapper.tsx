'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

interface Listing {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  base_price_cents: number;
  metadata: { image_url?: string | null } | null;
}

interface CarouselWrapperProps {
  items: Listing[];
}

function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export default function CarouselWrapper({ items }: CarouselWrapperProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  if (items.length === 0) {
    return <p className="text-left font-s-body text-s-muted">Our collection is currently undergoing curation.</p>;
  }

  const activeItem = items[activeIndex] ?? items[0];

  return (
    <div className="w-full flex flex-col md:flex-row gap-12 md:gap-16 items-start">
      
      {/* ─── Left Side: Sticky Cinematic Portrait Preview Column ─── */}
      <div className="w-full md:w-1/2 md:sticky md:top-28 z-raised">
        <div className="relative aspect-[1/1.25] w-full rounded-s-card overflow-hidden shadow-2xl border border-s-border bg-s-surface">
          
          <AnimatePresence mode="popLayout">
            <motion.div
              key={activeIndex}
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
              className="absolute inset-0 w-full h-full"
            >
              {activeItem?.metadata?.image_url != null ? (
                <Image
                  src={activeItem.metadata.image_url}
                  alt={activeItem.name}
                  fill
                  priority
                  className="object-cover object-center"
                  sizes="(max-width: 720px) 100vw, 50vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center bg-s-surface">
                  <span className="text-sm font-s-body text-s-muted">Curation in progress</span>
                </div>
              )}
              
              {/* Subtle ambient light vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent pointer-events-none" />

              {/* Price Badge */}
              <div className="absolute bottom-6 left-6 bg-black py-2 px-4 rounded-pill shadow-xl">
                <span className="font-s-heading font-black text-s-accent text-lg tracking-tight leading-none">
                  {formatPrice(activeItem?.base_price_cents ?? 0)}
                </span>
              </div>

            </motion.div>
          </AnimatePresence>
          
        </div>
      </div>

      {/* ─── Right Side: Interactive Hover Listing Column ─── */}
      <ul className="w-full md:w-1/2 flex flex-col divide-y divide-s-border/40 border-y border-s-border/40">
        {items.map((listing, index) => {
          const isActive = index === activeIndex;
          const indexStr = String(index + 1).padStart(2, '0');

          return (
            <li
              key={listing.id}
              onMouseEnter={() => setActiveIndex(index)}
              className={[
                'group relative py-6 px-4 -mx-4 transition-all duration-base rounded-s-card cursor-pointer flex items-start text-left',
                isActive ? 'bg-s-surface/50 shadow-md' : 'hover:bg-s-surface/20'
              ].join(' ')}
            >
              {/* Staggered index listing number */}
              <span 
                className={[
                  'font-s-heading font-light text-4xl mr-6 select-none transition-colors duration-base leading-none pt-1',
                  isActive ? 'text-s-accent font-semibold' : 'text-s-muted/40 group-hover:text-s-accent/60'
                ].join(' ')}
              >
                {indexStr}
              </span>

              {/* Product Core Copy Info */}
              <div className="flex-1">
                <div className="flex justify-between items-baseline gap-4 mb-2">
                  <h3 
                    className={[
                      'font-s-heading font-bold text-lg uppercase tracking-tight transition-colors duration-base',
                      isActive ? 'text-s-accent' : 'text-s-text group-hover:text-s-accent'
                    ].join(' ')}
                  >
                    {listing.name}
                  </h3>
                  <span className="font-s-heading font-black text-s-text text-sm">
                    {formatPrice(listing.base_price_cents)}
                  </span>
                </div>
                
                {/* Expanded Short description revealed on active state */}
                {listing.short_description !== null && (
                  <motion.p 
                    initial={false}
                    animate={{ height: isActive ? 'auto' : '1.6rem', opacity: isActive ? 1 : 0.6 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    className="font-s-body text-s-muted text-sm leading-relaxed overflow-hidden line-clamp-2"
                  >
                    {listing.short_description}
                  </motion.p>
                )}

                <a 
                  href={`/listings/${listing.slug}`}
                  className="inline-block mt-3 font-mono text-[9px] uppercase tracking-[0.2em] text-s-accent font-bold group-hover:underline"
                >
                  Acquire Item &rarr;
                </a>
              </div>
            </li>
          );
        })}
      </ul>

    </div>
  );
}
