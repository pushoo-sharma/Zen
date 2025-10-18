-- Create agent_traces table for transparency
CREATE TABLE public.agent_traces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  task_type TEXT NOT NULL,
  thread_id TEXT,
  input JSONB NOT NULL,
  steps JSONB NOT NULL,
  final JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agent_traces ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own agent traces"
ON public.agent_traces
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own agent traces"
ON public.agent_traces
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own agent traces"
ON public.agent_traces
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own agent traces"
ON public.agent_traces
FOR DELETE
USING (auth.uid() = user_id);