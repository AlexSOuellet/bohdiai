import { orderStep } from '@/lib/market/order-step';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** The buyer says they paid; the owner sees it on her Today view and confirms. */
export async function POST(req: Request) {
  return orderStep(req, 'market_mark_paid', 'This order isn’t open any more. Please ask at the table.');
}
