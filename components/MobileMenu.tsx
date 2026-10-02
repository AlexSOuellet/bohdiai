'use client';

/**
 * The phone menu: one button opens every link, Pricing and FAQ first. Closes
 * on a link tap, the button, or Escape. Hidden from md up, where the links sit
 * in the header row.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Route } from 'next';

export function MobileMenu({
  links,
}: {
  links: ReadonlyArray<{ href: string; label: string }>;
}): React.ReactElement {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const bar = 'h-[1.5px] rounded bg-current transition-[transform,opacity] duration-base';
  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? 'Close menu' : 'Open menu'}
        onClick={() => setOpen((o) => !o)}
        className="grid size-9 place-items-center rounded-full border border-white/10 bg-white/5 text-text-soft backdrop-blur-[20px]"
      >
        <span aria-hidden="true" className="flex w-4 flex-col gap-[3px]">
          <span className={`${bar} ${open ? 'translate-y-[4.5px] rotate-45' : ''}`} />
          <span className={`${bar} ${open ? 'opacity-0' : ''}`} />
          <span className={`${bar} ${open ? '-translate-y-[4.5px] -rotate-45' : ''}`} />
        </span>
      </button>
      {open && (
        <nav
          id="mobile-menu"
          aria-label="Menu"
          className="absolute inset-x-0 top-full mt-3 flex flex-col overflow-hidden rounded-[18px] border border-honey-warm/20 p-2 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-[24px] [background:linear-gradient(180deg,rgba(26,20,16,0.97),rgba(10,8,5,0.96))]"
        >
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href as Route}
              onClick={() => setOpen(false)}
              className="rounded-[12px] px-4 py-3.5 font-sans text-[17px] font-medium text-text no-underline hover:bg-white/[0.05]"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}
