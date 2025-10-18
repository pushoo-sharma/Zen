import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Shield, Lock, Eye, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PrivacyConsentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConsent: () => void;
}

export function PrivacyConsentModal({ open, onOpenChange, onConsent }: PrivacyConsentModalProps) {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAccept = async () => {
    if (!agreed) {
      toast.error("Please review and accept the privacy terms");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("privacy_consents")
        .insert({
          user_id: user.id,
          consent_type: "oauth_email_access",
          granted: true,
        });

      if (error) throw error;

      toast.success("Privacy consent recorded");
      onConsent();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error recording consent:", error);
      toast.error("Failed to record consent");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Privacy & Data Protection
          </DialogTitle>
          <DialogDescription>
            Please review how InboxZen handles your email data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <Eye className="h-5 w-5 text-primary mt-0.5" />
              <div className="space-y-1">
                <h3 className="font-semibold">What We Access</h3>
                <p className="text-sm text-muted-foreground">
                  InboxZen reads <strong>metadata only</strong> from your emails including:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mt-2">
                  <li>Sender addresses and names</li>
                  <li>Subject lines</li>
                  <li>Timestamps</li>
                  <li>Message IDs</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-2">
                  <strong>We DO NOT access:</strong> Email body content or attachments permanently.
                  They are analyzed in-memory and immediately discarded.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <Lock className="h-5 w-5 text-primary mt-0.5" />
              <div className="space-y-1">
                <h3 className="font-semibold">How We Protect Your Data</h3>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li><strong>Read-Only Access:</strong> We never send emails or modify your inbox</li>
                  <li><strong>24-Hour Cache:</strong> Metadata cached for max 24 hours, then deleted</li>
                  <li><strong>AES-256 Encryption:</strong> All stored data is encrypted at rest</li>
                  <li><strong>TLS 1.3:</strong> All API communications use modern encryption</li>
                  <li><strong>PII Redaction:</strong> Email addresses masked in logs and analytics</li>
                </ul>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 border rounded-lg">
              <Trash2 className="h-5 w-5 text-primary mt-0.5" />
              <div className="space-y-1">
                <h3 className="font-semibold">Your Data Rights</h3>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>Revoke access anytime in Settings</li>
                  <li>Delete all your data with one click</li>
                  <li>Export your data as JSON</li>
                  <li>Audit logs retained for 30 days max</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg">
            <Checkbox 
              id="privacy-consent" 
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked === true)}
            />
            <Label 
              htmlFor="privacy-consent" 
              className="text-sm cursor-pointer leading-relaxed"
            >
              I understand and consent to InboxZen accessing my email metadata (not content) 
              to provide smart prioritization and AI-powered features. I understand that I can 
              revoke access and delete all my data at any time.
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Decline
          </Button>
          <Button onClick={handleAccept} disabled={!agreed || loading}>
            {loading ? "Processing..." : "Accept & Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
