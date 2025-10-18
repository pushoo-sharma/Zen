import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

export default function WhyThisDraft() {
  const [traces, setTraces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadTraces() {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("traces");

      if (error) throw error;
      setTraces(data?.traces || []);
    } catch (error: any) {
      console.error("Traces error:", error);
      toast.error(error.message || "Failed to load traces");
    } finally {
      setLoading(false);
    }
  }

// No auto-load to avoid CORS preflight issues; use Refresh button

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Why This Draft?</CardTitle>
            <CardDescription>
              Transparent agent execution traces
            </CardDescription>
          </div>
          <Button onClick={loadTraces} disabled={loading} variant="outline" size="sm">
            {loading ? "Loading..." : "Refresh"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {traces.length === 0 && !loading && (
          <p className="text-sm text-muted-foreground">No traces yet</p>
        )}
        <div className="space-y-3">
          {traces.map((trace) => (
            <Card key={trace.id} className="border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{trace.task_type}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(trace.created_at).toLocaleString()}
                    </span>
                  </div>
                  {trace.thread_id && (
                    <span className="text-xs text-muted-foreground">
                      Thread #{trace.thread_id.slice(0, 10)}...
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Subject:</p>
                  <p className="text-sm">{trace.input?.subject}</p>
                </div>
                
                {trace.final?.body && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Final Draft:</p>
                    <div className="bg-muted p-3 rounded-md text-xs whitespace-pre-wrap">
                      {trace.final.body}
                    </div>
                  </div>
                )}

                {trace.final?.warnings && trace.final.warnings.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Warnings:</p>
                    <div className="space-y-1">
                      {trace.final.warnings.map((w: string, i: number) => (
                        <Badge key={i} variant="destructive" className="text-xs">
                          {w}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <Collapsible>
                  <CollapsibleTrigger className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
                    <ChevronDown className="h-4 w-4" />
                    Show agent steps ({trace.steps?.length || 0})
                  </CollapsibleTrigger>
                  <CollapsibleContent className="mt-2">
                    <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-64">
                      {JSON.stringify(trace.steps, null, 2)}
                    </pre>
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
