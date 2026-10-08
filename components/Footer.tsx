import { SITE_CONTACT_EMAIL as CONTACT_EMAIL } from '@/lib/site/contact';
import { Wordmark } from './Wordmark';

export function Footer(): React.ReactElement {
  return (
    <footer className="relative z-content mt-12 pb-9 pt-12 md:mt-20 md:pb-9 md:pt-12 [background:linear-gradient(to_bottom,rgba(243,201,122,0.18),transparent_1px)_top/100%_1px_no-repeat,transparent]">
      <div className="mx-auto flex max-w-[1180px] flex-col gap-8 px-4 md:flex-row md:items-start md:justify-between md:gap-10 md:px-8">
        <div className="md:max-w-[300px] md:shrink-0">
          <Wordmark className="mb-3.5 inline-block text-[22px]" />
          <p className="text-[12px] leading-[1.55] text-muted md:text-[13px]">
            Websites for makers, contractors and charities. You keep 100% of what you sell.
          </p>
        </div>

        <div className="flex flex-wrap gap-7 md:gap-12">
          <FooterCol title="Site">
            <FLink href="/makers">For makers</FLink>
            <FLink href="/contractors">For contractors</FLink>
            <FLink href="/faq">FAQ</FLink>
            <FLink href="/#work">Work</FLink>
            <FLink href="/#how">How it works</FLink>
            <FLink href="/#pledge">Our pledge</FLink>
            <FLink href="#contact">Start a project</FLink>
          </FooterCol>
          <FooterCol title="Contact">
            <FLink href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</FLink>
          </FooterCol>
        </div>
      </div>

      <div className="mx-auto mt-7 flex max-w-[1180px] flex-col items-start justify-between gap-2 border-t border-white/5 px-4 pt-5 text-[11px] tracking-[0.02em] text-muted md:flex-row md:items-center md:px-8">
        <span>© 2026 BohdiAI</span>
        <span className="flex gap-4 md:gap-[18px]">
          <a
            href="/privacy"
            className="text-muted no-underline transition-colors hover:text-text-soft"
          >
            Privacy
          </a>
          <a
            href="/terms"
            className="text-muted no-underline transition-colors hover:text-text-soft"
          >
            Terms
          </a>
        </span>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex min-w-[130px] flex-col gap-2 md:gap-2.5">
      <span className="mb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-muted">
        {title}
      </span>
      {children}
    </div>
  );
}

function FLink({
  href,
  external = false,
  children,
}: {
  href: string;
  external?: boolean;
  children: React.ReactNode;
}): React.ReactElement {
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-[12px] text-text-soft no-underline transition-colors hover:text-honey-warm md:text-[13px]"
      >
        {children}
      </a>
    );
  }
  return (
    <a
      href={href}
      className="inline-flex items-center gap-1.5 text-[12px] text-text-soft no-underline transition-colors hover:text-honey-warm md:text-[13px]"
    >
      {children}
    </a>
  );
}
