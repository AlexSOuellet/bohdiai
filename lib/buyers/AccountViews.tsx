/**
 * My account and an order's page (buyer accounts, Full; Penny's site is the
 * reference): past orders, a page for each order, Reorder on a paid one. Every
 * word is the shop's own. Shared by every design; each design styles the `ba-`
 * classes in its own look.
 */
import type { ReactElement } from 'react';
import { fill } from '@/lib/site-words/words';
import type { ShopWords } from '@/lib/storefront/words';
import type { BuyerOrder, BuyerOrderSummary } from './accounts';
import { signOutBuyer } from './actions';
import { ReorderButton } from './AccountForms';

type W = ShopWords['account'];

function day(iso: string, locale: string, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat(locale === '' ? undefined : locale, { dateStyle: 'medium', timeZone }).format(new Date(iso));
  } catch {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(iso));
  }
}

/** An order's status in the shop's words ("partially_refunded" reads its "partiallyRefunded" spot). */
function statusWord(w: W, status: string): string {
  const spot = status.replace(/_([a-z])/g, (_m, c: string) => c.toUpperCase());
  return (w.status as Readonly<Record<string, string>>)[spot] ?? '';
}

export function MyAccount({ w, name, orders, timeZone }: { w: W; name: string; orders: readonly BuyerOrderSummary[]; timeZone: string }): ReactElement {
  return (
    <section className="ba-account" aria-labelledby="ba-title">
      <div className="ba-account-head">
        <div>
          <h1 id="ba-title" className="ba-title">
            {w.mine.title}
          </h1>
          <p className="ba-lede">{name === '' ? w.mine.helloNoName : fill(w.mine.hello, { name })}</p>
        </div>
        <form action={signOutBuyer}>
          <button type="submit" className="ba-link">
            {w.mine.signOut}
          </button>
        </form>
      </div>
      <h2 className="ba-sub">{w.mine.orders}</h2>
      {orders.length === 0 ? (
        <div className="ba-empty">
          <p>{w.mine.none}</p>
          <a className="ba-btn" href="/shop">
            {w.mine.browse}
          </a>
        </div>
      ) : (
        <ul className="ba-orders">
          {orders.map((o) => (
            <li key={o.number} className="ba-order-row">
              <a href={`/account/orders/${encodeURIComponent(o.number)}`} aria-label={`${fill(w.mine.number, { n: o.number })}, ${w.mine.view}`}>
                <span className="ba-order-number">{fill(w.mine.number, { n: o.number })}</span>
                <span className="ba-order-day">{day(o.placedAt, w.mine.locale, timeZone)}</span>
                <span className="ba-order-status" data-status={o.status}>
                  {statusWord(w, o.status)}
                </span>
                <span className="ba-order-total">{o.total}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function OrderPage({ w, order, timeZone }: { w: W; order: BuyerOrder; timeZone: string }): ReactElement {
  return (
    <section className="ba-account" aria-labelledby="ba-title">
      <p className="ba-links">
        <a className="ba-link" href="/account">
          {w.order.back}
        </a>
      </p>
      <div className="ba-account-head">
        <div>
          <h1 id="ba-title" className="ba-title">
            {fill(w.mine.number, { n: order.number })}
          </h1>
          <p className="ba-lede">
            {fill(w.order.placed, { date: day(order.placedAt, w.mine.locale, timeZone) })}
            {' · '}
            <span className="ba-order-status" data-status={order.status}>
              {statusWord(w, order.status)}
            </span>
          </p>
        </div>
        {order.paid && <ReorderButton w={w} number={order.number} />}
      </div>
      <h2 className="ba-sub">{w.order.items}</h2>
      <ul className="ba-lines">
        {order.lines.map((l, i) => (
          <li key={`${l.name}-${i}`} className="ba-line">
            <span className="ba-line-name">
              {l.name}
              {l.option !== '' && <span className="ba-line-option">{l.option}</span>}
            </span>
            <span className="ba-line-qty">{l.quantity > 1 ? `× ${l.quantity}` : ''}</span>
            <span className="ba-line-price">{l.price}</span>
          </li>
        ))}
      </ul>
      <dl className="ba-sum">
        <div>
          <dt>{w.order.subtotal}</dt>
          <dd>{order.subtotal}</dd>
        </div>
        {order.discount !== null && (
          <div>
            <dt>{order.discount.label === '' ? w.order.discount : order.discount.label}</dt>
            <dd>−{order.discount.amount}</dd>
          </div>
        )}
        {order.shipping !== null && (
          <div>
            <dt>{w.order.shipping}</dt>
            <dd>{order.shipping}</dd>
          </div>
        )}
        {order.tax !== null && (
          <div>
            <dt>{w.order.tax}</dt>
            <dd>{order.tax}</dd>
          </div>
        )}
        <div className="ba-sum-total">
          <dt>{w.order.total}</dt>
          <dd>{order.total}</dd>
        </div>
      </dl>
    </section>
  );
}
