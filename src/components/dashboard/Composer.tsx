import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, Clock } from "lucide-react";

const Composer = () => {
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sendAt, setSendAt] = useState("");
  const [sending, setSending] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const { toast } = useToast();

  // Check for bridged draft from Companion
  useEffect(() => {
    const bridge = localStorage.getItem("inboxzen.draftBridge");
    if (bridge) {
      setBody(bridge);
      localStorage.removeItem("inboxzen.draftBridge");
      toast({
        title: "Draft loaded",
        description: "AI draft has been loaded into the composer",
      });
    }
  }, [toast]);

  const handleSendNow = async () => {
    if (!to || !subject || !body) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields before sending",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-email", {
        body: { to, subject, body },
      });

      if (error) throw error;

      toast({
        title: "Email sent!",
        description: "Your email has been sent successfully",
      });

      // Clear form
      setTo("");
      setSubject("");
      setBody("");
    } catch (error: any) {
      console.error("Error sending email:", error);
      toast({
        title: "Failed to send email",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleSchedule = async () => {
    if (!to || !subject || !body || !sendAt) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields including the send time",
        variant: "destructive",
      });
      return;
    }

    setScheduling(true);
    try {
      const { data, error } = await supabase.functions.invoke("schedule-email", {
        body: { to, subject, body, sendAt: new Date(sendAt).toISOString() },
      });

      if (error) throw error;

      toast({
        title: "Email scheduled!",
        description: `Your email will be sent at ${new Date(sendAt).toLocaleString()}`,
      });

      // Clear form
      setTo("");
      setSubject("");
      setBody("");
      setSendAt("");
    } catch (error: any) {
      console.error("Error scheduling email:", error);
      toast({
        title: "Failed to schedule email",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setScheduling(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Compose Email</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Input
            placeholder="To: recipient@example.com"
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <div>
          <Input
            placeholder="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>
        <div>
          <Textarea
            placeholder="Write your message here..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="min-h-[200px]"
          />
        </div>
        <div>
          <Input
            type="datetime-local"
            value={sendAt}
            onChange={(e) => setSendAt(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSendNow} disabled={sending || scheduling} className="flex-1">
            {sending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Now
              </>
            )}
          </Button>
          <Button
            onClick={handleSchedule}
            disabled={sending || scheduling}
            variant="outline"
            className="flex-1"
          >
            {scheduling ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scheduling...
              </>
            ) : (
              <>
                <Clock className="mr-2 h-4 w-4" />
                Schedule
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Composer;
