-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'member');

-- Create user_team_roles table
CREATE TABLE public.user_team_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, team_id)
);

-- Enable RLS
ALTER TABLE public.user_team_roles ENABLE ROW LEVEL SECURITY;

-- Create policies for user_team_roles
CREATE POLICY "Users can view their own team roles"
  ON public.user_team_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own team roles"
  ON public.user_team_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create security definer function to check team admin status
CREATE OR REPLACE FUNCTION public.is_team_admin(_user_id UUID, _team_id TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_team_roles
    WHERE user_id = _user_id
      AND team_id = _team_id
      AND role = 'admin'
  )
$$;

-- Create function to get user's team role
CREATE OR REPLACE FUNCTION public.get_user_team_role(_user_id UUID, _team_id TEXT)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_team_roles
  WHERE user_id = _user_id
    AND team_id = _team_id
  LIMIT 1
$$;