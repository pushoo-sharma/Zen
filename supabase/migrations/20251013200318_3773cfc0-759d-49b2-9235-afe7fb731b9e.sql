-- Update email_events table to support feedback actions
ALTER TABLE public.email_events DROP CONSTRAINT IF EXISTS email_events_event_type_check;

ALTER TABLE public.email_events
ADD CONSTRAINT email_events_event_type_check 
CHECK (event_type IN ('received', 'replied', 'ai_drafted', 'sent', 'scheduled', 'opened', 'snoozed', 'ignored'));

-- Create recommendations preferences table
CREATE TABLE public.recommendation_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hour_bias JSONB DEFAULT '{}'::jsonb,
  weights JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.recommendation_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own recommendation preferences"
ON public.recommendation_preferences FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own recommendation preferences"
ON public.recommendation_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recommendation preferences"
ON public.recommendation_preferences FOR UPDATE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_recommendation_preferences_updated_at
BEFORE UPDATE ON public.recommendation_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();