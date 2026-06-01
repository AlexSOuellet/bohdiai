// Poll a background build's status. The onboarding screen hits this every couple
// of seconds to update progress and, when done, get the subdomain to send the
// maker to (or the error, if it failed).

import type { NextRequest } from 'next/server';
import { getBuild } from '@/lib/onboarding/build-store';

export const runtime = 'nodejs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;
  const build = await getBuild(id);
  if (build === null) {
    return new Response('Build not found', { status: 404 });
  }
  return Response.json({
    status: build.status,
    statusLabel: build.status_label,
    subdomain: build.subdomain,
    tenantId: build.tenant_id,
    error: build.error,
  });
}
