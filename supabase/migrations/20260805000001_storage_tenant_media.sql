-- Storage bucket for maker-uploaded media (real product photos, and later logos/
-- gallery images). Public read — storefront pages display these images directly.
-- Writes happen server-side only, through ownership-gated server actions using the
-- service role, so no per-user storage RLS is needed here.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tenant-media',
  'tenant-media',
  true,
  10485760, -- 10MB per file
  array['image/jpeg', 'image/webp', 'image/png']
)
on conflict (id) do nothing;

-- Allow service role full access (uploads run server-side via supabaseAdmin)
create policy "service role full access on tenant-media"
  on storage.objects
  for all
  to service_role
  using (bucket_id = 'tenant-media')
  with check (bucket_id = 'tenant-media');

-- Allow public read (storefront pages display these images directly)
create policy "public read on tenant-media"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'tenant-media');
