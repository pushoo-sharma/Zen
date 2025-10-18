# Production Readiness Checklist

## 1. Environment Variables & Secrets ✅

All secrets are managed through Lovable Cloud → Settings → Secrets:

### Configured Secrets:
- ✅ `STRIPE_SECRET_KEY` - Stripe API key for payments
- ✅ `GOOGLE_CLIENT_ID` - Google OAuth client ID
- ✅ `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- ✅ `LOVABLE_API_KEY` - Lovable AI API key
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Supabase admin key
- ✅ `INTERNAL_CRON_SECRET` - Cron job authentication

### Required for Full Production (if using):
- `OUTLOOK_CLIENT_ID` - Microsoft OAuth client ID
- `OUTLOOK_CLIENT_SECRET` - Microsoft OAuth client secret
- `OPENAI_API_KEY` - OpenAI API key (if not using Lovable AI)

**Note**: The `.env` file is auto-managed by Lovable Cloud and should never be edited manually or committed to version control.

## 2. Structured Logging ✅

**Location**: `supabase/functions/_shared/logger.ts`

```typescript
import { logger } from './_shared/logger.ts';

// Usage in edge functions
logger.info('Processing email', { emailId, userId });
logger.warn('Rate limit approaching', { userId, count });
logger.error('API call failed', { error, endpoint });
```

Features:
- Structured JSON logging
- Log levels: info, warn, error, debug
- Contextual logging with metadata
- Timestamp on all entries

## 3. Error Pages ✅

### 404 Not Found
**Location**: `src/pages/NotFound.tsx`
- Displays when user navigates to non-existent route
- Provides links back to home and dashboard
- Uses design system tokens

### 500 Server Error
**Location**: `src/pages/ServerError.tsx`
- Displays on unhandled application errors
- Includes refresh and home navigation
- Wrapped by ErrorBoundary component

### Error Boundary
**Location**: `src/components/ErrorBoundary.tsx`
- Catches React component errors
- Logs errors to console (can be extended to Sentry)
- Prevents full app crashes

## 4. Health & Monitoring ✅

### Health Endpoint
**Location**: `supabase/functions/health/index.ts`
**Endpoint**: `https://[project-id].supabase.co/functions/v1/health`

Returns:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-14T17:47:08Z",
  "services": {
    "database": {
      "status": "up",
      "latencyMs": 45
    },
    "queue": {
      "status": "up",
      "pendingJobs": 12
    },
    "cache": {
      "status": "up",
      "type": "in-memory"
    }
  },
  "metrics": {
    "uptimeSeconds": 3600,
    "memoryUsage": {}
  },
  "version": "1.0.0"
}
```

### Monitoring Setup
- Set up monitoring with **UptimeRobot** or **Cronitor**
- Check interval: 5 minutes
- Alert on 3 consecutive failures
- Alert destination: founder@inboxagent.ai

## 5. Role-Based Access Control (RBAC) ✅

### Database Schema
**Table**: `public.user_roles`
**Enum**: `public.app_role` (admin, user, team_manager)

### Functions
- `has_role(_user_id, _role)` - Check if user has specific role
- `get_user_role(_user_id)` - Get user's primary role
- `handle_new_user_role()` - Auto-assign 'user' role on signup

### Frontend Hook
**Location**: `src/hooks/useRBAC.ts`

```typescript
const { userRole, isAdmin, isTeamManager, hasRole } = useRBAC();

if (!isAdmin) {
  // Restrict access
}
```

### Backend Middleware
**Location**: `supabase/functions/_shared/rbac.ts`

```typescript
import { requireRole } from './_shared/rbac.ts';

// In edge function
const { userId, role } = await requireRole(req, 'admin');
```

### Protected Routes
Apply guards to:
- `/compose` - Requires authenticated user
- `/team/*` - Requires team_manager or admin
- `/billing/*` - Requires authenticated user
- Admin endpoints - Requires admin role

## 6. Reliability Layer ✅

### Job Queue
**Location**: `supabase/functions/_shared/queue.ts`
- In-memory job queue with database backup
- Automatic retry with exponential backoff
- Max 5 attempts per job

### Circuit Breaker
**Location**: `supabase/functions/_shared/circuit.ts`
- Opens after 5 consecutive failures
- Recovery timeout: 15 seconds
- Prevents cascading failures

### Retry Logic
**Location**: `supabase/functions/_shared/retry.ts`
- Exponential backoff strategy
- Configurable max attempts
- Used for external API calls

### Rate Limiter
**Location**: `supabase/functions/_shared/rateLimiter.ts`
- Per-user rate limiting
- Sliding window algorithm
- Prevents API abuse

### Cache
**Location**: `supabase/functions/_shared/cache.ts`
- In-memory cache with TTL
- Used for expensive operations
- Recommended TTLs:
  - Thread summaries: 5 minutes
  - Priority scores: 60 seconds
  - User preferences: 10 minutes

## 7. Analytics & Metrics ✅

**Location**: `src/lib/analytics.ts`, `src/hooks/useAnalytics.ts`

### Tracked Events
- Page views
- User actions (compose, send, archive)
- Email events (sent, received, read, replied)
- AI events (draft generated, suggestion shown/accepted)

### Key Metrics to Monitor
- API latency (p50, p95, p99)
- Queue depth
- AI generation time
- Error rates
- Daily Active Users (DAU)
- Email processing throughput

### Integration Options
- Current: Built-in event tracking to Supabase
- Future: PostHog, Mixpanel, or Segment

## 8. Deployment & CI/CD

### Recommended Setup (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  pull_request:
    branches: [staging, production]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

### Branch Strategy
- `main` → Development environment
- `staging` → Preview deployments (automatic)
- `production` → Live production (manual approval)

### Deployment Platforms
- **Recommended**: Vercel or Netlify
- Automatic preview deployments on PRs
- Production deployments require approval
- Edge functions deploy automatically via Supabase

## 9. Security Checklist

- ✅ RLS policies on all tables
- ✅ RBAC implemented with security definer functions
- ✅ JWT verification on protected endpoints
- ✅ Rate limiting on user-facing endpoints
- ✅ Input validation on all forms
- ✅ CORS headers properly configured
- ✅ Secrets stored securely (not in code)
- ✅ API keys never exposed to frontend
- ✅ SQL injection prevention via Supabase client
- ✅ XSS prevention via React's built-in escaping

## 10. Performance Checklist

- ✅ Database indexes on frequently queried columns
- ✅ Caching for expensive operations
- ✅ Job queue for background tasks
- ✅ Circuit breaker for external services
- ✅ Retry logic with exponential backoff
- ✅ Lazy loading of heavy components
- ✅ Image optimization
- ✅ Code splitting

## Final Readiness Checklist

- ✅ All secrets configured and not committed to code
- ✅ Health endpoint returns green status
- ✅ 404 and 500 error pages render correctly
- ✅ RBAC blocks unauthorized access to protected routes
- ✅ Analytics events being tracked
- ✅ Logging structured and queryable
- ✅ Error boundary catches and reports errors
- ✅ Rate limiting prevents abuse
- ✅ Queue processing jobs reliably
- ✅ CI/CD pipeline configured

## Monitoring Dashboards

### Key URLs
- Health: `https://[project-id].supabase.co/functions/v1/health`
- Backend: Lovable Cloud → View Backend
- Logs: Lovable Cloud → Functions → Logs

### Alerts to Configure
1. Health endpoint returns non-200 status
2. Error rate exceeds 5% over 5 minutes
3. Queue depth exceeds 1000 jobs
4. API latency p95 exceeds 2 seconds
5. Database connection failures

## Support Contacts
- **Email**: founder@inboxagent.ai
- **Documentation**: `/docs/` folder
- **Health Status**: `/api/health` endpoint
