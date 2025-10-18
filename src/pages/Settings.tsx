import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Trash2, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { EmailConnections } from "@/components/settings/EmailConnections";
import { TeamJoinSection } from "@/components/settings/TeamJoinSection";
import { DataControlSection } from "@/components/settings/DataControlSection";
import { SubscriptionManager } from "@/components/settings/SubscriptionManager";
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

const Settings = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, subscriptionStatus, checkSubscription } = useAuth();
  const [tone, setTone] = useState("friendly");
  const [syncInterval, setSyncInterval] = useState("10");
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [useMemory, setUseMemory] = useState(true);
  const [maxContextChars, setMaxContextChars] = useState(2000);
  const [savingMemory, setSavingMemory] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    // Load user preferences
    const loadPreferences = async () => {
      if (!user) return;
      
      const { data, error } = await supabase
        .from("profiles")
        .select("default_tone")
        .eq("id", user.id)
        .single();

      if (!error && data) {
        setTone(data.default_tone || "friendly");
      }

      // Load sync interval from localStorage for now
      const savedInterval = localStorage.getItem("inboxzen_sync_interval");
      if (savedInterval) {
        setSyncInterval(savedInterval);
      }

      // Load memory preferences
      try {
        const { data: memData, error: memError } = await supabase.functions.invoke(
          "memory-prefs"
        );

        if (!memError && memData?.flags) {
          setUseMemory(memData.flags.use_memory ?? true);
          setMaxContextChars(memData.flags.max_context_chars ?? 2000);
        }
      } catch (error) {
        console.error("Error loading memory prefs:", error);
      }
    };

    loadPreferences();
  }, [user, authLoading, navigate]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ default_tone: tone })
        .eq("id", user.id);

      if (error) throw error;

      localStorage.setItem("inboxzen_sync_interval", syncInterval);
      localStorage.setItem("inboxzen_tone", tone);

      toast.success("Settings saved successfully!");
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error(error.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleResetLearning = async () => {
    if (!user) return;

    setResetting(true);
    try {
      const { data, error } = await supabase.functions.invoke("reset-learning");

      if (error) throw error;

      toast.success(data.message || "Learning data reset successfully!");
    } catch (error: any) {
      console.error("Error resetting learning:", error);
      toast.error(error.message || "Failed to reset learning data");
    } finally {
      setResetting(false);
    }
  };

  const handleSaveMemory = async () => {
    if (!user) return;

    setSavingMemory(true);
    try {
      const { error } = await supabase.functions.invoke("memory-prefs", {
        body: {
          use_memory: useMemory,
          max_context_chars: maxContextChars,
        },
      });

      if (error) throw error;

      toast.success("Memory preferences saved successfully!");
    } catch (error: any) {
      console.error("Error saving memory prefs:", error);
      toast.error(error.message || "Failed to save memory preferences");
    } finally {
      setSavingMemory(false);
    }
  };

  const handleExportMemory = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("memory-export");

      if (error) throw error;

      // Create blob and download
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `inboxzen_memory_export_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Memory exported successfully!");
    } catch (error: any) {
      console.error("Error exporting memory:", error);
      toast.error(error.message || "Failed to export memory");
    }
  };


  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto p-6 space-y-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/dashboard")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground mt-2">Customize your InboxZen experience</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>AI Response Tone</CardTitle>
            <CardDescription>Choose how AI drafts your email responses</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup value={tone} onValueChange={setTone}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="formal" id="formal" />
                <Label htmlFor="formal">Formal - Professional and structured</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="friendly" id="friendly" />
                <Label htmlFor="friendly">Friendly - Warm and approachable</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="brief" id="brief" />
                <Label htmlFor="brief">Brief - Short and to the point</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sync Settings</CardTitle>
            <CardDescription>How often should we check for new emails?</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={syncInterval} onValueChange={setSyncInterval}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">Every 5 minutes</SelectItem>
                <SelectItem value="10">Every 10 minutes</SelectItem>
                <SelectItem value="manual">Manual only</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <EmailConnections />

        <Card>
          <CardHeader>
            <CardTitle>AI Memory & Context</CardTitle>
            <CardDescription>
              Control how InboxZen remembers thread summaries and contact preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="use-memory">Enable AI Memory</Label>
                <p className="text-sm text-muted-foreground">
                  Allow InboxZen to remember thread summaries and contact details
                </p>
              </div>
              <Switch
                id="use-memory"
                checked={useMemory}
                onCheckedChange={setUseMemory}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-chars">Maximum Context Characters</Label>
              <Input
                id="max-chars"
                type="number"
                min="500"
                max="5000"
                step="100"
                value={maxContextChars}
                onChange={(e) => setMaxContextChars(Number(e.target.value))}
                disabled={!useMemory}
              />
              <p className="text-sm text-muted-foreground">
                How much context to include in AI responses (500-5000 characters)
              </p>
            </div>

            <Button onClick={handleSaveMemory} disabled={savingMemory}>
              {savingMemory ? "Saving..." : "Save Memory Preferences"}
            </Button>

            <Button
              variant="outline"
              onClick={handleExportMemory}
              className="w-full"
            >
              Export Memory JSON
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Learning Preferences</CardTitle>
            <CardDescription>
              Control how InboxZen learns from your behavior and adapts to your patterns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
              <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium">Adaptive Recommendations</p>
                <p className="text-sm text-muted-foreground">
                  InboxZen learns from your email interactions to provide better recommendations over time.
                  Hour-of-day preferences and engagement patterns are updated nightly.
                </p>
              </div>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={resetting}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {resetting ? "Resetting..." : "Reset Learning Data"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset All Learning Data?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all your behavioral data, including:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Email interaction history (opens, snoozes, ignores)</li>
                      <li>Hour-of-day preferences</li>
                      <li>Personalized recommendation weights</li>
                      <li>Thread summaries and AI memory</li>
                      <li>Contact notes and preferences</li>
                    </ul>
                    <br />
                    Smart suggestions will return to default scoring until new patterns are learned.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetLearning}>
                    Reset Data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billing & Subscription</CardTitle>
            <CardDescription>
              Manage your subscription plan and billing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SubscriptionManager />
          </CardContent>
        </Card>

        <DataControlSection />

        <Card className="opacity-60">
          <CardHeader>
            <CardTitle>Team Collaboration</CardTitle>
            <CardDescription>
              Join a team to enable collaborative intelligence and shared insights
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <TeamJoinSection />
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardHeader>
            <CardTitle>Integrations</CardTitle>
            <CardDescription>Connect with other services (Coming Soon)</CardDescription>
          </CardHeader>
          <CardContent>
            <Button disabled variant="outline" className="w-full">
              Connect Slack
            </Button>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
