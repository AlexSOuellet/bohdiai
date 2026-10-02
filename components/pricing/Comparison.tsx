/**
 * What else people pay, and what they'd be doing themselves. A stack of the
 * quotes they've already been handed: the other options sit dim and flat, and
 * BohdiAI lifts out of the stack. The date says when the prices were checked.
 */
import { COMPARISON, COMPARISON_CHECKED, type Audience } from '@/lib/site/plans';

function checkedLabel(iso: string): string {
  const d = new Date(`${iso}T12:00:00Z`);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

export function Comparison({ audience }: { audience: Audience }): React.ReactElement {
  const rows = COMPARISON[audience];
  return (
    <div className="mx-auto max-w-[980px]">
      <div className="hidden grid-cols-[1.1fr_1.2fr_1.7fr] gap-6 px-6 pb-3 text-[11px] font-medium uppercase tracking-[0.18em] text-muted md:grid">
        <span>Option</span>
        <span>What it costs</span>
        <span>What it means for you</span>
      </div>
      <ul className="flex flex-col gap-2.5">
        {rows.map((row) => {
          const ours = row.ours === true;
          return (
            <li
              key={row.name}
              aria-current={ours ? true : undefined}
              className={[
                'grid gap-1.5 rounded-[16px] border px-5 py-4 md:grid-cols-[1.1fr_1.2fr_1.7fr] md:items-center md:gap-6 md:px-6 md:py-5',
                ours
                  ? 'relative mt-3 border-honey-warm/45 shadow-[0_30px_70px_-25px_rgba(0,0,0,0.9),0_0_70px_-20px_rgba(243,201,122,0.4)] [background:linear-gradient(100deg,rgba(243,201,122,0.16),rgba(26,20,16,0.9)_45%)] md:-mx-3 md:px-9 md:py-7'
                  : 'border-white/[0.06] bg-white/[0.02] opacity-80',
              ].join(' ')}
            >
              <span
                className={`font-sans text-[17px] font-semibold tracking-[-0.01em] md:text-[18px] ${ours ? 'text-honey-warm' : 'text-text-soft'}`}
              >
                {row.name}
              </span>
              <span className={`text-[14px] md:text-[15px] ${ours ? 'font-semibold text-text' : 'text-text-soft'}`}>
                {row.cost}
              </span>
              <span className={`text-[14px] leading-[1.5] md:text-[15px] ${ours ? 'text-text' : 'text-muted'}`}>
                {row.you}
              </span>
            </li>
          );
        })}
      </ul>
      <p className="mt-5 text-center text-[12px] text-muted">
        Prices checked {checkedLabel(COMPARISON_CHECKED)}, from each company’s own pricing and published price guides
      </p>
    </div>
  );
}
