import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Crown } from "lucide-react";

interface TeamSettingsProps {
  teamId: string;
  onUpdate?: () => void;
}

export default function TeamSettings({ teamId, onUpdate }: TeamSettingsProps) {
  const [tonePreference, setTonePreference] = useState("balanced");
  const [formalityLevel, setFormalityLevel] = useState([50]);
  const [responseSpeedTarget, setResponseSpeedTarget] = useState([24]);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      const settings = {
        tonePreference,
        formalityLevel: formalityLevel[0],
        responseSpeedTarget: responseSpeedTarget[0],
      };

      // This would call a team settings update function
      const { error } = await supabase.functions.invoke("update-team-settings", {
        body: { teamId, settings }
      });

      if (error) throw error;

      toast.success("Team settings updated successfully");
      onUpdate?.();
    } catch (error: any) {
      console.error("Failed to save settings:", error);
      toast.error("Failed to update settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Crown className="h-4 w-4 text-primary" />
              Team AI Preferences
            </CardTitle>
            <CardDescription className="mt-1">
              Configure how AI adapts to your team's communication style
            </CardDescription>
          </div>
          <Badge variant="secondary">Admin Only</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tone Preference */}
        <div className="space-y-2">
          <Label htmlFor="tone">Default Tone</Label>
          <Select value={tonePreference} onValueChange={setTonePreference}>
            <SelectTrigger id="tone">
              <SelectValue placeholder="Select tone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="friendly">Friendly</SelectItem>
              <SelectItem value="balanced">Balanced</SelectItem>
              <SelectItem value="concise">Concise</SelectItem>
              <SelectItem value="warm">Warm</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            AI will adapt draft tone to match this team preference
          </p>
        </div>

        {/* Formality Level */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Formality Level</Label>
            <span className="text-sm text-muted-foreground">{formalityLevel[0]}%</span>
          </div>
          <Slider
            value={formalityLevel}
            onValueChange={setFormalityLevel}
            max={100}
            step={10}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Casual</span>
            <span>Formal</span>
          </div>
        </div>

        {/* Response Speed Target */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Response Speed Target</Label>
            <span className="text-sm text-muted-foreground">{responseSpeedTarget[0]}h</span>
          </div>
          <Slider
            value={responseSpeedTarget}
            onValueChange={setResponseSpeedTarget}
            max={72}
            step={6}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            AI will suggest send times based on this target
          </p>
        </div>

        {/* Privacy Notice */}
        <div className="rounded-md bg-muted p-3 text-xs space-y-1">
          <div className="font-medium">Privacy Controls</div>
          <p className="text-muted-foreground">
            These settings only affect how the AI drafts suggestions for your team. 
            Individual user data remains private and anonymized.
          </p>
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full">
          <Save className="mr-2 h-4 w-4" />
          {saving ? "Saving..." : "Save Team Settings"}
        </Button>
      </CardContent>
    </Card>
  );
}
