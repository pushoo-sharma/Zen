import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, Shield, MessageSquare, Users, Clock, Lightbulb } from "lucide-react";
import { toast } from "sonner";

export default function DraftTransparency() {
  const [latestTrace, setLatestTrace] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLatestTrace();
  }, []);

  async function loadLatestTrace() {
    try {
      const { data, error } = await supabase.functions.invoke("traces");
      if (error) throw error;
      
      if (data.traces && data.traces.length > 0) {
        setLatestTrace(data.traces[0]);
      }
      setLoading(false);
    } catch (error: any) {
      console.error("Failed to load trace:", error);
      toast.error("Unable to load draft reasoning");
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card className="border-muted">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Draft Transparency</CardTitle>
          <CardDescription className="text-xs">Loading AI reasoning...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!latestTrace) {
    return (
      <Card className="border-muted bg-muted/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-muted-foreground" />
            Draft Transparency
          </CardTitle>
          <CardDescription className="text-xs">
            When you generate a draft using AI, you'll see the reasoning behind every decision here.
            We believe in showing our work.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const agentIcons: Record<string, any> = {
    tone: MessageSquare,
    summarizer: MessageSquare,
    relationship: Users,
    scheduler: Clock,
    safety: Shield,
  };

  const agentDescriptions: Record<string, string> = {
    tone: "Adjusted writing style to match your voice profile",
    summarizer: "Condensed thread context for clarity",
    relationship: "Applied relationship-building techniques",
    scheduler: "Recommended optimal send timing",
    safety: "Verified content for sensitive information",
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              Why This Draft?
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Generated using {latestTrace.steps?.length || 0} AI agents: Tone, Relationship, Safety, and Scheduler
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-xs">
            {new Date(latestTrace.created_at).toLocaleTimeString()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Subject and Final Draft */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-muted-foreground">Subject</div>
          <div className="text-sm">{latestTrace.input?.subject || "N/A"}</div>
        </div>

        {latestTrace.final?.body && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Final Draft</div>
            <div className="text-sm bg-background p-3 rounded-md border">
              {latestTrace.final.body}
            </div>
          </div>
        )}

        {/* Warnings */}
        {latestTrace.final?.warnings && latestTrace.final.warnings.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-destructive">Warnings</div>
            <ul className="text-sm text-destructive list-disc list-inside">
              {latestTrace.final.warnings.map((warning: string, idx: number) => (
                <li key={idx}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Agent Contributions */}
        {latestTrace.steps && latestTrace.steps.length > 0 && (
          <Collapsible className="space-y-2">
            <CollapsibleTrigger className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors w-full">
              <ChevronDown className="h-3 w-3" />
              View detailed reasoning from each agent
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-3 pt-2">
              {latestTrace.steps.map((step: any, idx: number) => {
                const agentName = step.agent?.toLowerCase() || "unknown";
                const Icon = agentIcons[agentName] || MessageSquare;
                
                return (
                  <div key={idx} className="p-3 rounded-md bg-background border space-y-1">
                    <div className="flex items-center gap-2 text-xs font-medium">
                      <Icon className="h-3 w-3 text-primary" />
                      <span>{step.agent || "Agent"}</span>
                      <Badge variant="secondary" className="text-xs ml-auto">
                        Score: {step.score || "N/A"}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {agentDescriptions[agentName] || "Processed draft"}
                    </div>
                    {step.result && (
                      <div className="text-xs mt-2 p-2 bg-muted rounded">
                        {typeof step.result === "string" 
                          ? step.result 
                          : JSON.stringify(step.result, null, 2)}
                      </div>
                    )}
                  </div>
                );
              })}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}
