import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, RefreshCw, Eye, Clock, X, Loader2 } from "lucide-react";

const SmartSuggestions = () => {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("recommendations");

      if (error) throw error;

      setRecommendations(data.recommendations || []);

      if (data.recommendations?.length === 0) {
        toast({
          title: "No recommendations",
          description: "Connect your Gmail to get smart suggestions",
        });
      }
    } catch (error: any) {
      console.error("Error loading recommendations:", error);
      toast({
        title: "Failed to load suggestions",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, []);

  const handleFeedback = async (
    messageId: string,
    action: "opened" | "snoozed" | "ignored",
    subject: string
  ) => {
    try {
      const { error } = await supabase.functions.invoke("feedback", {
        body: { messageId, action, subject },
      });

      if (error) throw error;

      // Remove from list after feedback
      setRecommendations((prev) => prev.filter((r) => r.id !== messageId));

      toast({
        title: "Feedback recorded",
        description: `Email marked as ${action}`,
      });
    } catch (error: any) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Failed to record feedback",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>Smart Suggestions</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadRecommendations}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading && recommendations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Analyzing your inbox...</p>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No suggestions available</p>
            <p className="text-xs mt-1">Connect Gmail to get smart recommendations</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recommendations.map((email) => (
              <div
                key={email.id}
                className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">
                        {email.subject || "(No subject)"}
                      </h4>
                      <Badge variant="secondary" className="text-xs">
                        Score: {email.recoScore}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {email.from}
                    </p>
                    {email.snippet && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {email.snippet}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() =>
                      handleFeedback(email.id, "opened", email.subject)
                    }
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Open
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() =>
                      handleFeedback(email.id, "snoozed", email.subject)
                    }
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    Snooze
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() =>
                      handleFeedback(email.id, "ignored", email.subject)
                    }
                  >
                    <X className="h-3 w-3 mr-1" />
                    Ignore
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartSuggestions;
