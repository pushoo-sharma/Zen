/**
 * React hook for analytics tracking
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView, trackEvent } from '@/lib/analytics';

/**
 * Track page views automatically
 */
export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname, {
      search: location.search,
      hash: location.hash,
    });
  }, [location]);
}

/**
 * Hook for tracking events
 */
export function useAnalytics() {
  return {
    trackEvent,
    trackPageView,
  };
}
