import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  CheckCircle2,
  Circle,
  Mail,
  Sparkles,
  Send,
  Calendar,
  FileText,
  Rocket,
  ArrowRight,
} from "lucide-react";

interface OnboardingStep {
  key: string;
  label: string;
  description: string;
  icon: any;
  action: string;
  actionLink: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    key: "connect_email",
    label: "Connect Your Email",
    description: "Link your Gmail or Outlook account to start managing your inbox",
    icon: Mail,
    action: "Connect Email",
    actionLink: "/settings",
  },
  {
    key: "try_priority",
    label: "Explore Smart Priorities",
    description: "See how AI automatically prioritizes your most important emails",
    icon: Sparkles,
    action: "View Dashboard",
    actionLink: "/dashboard",
  },
  {
    key: "send_draft",
    label: "Generate Your First AI Draft",
    description: "Let AI create a professional reply in seconds",
    icon: Send,
    action: "Try AI Draft",
    actionLink: "/dashboard",
  },
  {
    key: "add_calendar",
    label: "Add a Calendar Event",
    description: "Use AI to automatically detect and suggest calendar events",
    icon: Calendar,
    action: "View Calendar",
    actionLink: "/dashboard",
  },
  {
    key: "review_digest",
    label: "Check Your Daily Digest",
    description: "Review AI-generated summaries of your day's emails",
    icon: FileText,
    action: "See Insights",
    actionLink: "/insights",
  },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [steps, setSteps] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [completedCount, setCompletedCount] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    loadOnboardingStatus();
  }, [user, authLoading, navigate]);

  const loadOnboardingStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("onboarding-status", {
        method: "GET",
      });

      if (error) throw error;

      if (data?.steps) {
        setSteps(data.steps);
        const completed = Object.values(data.steps).filter((v) => v === true).length;
        setCompletedCount(completed);
      }
    } catch (error: any) {
      console.error("Error loading onboarding:", error);
      toast.error("Failed to load onboarding progress");
    } finally {
      setLoading(false);
    }
  };

  const markStepComplete = async (stepKey: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("onboarding-status", {
        method: "POST",
        body: { step: stepKey, completed: true },
      });

      if (error) throw error;

      if (data?.steps) {
        setSteps(data.steps);
        const completed = Object.values(data.steps).filter((v) => v === true).length;
        setCompletedCount(completed);
        
        if (data.completed) {
          toast.success("🎉 Onboarding complete! Welcome to InboxZen!");
        }
      }
    } catch (error: any) {
      console.error("Error updating step:", error);
      toast.error("Failed to update progress");
    }
  };

  const handleStepAction = (step: OnboardingStep) => {
    markStepComplete(step.key);
    navigate(step.actionLink);
  };

  const handleSkipOnboarding = () => {
    navigate("/dashboard");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading your onboarding...</p>
        </div>
      </div>
    );
  }

  const progress = (completedCount / ONBOARDING_STEPS.length) * 100;
  const allCompleted = completedCount === ONBOARDING_STEPS.length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2">
            <Rocket className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold text-foreground">Welcome to InboxZen</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Get started in less than 5 minutes
          </p>
          
          <div className="max-w-md mx-auto space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress</span>
              <Badge variant={allCompleted ? "default" : "secondary"}>
                {completedCount} of {ONBOARDING_STEPS.length} completed
              </Badge>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Completion Card */}
        {allCompleted && (
          <Card className="border-primary bg-primary/5">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <CheckCircle2 className="h-16 w-16 text-primary mx-auto" />
                <div>
                  <h3 className="text-2xl font-bold text-foreground">
                    Congratulations! 🎉
                  </h3>
                  <p className="text-muted-foreground mt-2">
                    You've completed the onboarding. Start using InboxZen to transform your email workflow.
                  </p>
                </div>
                <Button onClick={() => navigate("/dashboard")} size="lg">
                  Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Steps Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {ONBOARDING_STEPS.map((step) => {
            const Icon = step.icon;
            const isCompleted = steps[step.key] === true;

            return (
              <Card
                key={step.key}
                className={isCompleted ? "border-primary/50" : ""}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${isCompleted ? "bg-primary/10" : "bg-muted"}`}>
                        <Icon className={`h-5 w-5 ${isCompleted ? "text-primary" : "text-muted-foreground"}`} />
                      </div>
                      <div className="space-y-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {step.label}
                          {isCompleted && (
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          )}
                        </CardTitle>
                        <CardDescription>{step.description}</CardDescription>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => handleStepAction(step)}
                    disabled={isCompleted}
                    variant={isCompleted ? "outline" : "default"}
                    className="w-full"
                  >
                    {isCompleted ? (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Completed
                      </>
                    ) : (
                      <>
                        {step.action}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Tips</CardTitle>
            <CardDescription>Get the most out of InboxZen</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-primary mt-2" />
              <p className="text-sm text-muted-foreground">
                <strong>Smart Priorities:</strong> AI automatically ranks emails by importance, urgency, and your engagement patterns
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-primary mt-2" />
              <p className="text-sm text-muted-foreground">
                <strong>AI Drafts:</strong> Generate professional responses instantly with customizable tone and style
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-primary mt-2" />
              <p className="text-sm text-muted-foreground">
                <strong>Learning System:</strong> InboxZen learns from your behavior to provide better recommendations over time
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-primary mt-2" />
              <p className="text-sm text-muted-foreground">
                <strong>Team Mode:</strong> Join a team to enable collaborative intelligence and shared insights
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Skip Button */}
        <div className="flex justify-center">
          <Button variant="ghost" onClick={handleSkipOnboarding}>
            Skip onboarding and go to dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
