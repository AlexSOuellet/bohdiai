/**
 * Main Street — the cart (Full), in the family's own chrome and lettering: her
 * pieces priced from the catalog, a discount code when promotions are on, the
 * sums, and the form that sends the order. Nothing is charged. Every word is the
 * site's own (`words.cart`). Class-only: the rules live in chrome's stylesheet
 * under `.ms-cart-*`.
 */
import type { ReactElement } from 'react';
import type { CartView } from '../content';
import { fill } from '@/lib/site-words/words';
import { PromoCodeForm, RemoveFromCartButton, SyncCart } from '@/lib/storefront/CartControls';
import { OrderRequestForm } from '@/lib/storefront/OrderRequestForm';
import { Type } from './Type';
import type { FamilyWords } from './words';

export function FamilyCart({ cart, words }: { cart: CartView; words: FamilyWords }): ReactElement {
  const C = words.cart;
  const ready = cart.lines.filter((l) => l.available);
  const blocked = ready.length !== cart.lines.length;
  return (
    <section className="ms-wrap ms-cart">
      <SyncCart ids={cart.lines.map((l) => l.id)} />
      <Type as="h1" role="closeHead" className="ms-cart-title">
        {C.title}
      </Type>
      {cart.lines.length === 0 ? (
        <div className="ms-cart-empty">
          <Type as="p" role="body">
            {C.empty}
          </Type>
          <Type as="a" role="navLabel" href="/shop" className="ms-product-cta">
            {C.browse}
          </Type>
        </div>
      ) : (
        <div className="ms-cart-grid">
          <div className="ms-cart-sheet" aria-label={C.title} role="group">
            <ul className="ms-cart-lines">
              {cart.lines.map((l) => (
                <li key={l.id} className="ms-cart-line" data-gone={l.available ? 'false' : 'true'}>
                  {l.photo?.url !== undefined ? (
                    // The owner's own upload, already shrunk at upload.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.photo.url} alt="" loading="lazy" className="archetype-photo ms-cart-photo" />
                  ) : (
                    <span className="ms-cart-photo archetype-photo-empty" />
                  )}
                  <div className="ms-cart-name">
                    <Type as="a" role="body" href={`/listings/${l.slug}`}>
                      {l.name}
                    </Type>
                    {!l.available && (
                      <Type as="span" role="eyebrow" className="ms-cart-gone">
                        {C.gone}
                      </Type>
                    )}
                  </div>
                  <Type as="span" role="body" className="ms-cart-price">
                    {l.salePrice === undefined ? (
                      l.price
                    ) : (
                      <>
                        <s>
                          <span className="ms-sr">{C.was} </span>
                          {l.price}
                        </s>{' '}
                        {l.salePrice}
                      </>
                    )}
                  </Type>
                  <RemoveFromCartButton listingId={l.id} className="ms-cart-out" label={C.remove} ariaLabel={fill(C.removeLabel, { name: l.name })} />
                </li>
              ))}
            </ul>
            {cart.codes && (
              <div className="ms-cart-code">
                <PromoCodeForm current={cart.code?.value ?? null} className="ms-code" labels={{ field: C.codeField, apply: C.codeApply, applying: C.codeApplying, remove: C.codeRemove }} />
                {cart.code !== undefined && (
                  <p role={cart.code.applied ? 'status' : 'alert'}>{cart.code.applied ? fill(C.codeApplied, { code: cart.code.value }) : (cart.code.message ?? '')}</p>
                )}
              </div>
            )}
            <dl className="ms-cart-sum">
              {cart.discount !== undefined && (
                <>
                  <div>
                    <dt>{C.subtotal}</dt>
                    <dd>{cart.subtotal}</dd>
                  </div>
                  <div>
                    <dt>{cart.discount.label}</dt>
                    <dd>−{cart.discount.amount}</dd>
                  </div>
                </>
              )}
              <div className="ms-cart-total">
                <dt>{C.total}</dt>
                <dd>{cart.total}</dd>
              </div>
            </dl>
          </div>
          <div className="ms-cart-send" aria-labelledby="ms-cart-send">
            <Type as="h2" role="title" id="ms-cart-send" className="ms-cart-send-title">
              {cart.pay === undefined ? C.sendTitle : C.payTitle}
            </Type>
            <Type as="p" role="body" className="ms-cart-send-lede">
              {cart.pay === undefined ? C.sendLede : C.payLede}
            </Type>
            {blocked ? (
              <p className="bc-form__status" role="alert">
                {C.fix}
              </p>
            ) : (
              <OrderRequestForm listingIds={ready.map((l) => l.id)} code={cart.code?.applied === true ? cart.code.value : null} w={C} honeypot={C.honeypot} pay={cart.pay ?? null} />
            )}
          </div>
        </div>
      )}
    </section>
  );
}
