-- Create job queue table for background processing
CREATE TABLE IF NOT EXISTS public.job_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  payload JSONB NOT NULL,
  attempt INTEGER DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create index for efficient queue processing
CREATE INDEX IF NOT EXISTS idx_job_queue_status_created ON public.job_queue(status, created_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_job_queue_user ON public.job_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_job_queue_scheduled ON public.job_queue(scheduled_for) WHERE status = 'pending';

-- Enable RLS
ALTER TABLE public.job_queue ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own jobs
CREATE POLICY "Users can view their own jobs"
  ON public.job_queue
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow system to manage jobs (service role only)
CREATE POLICY "Service role can manage jobs"
  ON public.job_queue
  FOR ALL
  USING (true);

-- Add cleanup function for old completed/failed jobs
CREATE OR REPLACE FUNCTION public.cleanup_old_jobs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.job_queue
  WHERE status IN ('completed', 'failed')
    AND completed_at < NOW() - INTERVAL '7 days';
END;
$$;