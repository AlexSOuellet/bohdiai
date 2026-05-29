import Image from 'next/image';
import meta from './meta';

export { meta };

interface AboutStoryContent {
  eyebrow?: string;
  headline: string;
  intro: string;
  body: string;
  signatureName?: string;
  signatureRole?: string;
  imageUrl?: string;
}

interface AboutStoryProps {
  content: AboutStoryContent;
}

function richTextToParagraphs(raw: string): string[] {
  // Accept either <p>-wrapped HTML or newline-separated plain text.
  const stripped = raw
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .trim();

  return stripped
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
}

export default function AboutStory({ content }: AboutStoryProps) {
  const { eyebrow, headline, intro, body, signatureName, signatureRole, imageUrl } = content;

  const introParagraphs = richTextToParagraphs(intro);
  const bodyParagraphs = richTextToParagraphs(body);
  const hasImage = imageUrl !== undefined && imageUrl !== '';
  const hasSignature = signatureName !== undefined && signatureName !== '';

  return (
    <article className="bg-s-background">
      {hasImage && (
        <div className="relative w-full h-[42vh] md:h-[60vh] overflow-hidden">
          <Image
            src={imageUrl!}
            alt={headline}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-s-background pointer-events-none" />
        </div>
      )}

      <header className="max-w-3xl mx-auto px-6 pt-16 md:pt-24 pb-10 md:pb-14 text-center">
        {eyebrow !== undefined && eyebrow !== '' && (
          <p className="mb-5 font-s-body text-[0.7rem] uppercase tracking-[0.22em] text-s-accent font-bold">
            {eyebrow}
          </p>
        )}
        <h1 className="sf-heading text-4xl md:text-5xl lg:text-6xl text-s-text leading-[1.05] mb-8">
          {headline}
        </h1>
        <div className="space-y-4 font-s-body text-lg md:text-xl text-s-text/85 leading-relaxed">
          {introParagraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 pb-20 md:pb-28">
        <div className="space-y-6 font-s-body text-base md:text-lg text-s-text/80 leading-[1.75]">
          {bodyParagraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>

        {hasSignature && (
          <div className="mt-14 md:mt-20 flex items-end gap-4">
            <div>
              <p className="sf-heading font-light italic text-s-text text-3xl md:text-4xl leading-none mb-1">
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
        )}
      </div>
    </article>
  );
}
