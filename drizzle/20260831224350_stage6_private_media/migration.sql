INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'journal-media',
  'journal-media',
  false,
  26214400,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'audio/mpeg', 'audio/mp4', 'audio/webm', 'audio/ogg', 'audio/wav']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "journal_media_select_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'journal-media'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

CREATE POLICY "journal_media_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'journal-media'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

CREATE POLICY "journal_media_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'journal-media'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'journal-media'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

CREATE POLICY "journal_media_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'journal-media'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  requesting_user uuid := auth.uid();
  deleted_count integer;
BEGIN
  DELETE FROM storage.objects
  WHERE bucket_id = 'journal-media'
    AND (storage.foldername(name))[1] = requesting_user::text;

  DELETE FROM auth.users
  WHERE id = requesting_user;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  IF deleted_count <> 1 THEN
    RAISE EXCEPTION 'No authenticated account was deleted';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_own_account() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_own_account() FROM anon;
GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;
