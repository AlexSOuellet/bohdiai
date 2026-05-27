'use client';

import { useState, useEffect } from 'react';
import meta from './meta';

export { meta };

interface NavSplitContent {
  shopName: string;
  sections?: string;
}

interface NavSplitProps {
  content: NavSplitContent;
}

const SECTION_LINKS: Record<string, { label: string; href: string }> = {
  shop:          { label: 'Shop',          href: '/shop' },
  about:         { label: 'About',         href: '/about' },
  collections:   { label: 'Collections',   href: '/collections' },
  subscriptions: { label: 'Subscriptions', href: '/subscriptions' },
  events:        { label: 'Events',        href: '/#events' },
  gallery:       { label: 'Gallery',       href: '/gallery' },
  contact:       { label: 'Contact',       href: '/contact' },
};

function parseSections(raw: string | undefined): string[] {
  if (raw === undefined || raw === '') return ['shop'];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((s): s is string => typeof s === 'string');
  } catch {
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return ['shop'];
}

function CartIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

export default function NavSplit({ content }: NavSplitProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const sections = parseSections(content.sections);
  const validLinks = sections.filter((s) => SECTION_LINKS[s] !== undefined);

  const headerClass = [
    'fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-s-background border-b border-s-border',
    scrolled ? 'py-3' : 'py-4',
  ].join(' ');

  const linkClass =
    'font-s-body text-xs uppercase tracking-[0.15em] text-s-text/60 hover:text-s-text transition-colors duration-200';

  return (
    <header className={headerClass}>
      {/* ─── Desktop ─── */}
      <div className="hidden md:flex max-w-7xl mx-auto px-6 items-center justify-between gap-8">
        <a
          href="/"
          aria-label={`${content.shopName} — Home`}
          className="font-s-heading text-base tracking-tight whitespace-nowrap shrink-0 text-s-text"
        >
          {content.shopName}
        </a>

        <nav className="flex items-center gap-8" aria-label="Primary navigation">
          {validLinks.map((key) => {
            const link = SECTION_LINKS[key];
            if (link === undefined) return null;
            return <a key={key} href={link.href} className={linkClass}>{link.label}</a>;
          })}
        </nav>

        <a href="/cart" aria-label="Cart" className="text-s-text/60 hover:text-s-text transition-colors duration-200 shrink-0">
          <CartIcon />
        </a>
      </div>

      {/* ─── Mobile ─── */}
      <div className="md:hidden flex items-center justify-between px-6">
        <a
          href="/"
          aria-label={`${content.shopName} — Home`}
          className="font-s-heading text-s-text text-base tracking-tight"
        >
          {content.shopName}
        </a>
        <a href="/cart" aria-label="Cart" className="text-s-text/60 hover:text-s-text transition-colors duration-200">
          <CartIcon />
        </a>
      </div>
    </header>
  );
}
