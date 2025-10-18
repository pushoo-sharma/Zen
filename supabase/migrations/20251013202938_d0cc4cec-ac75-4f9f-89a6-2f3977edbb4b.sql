-- Create auto_actions table for autonomous workflow management
CREATE TABLE public.auto_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  thread_id TEXT,
  action TEXT NOT NULL CHECK (action IN ('draft', 'send', 'snooze', 'archive')),
  confidence NUMERIC NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'executed', 'declined')),
  payload JSONB,
  reasoning TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  executed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.auto_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own auto actions"
  ON public.auto_actions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own auto actions"
  ON public.auto_actions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own auto actions"
  ON public.auto_actions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own auto actions"
  ON public.auto_actions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_auto_actions_user_status ON public.auto_actions(user_id, status);
CREATE INDEX idx_auto_actions_created ON public.auto_actions(created_at DESC);