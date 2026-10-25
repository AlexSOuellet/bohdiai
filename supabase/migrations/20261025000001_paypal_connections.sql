-- A site's PayPal connection (Alex, 2026-10-25): the maker presses Connect PayPal,
-- says yes on PayPal's own page, and PayPal tells us her PayPal account ID. Online
-- orders then go straight to her own PayPal. One per site.
--
-- Nothing secret is kept: PayPal's partner setup gives BohdiAI no keys of hers. We
-- act on her account with BohdiAI's own partner keys, which live only in Cloudflare.
-- Locked all the same (Alex: payment security is #1): only BohdiAI's server reads or
-- writes it; no policy lets a maker's screen or the public site see a row.

create table paypal_connections (
  tenant_id uuid primary key references tenants(id) on delete cascade,
  -- PayPal's ID for her account, and its name and email as PayPal has them.
  merchant_id text not null check (length(merchant_id) between 1 and 64),
  business_name text not null default '' check (length(business_name) <= 255),
  email text not null default '' check (length(email) <= 254),
  -- PayPal's own checks: payments can be received, and her email is confirmed.
  payments_receivable boolean not null default false,
  email_confirmed boolean not null default false,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger paypal_connections_set_updated_at
  before update on paypal_connections
  for each row execute function set_updated_at();

alter table paypal_connections enable row level security;
revoke all on paypal_connections from public, anon, authenticated;

-- PayPal as a way to pay, beside the others.
alter table payments drop constraint payments_processor_check;
alter table payments add constraint payments_processor_check
  check (processor = any (array['stripe', 'square', 'paypal', 'manual']));
alter table orders drop constraint orders_payment_method_check;
alter table orders add constraint orders_payment_method_check
  check (payment_method = any (array['venmo', 'cashapp', 'zelle', 'cash', 'card', 'paypal']));

-- One processor payment is recorded once, even if its confirmation arrives twice.
create unique index payments_processor_external_once
  on payments (processor, external_payment_id)
  where external_payment_id is not null and payment_type = 'charge';
