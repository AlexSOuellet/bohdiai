import Link from 'next/link';
import type { Route } from 'next';
import { MobileMenu } from './MobileMenu';
import { Wordmark } from './Wordmark';
import { HeaderBackdrop } from './HeaderBackdrop';
import type { Arm } from '@/lib/site/arms';

const BLUR_CHIP =
  'inline-flex items-center gap-2 rounded-pill border border-white/10 bg-white/5 px-4 py-2 text-[13px] font-medium text-text-soft no-underline backdrop-blur-[20px]';

/** Every page's links, in order. Pricing and FAQ lead: they are what people come looking for. */
export const NAV_LINKS = [
  { href: '/#pricing', label: 'Pricing' },
  { href: '/faq', label: 'FAQ' },
  { href: '/#work', label: 'Work' },
  { href: '/#who', label: 'About' },
  { href: '#contact', label: 'Contact' },
] as const;

/** An arm's own links: everything on its page, the looks first for makers. */
export const ARM_NAV_LINKS: Record<Arm, ReadonlyArray<{ href: string; label: string }>> = {
  makers: [
    { href: '/#looks', label: 'Looks' },
    { href: '/#how', label: 'How it works' },
    { href: '/#work', label: 'Work' },
    { href: '/#plans', label: 'Pricing' },
    { href: '/faq', label: 'FAQ' },
    { href: '#contact', label: 'Contact' },
  ],
  service: [
    { href: '/#plans', label: 'Pricing' },
    { href: '/#how', label: 'How it works' },
    { href: '/#work', label: 'Work' },
    { href: '/faq', label: 'FAQ' },
    { href: '#contact', label: 'Contact' },
  ],
};

/** Makers sign up on the form; everyone else starts with a message. */
const CTA: Record<Arm | 'parent', { href: string; label: string }> = {
  parent: { href: '#contact', label: 'Start a project →' },
  makers: { href: '/start', label: 'Start your site →' },
  service: { href: '#contact', label: 'Start a project →' },
};

export function Header({ arm }: { arm?: Arm } = {}): React.ReactElement {
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
