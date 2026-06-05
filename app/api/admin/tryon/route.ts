/**
 * Founder-only try-on endpoint: re-express a tenant's live store in another
 * archetype and save it as a version. No auth yet — dev/founder only; gate before
 * this ships (see the try-on spec).
 */
import { NextResponse } from 'next/server';
import { convertStore } from '@/lib/tryon/convert';

export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      subdomain?: string;
      target?: string;
      label?: string;
      lookKey?: string;
    };
    if (!body.subdomain || !body.target || !body.label) {
      return NextResponse.json({ ok: false, error: 'subdomain, target, label required' }, { status: 400 });
    }
    const result = await convertStore({
      subdomain: body.subdomain,
      targetArchetypeKey: body.target,
      label: body.label,
      lookKey: body.lookKey,
    });
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
