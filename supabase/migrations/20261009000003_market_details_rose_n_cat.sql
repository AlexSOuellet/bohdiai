-- Market hours, address, booth and website moved behind their own switch,
-- market_details (Lite up; Showcase is day, market and town). Rose n' Cat
-- already uses them, so she keeps them on.
insert into public.tenant_features (tenant_id, feature_key, enabled)
select id, 'market_details', true from public.tenants where subdomain = 'rose-n-cat' and deleted_at is null
on conflict (tenant_id, feature_key) do update set enabled = true;
