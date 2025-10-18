# Cron Job Setup for InboxZen

This document explains how to set up scheduled jobs for InboxZen's automated background tasks.

## Overview

InboxZen uses several edge functions that need to run on a schedule:
- `auto-agent` - Processes pending autonomous actions (every 5-10 minutes)
- `learn-preferences` - Analyzes user behavior patterns (daily at 2am)
- `team-aggregate` - Aggregates team analytics (hourly)

## Security

All cron functions are protected with an internal secret to prevent unauthorized access. The functions require:
- Header: `x-internal-secret: [YOUR_INTERNAL_CRON_SECRET]`

## Setup Method: Supabase pg_cron (Recommended)

Run the following SQL in your Supabase SQL Editor:

### 1. Enable Required Extensions

```sql
-- Enable extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
```

### 2. Schedule Auto-Agent (Every 10 minutes)

```sql
SELECT cron.schedule(
  'auto-agent-processor',
  '*/10 * * * *', -- Every 10 minutes
  $$
  SELECT
    net.http_post(
      url:='https://kwuxuzgjsrfazudnqeya.supabase.co/functions/v1/auto-agent',
      headers:='{"Content-Type": "application/json", "x-internal-secret": "YOUR_INTERNAL_CRON_SECRET"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);
```

### 3. Schedule Learn-Preferences (Daily at 2am)

```sql
SELECT cron.schedule(
  'learn-preferences-daily',
  '0 2 * * *', -- Daily at 2am
  $$
  SELECT
    net.http_post(
      url:='https://kwuxuzgjsrfazudnqeya.supabase.co/functions/v1/learn-preferences',
      headers:='{"Content-Type": "application/json", "x-internal-secret": "YOUR_INTERNAL_CRON_SECRET"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);
```

### 4. Schedule Team-Aggregate (Hourly)

```sql
SELECT cron.schedule(
  'team-aggregate-hourly',
  '0 * * * *', -- Every hour
  $$
  SELECT
    net.http_post(
      url:='https://kwuxuzgjsrfazudnqeya.supabase.co/functions/v1/team-aggregate',
      headers:='{"Content-Type": "application/json", "x-internal-secret": "YOUR_INTERNAL_CRON_SECRET"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);
```

**Important:** Replace `YOUR_INTERNAL_CRON_SECRET` with the actual secret value from your Supabase secrets.

## Monitoring

Check execution logs:

```sql
-- View recent cron job runs
SELECT * FROM cron.job_run_details 
WHERE jobid IN (
  SELECT jobid FROM cron.job 
  WHERE jobname IN ('auto-agent-processor', 'learn-preferences-daily', 'team-aggregate-hourly')
)
ORDER BY start_time DESC 
LIMIT 20;
```

## Adjusting Schedule

To change a schedule:

```sql
-- First unschedule
SELECT cron.unschedule('job-name-here');

-- Then reschedule with new interval
SELECT cron.schedule(...);
```

## Alternative: External Cron Services

If you prefer external services:

### GitHub Actions

Create `.github/workflows/cron.yml`:

```yaml
name: Cron Jobs
on:
  schedule:
    - cron: '*/10 * * * *'  # Auto-agent every 10 minutes
    - cron: '0 2 * * *'     # Learn-preferences daily at 2am

jobs:
  trigger-functions:
    runs-on: ubuntu-latest
    steps:
      - name: Call auto-agent
        run: |
          curl -X POST \
            https://kwuxuzgjsrfazudnqeya.supabase.co/functions/v1/auto-agent \
            -H "Content-Type: application/json" \
            -H "x-internal-secret: ${{ secrets.INTERNAL_CRON_SECRET }}" \
            -d '{}'
```

### Cron-job.org

1. Go to https://cron-job.org
2. Create a new cron job
3. Set URL: `https://kwuxuzgjsrfazudnqeya.supabase.co/functions/v1/auto-agent`
4. Add custom header: `x-internal-secret: YOUR_SECRET`
5. Set schedule interval

## Troubleshooting

### Jobs Not Running

Check function logs in Supabase dashboard or via CLI:
```bash
supabase functions logs auto-agent
```

### Authentication Errors

Verify the `x-internal-secret` header matches the value in your Supabase secrets.

### High Error Rate

Check rate limiting settings if functions are failing due to too many requests.
