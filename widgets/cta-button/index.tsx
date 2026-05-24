import meta from './meta';

export { meta };

// ─── Types ────────────────────────────────────────────────────────────────────

interface CtaButtonContent {
  label: string;
  href: string;
}

interface CtaButtonProps {
  content: CtaButtonContent;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CtaButton({ content }: CtaButtonProps) {
  return (
    <a
      href={content.href}
      className="inline-block font-medium transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{
        backgroundColor: 'var(--color-accent)',
        color: 'var(--color-background)',
        fontFamily: 'var(--font-body)',
        borderRadius: 'var(--card-border-radius)',
        padding: '0.75rem 2rem',
        outlineColor: 'var(--color-accent)',
      }}
    >
      {content.label}
    </a>
  );
}
