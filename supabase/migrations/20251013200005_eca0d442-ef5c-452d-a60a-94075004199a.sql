-- Create email_events table for analytics
CREATE TABLE public.email_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('received', 'replied', 'ai_drafted', 'sent', 'scheduled')),
  subject TEXT,
  response_time_seconds INTEGER,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_email_events_user_created ON public.email_events(user_id, created_at DESC);
CREATE INDEX idx_email_events_type ON public.email_events(user_id, event_type);

-- Enable RLS
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own email events"
ON public.email_events FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own email events"
ON public.email_events FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own email events"
ON public.email_events FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own email events"
ON public.email_events FOR DELETE
USING (auth.uid() = user_id);