# Auto-Agent Scheduled Execution Setup

The `auto-agent` edge function processes pending autonomous actions. It should run periodically (e.g., every 5-10 minutes) to execute high-confidence actions.

## Option 1: Supabase pg_cron (Recommended)

Run in your Supabase SQL Editor:

```sql
-- Enable extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule auto-agent to run every 10 minutes
SELECT cron.schedule(
  'auto-agent-processor',
  '*/10 * * * *', -- Every 10 minutes
  $$
  SELECT
    net.http_post(
      url:='https://kwuxuzgjsrfazudnqeya.supabase.co/functions/v1/auto-agent',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
      body:='{}'::jsonb
    ) as request_id;
  $$
);
```

Replace `YOUR_ANON_KEY` with your Supabase anon key.

## Option 2: External Cron Service

Use services like:
- **GitHub Actions**: Schedule a workflow to POST to the function
- **Cron-job.org**: Free web-based cron service
- **EasyCron**: Another reliable option

Example curl command:
```bash
curl -X POST \
  https://kwuxuzgjsrfazudnqeya.supabase.co/functions/v1/auto-agent \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Monitoring

Check execution logs:
```sql
SELECT * FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'auto-agent-processor')
ORDER BY start_time DESC 
LIMIT 10;
```

## Adjusting Frequency

To change the schedule, first unschedule:
```sql
SELECT cron.unschedule('auto-agent-processor');
```

Then reschedule with your desired interval.

## Security Notes

- The function uses `SUPABASE_SERVICE_ROLE_KEY` for elevated permissions
- Only actions with confidence ≥ 0.8 are auto-executed
- Users can always review and decline actions before execution