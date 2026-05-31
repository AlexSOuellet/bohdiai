// The slop floor: deterministic checks that mechanically flag the AI "tells"
// in a finished layout tree. Code is the gate — it counts, it can't be talked
// out of a verdict. Bohdi's own opinion of his work is not an input here; only
// the structure of what he actually produced.
//
// This grows one check at a time. Each check is a pure function over a Page
// and returns a finding or null. scoreSlop runs them all.

import type { Page, LayoutNode } from './layout';

export interface SlopFinding {
  check: string;
  severity: 'fail' | 'warn';
  message: string;
}

export interface SlopReport {
  passed: boolean;
  findings: SlopFinding[];
}

// A run of more than this many consecutive full-width bands at the top level
// reads as the monotonic vertical stack — the clearest "AI-built" tell. Tunable.
export const MAX_CONSECUTIVE_BANDS = 4;

/** Longest run of consecutive `band` siblings in a list of nodes. */
function longestBandRun(nodes: LayoutNode[]): number {
  let longest = 0;
  let current = 0;
  for (const node of nodes) {
    if (node.type === 'band') {
      current += 1;
      if (current > longest) longest = current;
    } else {
      current = 0;
    }
  }
  return longest;
}

/**
 * Flags a top-level vertical sequence that is a long unbroken run of bands.
 * Stacking bands isn't itself slop — a long run of them with nothing breaking
 * the rhythm is. Only fires when the root is a stack (the vertical scroll).
 */
export function checkBandMonotony(page: Page): SlopFinding | null {
  if (page.root.type !== 'stack') return null;
  const run = longestBandRun(page.root.children);
  if (run <= MAX_CONSECUTIVE_BANDS) return null;
  return {
    check: 'band-stack-monotony',
    severity: 'fail',
    message: `Top level is ${run} full-width bands in a row with nothing breaking the rhythm. That reads as a stacked, AI-built page. Break the run with a split, overlap, bleed, or grid section.`,
  };
}

const CHECKS: ((page: Page) => SlopFinding | null)[] = [checkBandMonotony];

/** Run every slop check against a page. */
export function scoreSlop(page: Page): SlopReport {
  const findings = CHECKS.map((check) => check(page)).filter((f): f is SlopFinding => f !== null);
  return { passed: findings.length === 0, findings };
}
