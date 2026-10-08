/**
 * Questions as tap-to-open lines (native details/summary: keyboard and screen
 * reader friendly, no script). The honey plus turns as a question opens.
 */
import type { FaqItem } from '@/lib/site/faq';

export function FaqList({ items, openFirst = false }: { items: readonly FaqItem[]; openFirst?: boolean }): React.ReactElement {
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((item, i) => (
        <details
          key={item.id}
          id={item.id}
          open={openFirst && i === 0}
          className="group scroll-mt-24 rounded-[16px] border border-white/[0.07] bg-white/[0.025] transition-colors duration-base open:border-honey-warm/30 open:bg-white/[0.04]"
        >
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-sans text-[16px] font-medium tracking-[-0.01em] text-text marker:hidden md:px-6 md:py-5 md:text-[18px] [&::-webkit-details-marker]:hidden">
            {item.q}
            <span
              aria-hidden="true"
              className="grid size-7 shrink-0 place-items-center rounded-full border border-honey-warm/35 text-[16px] text-honey-warm transition-transform duration-base group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <div className="flex flex-col gap-3 px-5 pb-5 text-[15px] leading-[1.65] text-text-soft md:px-6 md:pb-6 md:text-[16px]">
            {item.a.map((para) => (
              <p key={para}>{para}</p>
            ))}
            {item.link !== undefined && (
              <a
                href={item.link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-fit border-b border-honey-warm/35 pb-0.5 text-[14px] font-semibold text-honey-warm no-underline transition-colors hover:border-honey-warm"
              >
                {item.link.label}
              </a>
            )}
          </div>
        </details>
      ))}
    </div>
  );
}
