-- InboxAgent.ai Schema Reference
-- This is a reference schema showing the logical data model.
-- Your Supabase project may already have similar tables.

-- Users (typically managed by Supabase Auth)
-- CREATE TABLE IF NOT EXISTS users (
--   id UUID PRIMARY KEY,
--   email TEXT UNIQUE NOT NULL,
--   name TEXT,
--   created_at TIMESTAMP DEFAULT NOW()
-- );

-- Teams
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Team membership (maps users to teams)
CREATE TABLE IF NOT EXISTS team_members (
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- references auth.users(id) in Supabase
  role TEXT CHECK (role IN ('owner','member')) NOT NULL DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (team_id, user_id)
);

-- Minimal events table (can be replaced with PostHog/Segment later)
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- nullable for anonymous events
  team_id UUID,
  event_name TEXT NOT NULL,
  properties JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS on tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Teams
CREATE POLICY "Users can view teams they belong to"
  ON teams FOR SELECT
  USING (id IN (
    SELECT team_id FROM team_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Team owners can update their teams"
  ON teams FOR UPDATE
  USING (id IN (
    SELECT team_id FROM team_members 
    WHERE user_id = auth.uid() AND role = 'owner'
  ));

CREATE POLICY "Authenticated users can create teams"
  ON teams FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for Team Members
CREATE POLICY "Users can view members of their teams"
  ON team_members FOR SELECT
  USING (team_id IN (
    SELECT team_id FROM team_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Team owners can manage members"
  ON team_members FOR ALL
  USING (team_id IN (
    SELECT team_id FROM team_members 
    WHERE user_id = auth.uid() AND role = 'owner'
  ));

-- RLS Policies for Analytics Events
CREATE POLICY "Users can view their own events"
  ON analytics_events FOR SELECT
  USING (user_id = auth.uid() OR team_id IN (
    SELECT team_id FROM team_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Authenticated users can insert events"
  ON analytics_events FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_team_id ON analytics_events(team_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);

-- Function to automatically add creator as team owner
CREATE OR REPLACE FUNCTION handle_new_team()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO team_members (team_id, user_id, role)
  VALUES (NEW.id, auth.uid(), 'owner');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_team_created
  AFTER INSERT ON teams
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_team();
