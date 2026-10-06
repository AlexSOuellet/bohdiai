import Image from 'next/image';
import type { WorkEntry } from '@/lib/site/work';

/** A screenshot in a small browser frame with the site's real address. */
export function WorkShot({ entry, sizes }: { entry: WorkEntry; sizes: string }): React.ReactElement {
  return (
    <div className="overflow-hidden rounded-[14px] border border-white/[0.07] bg-[#1a1612] shadow-[0_50px_100px_-30px_rgba(0,0,0,0.8),0_20px_60px_-20px_rgba(233,161,61,0.18)]">
      <div className="flex items-center gap-2.5 border-b border-white/[0.05] bg-[#15110a] px-3 py-2">
        <span className="flex gap-1" aria-hidden="true">
          <span className="size-2 rounded-full bg-[#2c2620]" />
          <span className="size-2 rounded-full bg-[#2c2620]" />
          <span className="size-2 rounded-full bg-[#2c2620]" />
        </span>
        <span className="flex-1 truncate rounded-[6px] bg-bg px-2.5 py-1 text-center text-[10.5px] text-muted">
          <span className="text-honey" aria-hidden="true">
            🔒{' '}
          </span>
          {entry.host}
        </span>
      </div>
      <div className="relative aspect-[1440/760]">
        <Image
          src={entry.shot}
          alt={`${entry.name} home page`}
          fill
          sizes={sizes}
          className="object-cover object-top"
        />
      </div>
    </div>
  );
}
