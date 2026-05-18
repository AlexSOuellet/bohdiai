import { BohdiLogo } from './BohdiLogo';

export function Header() {
  return (
    <header className="relative z-20">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between px-6 pt-6 md:px-10 md:pt-8">
        <a href="#top" className="focus-ring rounded">
          <BohdiLogo />
        </a>
        <nav
          aria-label="Primary"
          className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-600 md:gap-6"
        >
          <a href="#how" className="link-underline hidden md:inline">
            How it works
          </a>
          <a href="#community" className="link-underline hidden md:inline">
            Community
          </a>
          <span
            aria-disabled="true"
            className="rounded-full border border-ink-900/15 px-3 py-2 text-ink-800/60"
            title="Log in opens when the product launches"
          >
            Log in
          </span>
        </nav>
      </div>
    </header>
  );
}
