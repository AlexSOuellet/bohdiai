import Link from 'next/link';
import type { Route } from 'next';
import { MobileMenu } from './MobileMenu';
import { Wordmark } from './Wordmark';
import { HeaderBackdrop } from './HeaderBackdrop';

const BLUR_CHIP =
  'inline-flex items-center gap-2 rounded-pill border border-white/10 bg-white/5 px-4 py-2 text-[13px] font-medium text-text-soft no-underline backdrop-blur-[20px]';

/** bohdiai.com's links (the maker site, Session 117): everything on its page, the looks first. */
export const NAV_LINKS = [
  { href: '/#looks', label: 'Looks' },
  { href: '/#ladder', label: 'Plans' },
  { href: '/#how', label: 'How it works' },
  { href: '/#plans', label: 'Pricing' },
  { href: '/#custom', label: 'Custom sites' },
  { href: '/faq', label: 'FAQ' },
  { href: '#contact', label: 'Contact' },
] as const;

/** The service page's links, kept with its switched-off page (Session 117). */
export const ARM_NAV_LINKS: Record<'service', ReadonlyArray<{ href: string; label: string }>> = {
  service: [
    { href: '/#plans', label: 'Pricing' },
    { href: '/#how', label: 'How it works' },
    { href: '/#work', label: 'Work' },
    { href: '/faq', label: 'FAQ' },
    { href: '#contact', label: 'Contact' },
  ],
};

/** Makers sign up on the form; the service page starts with a message. */
const CTA: Record<'service' | 'parent', { href: string; label: string }> = {
  parent: { href: '/start', label: 'Start your site →' },
  service: { href: '#contact', label: 'Start a project →' },
};

export function Header({ arm }: { arm?: 'service' } = {}): React.ReactElement {
  const links = arm === undefined ? NAV_LINKS : ARM_NAV_LINKS[arm];
  const cta = CTA[arm ?? 'parent'];
  return (
    <header className="sticky top-3 z-sticky flex items-center justify-between gap-2 pt-0.5 md:top-4 md:pt-2">
      <HeaderBackdrop />
      <div className="flex items-center gap-2">
        <Link href="/" className={BLUR_CHIP}>
          <Wordmark className="text-[22px]" />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-2 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href as Route} className={BLUR_CHIP}>
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-2">
        <a
          href={cta.href}
          className="inline-flex items-center gap-2 whitespace-nowrap rounded-pill border border-transparent bg-text px-4 py-2 text-[12px] font-semibold text-bg no-underline md:text-[13px]"
        >
          {cta.label}
        </a>
        <MobileMenu links={links} />
      </div>
    </header>
  );
}
