-- F9: block SVG in Storage buckets. SVG can run script when opened on the
-- Storage origin. Player photos: raster only. Covers: drop image/svg+xml.

update storage.buckets
set allowed_mime_types = array[
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif'
]
where id = 'photos';

update storage.buckets
set allowed_mime_types = array[
  'image/jpeg',
  'image/png',
  'image/webp'
]
where id = 'covers';
