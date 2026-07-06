-- Public bucket for item photos (fallback: category icons when no photo)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'item-photos',
  'item-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS item_photos_select ON storage.objects;
DROP POLICY IF EXISTS item_photos_insert ON storage.objects;
DROP POLICY IF EXISTS item_photos_update ON storage.objects;
DROP POLICY IF EXISTS item_photos_delete ON storage.objects;

CREATE POLICY item_photos_select ON storage.objects
  FOR SELECT USING (bucket_id = 'item-photos');

CREATE POLICY item_photos_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'item-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY item_photos_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'item-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY item_photos_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'item-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
