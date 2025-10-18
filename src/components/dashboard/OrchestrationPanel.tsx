import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Workflow, FileSearch } from "lucide-react";

export default function OrchestrationPanel() {
  const [log, setLog] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [coordinating, setCoordinating] = useState(false);

  async function runDraft() {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("orchestrate", {
        body: {
          task: {
            type: "DRAFT",
            subject: "Follow up on contract",
            body: "Draft reply confirming Friday 2pm.",
          },
        },
      });

      if (error) throw error;
      setLog(data);
      toast.success("Orchestration completed");
    } catch (error: any) {
      console.error("Orchestration error:", error);
      toast.error(error.message || "Orchestration failed");
    } finally {
      setLoading(false);
    }
  }

  async function runCoordinate() {
    setCoordinating(true);
    try {
      const { data, error } = await supabase.functions.invoke("coordinate", {
        body: {
          subject: "Project Update",
          body: "Draft a professional follow-up confirming our Friday 2pm meeting and asking if they need anything prepared.",
          threadId: "test-thread-" + Date.now(),
        },
      });

      if (error) throw error;
      setLog(data);
      toast.success("Coordination complete! Check 'Why This Draft?' panel for trace.");
    } catch (error: any) {
      console.error("Coordination error:", error);
      toast.error(error.message || "Coordination failed");
    } finally {
      setCoordinating(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Multi-Agent Orchestration</CardTitle>
            <CardDescription>
              Test multi-agent coordination for email drafting
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={runDraft} disabled={loading || coordinating} variant="outline" size="sm">
              <Workflow className="h-4 w-4 mr-1" />
              {loading ? "Running..." : "Orchestrate"}
            </Button>
            <Button onClick={runCoordinate} disabled={loading || coordinating} variant="default" size="sm">
              <FileSearch className="h-4 w-4 mr-1" />
              {coordinating ? "Coordinating..." : "Coordinate & Trace"}
            </Button>
          </div>
        </div>
      </CardHeader>
      {log && (
        <CardContent>
          <pre className="whitespace-pre-wrap text-xs bg-muted p-3 rounded-md overflow-auto max-h-96">
            {JSON.stringify(log, null, 2)}
          </pre>
        </CardContent>
      )}
    </Card>
  );
}
