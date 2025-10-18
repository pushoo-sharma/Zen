import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2, Check } from "lucide-react";
import { SUBSCRIPTION_TIERS } from "@/lib/subscriptionTiers";

export function SubscriptionManager() {
  const { subscriptionStatus, checkSubscription } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (priceId: string, tierName: string) => {
    setLoading(priceId);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId }
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        toast.success(`Opening checkout for ${tierName}...`);
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Failed to start checkout');
    } finally {
      setLoading(null);
    }
  };

  const handleManageSubscription = async () => {
    setLoading('portal');
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
        toast.success('Opening subscription management...');
      }
    } catch (error: any) {
      console.error('Portal error:', error);
      toast.error(error.message || 'Failed to open subscription portal');
    } finally {
      setLoading('portal');
    }
  };

  const handleRefreshStatus = async () => {
    setLoading('refresh');
    try {
      await checkSubscription();
      toast.success('Subscription status refreshed');
    } catch (error) {
      toast.error('Failed to refresh subscription status');
    } finally {
      setLoading('refresh');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>
            {subscriptionStatus.subscribed 
              ? `You're currently on the ${subscriptionStatus.plan.charAt(0).toUpperCase() + subscriptionStatus.plan.slice(1)} plan`
              : "You're currently on the free plan"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscriptionStatus.subscribed && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Subscription Status</p>
                <p className="text-sm text-muted-foreground">
                  Renews on {subscriptionStatus.subscriptionEnd 
                    ? new Date(subscriptionStatus.subscriptionEnd).toLocaleDateString() 
                    : 'N/A'}
                </p>
              </div>
              <Badge variant="default">Active</Badge>
            </div>
          )}
          
          <div className="flex gap-2">
            {subscriptionStatus.subscribed && (
              <Button
                variant="outline"
                onClick={handleManageSubscription}
                disabled={loading === 'portal'}
              >
                {loading === 'portal' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Manage Subscription
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleRefreshStatus}
              disabled={loading === 'refresh'}
            >
              {loading === 'refresh' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Refresh Status
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {Object.entries(SUBSCRIPTION_TIERS).map(([key, tier]) => {
          const isCurrentPlan = subscriptionStatus.plan === key;
          
          return (
            <Card key={key} className={isCurrentPlan ? "border-primary" : ""}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{tier.name}</CardTitle>
                  {isCurrentPlan && <Badge>Current Plan</Badge>}
                </div>
                <CardDescription>
                  <span className="text-3xl font-bold text-foreground">{tier.price}</span>
                  <span className="text-sm">/month{tier.perUser ? ' per user' : ''}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {tier.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                {!isCurrentPlan && (
                  <Button
                    className="w-full"
                    onClick={() => handleCheckout(tier.priceId, tier.name)}
                    disabled={loading === tier.priceId}
                  >
                    {loading === tier.priceId && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {subscriptionStatus.subscribed ? 'Switch Plan' : 'Subscribe'}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
