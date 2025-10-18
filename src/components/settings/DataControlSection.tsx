import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Shield, Trash2, Download, Clock, Database, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export function DataControlSection() {
  const navigate = useNavigate();
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExportData = async () => {
    setExporting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Fetch user data from multiple tables
      const [
        { data: profile },
        { data: consents },
        { data: auditLogs },
        { data: onboarding },
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase.from("privacy_consents").select("*").eq("user_id", user.id),
        supabase.from("audit_logs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(100),
        supabase.from("onboarding_progress").select("*").eq("user_id", user.id).maybeSingle(),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
        },
        profile,
        privacy_consents: consents,
        recent_audit_logs: auditLogs,
        onboarding: onboarding,
      };

      // Create download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `inboxzen-data-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Data exported successfully");
    } catch (error: any) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke("delete-user-data", {
        body: { confirm_deletion: true },
      });

      if (error) throw error;

      toast.success("Account deleted successfully");
      
      // Sign out and redirect
      await supabase.auth.signOut();
      navigate("/");
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(error.message || "Failed to delete account");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="border-destructive/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <CardTitle>My Data Control</CardTitle>
        </div>
        <CardDescription>
          Manage your privacy, view audit logs, and control your data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Data Retention Info */}
        <div className="p-4 bg-muted rounded-lg space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <Database className="h-4 w-4" />
            Data Retention Policy
          </h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Email metadata cache</span>
              <Badge variant="secondary">24 hours max</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Audit logs</span>
              <Badge variant="secondary">30 days</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Message bodies</span>
              <Badge variant="outline">Deleted immediately</Badge>
            </div>
          </div>
        </div>

        {/* Encryption Info */}
        <div className="p-4 bg-primary/5 rounded-lg">
          <h4 className="font-semibold flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4" />
            Security Measures
          </h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>✓ AES-256 encryption for stored data</li>
            <li>✓ TLS 1.3 for all API communications</li>
            <li>✓ PII redacted in logs and analytics</li>
            <li>✓ OAuth tokens rotated every 90 days</li>
            <li>✓ Read-only email access (no send permissions)</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={handleExportData}
            disabled={exporting}
            variant="outline"
            className="w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            {exporting ? "Exporting..." : "Export My Data (JSON)"}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="w-full"
                disabled={deleting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {deleting ? "Deleting..." : "Delete Account & All Data"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  Permanently Delete Account?
                </AlertDialogTitle>
                <AlertDialogDescription className="space-y-3">
                  <p>This action cannot be undone. This will permanently delete:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Your account and profile</li>
                    <li>All OAuth connections and tokens</li>
                    <li>AI memory and learning data</li>
                    <li>Audit logs and activity history</li>
                    <li>All cached email metadata</li>
                  </ul>
                  <p className="font-semibold">Are you absolutely sure?</p>
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Yes, Delete Everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
