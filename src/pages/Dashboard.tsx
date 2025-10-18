import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Rocket } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import EmailFeed from "@/components/dashboard/EmailFeed";
import AnalyticsPanel from "@/components/dashboard/AnalyticsPanel";
import Composer from "@/components/dashboard/Composer";
import SmartSuggestions from "@/components/dashboard/SmartSuggestions";
import Companion from "@/components/dashboard/Companion";
import ThreadPicker from "@/components/dashboard/ThreadPicker";
import OrchestrationPanel from "@/components/dashboard/OrchestrationPanel";
import WhyThisDraft from "@/components/dashboard/WhyThisDraft";
import DraftTransparency from "@/components/dashboard/DraftTransparency";
import { FeedbackButton } from "@/components/feedback/FeedbackButton";
import { BetaPioneerBadge } from "@/components/feedback/BetaPioneerBadge";
import { mockEmails } from "@/lib/mockData";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useBetaMetrics } from "@/hooks/useBetaMetrics";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { trackDailyActive } = useBetaMetrics();
  const [emails, setEmails] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [showOnboardingBanner, setShowOnboardingBanner] = useState(false);

  // Track daily active user
  useEffect(() => {
    if (user) {
      trackDailyActive();
    }
  }, [user, trackDailyActive]);

  const handleThreadSelect = (threadId: string) => {
    setSelectedThreadId(threadId);
    // Thread ID is now available for Companion or other components to use
  };

  useEffect(() => {
    // Redirect to auth if not logged in
    if (!authLoading && !user) {
      navigate("/auth");
      return;
    }

    // Check onboarding status
    const checkOnboarding = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase.functions.invoke("onboarding-status", {
          method: "GET",
        });

        if (!error && data) {
          setOnboardingComplete(data.completed);
          // Show banner if not dismissed and not completed
          const dismissed = localStorage.getItem('onboarding-banner-dismissed');
          setShowOnboardingBanner(!data.completed && !dismissed);
        }
      } catch (error) {
        console.error("Error checking onboarding:", error);
      }
    };

    // Load and classify emails with AI
    const classifyEmails = async () => {
      if (!user) return;
      
      try {
        // First, check if user has Gmail connected
        const { data: connections } = await supabase
          .from("oauth_connections")
          .select("provider")
          .eq("user_id", user.id);

        let emailsToClassify = mockEmails;

        // If Gmail is connected, fetch real emails
        if (connections && connections.some(c => c.provider === "gmail")) {
          try {
            const { data: gmailData, error: gmailError } = await supabase.functions.invoke(
              "fetch-gmail-emails"
            );

            if (!gmailError && gmailData?.emails) {
              emailsToClassify = gmailData.emails;
              toast.success(`Loaded ${gmailData.emails.length} emails from Gmail`);
            }
          } catch (error: any) {
            console.error("Gmail fetch error:", error);
            toast.error("Using demo emails instead");
          }
        }

        // Classify emails with AI
        const { data, error } = await supabase.functions.invoke("classify-emails", {
          body: { emails: emailsToClassify }
        });

        if (error) throw error;
        
        setEmails(data.emails);
        setIsLoading(false);
        if (emailsToClassify === mockEmails) {
          toast.success("Inbox analyzed! (Using demo emails)");
        }
      } catch (error: any) {
        console.error("Classification error:", error);
        toast.error(error.message || "Failed to analyze emails");
        setIsLoading(false);
      }
    };

    if (user) {
      checkOnboarding();
      classifyEmails();
    }
  }, [user, authLoading, navigate]);

  const handleDismissOnboardingBanner = () => {
    localStorage.setItem('onboarding-banner-dismissed', 'true');
    setShowOnboardingBanner(false);
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">
            {authLoading ? "Loading..." : "Analyzing your inbox..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <ThreadPicker onSelect={handleThreadSelect} />
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Beta Feedback Bar */}
          <div className="flex items-center justify-between gap-4 pb-2 border-b">
            <div className="flex items-center gap-2">
              <BetaPioneerBadge />
              <span className="text-sm text-muted-foreground">
                Help us improve with your feedback
              </span>
            </div>
            <div className="flex gap-2">
              <FeedbackButton type="bug" />
              <FeedbackButton type="improvement" />
            </div>
          </div>

          {showOnboardingBanner && (
            <Card className="bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Rocket className="h-6 w-6 text-primary" />
                  <div>
                    <h3 className="font-semibold text-foreground">Complete your setup!</h3>
                    <p className="text-sm text-muted-foreground">
                      Take a quick tour to get the most out of InboxZen
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={() => navigate("/onboarding")} variant="default">
                    Continue Setup
                  </Button>
                  <Button
                    onClick={handleDismissOnboardingBanner}
                    variant="ghost"
                    size="icon"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          )}
          <SmartSuggestions />
          <EmailFeed emails={emails} />
          <Composer />
          <DraftTransparency />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <OrchestrationPanel />
            <WhyThisDraft />
          </div>
        </div>
      </div>
      <AnalyticsPanel emails={emails} />
      <Companion />
    </div>
  );
};

export default Dashboard;
