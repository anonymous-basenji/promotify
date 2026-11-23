-- team_members: close self-join and owner-escalation holes
-- Before: any user could add themselves to any team with any role, admins could
-- invite owners, and admins could make themselves owner or demote the owner.

DROP POLICY IF EXISTS "Users can join as creator or admins can invite" ON public.team_members;

CREATE POLICY "Creator joins as owner, owners or admins invite"
  ON public.team_members FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Team creator adding themselves as owner (team creation flow)
    (
      auth.uid() = user_id
      AND role = 'owner'
      AND EXISTS (
        SELECT 1 FROM public.teams t
        WHERE t.team_id = team_members.team_id AND t.user_id = auth.uid()
      )
    )
    -- Owners can invite any role
    OR public.is_team_owner(team_id, auth.uid())
    -- Admins can invite admins and members, not owners
    OR (public.is_team_admin(team_id, auth.uid()) AND role <> 'owner')
  );

DROP POLICY IF EXISTS "Admins can update member roles" ON public.team_members;

CREATE POLICY "Owners or admins can update member roles"
  ON public.team_members FOR UPDATE
  TO authenticated
  USING (
    public.is_team_owner(team_id, auth.uid())
    OR (public.is_team_admin(team_id, auth.uid()) AND role <> 'owner')
  )
  WITH CHECK (
    public.is_team_owner(team_id, auth.uid())
    OR (public.is_team_admin(team_id, auth.uid()) AND role <> 'owner')
  );
