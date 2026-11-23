-- Owner check for policies (SECURITY DEFINER avoids recursion on team_members)
CREATE OR REPLACE FUNCTION public.is_team_owner(_team_id UUID, _user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = _team_id AND user_id = _user_id AND role = 'owner'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Teams: any owner can delete, including one who received ownership by transfer
DROP POLICY IF EXISTS "Team creator can delete team" ON public.teams;

CREATE POLICY "Team owners can delete team"
  ON public.teams FOR DELETE
  TO authenticated
  USING (public.is_team_owner(team_id, auth.uid()));

-- team_snippets policies
CREATE POLICY "Team members can view snippets"
  ON public.team_snippets FOR SELECT
  TO authenticated
  USING (public.is_team_member(team_id, auth.uid()));

CREATE POLICY "Team members can add snippets"
  ON public.team_snippets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.is_team_member(team_id, auth.uid()));

CREATE POLICY "Team members can update snippets"
  ON public.team_snippets FOR UPDATE
  TO authenticated
  USING (public.is_team_member(team_id, auth.uid()))
  WITH CHECK (public.is_team_member(team_id, auth.uid()));

CREATE POLICY "Team members can delete snippets"
  ON public.team_snippets FOR DELETE
  TO authenticated
  USING (public.is_team_member(team_id, auth.uid()));
