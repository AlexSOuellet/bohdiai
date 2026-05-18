type GlyphName =
  | 'bread'
  | 'spool'
  | 'tag'
  | 'house'
  | 'leaf'
  | 'vase'
  | 'flame'
  | 'spark'
  | 'note'
  | 'flower'
  | 'ring'
  | 'wrench';

export function Glyph({ name }: { name: GlyphName }) {
  const stroke = '#bf7a1f';
  const baseProps = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none' as const,
    stroke,
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  switch (name) {
    case 'bread':
      return (
        <svg {...baseProps}>
          <path d="M4 13c0-4 4-7 8-7s8 3 8 7-3 6-8 6-8-2-8-6z" />
          <path d="M9 11l-1 5M12 10l0 6M15 11l1 5" />
        </svg>
      );
    case 'spool':
      return (
        <svg {...baseProps}>
          <rect x="5" y="4" width="14" height="16" rx="2" />
          <path d="M5 9h14M5 15h14" />
        </svg>
      );
    case 'tag':
      return (
        <svg {...baseProps}>
          <path d="M3 12V4h8l10 10-8 8L3 12z" />
          <circle cx="8" cy="8" r="1.5" />
        </svg>
      );
    case 'house':
      return (
        <svg {...baseProps}>
          <path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />
        </svg>
      );
    case 'leaf':
      return (
        <svg {...baseProps}>
          <path d="M20 4c-9 0-15 5-15 13 0 2 1 3 3 3 8 0 13-6 13-15z" />
          <path d="M5 20c4-5 8-9 14-13" />
        </svg>
      );
    case 'vase':
      return (
        <svg {...baseProps}>
          <path d="M8 4h8l-1 3a3 3 0 0 0 1 4v6a3 3 0 0 1-3 3h-2a3 3 0 0 1-3-3v-6a3 3 0 0 0 1-4z" />
        </svg>
      );
    case 'flame':
      return (
        <svg {...baseProps}>
          <path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-3 2-6 0 0 2 1 3-4z" />
        </svg>
      );
    case 'spark':
      return (
        <svg {...baseProps}>
          <path d="M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3 3M15 15l3 3M6 18l3-3M15 9l3-3" />
        </svg>
      );
    case 'note':
      return (
        <svg {...baseProps}>
          <path d="M9 18V5l10-2v13" />
          <circle cx="7" cy="18" r="2" />
          <circle cx="17" cy="16" r="2" />
        </svg>
      );
    case 'flower':
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="12" r="2.5" />
          <path d="M12 9.5V5M12 14.5V19M9.5 12H5M14.5 12H19M9 9l-2-2M15 15l2 2M9 15l-2 2M15 9l2-2" />
        </svg>
      );
    case 'ring':
      return (
        <svg {...baseProps}>
          <circle cx="12" cy="15" r="5" />
          <path d="M9 6l3-2 3 2-1 4h-4z" />
        </svg>
      );
    case 'wrench':
      return (
        <svg {...baseProps}>
          <path d="M14 7a4 4 0 1 0-3 7l-7 7 2 2 7-7a4 4 0 0 0 5-5l-2 2-2-2 2-2z" />
        </svg>
      );
  }
}

export type { GlyphName };
