import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RefreshCw, Minimize2 } from "lucide-react";

interface SmartDraftModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: any;
}

const SmartDraftModal = ({ isOpen, onClose, email }: SmartDraftModalProps) => {
  const [draft, setDraft] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleRegenerate = async () => {
    try {
      setIsGenerating(true);
      const tone = localStorage.getItem("inboxzen_tone") || "friendly";
      
      const { data, error } = await supabase.functions.invoke("generate-draft", {
        body: {
          subject: email.subject,
          from: email.sender || email.from,
          snippet: email.body || email.snippet,
          tone
        }
      });

      if (error) throw error;
      
      setDraft(data.draft);
      toast.success("Draft generated!");
    } catch (error: any) {
      console.error("Draft generation error:", error);
      toast.error(error.message || "Failed to generate draft");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShorter = () => {
    const sentences = draft.split(". ");
    setDraft(sentences.slice(0, Math.max(1, sentences.length - 1)).join(". ") + ".");
  };

  const handleSendLater = () => {
    console.log("Send later:", { email: email.id, draft });
    toast.success("Email scheduled for later!");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Smart Draft</DialogTitle>
          <DialogDescription>
            AI-generated reply to {email.sender}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">Original: {email.subject}</p>
          </div>

          <Textarea 
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={8}
            className="resize-none"
            placeholder="Click 'Regenerate' to create a draft..."
          />

          <div className="flex gap-2">
            <Button 
              variant="outline"
              size="sm"
              onClick={handleRegenerate}
              disabled={isGenerating}
            >
              <RefreshCw className="mr-1 h-3 w-3" />
              {isGenerating ? "Generating..." : "Regenerate"}
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={handleShorter}
              disabled={!draft || isGenerating}
            >
              <Minimize2 className="mr-1 h-3 w-3" />
              Shorter
            </Button>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSendLater} disabled={!draft}>
              Send Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SmartDraftModal;
