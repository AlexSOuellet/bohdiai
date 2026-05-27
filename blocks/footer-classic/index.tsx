import meta from './meta';

export { meta };

interface FooterClassicContent {
  shopName: string;
  sections?: string;
}

interface FooterClassicProps {
  content: FooterClassicContent;
}

const SECTION_LINKS: Record<string, { label: string; href: string }> = {
  shop:          { label: 'Shop',          href: '/shop' },
  about:         { label: 'About',         href: '/about' },
  collections:   { label: 'Collections',   href: '/collections' },
  subscriptions: { label: 'Subscriptions', href: '/subscriptions' },
  contact:       { label: 'Contact',       href: '/contact' },
  events:        { label: 'Events',        href: '/#events' },
  gallery:       { label: 'Gallery',       href: '/gallery' },
};

function parseSections(raw: string | undefined): string[] {
  if (raw === undefined || raw === '') return ['shop', 'contact'];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter((s): s is string => typeof s === 'string');
  } catch {
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return ['shop', 'contact'];
}

export default function FooterClassic({ content }: FooterClassicProps) {
  const sections = parseSections(content.sections);
  const navLinks = sections
    .map((key) => SECTION_LINKS[key])
    .filter((link): link is { label: string; href: string } => link !== undefined);

  const year = new Date().getFullYear();

  const linkClass =
    'font-s-body text-xs uppercase tracking-[0.15em] text-s-text/60 hover:text-s-text transition-colors duration-200';

  return (
    <footer className="mt-24 border-t border-s-border bg-s-background">
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
        {/* ─── Top row: wordmark + nav ─── */}
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <a
            href="/"
            aria-label={`${content.shopName} — Home`}
            className="font-s-heading text-lg tracking-tight text-s-text"
          >
            {content.shopName}
          </a>

          {navLinks.length > 0 && (
            <nav className="flex flex-wrap items-center gap-x-8 gap-y-3" aria-label="Footer navigation">
              {navLinks.map((link) => (
                <a key={link.href} href={link.href} className={linkClass}>
                  {link.label}
                </a>
              ))}
            </nav>
          )}
        </div>

        {/* ─── Bottom row: legal + credit ─── */}
        <div className="mt-10 pt-6 border-t border-s-border/60 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2" aria-label="Legal">
            <a href="/terms" className={linkClass}>Terms</a>
            <a href="/privacy" className={linkClass}>Privacy</a>
          </nav>

          <p className="font-s-body text-xs text-s-text/50">
            © {year} {content.shopName} — Empowered by{' '}
            <a
              href="https://bohdiai.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-s-text/70 hover:text-s-text transition-colors duration-200"
            >
              BohdiAI
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
