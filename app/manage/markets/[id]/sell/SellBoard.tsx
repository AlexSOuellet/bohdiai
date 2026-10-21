'use client';

import Link from 'next/link';
import type { Route } from 'next';
import type { PaySettings } from '@/lib/market/pay';
import type { SellMethod, SellPiece } from '@/lib/backend/markets/sell';
import { RingUp } from './RingUp';

/** Sell at the table: tap what they're taking, show them how to pay, record the sale. */
export function SellBoard(props: {
  eventId: string;
  marketName: string;
  shopName: string;
  pieces: SellPiece[];
  pay: PaySettings;
  methods: SellMethod[];
  open: boolean;
  card?: boolean;
}): React.ReactElement {
  return (
    <>
      <div className="bk-head">
        <h1 className="bk-title">Sell · {props.marketName}</h1>
        <div className="bk-head-actions">
          <Link className="bk-btn bk-btn-quiet" href={`/manage/markets/${props.eventId}/today` as Route}>
            Back to Today
          </Link>
        </div>
      </div>
      <main id="main" className="bk-content">
        <RingUp {...props} />
      </main>
    </>
  );
}
