import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type BetaMetricType =
  | 'daily_active'
  | 'email_processed'
  | 'ai_action_taken'
  | 'draft_generated'
  | 'suggestion_accepted'
  | 'time_saved_minutes'
  | 'session_duration_minutes';

export function useBetaMetrics() {
  const { user } = useAuth();

  const trackMetric = useCallback(
    async (metricType: BetaMetricType, value: number, metadata?: Record<string, any>) => {
      if (!user) return;

      try {
        const { error } = await supabase.functions.invoke('track-beta-metric', {
          body: {
            metric_type: metricType,
            metric_value: value,
            metadata: metadata || {},
          },
        });

        if (error) {
          console.error('Error tracking beta metric:', error);
        }
      } catch (error) {
        console.error('Exception tracking beta metric:', error);
      }
    },
    [user]
  );

  // Convenience methods for common metrics
  const trackDailyActive = useCallback(() => {
    trackMetric('daily_active', 1);
  }, [trackMetric]);

  const trackEmailProcessed = useCallback((count: number = 1) => {
    trackMetric('email_processed', count);
  }, [trackMetric]);

  const trackAIAction = useCallback((actionType: string) => {
    trackMetric('ai_action_taken', 1, { action_type: actionType });
  }, [trackMetric]);

  const trackDraftGenerated = useCallback(() => {
    trackMetric('draft_generated', 1);
  }, [trackMetric]);

  const trackSuggestionAccepted = useCallback((suggestionType: string) => {
    trackMetric('suggestion_accepted', 1, { suggestion_type: suggestionType });
  }, [trackMetric]);

  const trackTimeSaved = useCallback((minutes: number) => {
    trackMetric('time_saved_minutes', minutes);
  }, [trackMetric]);

  const trackSessionDuration = useCallback((minutes: number) => {
    trackMetric('session_duration_minutes', minutes);
  }, [trackMetric]);

  return {
    trackMetric,
    trackDailyActive,
    trackEmailProcessed,
    trackAIAction,
    trackDraftGenerated,
    trackSuggestionAccepted,
    trackTimeSaved,
    trackSessionDuration,
  };
}
