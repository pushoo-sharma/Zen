/**
 * Role-Based Access Control utilities for edge functions
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logger } from "./logger.ts";

export type AppRole = 'admin' | 'user' | 'team_manager' | 'member';

/**
 * Check if user has a specific role
 */
export async function hasRole(
  supabaseClient: any,
  userId: string,
  role: AppRole
): Promise<boolean> {
  try {
    const { data, error } = await supabaseClient.rpc('has_role', {
      _user_id: userId,
      _role: role,
    });

    if (error) {
      logger.error('Error checking role', { userId, role, error: error.message });
      return false;
    }

    return data === true;
  } catch (error: any) {
    logger.error('Exception in hasRole', { userId, role, error: error.message });
    return false;
  }
}

/**
 * Get user's primary role
 */
export async function getUserRole(
  supabaseClient: any,
  userId: string
): Promise<AppRole | null> {
  try {
    const { data, error } = await supabaseClient.rpc('get_user_role', {
      _user_id: userId,
    });

    if (error) {
      logger.error('Error getting user role', { userId, error: error.message });
      return null;
    }

    return data as AppRole;
  } catch (error: any) {
    logger.error('Exception in getUserRole', { userId, error: error.message });
    return null;
  }
}

/**
 * Middleware to require authentication
 */
export async function requireAuth(req: Request): Promise<{ userId: string; supabaseClient: any }> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    throw new Error('UNAUTHENTICATED: Missing authorization header');
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: authHeader },
      },
    }
  );

  const { data: { user }, error } = await supabaseClient.auth.getUser();

  if (error || !user) {
    throw new Error('UNAUTHENTICATED: Invalid token');
  }

  return { userId: user.id, supabaseClient };
}

/**
 * Middleware to require specific role
 */
export async function requireRole(
  req: Request,
  requiredRole: AppRole
): Promise<{ userId: string; supabaseClient: any; role: AppRole }> {
  const { userId, supabaseClient } = await requireAuth(req);

  const role = await getUserRole(supabaseClient, userId);
  
  if (!role) {
    throw new Error('FORBIDDEN: No role assigned');
  }

  // Admin can access everything
  if (role === 'admin') {
    return { userId, supabaseClient, role };
  }

  // Check specific role requirements using hierarchy
  const roleHierarchy: Record<AppRole, number> = {
    'admin': 3,
    'team_manager': 2,
    'member': 1,
    'user': 1,
  };

  const userLevel = roleHierarchy[role] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;

  if (userLevel < requiredLevel) {
    throw new Error(`FORBIDDEN: Requires ${requiredRole} role`);
  }

  return { userId, supabaseClient, role };
}
