import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Users, LogOut, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const TeamJoinSection = () => {
  const [teamId, setTeamId] = useState("");
  const [currentTeam, setCurrentTeam] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrentTeam();
  }, []);

  const loadCurrentTeam = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data, error } = await supabase
        .from("user_team_links")
        .select("team_id")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      setCurrentTeam(data?.team_id || null);
    } catch (error: any) {
      console.error("Error loading team:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeam = async () => {
    if (!teamId.trim()) {
      toast.error("Please enter a team ID");
      return;
    }

    setJoining(true);
    try {
      const { error } = await supabase.functions.invoke("team-join", {
        body: {
          teamId: teamId.trim(),
          action: "join",
        },
      });

      if (error) throw error;

      toast.success("Successfully joined team!");
      setCurrentTeam(teamId.trim());
      setTeamId("");
    } catch (error: any) {
      console.error("Error joining team:", error);
      toast.error(error.message || "Failed to join team");
    } finally {
      setJoining(false);
    }
  };

  const handleLeaveTeam = async () => {
    setLeaving(true);
    try {
      const { error } = await supabase.functions.invoke("team-join", {
        body: {
          teamId: currentTeam,
          action: "leave",
        },
      });

      if (error) throw error;

      toast.success("Successfully left team");
      setCurrentTeam(null);
    } catch (error: any) {
      console.error("Error leaving team:", error);
      toast.error(error.message || "Failed to leave team");
    } finally {
      setLeaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {currentTeam ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Current Team</p>
                <p className="text-xs text-muted-foreground">{currentTeam}</p>
              </div>
            </div>
            <Badge variant="secondary">Active</Badge>
          </div>
          
          <Button
            variant="destructive"
            onClick={handleLeaveTeam}
            disabled={leaving}
            className="w-full"
          >
            {leaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Leaving...
              </>
            ) : (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                Leave Team
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground">
            Leaving the team will stop contributing to collaborative insights.
            Your personal data remains private.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="team-id">Team ID</Label>
            <Input
              id="team-id"
              placeholder="Enter team ID or invite code"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              disabled={joining}
            />
            <p className="text-xs text-muted-foreground">
              Get the team ID from your team administrator
            </p>
          </div>

          <Button onClick={handleJoinTeam} disabled={joining} className="w-full">
            {joining ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Joining...
              </>
            ) : (
              <>
                <Users className="mr-2 h-4 w-4" />
                Join Team
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
