-- Market costs, organizer, notes and reviews moved behind their own switch,
-- market_records (Full; Saltmarsh & Lace demo spec). Rose n' Cat already uses
-- them, so she keeps them on.
insert into public.tenant_features (tenant_id, feature_key, enabled)
select id, 'market_records', true from public.tenants where subdomain = 'rose-n-cat' and deleted_at is null
on conflict (tenant_id, feature_key) do update set enabled = true;
