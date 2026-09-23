-- Hand-built client sites (the contractor layout) show the business's own job
-- videos alongside their photos. A tenant's own media belongs in tenant-media,
-- which until now accepted only still images at 10MB.
--
-- Allow web-encoded video/mp4 and raise the per-file cap to 25MB. Maker-facing
-- upload paths still validate their own types (app/dashboard/website/actions.ts
-- accepts images only), so this does not open video uploads to makers.

update storage.buckets
set
  allowed_mime_types = array['image/jpeg', 'image/webp', 'image/png', 'video/mp4'],
  file_size_limit = 26214400 -- 25MB; a web-encoded hero loop is ~2-3MB
where id = 'tenant-media';
