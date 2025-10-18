-- Create memory tables for contextual awareness

-- Thread summaries table
CREATE TABLE IF NOT EXISTS public.mem_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  thread_id TEXT NOT NULL,
  subject TEXT,
  summary TEXT,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, thread_id)
);

-- Enable RLS for mem_threads
ALTER TABLE public.mem_threads ENABLE ROW LEVEL SECURITY;

-- RLS policies for mem_threads
CREATE POLICY "Users can view their own thread memories"
  ON public.mem_threads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own thread memories"
  ON public.mem_threads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own thread memories"
  ON public.mem_threads FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own thread memories"
  ON public.mem_threads FOR DELETE
  USING (auth.uid() = user_id);

-- Contact memory table
CREATE TABLE IF NOT EXISTS public.mem_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact TEXT NOT NULL,
  notes TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  last_interaction TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, contact)
);

-- Enable RLS for mem_contacts
ALTER TABLE public.mem_contacts ENABLE ROW LEVEL SECURITY;

-- RLS policies for mem_contacts
CREATE POLICY "Users can view their own contact memories"
  ON public.mem_contacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contact memories"
  ON public.mem_contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contact memories"
  ON public.mem_contacts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contact memories"
  ON public.mem_contacts FOR DELETE
  USING (auth.uid() = user_id);

-- User memory preferences table
CREATE TABLE IF NOT EXISTS public.mem_prefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  flags JSONB DEFAULT '{"use_memory": true, "max_context_chars": 2000}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS for mem_prefs
ALTER TABLE public.mem_prefs ENABLE ROW LEVEL SECURITY;

-- RLS policies for mem_prefs
CREATE POLICY "Users can view their own memory preferences"
  ON public.mem_prefs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memory preferences"
  ON public.mem_prefs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memory preferences"
  ON public.mem_prefs FOR UPDATE
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_mem_threads_user_id ON public.mem_threads(user_id);
CREATE INDEX idx_mem_threads_thread_id ON public.mem_threads(thread_id);
CREATE INDEX idx_mem_contacts_user_id ON public.mem_contacts(user_id);
CREATE INDEX idx_mem_contacts_contact ON public.mem_contacts(contact);
CREATE INDEX idx_mem_prefs_user_id ON public.mem_prefs(user_id);

-- Add trigger for updating updated_at
CREATE TRIGGER update_mem_prefs_updated_at
  BEFORE UPDATE ON public.mem_prefs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();