import meta from './meta';
import ScrollReveal from '@/components/storefront/ScrollReveal';
import SplitReveal from '@/components/storefront/motion/SplitReveal';

export { meta };

interface AboutManifestContent {
  eyebrow?: string;
  manifest: string;
  principle1?: string;
  principle2?: string;
  principle3?: string;
  principle4?: string;
}

interface AboutManifestProps {
  content: AboutManifestContent;
}

export default function AboutManifest({ content }: AboutManifestProps) {
  const { eyebrow, manifest, principle1, principle2, principle3, principle4 } = content;
  const principles = [principle1, principle2, principle3, principle4].filter(
    (p): p is string => p !== undefined && p !== '',
  );

  return (
    <section className="relative w-full bg-s-background py-s-section sf-noise-grain overflow-hidden">
      {/* Ambient accent glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50vw] h-[50vw] rounded-full bg-s-accent/6 blur-[140px] pointer-events-none z-0" aria-hidden="true" />

      <div className="relative z-content mx-auto max-w-5xl px-6 text-center">

        {eyebrow !== undefined && eyebrow !== '' && (
          <ScrollReveal delay={0.05}>
            <p className="mb-8 font-s-body text-[0.7rem] uppercase tracking-[0.28em] text-s-accent font-bold">
              {eyebrow}
            </p>
          </ScrollReveal>
        )}

        <p className="font-s-heading font-light text-s-text text-2xl md:text-3xl lg:text-4xl leading-[1.25] tracking-tight">
          <SplitReveal text={manifest} by="word" stagger={0.035} delay={0.1} />
        </p>

        {principles.length > 0 && (
          <div className="mt-16 md:mt-20 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 max-w-3xl mx-auto text-left">
            {principles.map((p, i) => (
              <ScrollReveal key={i} delay={0.3 + i * 0.08} yOffset={16}>
                <div className="flex items-start gap-4">
                  <span className="font-s-heading font-black text-s-accent text-2xl md:text-3xl leading-none mt-0.5">
                    {(i + 1).toString().padStart(2, '0')}
                  </span>
                  <p className="font-s-body text-s-text text-base md:text-lg leading-snug">
                    {p}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
