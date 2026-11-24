-- Promo images: a library per team, with one optionally marked as the main image.
-- Files live in the public "team-images" bucket at <team_id>/<uuid>.<ext>.

CREATE TABLE public.team_images (
  team_image_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(team_id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  image_path TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (team_image_id, team_id),
  CONSTRAINT team_images_path_in_team_folder
    CHECK (image_path ~ ('^' || team_id::text || '/[0-9a-f-]{36}\.(jpg|png|webp)$'))
);

CREATE INDEX idx_team_images_team ON public.team_images(team_id);

-- The composite key keeps a team from using another team's image
ALTER TABLE public.teams ADD COLUMN promo_image_id UUID;
ALTER TABLE public.teams ADD CONSTRAINT teams_promo_image_fkey
  FOREIGN KEY (promo_image_id, team_id)
  REFERENCES public.team_images (team_image_id, team_id)
  ON DELETE SET NULL (promo_image_id);

-- team_images: members can view and add; only owners and admins can delete
ALTER TABLE public.team_images ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON public.team_images TO authenticated;

CREATE POLICY "Team members can view images"
  ON public.team_images FOR SELECT
  TO authenticated
  USING (public.is_team_member(team_id, auth.uid()));

CREATE POLICY "Team members can add images"
  ON public.team_images FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_team_member(team_id, auth.uid()));

CREATE POLICY "Team admins can delete images"
  ON public.team_images FOR DELETE
  TO authenticated
  USING (public.is_team_admin(team_id, auth.uid()));

-- Storage: anyone with a file's URL can view it, but only members can list or upload
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('team-images', 'team-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']);

CREATE POLICY "Team members can list team images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'team-images'
    AND public.is_team_member(((storage.foldername(name))[1])::uuid, auth.uid())
  );

CREATE POLICY "Team members can upload team images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'team-images'
    AND public.is_team_member(((storage.foldername(name))[1])::uuid, auth.uid())
  );

CREATE POLICY "Team admins can delete team images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'team-images'
    AND public.is_team_admin(((storage.foldername(name))[1])::uuid, auth.uid())
  );
