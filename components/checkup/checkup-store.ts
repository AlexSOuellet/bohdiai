import { useSyncExternalStore } from 'react';
import { type AskedQuestion, type Turn, sanitizeTranscript, sanitizeQuestion } from '@/lib/checkup/transcript';
import { WriteUpSchema, type WriteUp } from '@/lib/checkup/schemas';

/**
 * The visitor's checkup, kept in this browser so a refresh doesn't lose it.
 * Storage can be blocked (private windows, strict settings); the checkup still
 * works, it just starts over on refresh.
 */

export interface CheckupState {
  readonly started: boolean;
  readonly turns: readonly Turn[];
  /** The question on screen, or null while the next one is being written or at the end. */
  readonly current: AskedQuestion | null;
  readonly writeUp: WriteUp | null;
}

const STORAGE_KEY = 'bohdi-checkup-v2';
export const EMPTY: CheckupState = { started: false, turns: [], current: null, writeUp: null };

/** A saved or freshly fetched write-up, checked before it is shown. */
export function toWriteUp(v: unknown): WriteUp | null {
  const parsed = WriteUpSchema.safeParse(v);
  return parsed.success ? parsed.data : null;
}

export function parseSaved(raw: string | null): CheckupState | null {
  if (raw === null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== 'object') return null;
    const rec = parsed as Record<string, unknown>;
    const turns = sanitizeTranscript(rec['turns']);
    const current = sanitizeQuestion(rec['current']);
    return {
      started: rec['started'] === true,
      turns,
      current,
      writeUp: toWriteUp(rec['writeUp']),
    };
  } catch {
    return null;
  }
}

let current: CheckupState | null = null;
const listeners = new Set<() => void>();

function read(): CheckupState {
  if (current !== null) return current;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    raw = null;
  }
  current = parseSaved(raw) ?? EMPTY;
  return current;
}

export function writeCheckup(next: CheckupState): void {
  current = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Blocked storage: keep going in memory.
  }
  for (const l of listeners) l();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The saved checkup in the browser; the empty one while rendering on the server. */
export function useCheckupState(): CheckupState {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** For tests: forget the in-memory copy so the next read goes back to storage. */
export function resetCheckupStoreForTests(): void {
  current = null;
}
