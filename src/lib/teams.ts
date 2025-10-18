/**
 * Team Management Utilities
 * Handles team creation, membership, and role management
 */

import { supabase } from '@/integrations/supabase/client';
import { trackEvent } from './analytics';

export type TeamRole = 'owner' | 'member';

export interface Team {
  id: string;
  name: string;
  created_at: string;
}

export interface TeamMember {
  team_id: string;
  user_id: string;
  role: TeamRole;
  joined_at: string;
}

export interface TeamWithRole extends Team {
  role: TeamRole;
}

/**
 * Get all teams for the current user
 */
export async function getUserTeams(): Promise<TeamWithRole[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Using existing user_team_links and user_team_roles tables
    const { data: links, error: linksError } = await supabase
      .from('user_team_links')
      .select('team_id')
      .eq('user_id', user.id);

    if (linksError) throw linksError;

    const { data: roles, error: rolesError } = await supabase
      .from('user_team_roles')
      .select('team_id, role')
      .eq('user_id', user.id);

    if (rolesError) throw rolesError;

    // Map roles for each team
    const teams: TeamWithRole[] = (links || []).map(link => {
      const roleData = roles?.find(r => r.team_id === link.team_id);
      return {
        id: link.team_id,
        name: link.team_id, // TODO: Add team name to schema
        created_at: new Date().toISOString(),
        role: (roleData?.role === 'admin' ? 'owner' : 'member') as TeamRole,
      };
    });

    return teams;
  } catch (error) {
    console.error('Error fetching user teams:', error);
    throw error;
  }
}

/**
 * Create a new team (creator becomes owner)
 */
export async function createTeam(name: string): Promise<Team> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const teamId = `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create team link
    const { error: linkError } = await supabase
      .from('user_team_links')
      .insert({ team_id: teamId, user_id: user.id });

    if (linkError) throw linkError;

    // Set creator as admin (owner)
    const { error: roleError } = await supabase
      .from('user_team_roles')
      .insert({ team_id: teamId, user_id: user.id, role: 'admin' });

    if (roleError) throw roleError;

    // Track event
    await trackEvent('team_created', { team_id: teamId, team_name: name });

    return {
      id: teamId,
      name,
      created_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error creating team:', error);
    throw error;
  }
}

/**
 * Add a user to a team (owner only)
 */
export async function addTeamMember(
  teamId: string,
  userId: string,
  role: TeamRole = 'member'
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if current user is owner
    const isOwner = await checkTeamOwnership(teamId, user.id);
    if (!isOwner) throw new Error('Only team owners can add members');

    // Add team link
    const { error: linkError } = await supabase
      .from('user_team_links')
      .insert({ team_id: teamId, user_id: userId });

    if (linkError) throw linkError;

    // Set role
    const supabaseRole = role === 'owner' ? 'admin' : 'member';
    const { error: roleError } = await supabase
      .from('user_team_roles')
      .insert({ team_id: teamId, user_id: userId, role: supabaseRole });

    if (roleError) throw roleError;

    // Track event
    await trackEvent('team_member_added', { 
      team_id: teamId, 
      added_user_id: userId,
      role 
    });
  } catch (error) {
    console.error('Error adding team member:', error);
    throw error;
  }
}

/**
 * Remove a user from a team (owner only)
 */
export async function removeTeamMember(teamId: string, userId: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if current user is owner
    const isOwner = await checkTeamOwnership(teamId, user.id);
    if (!isOwner) throw new Error('Only team owners can remove members');

    // Remove team link
    const { error: linkError } = await supabase
      .from('user_team_links')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId);

    if (linkError) throw linkError;

    // Remove role (note: RLS may prevent direct deletion)
    await supabase
      .from('user_team_roles')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId);

    // Track event
    await trackEvent('team_member_removed', { 
      team_id: teamId, 
      removed_user_id: userId 
    });
  } catch (error) {
    console.error('Error removing team member:', error);
    throw error;
  }
}

/**
 * Check if a user is a team owner
 */
export async function checkTeamOwnership(teamId: string, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_team_roles')
      .select('role')
      .eq('team_id', teamId)
      .eq('user_id', userId)
      .single();

    if (error) return false;
    return data?.role === 'admin';
  } catch (error) {
    console.error('Error checking team ownership:', error);
    return false;
  }
}

/**
 * Get all members of a team
 */
export async function getTeamMembers(teamId: string): Promise<TeamMember[]> {
  try {
    const { data: links, error: linksError } = await supabase
      .from('user_team_links')
      .select('user_id')
      .eq('team_id', teamId);

    if (linksError) throw linksError;

    const { data: roles, error: rolesError } = await supabase
      .from('user_team_roles')
      .select('user_id, role')
      .eq('team_id', teamId);

    if (rolesError) throw rolesError;

    const members: TeamMember[] = (links || []).map(link => {
      const roleData = roles?.find(r => r.user_id === link.user_id);
      return {
        team_id: teamId,
        user_id: link.user_id,
        role: (roleData?.role === 'admin' ? 'owner' : 'member') as TeamRole,
        joined_at: new Date().toISOString(),
      };
    });

    return members;
  } catch (error) {
    console.error('Error fetching team members:', error);
    throw error;
  }
}

/**
 * Leave a team (members only, owners must transfer ownership first)
 */
export async function leaveTeam(teamId: string): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if user is owner
    const isOwner = await checkTeamOwnership(teamId, user.id);
    if (isOwner) {
      throw new Error('Team owners must transfer ownership before leaving');
    }

    // Remove team link
    const { error } = await supabase
      .from('user_team_links')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', user.id);

    if (error) throw error;

    // Track event
    await trackEvent('team_left', { team_id: teamId });
  } catch (error) {
    console.error('Error leaving team:', error);
    throw error;
  }
}
