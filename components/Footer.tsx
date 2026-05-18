import { BohdiLogo } from './BohdiLogo';

const SKOOL_URL = 'https://www.skool.com/wits-end-breakthrough-7869';
const CONTACT_EMAIL = 'alex@bohdiai.com';

export function Footer() {
  return (
    <footer className="paper-dark relative bg-espresso-900 text-cream-50">
      <div className="mx-auto max-w-[1180px] px-6 pb-10 pt-16 md:px-10">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <BohdiLogo tone="cream" size={32} />
            <p className="mt-5 max-w-[18ch] font-serif text-[26px] font-light leading-[1.15] tracking-[-0.01em] md:text-[30px]">
              The trusted friend who happens to be really good at tech.
            </p>
            <p className="mt-5 max-w-[40ch] text-[14px] text-cream-50/60">
              Built for small businesses. Made in Rhode Island. Launching summer 2026.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-[14px] sm:grid-cols-3 md:col-span-7">
            <FooterCol title="Get involved">
              <FLink href="#waitlist">Join the waitlist</FLink>
              <FLink href={SKOOL_URL}>Skool community</FLink>
            </FooterCol>
            <FooterCol title="The thing">
              <FLink href="#how">How it works</FLink>
              <FLink href="#who">Who&rsquo;s behind this</FLink>
            </FooterCol>
            <FooterCol title="Get in touch">
              <FLink href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</FLink>
            </FooterCol>
          </div>
        </div>
        <div className="mt-16 flex flex-wrap items-center justify-between gap-3 border-t border-cream-50/10 pt-6 font-mono text-[11px] uppercase tracking-[0.14em] text-cream-50/50">
          <span>© 2026 BohdiAI · bohdiai.com</span>
          <span>You own it. All of it.</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-4 font-mono text-[11px] uppercase tracking-[0.14em] text-honey-300">
        {title}
      </div>
      <ul className="space-y-2.5">{children}</ul>
    </div>
  );
}

function FLink({ href, children }: { href: string; children: React.ReactNode }) {
  const external = href.startsWith('http');
  return (
    <li>
      <a
        href={href}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        className="link-underline text-cream-50/85 hover:text-cream-50"
      >
        {children}
      </a>
    </li>
  );
}
