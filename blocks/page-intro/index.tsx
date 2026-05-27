import meta from './meta';

export { meta };

interface PageIntroContent {
  eyebrow?: string;
  heading: string;
  subheading?: string;
}

interface PageIntroProps {
  content: PageIntroContent;
}

export default function PageIntro({ content }: PageIntroProps) {
  return (
    <section className="pt-28 pb-8 md:pt-32 md:pb-12 bg-s-background">
      <div className="max-w-3xl mx-auto px-6 text-center">
        {content.eyebrow !== undefined && content.eyebrow !== '' && (
          <p className="font-s-body text-xs uppercase tracking-[0.2em] text-s-text/50 mb-4">
            {content.eyebrow}
          </p>
        )}
        <h1 className="font-s-heading text-4xl md:text-5xl lg:text-6xl text-s-text">
          {content.heading}
        </h1>
        {content.subheading !== undefined && content.subheading !== '' && (
          <p className="mt-5 font-s-body text-lg text-s-text/70 leading-relaxed max-w-2xl mx-auto">
            {content.subheading}
          </p>
        )}
      </div>
    </section>
  );
}
