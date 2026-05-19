const BLUR_CHIP =
  'inline-flex items-center gap-2 rounded-pill border border-white/10 bg-white/5 px-4 py-2 text-[13px] font-medium text-text-soft no-underline backdrop-blur-[20px]';

export function Header(): React.ReactElement {
  return (
    <header className="flex items-center justify-between pt-0.5 md:pt-2">
      <div className="flex items-center gap-1.5 md:gap-2">
        <a
          href="/"
          className={`${BLUR_CHIP} gap-2.5 py-2 pl-2 pr-3.5 text-[12px] md:text-[13px]`}
        >
          <span className="grid size-6 place-items-center rounded-[7px] bg-gradient-to-br from-honey-warm to-honey-deep text-[13px] font-bold text-bg-2">
            B
          </span>
          BohdiAI
        </a>
        <a href="#how" className={`${BLUR_CHIP} hidden md:inline-flex`}>
          How it works
        </a>
        <a href="#community" className={`${BLUR_CHIP} hidden md:inline-flex`}>
          Community
        </a>
      </div>
      <a
        href="#waitlist"
        className="inline-flex items-center gap-2 rounded-pill border border-transparent bg-text px-4 py-1.5 text-[12px] font-semibold text-bg no-underline md:py-2 md:text-[13px]"
      >
        Reserve your shop →
      </a>
    </header>
  );
}
