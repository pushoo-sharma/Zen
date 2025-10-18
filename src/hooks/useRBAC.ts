import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/integrations/supabase/types';

export type AppRole = Database['public']['Enums']['app_role'];

export function useRBAC() {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRole() {
      if (!user) {
        setUserRole(null);
        setLoading(false);
        return;
      }

      try {
        // Get user role using direct table query
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user role:', error);
          setUserRole(null);
        } else {
          setUserRole(data?.role as AppRole || null);
        }
      } catch (error) {
        console.error('Error in useRBAC:', error);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    }

    fetchRole();
  }, [user]);

  const hasRole = (role: AppRole) => {
    if (!userRole) return false;
    
    // Admin has all permissions
    if (userRole === 'admin') return true;
    
    // Team manager has team_manager, member, and user permissions
    if (userRole === 'team_manager' && (role === 'team_manager' || role === 'member' || role === 'user')) {
      return true;
    }
    
    // Check exact role match
    return userRole === role;
  };

  const isAdmin = userRole === 'admin';
  const isTeamManager = userRole === 'team_manager' || userRole === 'admin';

  return {
    userRole,
    loading,
    hasRole,
    isAdmin,
    isTeamManager,
  };
}
