// Streaming storefront generation. The build screen opens a POST against this
// route and reads server-sent events as Bohdi (or the legacy pipeline) runs.
// Each progress event arrives as it happens; a final `done` event carries the
// subdomain and total build time.

import type { NextRequest } from 'next/server';
import { checkGenerationRateLimit } from '@/lib/rate-limit';
import { MOODS, type MoodKey } from '@/lib/moods';
import { runStorefront } from '@/lib/onboarding/run-storefront';
import { loadTickerContent } from '@/lib/onboarding/ticker-content';
import { logger } from '@/lib/logger';
import type { ProgressEvent } from '@/lib/progress';

const TIP_INTERVAL_MS = 8000;

export const runtime = 'nodejs';
// Generation runs Bohdi or the legacy pipeline — sonnet calls + fal calls.
// A normal job fits in 3-4 minutes; 300s is the Hobby-plan ceiling and
// enough headroom for normal runs.
export const maxDuration = 300;

interface GenerateBody {
  shopName: string;
  subdomain: string;
  nicheSlug: string;
  moodKey: string;
  productCount: number;
  makerName?: string;
  logoUrl?: string;
  brandColors?: string[];
}

function isMoodKey(value: string): value is MoodKey {
  return value in MOODS;
}

export async function POST(req: NextRequest): Promise<Response> {
  let body: GenerateBody;
  try {
    body = (await req.json()) as GenerateBody;
  } catch {
    return new Response('Invalid JSON body', { status: 400 });
  }

  if (!isMoodKey(body.moodKey)) {
    return new Response('Invalid mood key', { status: 400 });
  }

  try {
    await checkGenerationRateLimit();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Rate limit exceeded';
    return new Response(message, { status: 429 });
  }

  const encoder = new TextEncoder();
  const start = Date.now();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ProgressEvent) => {
        const payload = `data: ${JSON.stringify(event)}\n\n`;
        try {
          controller.enqueue(encoder.encode(payload));
        } catch {
          // Client disconnected — controller may already be closed.
        }
      };

      // Load ticker content (niche tips + encouragement) before kicking off
      // generation so the first tip can land within a second or two.
      const ticker = await loadTickerContent(body.nicheSlug, body.makerName);
      const tipPool = interleave(shuffle(ticker.encouragement), shuffle(ticker.nicheTips));
      let tipIdx = 0;

      const sendNextTip = () => {
        if (tipPool.length === 0) return;
        const text = tipPool[tipIdx % tipPool.length] as string;
        tipIdx++;
        send({ type: 'tip', text });
      };

      // First tip lands immediately so the screen isn't blank while Bohdi
      // boots. Subsequent tips roll on a timer until generation finishes.
      sendNextTip();
      const tipTimer = setInterval(sendNextTip, TIP_INTERVAL_MS);

      try {
        const result = await runStorefront(
          {
            shopName: body.shopName,
            subdomain: body.subdomain,
            nicheSlug: body.nicheSlug,
            moodKey: body.moodKey as MoodKey,
            productCount: body.productCount,
            makerName: body.makerName,
            logoUrl: body.logoUrl,
            brandColors: body.brandColors,
          },
          send,
        );
        clearInterval(tipTimer);
        send({
          type: 'done',
          subdomain: result.subdomain,
          tenantId: result.tenantId,
          totalMs: Date.now() - start,
        });
      } catch (err) {
        clearInterval(tipTimer);
        const message = err instanceof Error ? err.message : 'Generation failed';
        logger.error('storefront stream failed', {
          subdomain: body.subdomain,
          nicheSlug: body.nicheSlug,
          moodKey: body.moodKey,
          error: message,
        });
        send({
          type: 'error',
          message:
            'We hit a problem building your store. Go back and try again — your choices are saved.',
        });
      } finally {
        try {
          controller.close();
        } catch {
          // Already closed.
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = copy[i] as T;
    copy[i] = copy[j] as T;
    copy[j] = tmp;
  }
  return copy;
}

/** Interleave two arrays. Encouragement first so the maker sees a warm line
 *  before a niche fact. */
function interleave<T>(a: T[], b: T[]): T[] {
  const out: T[] = [];
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    if (i < a.length) out.push(a[i] as T);
    if (i < b.length) out.push(b[i] as T);
  }
  return out;
}
