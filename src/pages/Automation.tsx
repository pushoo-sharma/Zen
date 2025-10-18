import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, Zap, Settings, Activity } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import AutomationSettings from "@/components/automation/AutomationSettings";
import AIActivityFeed from "@/components/automation/AIActivityFeed";

interface AutoAction {
  id: string;
  thread_id: string | null;
  action: string;
  confidence: number;
  status: string;
  reasoning: string | null;
  payload: any;
  created_at: string;
  executed_at: string | null;
}

const Automation = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [actions, setActions] = useState<AutoAction[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const loadActions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("auto-list", {
        body: {},
      });

      if (error) throw error;
      setActions(data.actions || []);
    } catch (error: any) {
      console.error("Error loading actions:", error);
      toast({
        title: "Failed to load actions",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadActions();
    }
  }, [user]);

  const handleApprove = async (actionId: string) => {
    try {
      const { error } = await supabase
        .from("auto_actions")
        .update({ status: "approved", executed_at: new Date().toISOString() })
        .eq("id", actionId);

      if (error) throw error;

      toast({
        title: "Action approved",
        description: "The action has been executed.",
      });

      loadActions();
    } catch (error: any) {
      toast({
        title: "Failed to approve",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDecline = async (actionId: string) => {
    try {
      const { error } = await supabase
        .from("auto_actions")
        .update({ status: "declined" })
        .eq("id", actionId);

      if (error) throw error;

      toast({
        title: "Action declined",
        description: "The action has been cancelled.",
      });

      loadActions();
    } catch (error: any) {
      toast({
        title: "Failed to decline",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "draft":
        return <Zap className="h-4 w-4" />;
      case "send":
        return <CheckCircle className="h-4 w-4" />;
      case "snooze":
        return <Clock className="h-4 w-4" />;
      case "archive":
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-green-500";
    if (confidence >= 0.6) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <div className="p-6 max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Autonomous AI Control</h1>
            <p className="text-muted-foreground mt-2">
              Configure AI autonomy with full transparency, control, and accountability
            </p>
          </div>

          <Tabs defaultValue="pending" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending">
                <Clock className="h-4 w-4 mr-2" />
                Pending Actions
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="activity">
                <Activity className="h-4 w-4 mr-2" />
                Activity Feed
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              <Card className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Pending Actions</h2>
                  <Button onClick={loadActions} variant="outline" size="sm" disabled={loading}>
                    {loading ? "Loading..." : "Refresh"}
                  </Button>
                </div>

                {loading && actions.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    Loading actions...
                  </div>
                ) : actions.filter(a => a.status === "pending").length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No pending actions. InboxZen will suggest actions as it learns your workflow.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {actions
                      .filter(a => a.status === "pending")
                      .map((action) => (
                        <Card key={action.id} className="p-4 border-primary/20">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                {getActionIcon(action.action)}
                                <span className="font-medium capitalize">{action.action}</span>
                                <Badge variant="secondary" className="ml-2">
                                  <div
                                    className={`mr-1 h-2 w-2 rounded-full ${getConfidenceColor(
                                      action.confidence
                                    )}`}
                                  />
                                  {Math.round(action.confidence * 100)}% confident
                                </Badge>
                              </div>
                              {action.reasoning && (
                                <p className="mt-2 text-sm text-muted-foreground">
                                  {action.reasoning}
                                </p>
                              )}
                              {action.payload?.subject && (
                                <p className="mt-1 text-sm">
                                  <span className="font-medium">Subject:</span>{" "}
                                  {action.payload.subject}
                                </p>
                              )}
                              <p className="mt-1 text-xs text-muted-foreground">
                                Created {new Date(action.created_at).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleApprove(action.id)}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleDecline(action.id)}
                              >
                                Decline
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <AutomationSettings />
            </TabsContent>

            <TabsContent value="activity">
              <AIActivityFeed />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Automation;
