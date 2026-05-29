import Image from 'next/image';
import meta from './meta';
import ScrollReveal from '@/components/storefront/ScrollReveal';

export { meta };

interface AboutFoundersNoteContent {
  eyebrow?: string;
  quote: string;
  signatureName: string;
  signatureRole?: string;
  portraitImageUrl?: string;
}

interface AboutFoundersNoteProps {
  content: AboutFoundersNoteContent;
}

export default function AboutFoundersNote({ content }: AboutFoundersNoteProps) {
  const { eyebrow, quote, signatureName, signatureRole, portraitImageUrl } = content;

  return (
    <section className="relative w-full bg-s-background py-s-section sf-noise-grain">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-12 gap-8 md:gap-12 items-center">

          {/* Portrait — left */}
          {portraitImageUrl !== undefined && portraitImageUrl !== '' && (
            <ScrollReveal delay={0.1} yOffset={24} className="col-span-12 md:col-span-5 lg:col-span-4">
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-s-card border border-s-border shadow-xl">
                <Image
                  src={portraitImageUrl}
                  alt={signatureName}
                  fill
                  sizes="(max-width: 720px) 100vw, 33vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent pointer-events-none" />
              </div>
            </ScrollReveal>
          )}

          {/* Quote + signature — right */}
          <div className={(portraitImageUrl !== undefined && portraitImageUrl !== '') ? 'col-span-12 md:col-span-7 lg:col-span-8' : 'col-span-12'}>
            <ScrollReveal delay={0.25} yOffset={20}>
              {eyebrow !== undefined && eyebrow !== '' && (
                <p className="mb-5 font-s-body text-[0.7rem] uppercase tracking-[0.22em] text-s-accent font-bold">
                  {eyebrow}
                </p>
              )}

              <blockquote className="font-s-heading font-light text-s-text text-2xl md:text-3xl lg:text-4xl leading-[1.2] tracking-tight mb-10">
                <span className="text-s-accent text-5xl leading-none align-top mr-1" aria-hidden="true">&ldquo;</span>
                {quote}
                <span className="text-s-accent text-5xl leading-none align-bottom ml-1" aria-hidden="true">&rdquo;</span>
              </blockquote>

              <div className="flex items-end gap-4">
                {/* Stylized signature wordmark */}
                <div>
                  <p className="font-s-heading font-light italic text-s-text text-3xl md:text-4xl leading-none mb-1">
                    {signatureName}
                  </p>
                  {signatureRole !== undefined && signatureRole !== '' && (
                    <p className="font-s-body text-xs uppercase tracking-[0.18em] text-s-muted">
                      {signatureRole}
                    </p>
                  )}
                </div>
                <div className="flex-1 h-px bg-s-border" aria-hidden="true" />
              </div>
            </ScrollReveal>
          </div>

        </div>
      </div>
    </section>
  );
}
