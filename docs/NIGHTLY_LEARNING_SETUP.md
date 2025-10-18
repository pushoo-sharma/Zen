# Nightly Learning Job Setup

InboxZen includes an automated learning system that improves recommendations over time by analyzing user behavior patterns. This document explains how to set up the nightly learning job.

## Overview

The learning system:
- Analyzes email interaction patterns (opens, replies, snoozes, ignores)
- Calculates hour-of-day engagement preferences
- Updates recommendation weights based on user behavior
- Runs automatically every night to keep recommendations fresh

## Setting Up the Cron Job

### Option 1: Supabase pg_cron (Recommended)

1. **Enable pg_cron extension**:
   ```sql
   -- Run this in your Supabase SQL editor
   CREATE EXTENSION IF NOT EXISTS pg_cron;
   CREATE EXTENSION IF NOT EXISTS pg_net;
   ```

2. **Schedule the nightly job**:
   ```sql
   -- Schedule to run every night at 2:00 AM UTC
   SELECT cron.schedule(
     'learn-preferences-nightly',
     '0 2 * * *',  -- 2:00 AM UTC daily
     $$
     SELECT net.http_post(
       url := 'https://kwuxuzgjsrfazudnqeya.supabase.co/functions/v1/learn-preferences',
       headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
     ) as request_id;
     $$
   );
   ```

3. **Important**: Replace `YOUR_SERVICE_ROLE_KEY` with your actual Supabase service role key
   - Find it in your Supabase dashboard under Settings → API
   - **Never commit this key to version control**

### Option 2: External Cron Service

You can also use external services like:
- GitHub Actions
- Vercel Cron Jobs
- AWS EventBridge
- Google Cloud Scheduler

Example GitHub Action workflow:

```yaml
name: Nightly Learning Job
on:
  schedule:
    - cron: '0 2 * * *'  # 2:00 AM UTC daily

jobs:
  learn:
    runs-on: ubuntu-latest
    steps:
      - name: Call learning function
        run: |
          curl -X POST \
            https://kwuxuzgjsrfazudnqeya.supabase.co/functions/v1/learn-preferences \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
            -H "Content-Type: application/json"
```

## What the Learning Job Does

1. **Fetches Recent Activity**
   - Retrieves email events from the last 30 days
   - Groups events by user

2. **Calculates Hour-of-Day Bias**
   - Analyzes when users are most engaged with emails
   - Tracks engagement ratio for each hour (0-23)
   - Creates personalized hour preferences

3. **Updates Preferences**
   - Stores learned patterns in `recommendation_preferences` table
   - Updates are used immediately by the recommendation system

4. **Example Output**
   ```json
   {
     "ok": true,
     "usersProcessed": 42,
     "totalUsers": 42
   }
   ```

## Monitoring

### Check Job Status

```sql
-- View scheduled cron jobs
SELECT * FROM cron.job;

-- View job run history
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;
```

### Manual Trigger

You can manually trigger the learning job for testing:

```bash
curl -X POST \
  https://kwuxuzgjsrfazudnqeya.supabase.co/functions/v1/learn-preferences \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: "application/json"
```

## User Privacy

The learning system respects user privacy:
- All data is per-user and isolated
- Users can reset their learning data anytime via Settings
- No cross-user data sharing or analysis
- All patterns are stored securely in the database

## Troubleshooting

### Job Not Running

1. Verify pg_cron is enabled:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
   ```

2. Check job schedule:
   ```sql
   SELECT * FROM cron.job WHERE jobname = 'learn-preferences-nightly';
   ```

3. View error logs:
   ```sql
   SELECT * FROM cron.job_run_details 
   WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'learn-preferences-nightly')
   ORDER BY start_time DESC;
   ```

### Function Errors

Check edge function logs in Supabase dashboard:
- Go to Edge Functions → learn-preferences → Logs
- Look for error messages or failed invocations

## Customization

You can adjust the learning schedule by modifying the cron expression:

- `'0 2 * * *'` - Daily at 2:00 AM
- `'0 */6 * * *'` - Every 6 hours
- `'0 0 * * 0'` - Weekly on Sunday at midnight

## Future Enhancements

Potential improvements to the learning system:
- Weight decay for old patterns
- Seasonal pattern detection
- Subject line keyword learning
- Sender priority learning
- Meeting time preferences
