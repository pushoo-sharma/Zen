-- Create team patterns and team links tables for collaborative intelligence
-- CORRECTED ORDER: Create user_team_links first, then team_patterns with policies

-- User team links table (create this first)
CREATE TABLE IF NOT EXISTS public.user_team_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS for user_team_links
ALTER TABLE public.user_team_links ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_team_links
CREATE POLICY "Users can view their own team link"
  ON public.user_team_links FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own team link"
  ON public.user_team_links FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own team link"
  ON public.user_team_links FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own team link"
  ON public.user_team_links FOR DELETE
  USING (auth.uid() = user_id);

-- Team patterns aggregation table (create after user_team_links)
CREATE TABLE IF NOT EXISTS public.team_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id TEXT NOT NULL,
  metric TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(team_id, metric)
);

-- Enable RLS for team_patterns
ALTER TABLE public.team_patterns ENABLE ROW LEVEL SECURITY;

-- RLS policies for team_patterns (now user_team_links exists)
CREATE POLICY "Users can view their team patterns"
  ON public.team_patterns FOR SELECT
  USING (
    team_id IN (
      SELECT team_id FROM public.user_team_links WHERE user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_team_patterns_team_id ON public.team_patterns(team_id);
CREATE INDEX idx_team_patterns_metric ON public.team_patterns(metric);
CREATE INDEX idx_user_team_links_user_id ON public.user_team_links(user_id);
CREATE INDEX idx_user_team_links_team_id ON public.user_team_links(team_id);