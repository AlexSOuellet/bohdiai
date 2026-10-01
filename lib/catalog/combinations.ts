/** Option combinations (Etsy-style, decided in D4): every choice of every option crossed. */
export const MAX_OPTIONS = 3;
export const MAX_CHOICES = 30;
export const MAX_COMBINATIONS = 100;

export type Combination = Record<string, string>;

export function combinationsOf(options: readonly { name: string; choices: readonly string[] }[]): Combination[] {
  if (options.length === 0) return [];
  let result: Combination[] = [{}];
  for (const option of options) {
    const next: Combination[] = [];
    for (const partial of result) for (const choice of option.choices) next.push({ ...partial, [option.name]: choice });
    result = next;
  }
  return result;
}

/** A stable key for a combination, whatever order its keys were written in. */
export function combinationKey(combination: Combination): string {
  return JSON.stringify(Object.keys(combination).sort().map((k) => [k, combination[k]]));
}
