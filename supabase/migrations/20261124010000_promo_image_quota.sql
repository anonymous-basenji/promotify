-- Limit each team to 20 promo images. A row in team_images is saved first and takes a slot;
-- Storage then accepts only the file that row names.

CREATE FUNCTION public.enforce_team_image_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Lock the team so simultaneous inserts are counted one at a time.
  -- NO KEY UPDATE allows the lock the team_id foreign key takes.
  PERFORM 1 FROM public.teams WHERE team_id = NEW.team_id FOR NO KEY UPDATE;

  IF (SELECT count(*) FROM public.team_images WHERE team_id = NEW.team_id) > 20 THEN
    RAISE EXCEPTION 'Team image limit reached' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NULL;
END;
$$;

-- AFTER, so RLS rejects non-members first
CREATE TRIGGER enforce_team_image_limit
  AFTER INSERT ON public.team_images
  FOR EACH ROW EXECUTE FUNCTION public.enforce_team_image_limit();

-- The file count also covers files left behind after their row was deleted
ALTER POLICY "Team members can upload team images"
  ON storage.objects
  WITH CHECK (
    bucket_id = 'team-images'
    AND name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$'
    AND public.is_team_member(((storage.foldername(name))[1])::uuid, auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.team_images
      WHERE team_images.image_path = objects.name
        AND team_images.user_id = auth.uid()
    )
    AND (
      SELECT count(*)
      FROM storage.objects AS existing
      WHERE existing.bucket_id = 'team-images'
        AND (storage.foldername(existing.name))[1] = (storage.foldername(objects.name))[1]
    ) < 20
  );
