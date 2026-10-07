import { orderStep } from '@/lib/market/order-step';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** The buyer steps back before paying; the piece goes back on the shelf. */
export async function POST(req: Request) {
  return orderStep(req, 'market_release', 'This one can’t be released here. Please ask at the table.');
}
