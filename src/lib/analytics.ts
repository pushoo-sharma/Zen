/**
 * Analytics Event Tracking
 * Lightweight event bus for product analytics
 * Can be wired to PostHog, Segment, or other tools later
 */

import { supabase } from '@/integrations/supabase/client';

export interface AnalyticsEvent {
  id?: string;
  user_id?: string;
  team_id?: string;
  event_name: string;
  properties?: Record<string, any>;
  created_at?: string;
}

type EventBusListener = (event: AnalyticsEvent) => void;

class EventBus {
  private listeners: Map<string, EventBusListener[]> = new Map();
  private globalListeners: EventBusListener[] = [];

  /**
   * Listen to specific event types
   */
  on(eventName: string, listener: EventBusListener) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName)!.push(listener);
  }

  /**
   * Listen to all events
   */
  onAny(listener: EventBusListener) {
    this.globalListeners.push(listener);
  }

  /**
   * Emit an event to listeners
   */
  emit(event: AnalyticsEvent) {
    // Call specific listeners
    const listeners = this.listeners.get(event.event_name) || [];
    listeners.forEach(listener => listener(event));

    // Call global listeners
    this.globalListeners.forEach(listener => listener(event));
  }

  /**
   * Remove a listener
   */
  off(eventName: string, listener: EventBusListener) {
    const listeners = this.listeners.get(eventName) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }
}

// Global event bus instance
export const eventBus = new EventBus();

/**
 * Track an analytics event
 */
export async function trackEvent(
  eventName: string,
  properties?: Record<string, any>
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    const event: AnalyticsEvent = {
      event_name: eventName,
      user_id: user?.id,
      properties: properties || {},
      created_at: new Date().toISOString(),
    };

    // Emit to event bus (for real-time listeners)
    eventBus.emit(event);

    // Store in database (can be replaced with external service)
    if (user) {
      await supabase
        .from('email_events')
        .insert({
          user_id: user.id,
          event_type: eventName,
          metadata: properties,
        });
    }

    // Console log in development
    if (import.meta.env.DEV) {
      console.log('📊 Analytics Event:', eventName, properties);
    }
  } catch (error) {
    // Don't throw - analytics failures shouldn't break the app
    console.error('Analytics tracking error:', error);
  }
}

/**
 * Track page view
 */
export function trackPageView(page: string, properties?: Record<string, any>) {
  return trackEvent('page_viewed', { page, ...properties });
}

/**
 * Track user action
 */
export function trackAction(
  action: string,
  category: string,
  properties?: Record<string, any>
) {
  return trackEvent('user_action', { action, category, ...properties });
}

/**
 * Track email event
 */
export function trackEmailEvent(
  eventType: 'sent' | 'received' | 'read' | 'replied' | 'archived',
  properties?: Record<string, any>
) {
  return trackEvent(`email_${eventType}`, properties);
}

/**
 * Track AI event
 */
export function trackAIEvent(
  eventType: 'draft_generated' | 'suggestion_shown' | 'suggestion_accepted',
  properties?: Record<string, any>
) {
  return trackEvent(`ai_${eventType}`, properties);
}

/**
 * Initialize analytics integrations
 * Call this once at app startup
 */
export function initAnalytics() {
  // Log all events in development
  if (import.meta.env.DEV) {
    eventBus.onAny((event) => {
      console.log('📊 Event:', event);
    });
  }

  // TODO: Wire up PostHog
  // if (import.meta.env.VITE_POSTHOG_KEY) {
  //   eventBus.onAny((event) => {
  //     posthog.capture(event.event_name, event.properties);
  //   });
  // }

  // TODO: Wire up Segment
  // if (import.meta.env.VITE_SEGMENT_KEY) {
  //   eventBus.onAny((event) => {
  //     analytics.track(event.event_name, event.properties);
  //   });
  // }
}

/**
 * Common event names (for consistency)
 */
export const Events = {
  // User events
  USER_SIGNED_UP: 'user_signed_up',
  USER_LOGGED_IN: 'user_logged_in',
  USER_LOGGED_OUT: 'user_logged_out',
  
  // Email events
  EMAIL_SENT: 'email_sent',
  EMAIL_RECEIVED: 'email_received',
  EMAIL_READ: 'email_read',
  EMAIL_REPLIED: 'email_replied',
  EMAIL_ARCHIVED: 'email_archived',
  EMAIL_PRIORITIZED: 'email_prioritized',
  
  // AI events
  DRAFT_GENERATED: 'draft_generated',
  DRAFT_ACCEPTED: 'draft_accepted',
  DRAFT_EDITED: 'draft_edited',
  SUGGESTION_SHOWN: 'suggestion_shown',
  SUGGESTION_ACCEPTED: 'suggestion_accepted',
  
  // Team events
  TEAM_CREATED: 'team_created',
  TEAM_MEMBER_ADDED: 'team_member_added',
  TEAM_MEMBER_REMOVED: 'team_member_removed',
  TEAM_LEFT: 'team_left',
  
  // Settings events
  SETTINGS_UPDATED: 'settings_updated',
  OAUTH_CONNECTED: 'oauth_connected',
  OAUTH_DISCONNECTED: 'oauth_disconnected',
} as const;
