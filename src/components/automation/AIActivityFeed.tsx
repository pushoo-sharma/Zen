import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Clock, 
  Mail, 
  Archive, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  Undo2,
  RefreshCw
} from "lucide-react";

export default function AIActivityFeed() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, []);

  async function loadActivities() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("auto_actions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      setActivities(data || []);
      setLoading(false);
    } catch (error: any) {
      console.error("Failed to load activities:", error);
      toast.error("Failed to load activity feed");
      setLoading(false);
    }
  }

  async function handleUndo(actionId: string) {
    try {
      // Mark action as undone
      const { error } = await supabase
        .from("auto_actions")
        .update({ status: "undone", executed_at: null })
        .eq("id", actionId);

      if (error) throw error;

      toast.success("Action undone successfully");
      loadActivities();
    } catch (error: any) {
      console.error("Failed to undo action:", error);
      toast.error("Failed to undo action");
    }
  }

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case "draft": return Mail;
      case "schedule": return Clock;
      case "archive": return Archive;
      default: return AlertCircle;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "executed": return CheckCircle;
      case "pending": return Clock;
      case "undone": return XCircle;
      default: return AlertCircle;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "executed": return "text-green-500";
      case "pending": return "text-yellow-500";
      case "undone": return "text-muted-foreground";
      default: return "text-muted-foreground";
    }
  };

  const formatNaturalLanguage = (activity: any) => {
    const action = activity.action?.toLowerCase() || "action";
    const confidence = Math.round((activity.confidence || 0) * 100);
    const time = new Date(activity.created_at).toLocaleString();

    if (action === "draft") {
      return `AI drafted a reply at ${confidence}% confidence on ${time}`;
    } else if (action === "schedule") {
      const sendTime = activity.payload?.sendAt 
        ? new Date(activity.payload.sendAt).toLocaleString()
        : "optimal time";
      return `AI scheduled email for ${sendTime} at ${confidence}% confidence`;
    } else if (action === "archive") {
      return `AI archived low-priority email at ${confidence}% confidence on ${time}`;
    }
    
    return `AI performed ${action} at ${confidence}% confidence on ${time}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              AI Activity Feed
            </CardTitle>
            <CardDescription className="mt-1">
              Complete audit trail of all autonomous AI actions
            </CardDescription>
          </div>
          <Button 
            onClick={loadActivities} 
            variant="ghost" 
            size="icon"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No autonomous actions yet</p>
            <p className="text-xs mt-1">Enable autonomous mode to see AI activity here</p>
          </div>
        ) : (
          activities.map((activity) => {
            const ActionIcon = getActionIcon(activity.action);
            const StatusIcon = getStatusIcon(activity.status);
            const statusColor = getStatusColor(activity.status);
            const canUndo = activity.status === "executed" && 
              new Date(activity.executed_at).getTime() > Date.now() - 3600000; // 1 hour

            return (
              <div 
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-md border bg-card hover:bg-accent/5 transition-colors"
              >
                <div className="mt-0.5">
                  <ActionIcon className="h-4 w-4 text-primary" />
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="text-sm font-medium flex items-center gap-2">
                        {activity.action}
                        <Badge variant="outline" className="text-xs font-mono">
                          {Math.round((activity.confidence || 0) * 100)}%
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatNaturalLanguage(activity)}
                      </p>
                    </div>
                    <StatusIcon className={`h-4 w-4 ${statusColor} flex-shrink-0`} />
                  </div>

                  {activity.reasoning && (
                    <div className="text-xs bg-muted p-2 rounded">
                      <span className="font-medium">Reasoning: </span>
                      {activity.reasoning}
                    </div>
                  )}

                  {canUndo && (
                    <Button
                      onClick={() => handleUndo(activity.id)}
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                    >
                      <Undo2 className="h-3 w-3 mr-1" />
                      Undo Action
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
