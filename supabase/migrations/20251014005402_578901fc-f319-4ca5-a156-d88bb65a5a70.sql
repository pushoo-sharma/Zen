-- Drop the problematic view
DROP VIEW IF EXISTS public.oauth_connections_safe;

-- The security definer function for server-side token access is fine as-is
-- Client code will need to explicitly select only non-sensitive fields