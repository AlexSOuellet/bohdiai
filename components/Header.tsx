import Link from 'next/link';
import { MobileMenu } from './MobileMenu';

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

export function Header(): React.ReactElement {
  return (
    <header className="relative z-sticky flex items-center justify-between gap-2 pt-0.5 md:pt-2">
      <div className="flex items-center gap-2">
        <Link href="/" className={`${BLUR_CHIP} gap-2.5 py-2 pl-2 pr-3.5 text-[12px] md:text-[13px]`}>
          <span className="grid size-6 place-items-center rounded-[7px] bg-gradient-to-br from-honey-warm to-honey-deep text-[13px] font-bold text-bg-2">
            B
          </span>
          BohdiAI
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-2 md:flex">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={BLUR_CHIP}>
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-2">
        <a
          href="#contact"
          className="inline-flex items-center gap-2 whitespace-nowrap rounded-pill border border-transparent bg-text px-4 py-2 text-[12px] font-semibold text-bg no-underline md:text-[13px]"
        >
          Start a project →
        </a>
        <MobileMenu links={NAV_LINKS} />
      </div>
    </header>
  );
}
