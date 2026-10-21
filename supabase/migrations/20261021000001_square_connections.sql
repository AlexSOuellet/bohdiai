-- A site's Square connection (Alex, 2026-10-21): the maker presses Connect Square,
-- says yes on Square's own page, and Square hands back a key that lets the market
-- app take cards into the maker's own Square account. One per site.
--
-- Locked (Alex: "my number 1 priority is all payment methods added remain secure"):
-- only BohdiAI's server reads or writes it. No policy lets a maker's screen or the
-- public site see a row, and the keys are scrambled (AES-GCM) with a secret that
-- lives only in Cloudflare (SQUARE_TOKEN_KEY), never in the database. We ask Square
-- for the fewest permissions: read the business, its orders and payments.
--
-- The sites table's old square_merchant_id (from the first setup, never used) comes
-- off, so the connection has one home.

create table square_connections (
  tenant_id uuid primary key references tenants(id) on delete cascade,
  -- Square's ID for the business, and its name as Square has it.
  merchant_id text not null check (length(merchant_id) between 1 and 64),
  business_name text not null default '' check (length(business_name) <= 255),
  -- The Square location card sales go to (a business can have more than one).
  location_id text check (location_id is null or length(location_id) between 1 and 64),
  location_name text not null default '' check (length(location_name) <= 255),
  -- The keys, scrambled: base64 of iv + ciphertext.
  access_token_enc text not null,
  refresh_token_enc text not null,
  -- When the access key runs out (Square: 30 days); the server renews it before then.
  expires_at timestamptz not null,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger square_connections_set_updated_at
  before update on square_connections
  for each row execute function set_updated_at();

alter table square_connections enable row level security;
revoke all on square_connections from public, anon, authenticated;

alter table tenants drop column square_merchant_id;
