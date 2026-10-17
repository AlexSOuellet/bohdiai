import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { Scene } from '@/components/Scene';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SectionKicker } from '@/components/SectionKicker';
import { LookBrowser } from '@/components/LookBrowser';
import { LOOKS_WORDS as W } from '@/lib/site/looks';

export const metadata: Metadata = { title: W.metaTitle, description: W.metaDescription };

/** bohdiai.com/looks — one real sample shop, Classic Loafs, in every mood (Alex, Session 107). */
export default async function LooksPage(): Promise<React.ReactElement> {
  const host = (await headers()).get('host') ?? '';
  return (
    <Scene>
      <Header />
      <main id="main">
        <div className="px-2 pt-10 text-center md:pt-16">
          <SectionKicker>{W.kicker}</SectionKicker>
          <h1 className="mx-auto max-w-[900px] font-sans text-[34px] font-medium leading-[1.05] tracking-[-0.02em] text-text md:text-[56px] md:tracking-[-0.03em]">
            {W.title}
          </h1>
          <p className="mx-auto mt-4 max-w-[52ch] text-[15px] text-muted md:text-[17px]">{W.lede}</p>
        </div>
        <LookBrowser local={host.includes('localhost')} />
      </main>
      <Footer />
    </Scene>
  );
}
