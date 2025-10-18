/**
 * Team Manager Component
 * Example UI for managing teams and members
 */

import React, { useState, useEffect } from 'react';
import { Users, UserPlus, UserMinus, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  getUserTeams,
  createTeam,
  getTeamMembers,
  addTeamMember,
  removeTeamMember,
  type TeamWithRole,
  type TeamMember,
} from '@/lib/teams';
import { useToast } from '@/hooks/use-toast';

export default function TeamManager() {
  const [teams, setTeams] = useState<TeamWithRole[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Load teams on mount
  useEffect(() => {
    loadTeams();
  }, []);

  // Load members when team selected
  useEffect(() => {
    if (selectedTeam) {
      loadMembers(selectedTeam);
    }
  }, [selectedTeam]);

  const loadTeams = async () => {
    try {
      const userTeams = await getUserTeams();
      setTeams(userTeams);
      if (userTeams.length > 0 && !selectedTeam) {
        setSelectedTeam(userTeams[0].id);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load teams',
        variant: 'destructive',
      });
    }
  };

  const loadMembers = async (teamId: string) => {
    try {
      const teamMembers = await getTeamMembers(teamId);
      setMembers(teamMembers);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load team members',
        variant: 'destructive',
      });
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;

    setLoading(true);
    try {
      const team = await createTeam(newTeamName);
      toast({
        title: 'Success',
        description: `Team "${newTeamName}" created`,
      });
      setNewTeamName('');
      await loadTeams();
      setSelectedTeam(team.id);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create team',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!newMemberEmail.trim() || !selectedTeam) return;

    setLoading(true);
    try {
      // Note: In production, you'd look up the user by email first
      const userId = newMemberEmail; // Placeholder
      await addTeamMember(selectedTeam, userId, 'member');
      toast({
        title: 'Success',
        description: 'Member added to team',
      });
      setNewMemberEmail('');
      await loadMembers(selectedTeam);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add member. Check permissions.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!selectedTeam) return;

    setLoading(true);
    try {
      await removeTeamMember(selectedTeam, userId);
      toast({
        title: 'Success',
        description: 'Member removed from team',
      });
      await loadMembers(selectedTeam);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove member. Check permissions.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedTeamData = teams.find(t => t.id === selectedTeam);
  const isOwner = selectedTeamData?.role === 'owner';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6" />
          Team Management
        </h2>
      </div>

      {/* Create Team */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">Create New Team</h3>
        <div className="flex gap-2">
          <Input
            placeholder="Team name"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateTeam()}
          />
          <Button onClick={handleCreateTeam} disabled={loading || !newTeamName.trim()}>
            Create
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Team List */}
        <Card className="p-4 md:col-span-1">
          <h3 className="font-semibold mb-3">Your Teams</h3>
          <div className="space-y-2">
            {teams.map((team) => (
              <div
                key={team.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedTeam === team.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
                onClick={() => setSelectedTeam(team.id)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{team.name}</span>
                  {team.role === 'owner' && <Crown className="w-4 h-4" />}
                </div>
                <span className="text-xs opacity-80">
                  {team.role === 'owner' ? 'Owner' : 'Member'}
                </span>
              </div>
            ))}
            {teams.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No teams yet. Create one above!
              </p>
            )}
          </div>
        </Card>

        {/* Team Members */}
        <Card className="p-4 md:col-span-2">
          {selectedTeam ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Team Members</h3>
                <Badge variant={isOwner ? 'default' : 'secondary'}>
                  {isOwner ? 'Owner' : 'Member'}
                </Badge>
              </div>

              {/* Add Member (Owner Only) */}
              {isOwner && (
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="User ID or email"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
                  />
                  <Button
                    onClick={handleAddMember}
                    disabled={loading || !newMemberEmail.trim()}
                    size="icon"
                  >
                    <UserPlus className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Members List */}
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.user_id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                        {member.role === 'owner' ? (
                          <Crown className="w-4 h-4 text-primary" />
                        ) : (
                          <Users className="w-4 h-4 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{member.user_id}</p>
                        <p className="text-xs text-muted-foreground">
                          {member.role === 'owner' ? 'Owner' : 'Member'}
                        </p>
                      </div>
                    </div>
                    {isOwner && member.role !== 'owner' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMember(member.user_id)}
                        disabled={loading}
                      >
                        <UserMinus className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {members.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No members yet
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Select a team to view members
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
