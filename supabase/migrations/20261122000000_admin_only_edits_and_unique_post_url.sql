-- Members can add groups and saved texts; only owners and admins can edit or delete them.
-- (The promo text on teams is already admin-only via "Team admins can update their team".)

-- facebook_groups
DROP POLICY IF EXISTS "Team members can update groups" ON public.facebook_groups;

CREATE POLICY "Team admins can update groups"
  ON public.facebook_groups FOR UPDATE
  TO authenticated
  USING (public.is_team_admin(team_id, auth.uid()))
  WITH CHECK (public.is_team_admin(team_id, auth.uid()));

DROP POLICY IF EXISTS "Team members can delete groups" ON public.facebook_groups;

CREATE POLICY "Team admins can delete groups"
  ON public.facebook_groups FOR DELETE
  TO authenticated
  USING (public.is_team_admin(team_id, auth.uid()));

-- team_snippets
DROP POLICY IF EXISTS "Team members can update snippets" ON public.team_snippets;

CREATE POLICY "Team admins can update snippets"
  ON public.team_snippets FOR UPDATE
  TO authenticated
  USING (public.is_team_admin(team_id, auth.uid()))
  WITH CHECK (public.is_team_admin(team_id, auth.uid()));

DROP POLICY IF EXISTS "Team members can delete snippets" ON public.team_snippets;

CREATE POLICY "Team admins can delete snippets"
  ON public.team_snippets FOR DELETE
  TO authenticated
  USING (public.is_team_admin(team_id, auth.uid()));

-- post_logs: the same post URL can't be logged twice for a group (stops retried logs
-- from double counting). Logs without a URL are not affected.
CREATE UNIQUE INDEX post_logs_group_post_url_key
  ON public.post_logs (facebook_group_id, post_url)
  WHERE post_url IS NOT NULL;
