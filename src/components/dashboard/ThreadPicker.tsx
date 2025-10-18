import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Thread {
  id: string;
  subject: string;
  from: string;
}

interface ThreadPickerProps {
  onSelect: (threadId: string) => void;
}

const ThreadPicker = ({ onSelect }: ThreadPickerProps) => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadThreads = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke("fetch-threads");

      if (error) throw error;

      setThreads(data.threads || []);
    } catch (error: any) {
      console.error("Error loading threads:", error);
      const msg = typeof error?.message === "string" ? error.message : "";
      const isAuth = msg.includes("401") || msg.toLowerCase().includes("unauthorized");
      toast({
        title: isAuth ? "Connect Gmail to load threads" : "Failed to load threads",
        description: isAuth ? "No Gmail connection found. Go to Settings → Email Connections to connect your account." : (msg || "Please try again."),
        variant: isAuth ? "default" : "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadThreads();
  }, []);

  return (
    <aside className="w-64 border-r bg-card">
      <div className="flex items-center justify-between border-b p-3">
        <h3 className="text-sm font-semibold">Threads</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadThreads}
          disabled={loading}
          className="h-7 w-7 p-0"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      <ScrollArea className="h-[calc(100vh-8rem)]">
        {loading && threads.length === 0 ? (
          <div className="p-3 text-xs text-muted-foreground">Loading threads…</div>
        ) : threads.length === 0 ? (
          <div className="p-3 text-xs text-muted-foreground">No threads found</div>
        ) : (
          <ul className="divide-y">
            {threads.map((thread) => (
              <li
                key={thread.id}
                className="p-3 hover:bg-accent cursor-pointer transition-colors"
                onClick={() => onSelect(thread.id)}
              >
                <div className="font-medium text-sm truncate">{thread.subject}</div>
                <div className="text-xs text-muted-foreground truncate mt-1">
                  {thread.from}
                </div>
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>
    </aside>
  );
};

export default ThreadPicker;
