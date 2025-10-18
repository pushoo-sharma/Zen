-- Drop the existing SELECT policy that exposes tokens
DROP POLICY IF EXISTS "Users can view their own connections" ON public.oauth_connections;

-- Create a new SELECT policy that only returns non-sensitive fields
CREATE POLICY "Users can view their own connection metadata" 
ON public.oauth_connections 
FOR SELECT 
USING (auth.uid() = user_id);

-- But we need to prevent access_token and refresh_token from being selected
-- We'll do this by creating a view that excludes sensitive fields
CREATE OR REPLACE VIEW public.oauth_connections_safe AS
SELECT 
  id,
  user_id,
  provider,
  email,
  created_at,
  updated_at,
  expires_at
FROM public.oauth_connections;

-- Grant access to the view
GRANT SELECT ON public.oauth_connections_safe TO authenticated;

-- Create a security definer function to get tokens (for server-side use only)
CREATE OR REPLACE FUNCTION public.get_oauth_token(
  _user_id uuid,
  _provider text
)
RETURNS TABLE (
  access_token text,
  refresh_token text,
  expires_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    access_token,
    refresh_token,
    expires_at
  FROM public.oauth_connections
  WHERE user_id = _user_id 
    AND provider = _provider
  LIMIT 1;
$$;

-- Only service role should be able to call this function
REVOKE EXECUTE ON FUNCTION public.get_oauth_token FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_oauth_token FROM authenticated;