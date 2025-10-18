import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface EmailConnection {
  id: string;
  provider: string;
  email: string;
  created_at: string;
}

export function EmailConnections() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<EmailConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [oauthUrl, setOauthUrl] = useState<string | null>(null);
  const [oauthHelpOpen, setOauthHelpOpen] = useState(false);

  useEffect(() => {
    loadConnections();
    
    // Check for OAuth callback params
    const params = new URLSearchParams(window.location.search);
    if (params.get("gmail_connected") === "true") {
      toast.success("Gmail connected successfully!");
      window.history.replaceState({}, "", window.location.pathname);
      loadConnections();
    } else if (params.get("error")) {
      toast.error(`Connection failed: ${params.get("error")}`);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const loadConnections = async () => {
    if (!user) return;
    
    try {
      // Only select non-sensitive fields (never access tokens)
      const { data, error } = await supabase
        .from("oauth_connections")
        .select("id, provider, email, created_at, expires_at")
        .eq("user_id", user.id);

      if (error) throw error;
      setConnections(data || []);
    } catch (error: any) {
      console.error("Error loading connections:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectGmail = async () => {
    if (!user) return;
    
    setConnecting("gmail");
    
    try {
      // Generate secure state token
      const state = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 min expiry

      // Store state in database
      const { error: stateError } = await supabase
        .from("oauth_states")
        .insert({
          state,
          user_id: user.id,
          expires_at: expiresAt,
        });

      if (stateError) {
        console.error("Failed to store OAuth state:", stateError);
        throw new Error("Failed to initialize OAuth flow");
      }

      const { data, error } = await supabase.functions.invoke("google-oauth-config");

      if (error || !data?.client_id || !data?.redirect_uri) {
        toast.error("Gmail OAuth is not configured. Please contact support.");
        setConnecting(null);
        return;
      }

      const scope = "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/userinfo.email";

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
        client_id: data.client_id,
        redirect_uri: data.redirect_uri,
        response_type: "code",
        scope: scope,
        access_type: "offline",
        prompt: "consent",
        state: state, // Use secure random state token
      })}`;
      // Save URL and show helper in case the browser blocks the popup
      setOauthUrl(authUrl);
      setOauthHelpOpen(true);

      // Do not auto-open or redirect here; many browsers/iframes block Google inside frames.
      // Instead, rely on the helper dialog's "Open in new tab" button which users can click.
      // This ensures a top-level tab is used and avoids X-Frame-Options blocks.

    } catch (e) {
      console.error("Failed to initiate Gmail OAuth:", e);
      toast.error("Failed to initiate Gmail OAuth");
      setConnecting(null);
    }
  };

  const handleDisconnect = async (connectionId: string, provider: string) => {
    try {
      const { error } = await supabase
        .from("oauth_connections")
        .delete()
        .eq("id", connectionId);

      if (error) throw error;

      toast.success(`${provider} disconnected`);
      loadConnections();
    } catch (error: any) {
      console.error("Error disconnecting:", error);
      toast.error(error.message || "Failed to disconnect");
    }
  };

  const gmailConnection = connections.find(c => c.provider === "gmail");
  const outlookConnection = connections.find(c => c.provider === "outlook");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Connections</CardTitle>
        <CardDescription>
          Connect your email accounts to fetch and analyze real emails
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Gmail */}
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
              <Mail className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="font-medium">Gmail</p>
              {gmailConnection ? (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Check className="h-3 w-3 text-green-600" />
                  {gmailConnection.email}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Not connected</p>
              )}
            </div>
          </div>
          {gmailConnection ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDisconnect(gmailConnection.id, "Gmail")}
            >
              <X className="h-4 w-4 mr-1" />
              Disconnect
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleConnectGmail}
              disabled={connecting === "gmail"}
            >
              {connecting === "gmail" ? "Connecting..." : "Connect"}
            </Button>
          )}
        </div>

        {/* Outlook */}
        <div className="flex items-center justify-between p-4 border rounded-lg opacity-60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
              <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="font-medium">Outlook</p>
              <p className="text-sm text-muted-foreground">Coming Soon</p>
            </div>
          </div>
          <Button variant="outline" size="sm" disabled>
            Connect
          </Button>
        </div>

        <Dialog open={oauthHelpOpen} onOpenChange={setOauthHelpOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Open Google sign-in</DialogTitle>
              <DialogDescription>
                If it’s blocked, copy this URL and paste it into a new browser tab.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="break-all text-sm select-all">{oauthUrl}</div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={async () => {
                    if (oauthUrl) {
                      await navigator.clipboard.writeText(oauthUrl);
                      toast.success("Copied link");
                    }
                  }}
                >
                  Copy link
                </Button>
                {oauthUrl && (
                  <a href={oauthUrl} target="_blank" rel="noopener noreferrer">
                    <Button>Open in new tab</Button>
                  </a>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
