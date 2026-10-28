/** The description writer's limits (Alex, 2026-10-28), apart from the writer so the
 *  screens can use them without loading the AI client. */

/** Runs a month, by plan. */
export const DESCRIBE_LIMIT = { free: 30, paid: 100 } as const;

export const SHORT_MAX = 300;
export const LONG_MAX = 1200;
export const FACTS_MAX = 500;

export type Description = { short: string; description: string };
