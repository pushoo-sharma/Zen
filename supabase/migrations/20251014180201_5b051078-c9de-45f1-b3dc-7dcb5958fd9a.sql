-- Beta signups table
CREATE TABLE public.beta_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  profession TEXT NOT NULL,
  email_volume TEXT NOT NULL,
  platform_used TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  invite_sent_at TIMESTAMP WITH TIME ZONE,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Beta feedback table
CREATE TABLE public.beta_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('bug', 'improvement', 'other')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  session_context JSONB,
  route TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'wont_fix')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Beta metrics table
CREATE TABLE public.beta_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  metric_type TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metadata JSONB,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.beta_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beta_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beta_metrics ENABLE ROW LEVEL SECURITY;

-- Beta signups policies (admin only)
CREATE POLICY "Admins can view all beta signups"
ON public.beta_signups FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update beta signups"
ON public.beta_signups FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Beta feedback policies
CREATE POLICY "Users can create feedback"
ON public.beta_feedback FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback"
ON public.beta_feedback FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback"
ON public.beta_feedback FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update feedback"
ON public.beta_feedback FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Beta metrics policies
CREATE POLICY "Users can insert their own metrics"
ON public.beta_metrics FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all metrics"
ON public.beta_metrics FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Triggers
CREATE TRIGGER update_beta_signups_updated_at
BEFORE UPDATE ON public.beta_signups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_beta_feedback_updated_at
BEFORE UPDATE ON public.beta_feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add beta_pioneer field to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS beta_pioneer BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS beta_joined_at TIMESTAMP WITH TIME ZONE;