/**
 * The shared kicker that opens most sections — • LABEL •.
 * Two honey dots with a soft halo, muted uppercase label between them.
 */
export function SectionKicker({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <div className="mb-4 flex items-center justify-center gap-3.5 text-[11px] font-medium uppercase tracking-[0.22em] text-muted md:text-[12px]">
      <span className="inline-block size-1.5 rounded-full bg-honey shadow-[0_0_14px_var(--honey)]" />
      {children}
      <span className="inline-block size-1.5 rounded-full bg-honey shadow-[0_0_14px_var(--honey)]" />
    </div>
  );
}
