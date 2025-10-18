-- Create voice_profiles table
CREATE TABLE public.voice_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.voice_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for voice_profiles
CREATE POLICY "Users can view their own voice profile"
ON public.voice_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own voice profile"
ON public.voice_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voice profile"
ON public.voice_profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Create scheduled_emails table
CREATE TABLE public.scheduled_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  send_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  sent_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.scheduled_emails ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scheduled_emails
CREATE POLICY "Users can view their own scheduled emails"
ON public.scheduled_emails FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scheduled emails"
ON public.scheduled_emails FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled emails"
ON public.scheduled_emails FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled emails"
ON public.scheduled_emails FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for voice_profiles updated_at
CREATE TRIGGER update_voice_profiles_updated_at
BEFORE UPDATE ON public.voice_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();