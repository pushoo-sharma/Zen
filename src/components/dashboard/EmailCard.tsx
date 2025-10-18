import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileEdit, Archive, Clock, Brain, RefreshCw } from "lucide-react";
import SmartDraftModal from "./SmartDraftModal";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EmailCardProps {
  email: any;
}

const EmailCard = ({ email }: EmailCardProps) => {
  const [showDraft, setShowDraft] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Priority": return "bg-red-500";
      case "Action Needed": return "bg-yellow-500";
      case "Informational": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const handleArchive = () => {
    console.log("Archive email:", email.id);
  };

  const handleSnooze = () => {
    console.log("Snooze email:", email.id);
  };

  const handleRefreshMemory = async () => {
    if (!email.threadId) {
      toast({
        title: "No thread ID",
        description: "This email doesn't have a thread ID to summarize",
        variant: "destructive",
      });
      return;
    }

    setRefreshing(true);
    try {
      const { data, error } = await supabase.functions.invoke("memory-summarize", {
        body: { threadId: email.threadId },
      });

      if (error) throw error;

      toast({
        title: "Memory updated",
        description: `Thread summary refreshed for: ${data.subject || email.subject}`,
      });
    } catch (error: any) {
      console.error("Error refreshing memory:", error);
      toast({
        title: "Failed to refresh memory",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <>
      <Card className="p-4 hover:shadow-md transition-shadow duration-200">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-foreground">{email.sender}</span>
                <Badge variant="secondary" className="text-xs">
                  <div className={`w-2 h-2 rounded-full mr-1 ${getPriorityColor(email.priority)}`}></div>
                  {email.priority}
                </Badge>
              </div>
              <h3 className="text-sm font-medium text-foreground truncate">{email.subject}</h3>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{email.summary}</p>
              
              {email.threadId && (
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    <Brain className="h-3 w-3 mr-1" />
                    Memory
                  </Badge>
                  <button
                    onClick={handleRefreshMemory}
                    disabled={refreshing}
                    className="text-xs text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {refreshing ? (
                      <span className="flex items-center gap-1">
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        Updating...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <RefreshCw className="h-3 w-3" />
                        Refresh
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{email.time}</span>
          </div>

          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="default"
              onClick={() => setShowDraft(true)}
            >
              <FileEdit className="mr-1 h-3 w-3" />
              Smart Draft
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleArchive}
            >
              <Archive className="mr-1 h-3 w-3" />
              Archive
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={handleSnooze}
            >
              <Clock className="mr-1 h-3 w-3" />
              Snooze
            </Button>
          </div>
        </div>
      </Card>

      <SmartDraftModal 
        isOpen={showDraft}
        onClose={() => setShowDraft(false)}
        email={email}
      />
    </>
  );
};

export default EmailCard;
