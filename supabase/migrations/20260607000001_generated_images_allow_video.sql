-- The Moment's signature hero is a held cinematic VIDEO. The generated-images
-- bucket previously allowed only still images and capped files at 10MB, so video
-- uploads were silently rejected — the renderer fell back to the temporary
-- fal.media URL, which expires and breaks the hero days later.
--
-- Allow video/mp4 and raise the size limit so generated clips persist on our own
-- storage alongside the stills.

update storage.buckets
set
  allowed_mime_types = array['image/jpeg', 'image/webp', 'image/png', 'video/mp4'],
  file_size_limit = 104857600 -- 100MB; a short Kling clip is well under this
where id = 'generated-images';
