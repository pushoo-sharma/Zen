import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  TrendingUp, 
  MessageSquare, 
  Clock,
  Shield,
  Settings,
  BarChart3
} from "lucide-react";
import { toast } from "sonner";
import TeamInsightsChart from "./TeamInsightsChart";
import TeamSettings from "./TeamSettings";

export default function TeamDashboard() {
  const [teamData, setTeamData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadTeamData();
  }, []);

  async function loadTeamData() {
    try {
      const { data, error } = await supabase.functions.invoke("team-insights");
      
      if (error) throw error;
      
      setTeamData(data);
      setIsAdmin(data?.isAdmin || false);
      setLoading(false);
    } catch (error: any) {
      console.error("Failed to load team data:", error);
      toast.error("Unable to load team insights");
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!teamData?.teamId) {
    return (
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Intelligence
          </CardTitle>
          <CardDescription>
            Join a team to unlock collective AI learning and shared communication insights.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const stats = teamData.stats || {};
  const patterns = teamData.patterns || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Users className="h-6 w-6 text-primary" />
                Team Collective Intelligence
              </CardTitle>
              <CardDescription className="mt-2">
                Anonymized insights from {stats.memberCount || 0} team members. 
                All data is aggregated and privacy-preserving.
              </CardDescription>
            </div>
            <Badge variant="outline" className="gap-1">
              <Shield className="h-3 w-3" />
              Privacy Protected
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="insights">
            <BarChart3 className="h-4 w-4 mr-2" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="patterns">
            <TrendingUp className="h-4 w-4 mr-2" />
            Patterns
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Avg Response Time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-bold">
                    {stats.avgResponseTime || "N/A"}
                  </div>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Team Tone</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <div className="text-2xl font-bold capitalize">
                    {stats.dominantTone || "Balanced"}
                  </div>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Communication Clarity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">
                    {stats.clarityScore || 0}%
                  </div>
                  <Progress value={stats.clarityScore || 0} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="text-xs">Team Activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalEmails || 0}
                </div>
                <div className="text-xs text-muted-foreground mt-1">emails this week</div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <TeamInsightsChart data={patterns} />
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Communication Patterns</CardTitle>
              <CardDescription>
                Aggregated behavioral patterns across the team—used to improve AI drafting
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tone Distribution */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Tone Distribution</div>
                {patterns.toneDistribution && Object.entries(patterns.toneDistribution).map(([tone, percentage]: any) => (
                  <div key={tone} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="capitalize">{tone}</span>
                      <span className="text-muted-foreground">{percentage}%</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                ))}
              </div>

              {/* Response Speed Heat Map */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Response Speed by Hour</div>
                <div className="grid grid-cols-12 gap-1">
                  {Array.from({ length: 24 }, (_, i) => {
                    const activity = patterns.hourlyActivity?.[i] || 0;
                    const opacity = Math.min(activity / 100, 1);
                    return (
                      <div
                        key={i}
                        className="h-8 rounded flex items-center justify-center text-xs"
                        style={{
                          backgroundColor: `hsl(var(--primary) / ${opacity})`,
                        }}
                        title={`${i}:00 - ${activity}% activity`}
                      >
                        {i % 3 === 0 ? i : ""}
                      </div>
                    );
                  })}
                </div>
                <div className="text-xs text-muted-foreground">
                  Peak hours: {patterns.peakHours?.join(", ") || "N/A"}
                </div>
              </div>

              {/* Sentiment Trends */}
              {patterns.sentimentTrend && (
                <div className="space-y-2">
                  <div className="text-sm font-medium">Sentiment Trend</div>
                  <div className="flex items-center gap-2">
                    <Badge variant={patterns.sentimentTrend > 0 ? "default" : "secondary"}>
                      {patterns.sentimentTrend > 0 ? "↑" : "↓"} 
                      {Math.abs(patterns.sentimentTrend)}% this week
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Privacy Notice */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Privacy Guarantee
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>
                All insights are derived from anonymized, aggregated data. No individual message 
                content is stored or shared.
              </p>
              <p>
                Team patterns are used only to improve AI drafting quality for everyone—making 
                suggestions more aligned with your team's communication culture.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="settings" className="space-y-4">
            <TeamSettings teamId={teamData.teamId} onUpdate={loadTeamData} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
