import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Shield, Zap, Mail, Clock, Archive } from "lucide-react";

export default function AutomationSettings() {
  const [autonomousMode, setAutonomousMode] = useState(false);
  const [draftingEnabled, setDraftingEnabled] = useState(false);
  const [schedulingEnabled, setSchedulingEnabled] = useState(false);
  const [archivingEnabled, setArchivingEnabled] = useState(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState([80]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load from profiles or create a preferences table
      // For now, using localStorage as fallback
      const stored = localStorage.getItem(`autonomy_settings_${user.id}`);
      if (stored) {
        const settings = JSON.parse(stored);
        setAutonomousMode(settings.autonomousMode || false);
        setDraftingEnabled(settings.draftingEnabled || false);
        setSchedulingEnabled(settings.schedulingEnabled || false);
        setArchivingEnabled(settings.archivingEnabled || false);
        setConfidenceThreshold([settings.confidenceThreshold || 80]);
      }
    } catch (error) {
      console.error("Failed to load automation settings:", error);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const settings = {
        autonomousMode,
        draftingEnabled,
        schedulingEnabled,
        archivingEnabled,
        confidenceThreshold: confidenceThreshold[0],
        updatedAt: new Date().toISOString(),
      };

      // Store in localStorage for now (in production, use a preferences table)
      localStorage.setItem(`autonomy_settings_${user.id}`, JSON.stringify(settings));

      toast.success("Automation settings saved successfully");
    } catch (error: any) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Master Toggle */}
      <Card className="border-primary/20">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Autonomous AI Mode
              </CardTitle>
              <CardDescription className="mt-2">
                Enable AI to take actions on your behalf with your explicit consent
              </CardDescription>
            </div>
            <Switch
              checked={autonomousMode}
              onCheckedChange={setAutonomousMode}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </CardHeader>
        {autonomousMode && (
          <CardContent className="pt-0">
            <div className="rounded-md bg-primary/10 p-3 text-sm space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="font-medium">Safety First</span>
              </div>
              <p className="text-xs text-muted-foreground">
                All autonomous actions are logged, reversible, and require high confidence scores. 
                You maintain full control and visibility.
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Granular Controls */}
      {autonomousMode && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Autonomous Capabilities</CardTitle>
            <CardDescription>
              Choose which actions AI can perform automatically
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Drafting */}
            <div className="flex items-center justify-between p-3 rounded-md border">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="space-y-1">
                  <div className="font-medium text-sm">Auto-Drafting</div>
                  <div className="text-xs text-muted-foreground">
                    AI generates draft replies for routine emails
                  </div>
                </div>
              </div>
              <Switch
                checked={draftingEnabled}
                onCheckedChange={setDraftingEnabled}
              />
            </div>

            {/* Scheduling */}
            <div className="flex items-center justify-between p-3 rounded-md border">
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="space-y-1">
                  <div className="font-medium text-sm">Auto-Scheduling</div>
                  <div className="text-xs text-muted-foreground">
                    AI determines optimal send times for drafted emails
                  </div>
                </div>
              </div>
              <Switch
                checked={schedulingEnabled}
                onCheckedChange={setSchedulingEnabled}
              />
            </div>

            {/* Archiving */}
            <div className="flex items-center justify-between p-3 rounded-md border">
              <div className="flex items-start gap-3">
                <Archive className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="space-y-1">
                  <div className="font-medium text-sm">Auto-Archiving</div>
                  <div className="text-xs text-muted-foreground">
                    AI archives low-priority emails after reading
                  </div>
                </div>
              </div>
              <Switch
                checked={archivingEnabled}
                onCheckedChange={setArchivingEnabled}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confidence Threshold */}
      {autonomousMode && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Confidence Threshold</CardTitle>
            <CardDescription>
              Minimum confidence required for AI to execute autonomous actions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Required Confidence</Label>
                <Badge variant="secondary" className="font-mono">
                  {confidenceThreshold[0]}%
                </Badge>
              </div>
              <Slider
                value={confidenceThreshold}
                onValueChange={setConfidenceThreshold}
                min={50}
                max={99}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Lower (More autonomous)</span>
                <span>Higher (More cautious)</span>
              </div>
            </div>

            <div className="rounded-md bg-muted p-3 text-xs space-y-2">
              <div className="font-medium">Current setting: {confidenceThreshold[0]}%</div>
              <p className="text-muted-foreground">
                {confidenceThreshold[0] >= 90 && "Very cautious: AI will only act when extremely confident"}
                {confidenceThreshold[0] >= 75 && confidenceThreshold[0] < 90 && "Balanced: AI acts on high-confidence decisions"}
                {confidenceThreshold[0] < 75 && "Permissive: AI acts more frequently with moderate confidence"}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Privacy & Audit */}
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Accountability Guarantee
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-muted-foreground">
          <p>✓ Every autonomous action is logged with full reasoning</p>
          <p>✓ All actions are reversible with one-click undo</p>
          <p>✓ Natural language summaries for every AI decision</p>
          <p>✓ Complete audit trail available in Activity Feed</p>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
        <Save className="mr-2 h-4 w-4" />
        {saving ? "Saving..." : "Save Automation Settings"}
      </Button>
    </div>
  );
}
