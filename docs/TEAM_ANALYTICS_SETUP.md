# Team Access & Analytics Implementation

## Overview
InboxAgent.ai now supports multi-user teams with role-based access control (owner/member) and comprehensive analytics event tracking.

## Team Management

### Data Model
The team system uses the existing Supabase tables:
- `user_team_links` - Maps users to teams
- `user_team_roles` - Stores user roles (admin = owner, member = member)
- `team_patterns` - Team-level analytics and patterns

### Role Mapping
- `admin` role → **owner** (can manage team, add/remove members)
- `member` role → **member** (can access team data, but no admin privileges)

### Usage

```typescript
import {
  createTeam,
  getUserTeams,
  addTeamMember,
  removeTeamMember,
  checkTeamOwnership,
  getTeamMembers,
  leaveTeam
} from '@/lib/teams';

// Create a new team
const team = await createTeam('My Real Estate Team');

// Get user's teams
const teams = await getUserTeams();

// Add a member (owner only)
await addTeamMember(teamId, userId, 'member');

// Check if user is owner
const isOwner = await checkTeamOwnership(teamId, userId);

// Get all team members
const members = await getTeamMembers(teamId);

// Leave a team
await leaveTeam(teamId);
```

## Analytics Tracking

### Architecture
The analytics system uses a lightweight event bus pattern that can be easily wired to external services like PostHog or Segment.

### Event Flow
1. `trackEvent()` called anywhere in the app
2. Event emitted to in-memory event bus
3. Event stored in `email_events` table
4. External listeners (PostHog/Segment) can receive events via the bus

### Usage

#### Basic Event Tracking
```typescript
import { trackEvent, Events } from '@/lib/analytics';

// Track custom event
await trackEvent('button_clicked', { button_id: 'save', page: '/settings' });

// Use predefined event names
await trackEvent(Events.EMAIL_SENT, { to: 'client@example.com' });
```

#### Specialized Tracking Functions
```typescript
import {
  trackPageView,
  trackAction,
  trackEmailEvent,
  trackAIEvent
} from '@/lib/analytics';

// Track page view
trackPageView('/dashboard', { referrer: '/' });

// Track user action
trackAction('clicked_draft', 'email', { email_id: '123' });

// Track email event
trackEmailEvent('sent', { subject: 'Meeting follow-up' });

// Track AI event
trackAIEvent('draft_generated', { tone: 'professional' });
```

#### React Hook
```typescript
import { useAnalytics } from '@/hooks/useAnalytics';

function MyComponent() {
  const { trackEvent } = useAnalytics();
  
  const handleClick = () => {
    trackEvent('component_interaction', { action: 'click' });
  };
  
  return <button onClick={handleClick}>Click me</button>;
}
```

### Event Bus Listeners

Listen to all events in real-time:

```typescript
import { eventBus } from '@/lib/analytics';

// Listen to specific events
eventBus.on('email_sent', (event) => {
  console.log('Email sent:', event);
});

// Listen to all events
eventBus.onAny((event) => {
  console.log('Any event:', event);
});
```

### Predefined Event Names

Use these constants for consistency:

```typescript
import { Events } from '@/lib/analytics';

// User events
Events.USER_SIGNED_UP
Events.USER_LOGGED_IN
Events.USER_LOGGED_OUT

// Email events
Events.EMAIL_SENT
Events.EMAIL_RECEIVED
Events.EMAIL_READ
Events.EMAIL_REPLIED
Events.EMAIL_ARCHIVED
Events.EMAIL_PRIORITIZED

// AI events
Events.DRAFT_GENERATED
Events.DRAFT_ACCEPTED
Events.DRAFT_EDITED
Events.SUGGESTION_SHOWN
Events.SUGGESTION_ACCEPTED

// Team events
Events.TEAM_CREATED
Events.TEAM_MEMBER_ADDED
Events.TEAM_MEMBER_REMOVED
Events.TEAM_LEFT

// Settings events
Events.SETTINGS_UPDATED
Events.OAUTH_CONNECTED
Events.OAUTH_DISCONNECTED
```

## Wiring External Services

### PostHog Integration

1. Install PostHog:
```bash
npm install posthog-js
```

2. Add to analytics initialization:
```typescript
// src/lib/analytics.ts
import posthog from 'posthog-js';

export function initAnalytics() {
  if (import.meta.env.VITE_POSTHOG_KEY) {
    posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
      api_host: 'https://app.posthog.com'
    });
    
    eventBus.onAny((event) => {
      posthog.capture(event.event_name, event.properties);
    });
  }
}
```

### Segment Integration

1. Install Segment:
```bash
npm install @segment/analytics-next
```

2. Add to analytics initialization:
```typescript
// src/lib/analytics.ts
import { AnalyticsBrowser } from '@segment/analytics-next';

export function initAnalytics() {
  if (import.meta.env.VITE_SEGMENT_KEY) {
    const analytics = AnalyticsBrowser.load({
      writeKey: import.meta.env.VITE_SEGMENT_KEY
    });
    
    eventBus.onAny((event) => {
      analytics.track(event.event_name, event.properties);
    });
  }
}
```

## Key Instrumentation Points

### Recommended Events to Track

1. **User Authentication**
   - Sign up, login, logout
   - OAuth connections

2. **Email Interactions**
   - Email sent, received, read
   - Draft generated, accepted, edited
   - Email prioritized, archived

3. **AI Features**
   - Draft suggestions shown/accepted
   - Calendar suggestions created
   - Smart replies used

4. **Team Collaboration**
   - Team created
   - Members added/removed
   - Team settings changed

5. **Performance Metrics**
   - Page load times
   - API response times
   - Error rates

## Database Schema Reference

See `infra/schema.sql` for the complete reference schema. Note that this project uses existing Supabase tables, but the schema file documents the logical model.

## Security Notes

1. **Team Access Control**: All team operations check user roles via `checkTeamOwnership()`
2. **RLS Policies**: Database enforces row-level security on team data
3. **Analytics Privacy**: Never track PII without user consent
4. **Event Bus**: Events are ephemeral in memory; only stored events persist

## Future Enhancements

- [ ] Team-level analytics dashboards
- [ ] Export analytics data
- [ ] Real-time team activity feed
- [ ] Advanced role permissions (custom roles)
- [ ] Team billing and quotas
