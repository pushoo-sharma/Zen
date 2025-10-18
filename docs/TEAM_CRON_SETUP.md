# Team Aggregation Cron Job Setup

This document explains how to set up the nightly team pattern aggregation job for InboxZen's Collaborative Intelligence Mode.

## Overview

The `team-aggregate` edge function runs nightly to:
- Aggregate email patterns across team members
- Calculate average response times
- Analyze event distributions
- Track hour-of-day activity patterns

## Setup Instructions

### Option 1: Supabase pg_cron (Recommended)

1. **Enable Required Extensions**

First, enable `pg_cron` and `pg_net` extensions in your Supabase project:

```sql
-- Enable pg_cron for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;
```

2. **Create the Cron Job**

Schedule the function to run every night at 2 AM UTC:

```sql
SELECT cron.schedule(
  'team-aggregate-nightly',
  '0 2 * * *', -- 2 AM UTC every day
  $$
  SELECT
    net.http_post(
      url := 'https://kwuxuzgjsrfazudnqeya.supabase.co/functions/v1/team-aggregate',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3dXh1emdqc3JmYXp1ZG5xZXlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMjQ4NjgsImV4cCI6MjA3NTkwMDg2OH0.1Q50W_ZeX6rYiCnKp_Y5auz0E9oSZUuIf4slYoEKXTk"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
```

3. **Verify the Job**

Check that the job was created successfully:

```sql
SELECT * FROM cron.job WHERE jobname = 'team-aggregate-nightly';
```

### Option 2: External Cron Service

If you prefer using an external service like GitHub Actions, cron-job.org, or AWS EventBridge:

1. Create a scheduled job that makes a POST request to:
   ```
   https://kwuxuzgjsrfazudnqeya.supabase.co/functions/v1/team-aggregate
   ```

2. Include the authorization header:
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3dXh1emdqc3JmYXp1ZG5xZXlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMjQ4NjgsImV4cCI6MjA3NTkwMDg2OH0.1Q50W_ZeX6rYiCnKp_Y5auz0E9oSZUuIf4slYoEKXTk
   ```

3. Schedule it to run daily at 2 AM UTC

## Monitoring

### Check Cron Job Status

```sql
SELECT * FROM cron.job_run_details 
WHERE jobname = 'team-aggregate-nightly' 
ORDER BY start_time DESC 
LIMIT 10;
```

### View Edge Function Logs

In Lovable Cloud dashboard:
1. Go to Backend → Edge Functions
2. Select `team-aggregate`
3. View execution logs

### Manual Trigger

You can manually trigger the aggregation:

```bash
curl -X POST https://kwuxuzgjsrfazudnqeya.supabase.co/functions/v1/team-aggregate \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"
```

## Troubleshooting

### Cron Job Not Running

1. Check if extensions are enabled:
```sql
SELECT * FROM pg_extension WHERE extname IN ('pg_cron', 'pg_net');
```

2. Verify the job exists:
```sql
SELECT * FROM cron.job;
```

3. Check for errors in job run details:
```sql
SELECT * FROM cron.job_run_details 
WHERE status = 'failed' 
ORDER BY start_time DESC;
```

### No Team Data

The function will only aggregate data if:
- Users have joined teams (via `user_team_links` table)
- Team members have email events in the `email_events` table

### Permission Issues

Make sure the edge function has the correct permissions set in `supabase/config.toml`:

```toml
[functions.team-aggregate]
verify_jwt = false  # This allows scheduled/cron execution
```

## Adjusting Schedule

To change the schedule, update the cron expression in the SQL. Common patterns:

- Every hour: `'0 * * * *'`
- Every 6 hours: `'0 */6 * * *'`
- Daily at 2 AM: `'0 2 * * *'`
- Weekly on Sunday at 2 AM: `'0 2 * * 0'`

Update the schedule:

```sql
SELECT cron.unschedule('team-aggregate-nightly');

SELECT cron.schedule(
  'team-aggregate-nightly',
  '0 3 * * *', -- New time: 3 AM UTC
  $$ ... $$
);
```

## Privacy & Security

- All aggregation is anonymized - no individual email content is stored
- Users can opt out by leaving their team
- Team patterns only include statistical aggregates
- Individual user data remains private and isolated

## Next Steps

After setting up the cron job:
1. Join a team in Settings → Team Collaboration
2. Wait for the first nightly run (or trigger manually)
3. View insights at `/insights` page
4. Share the team ID with colleagues to build collaborative intelligence
