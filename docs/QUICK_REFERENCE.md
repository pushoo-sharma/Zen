# InboxAgent.ai Quick Reference

## 📁 Project Structure

```
/inboxzen-core/
├── shared_ai/              # Shared AI utilities
│   ├── tone_model.ts       # User tone learning
│   ├── summarize_thread.ts # Thread summarization
│   ├── classify_intent.ts  # Intent classification
│   └── utils.ts            # Helper functions
│
├── gmail_outlook_api/      # Email provider integrations
│   ├── gmail_client.ts     # Gmail OAuth + fetch
│   ├── outlook_client.ts   # Outlook integration
│   ├── webhook_handler.ts  # Webhook processing
│   └── send_draft.ts       # Email sending
│
├── prioritization/         # Email prioritization engine
│   ├── priority_pipeline.ts # Score calculation (0-100)
│   ├── rules_engine.ts     # Rule-based adjustments
│   └── features.ts         # Feature extraction
│
└── agents/
    ├── real_estate/        # Real estate agent logic
    │   ├── categories.ts   # Inbox categories
    │   ├── overrides.ts    # Scoring overrides
    │   ├── features.ts     # Feature extraction
    │   ├── extract_address_datetime.ts
    │   ├── reply_templates.ts
    │   ├── deal_threading.ts
    │   └── digest_copy.ts
    │
    ├── sales/              # Future: Sales agent
    └── legal/              # Future: Legal agent

/src/
├── components/
│   ├── inboxzen/           # InboxZen UI components
│   │   ├── CategoryBadge.tsx
│   │   ├── DealHeat.tsx
│   │   └── CalendarSuggest.tsx
│   └── team/
│       └── TeamManager.tsx # Team management UI
│
├── lib/
│   ├── teams.ts            # Team management utilities
│   └── analytics.ts        # Analytics event tracking
│
├── hooks/
│   └── useAnalytics.ts     # Analytics React hook
│
└── pages/
    └── MessageView.tsx     # Demo message prioritization

/testdata/
└── seed_realestate_inbox.json  # 12 sample emails

/qa/
├── run_realtor_sanity.ts   # Test suite
└── README.md               # QA documentation

/infra/
└── schema.sql              # Reference database schema

/docs/
├── TEAM_ANALYTICS_SETUP.md # Team & analytics guide
└── QUICK_REFERENCE.md      # This file
```

## 🚀 Quick Start

### 1. Prioritize Emails

```typescript
import { scoreMessage, rank } from '@/inboxzen-core/prioritization/priority_pipeline';

const messages = [/* your email messages */];
const scored = rank(messages); // Returns sorted by priority
```

### 2. Extract Features

```typescript
import { extractFeatures } from '@/inboxzen-core/agents/real_estate/features';

const features = extractFeatures({
  subject: "Offer Received – 123 Main St",
  body: "The inspection is scheduled..."
});
// Returns: { hasOffer: true, hasAddress: true, hasInspection: true, ... }
```

### 3. Track Analytics

```typescript
import { trackEvent, Events } from '@/lib/analytics';

// Track any event
await trackEvent('button_clicked', { button_id: 'save' });

// Use predefined events
await trackEvent(Events.EMAIL_SENT, { to: 'client@example.com' });
```

### 4. Manage Teams

```typescript
import { createTeam, addTeamMember } from '@/lib/teams';

// Create team (creator becomes owner)
const team = await createTeam('My Real Estate Team');

// Add member (owner only)
await addTeamMember(team.id, userId, 'member');
```

## 📊 Real Estate Categories

| Category | Description | Example Keywords |
|----------|-------------|------------------|
| **ActiveDeals** | Escrow, offers, inspections | offer, escrow, inspection, closing |
| **ClientLeads** | New buyer/seller inquiries | interested, pre-approved, cash buyer |
| **Showings** | Tour scheduling | showing, appointment, open house |
| **Vendors** | Service providers | lender, inspector, photographer |
| **Marketing** | Newsletters, promos | newsletter, unsubscribe, marketing |

## 🎯 Priority Scoring

**Score Range: 0-100**

- **0-30**: Low priority (marketing, general inquiries)
- **31-60**: Medium priority (showings, routine updates)
- **61-100**: High priority (offers, urgent deadlines)

**Scoring Factors:**
- Base score (10 points)
- Reply/thread bonus (+10)
- Urgent keywords (+10)
- Category-specific boosts (varies)
- Real estate overrides (up to +20)

## 🔧 Common Tasks

### Run QA Tests
```bash
npx tsx qa/run_realtor_sanity.ts
```

### View Demo
Navigate to `/messages` in your browser

### Add Analytics to Component
```typescript
import { useAnalytics } from '@/hooks/useAnalytics';

function MyComponent() {
  const { trackEvent } = useAnalytics();
  
  const handleClick = () => {
    trackEvent('button_clicked', { button: 'save' });
  };
}
```

### Check Team Role
```typescript
import { checkTeamOwnership } from '@/lib/teams';

const isOwner = await checkTeamOwnership(teamId, userId);
if (isOwner) {
  // Show admin UI
}
```

## 📝 Key Files to Modify

| Task | Files to Edit |
|------|---------------|
| Add new category | `agents/real_estate/categories.ts` |
| Adjust scoring | `agents/real_estate/overrides.ts` |
| Add feature detection | `agents/real_estate/features.ts` |
| Track new event | `lib/analytics.ts` (add to Events) |
| Modify UI components | `components/inboxzen/*.tsx` |
| Add team features | `lib/teams.ts` |

## 🧪 Testing

### Unit Tests
```typescript
// Test prioritization
const result = scoreMessage({
  id: '1',
  subject: 'URGENT: Offer expiring',
  body: '...',
  from: 'agent@example.com'
});
console.log(result.total); // Should be high (60-80)
```

### Integration Tests
See `qa/run_realtor_sanity.ts` for full test suite

## 🔐 Security Notes

- **Team access**: Controlled via `checkTeamOwnership()`
- **RLS policies**: Database enforces row-level security
- **Analytics**: No PII tracked by default
- **Auth required**: All team operations require authentication

## 📚 Documentation Links

- [Team & Analytics Setup](./TEAM_ANALYTICS_SETUP.md)
- [QA Test Suite](../qa/README.md)
- [Real Estate Agent README](../src/inboxzen-core/agents/real_estate/README.md)
- [Sales Agent README](../src/inboxzen-core/agents/sales/README.md)
- [Legal Agent README](../src/inboxzen-core/agents/legal/README.md)

## 🎨 UI Components

### CategoryBadge
```tsx
<CategoryBadge category="ActiveDeals" />
```

### DealHeat
```tsx
<DealHeat score={75} />
```

### CalendarSuggest
```tsx
<CalendarSuggest
  suggestion={{
    title: "Showing at 123 Main St",
    address: "123 Main St",
    whenText: "Tomorrow at 2 PM"
  }}
  onAdd={() => console.log('Added')}
/>
```

### TeamManager
```tsx
<TeamManager />
```

## 🚨 Common Issues

### Prioritization not working
- Check that messages have required fields (id, subject, body, from)
- Verify keyword matches in `categories.ts` and `overrides.ts`

### Analytics not tracking
- Ensure `initAnalytics()` is called in App.tsx
- Check browser console for errors
- Verify user is authenticated

### Team operations failing
- Confirm user has correct role (owner for admin operations)
- Check RLS policies in Supabase
- Verify team_id and user_id are valid UUIDs

## 🔄 Migration Path

The reference schema in `infra/schema.sql` maps to existing Supabase tables:

| Reference | Existing Supabase Table |
|-----------|------------------------|
| `teams` | `user_team_links` (team_id) |
| `team_members.role` | `user_team_roles.role` |
| owner | admin |
| member | member |
| `analytics_events` | `email_events` |

## 📞 Support

- Check `/docs` for detailed guides
- Run QA tests for validation
- Review sample data in `/testdata`
- Inspect browser console for debug logs
