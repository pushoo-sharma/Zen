import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, TrendingUp, FileEdit } from "lucide-react";

interface AnalyticsPanelProps {
  emails: any[];
}

const AnalyticsPanel = ({ emails }: AnalyticsPanelProps) => {
  const timeSaved = Math.round(emails.length * 2.3); // Mock: ~2.3 min per email
  const inboxScore = Math.min(100, Math.round((emails.filter(e => e.priority !== "Priority").length / emails.length) * 100));
  const draftsSuggested = emails.length;

  return (
    <div className="w-80 bg-card border-l border-border p-6 overflow-auto">
      <h2 className="text-lg font-semibold mb-4">Analytics</h2>
      
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Time Saved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{timeSaved} min</div>
            <p className="text-xs text-muted-foreground mt-1">Today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Inbox Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{inboxScore}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {inboxScore >= 80 ? "Excellent!" : inboxScore >= 60 ? "Good progress" : "Keep going"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileEdit className="h-4 w-4 text-blue-500" />
              AI Drafts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{draftsSuggested}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready to review</p>
          </CardContent>
        </Card>

        <div className="pt-4">
          <div className="p-4 bg-primary/10 rounded-lg">
            <p className="text-sm font-medium text-primary">🎯 Daily Goal</p>
            <p className="text-xs text-muted-foreground mt-1">
              Process all priority emails by 5 PM
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPanel;
