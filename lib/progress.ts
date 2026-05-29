// Progress events for streaming generation work to the build screen.
// Emitted by Bohdi and the legacy generation pipeline; consumed by the
// SSE route at /api/onboarding/generate and rendered by the ticker.

export type ProgressEvent =
  | { type: 'status'; step: ProgressStep; label: string }
  | { type: 'tip'; text: string }
  | { type: 'done'; subdomain: string; tenantId: string; totalMs: number }
  | { type: 'error'; message: string };

export type ProgressStep =
  | 'starting'
  | 'reading-niche'
  | 'reading-mood'
  | 'studying-blocks'
  | 'deliberating'
  | 'choosing-palette'
  | 'choosing-type'
  | 'composing-home'
  | 'writing-about'
  | 'writing-shop-contact'
  | 'briefing-hero'
  | 'briefing-about-photo'
  | 'briefing-products'
  | 'generating-hero-image'
  | 'generating-about-image'
  | 'generating-product-image'
  | 'finalizing';

export type ProgressEmitter = (event: ProgressEvent) => void;

// Maker-facing labels per step. Personalized with the maker's name when
// available — e.g. "Sarah, choosing your colors…" instead of "Choosing
// colors…". Default first-name handling is just substitution; if no name
// is passed, the label drops the name gracefully.
export function labelFor(step: ProgressStep, makerName?: string): string {
  const name = makerName?.trim();
  const opener = name !== undefined && name !== '' ? `${name}, ` : '';

  switch (step) {
    case 'starting':
      return `${opener}getting set up…`;
    case 'reading-niche':
      return `${opener}reading about your craft…`;
    case 'reading-mood':
      return `${opener}thinking about the mood you picked…`;
    case 'studying-blocks':
      return `${opener}planning your layout…`;
    case 'deliberating':
      return `${opener}weighing options…`;
    case 'choosing-palette':
      return `${opener}choosing your colors…`;
    case 'choosing-type':
      return `${opener}choosing your fonts…`;
    case 'composing-home':
      return `${opener}putting your home page together…`;
    case 'writing-about':
      return `${opener}writing your story…`;
    case 'writing-shop-contact':
      return `${opener}writing your shop and contact pages…`;
    case 'briefing-hero':
      return `${opener}planning your main image…`;
    case 'briefing-about-photo':
      return `${opener}planning your portrait…`;
    case 'briefing-products':
      return `${opener}planning your product photos…`;
    case 'generating-hero-image':
      return `${opener}creating your main image…`;
    case 'generating-about-image':
      return `${opener}creating your portrait…`;
    case 'generating-product-image':
      return `${opener}creating your product photos…`;
    case 'finalizing':
      return `${opener}putting on the finishing touches…`;
  }
}

// Map Bohdi's tool names to progress steps. Used by the run loop to translate
// each tool call into a meaningful maker-facing event.
export function stepForTool(toolName: string): ProgressStep | null {
  switch (toolName) {
    case 'read_niche':
      return 'reading-niche';
    case 'read_mood':
      return 'reading-mood';
    case 'list_blocks':
    case 'list_widgets':
      return 'studying-blocks';
    case 'log_decision':
      return 'deliberating';
    case 'set_tokens':
      return 'choosing-palette';
    case 'set_home_page':
      return 'composing-home';
    case 'set_about_page':
      return 'writing-about';
    case 'set_secondary_pages_copy':
      return 'writing-shop-contact';
    case 'finalize':
      return 'finalizing';
    default:
      return null;
  }
}
