-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Teams
CREATE TABLE IF NOT EXISTS public.teams (
  team_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  promo_text TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Team Members
CREATE TABLE IF NOT EXISTS public.team_members (
  team_member_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(team_id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- 4. Team Snippets
CREATE TABLE IF NOT EXISTS public.team_snippets (
  team_snippet_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(team_id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Facebook Groups
CREATE TABLE IF NOT EXISTS public.facebook_groups (
  facebook_group_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(team_id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  group_url TEXT NOT NULL DEFAULT '',
  notes TEXT,
  member_count INT,
  allowed_days TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Post Logs
CREATE TABLE IF NOT EXISTS public.post_logs (
  post_log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facebook_group_id UUID NOT NULL REFERENCES public.facebook_groups(facebook_group_id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(team_id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
  posted_date DATE NOT NULL,
  post_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_facebook_groups_team_id ON public.facebook_groups(team_id);
CREATE INDEX IF NOT EXISTS idx_post_logs_team_date ON public.post_logs(team_id, posted_date);

-- Auto-create profile on auth.users signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facebook_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_logs ENABLE ROW LEVEL SECURITY;

-- Helper functions (SECURITY DEFINER avoids recursion on team_members)
CREATE OR REPLACE FUNCTION public.is_team_member(_team_id UUID, _user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = _team_id AND user_id = _user_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_team_admin(_team_id UUID, _user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = _team_id AND user_id = _user_id AND role IN ('owner', 'admin')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 1. profiles policies
CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. teams policies
CREATE POLICY "Team members can view their teams"
  ON public.teams FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_team_member(team_id, auth.uid()));

CREATE POLICY "Authenticated users can create teams"
  ON public.teams FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Team admins can update their team"
  ON public.teams FOR UPDATE
  TO authenticated
  USING (public.is_team_admin(team_id, auth.uid()));

CREATE POLICY "Team creator can delete team"
  ON public.teams FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. team_members policies
CREATE POLICY "Users can view members of their teams"
  ON public.team_members FOR SELECT
  TO authenticated
  USING (public.is_team_member(team_id, auth.uid()));

CREATE POLICY "Users can join as creator or admins can invite"
  ON public.team_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR public.is_team_admin(team_id, auth.uid()));

CREATE POLICY "Admins can update member roles"
  ON public.team_members FOR UPDATE
  TO authenticated
  USING (public.is_team_admin(team_id, auth.uid()))
  WITH CHECK (public.is_team_admin(team_id, auth.uid()));

CREATE POLICY "Admins or members can remove members"
  ON public.team_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_team_admin(team_id, auth.uid()));

-- 4. team_snippets (RLS enabled, no policies created yet to match prod)

-- 5. facebook_groups policies
CREATE POLICY "Team members can view groups"
  ON public.facebook_groups FOR SELECT
  TO authenticated
  USING (public.is_team_member(team_id, auth.uid()));

CREATE POLICY "Team members can add groups"
  ON public.facebook_groups FOR INSERT
  TO authenticated
  WITH CHECK (public.is_team_member(team_id, auth.uid()));

CREATE POLICY "Team members can update groups"
  ON public.facebook_groups FOR UPDATE
  TO authenticated
  USING (public.is_team_member(team_id, auth.uid()));

CREATE POLICY "Team members can delete groups"
  ON public.facebook_groups FOR DELETE
  TO authenticated
  USING (public.is_team_member(team_id, auth.uid()));

-- 6. post_logs policies
CREATE POLICY "Team members can view post logs"
  ON public.post_logs FOR SELECT
  TO authenticated
  USING (public.is_team_member(team_id, auth.uid()));

CREATE POLICY "Team members can log posts"
  ON public.post_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.is_team_member(team_id, auth.uid()));

CREATE POLICY "Users or admins can remove post logs"
  ON public.post_logs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_team_admin(team_id, auth.uid()));

