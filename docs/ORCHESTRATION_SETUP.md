# Multi-Agent Orchestration Setup

## Overview

InboxZen Phase 14 & 15 introduce a multi-agent orchestration system with transparent execution traces. This system coordinates specialized AI agents to collaboratively draft, schedule, and optimize email responses.

## Architecture

### Agent Types

1. **ToneAgent** - Rewrites drafts to match user's voice profile
2. **SummarizerAgent** - Condenses thread context into actionable bullets
3. **RelationshipAgent** - Suggests relationship-building improvements
4. **SchedulerAgent** - Proposes optimal send times
5. **SafetyAgent** - Validates content for sensitive information

### Execution Modes

#### Orchestration (`/orchestrate`)
- Runs multiple agents in parallel
- Ranks results by confidence scores
- Best for exploring options

#### Coordination (`/coordinate`)
- Executes agents in sequence: Summarizer → Relationship → Tone → Safety → Scheduler
- Includes safety gates
- Persists full execution trace
- Best for production drafts

## Edge Functions

### `orchestrate`
**Purpose:** Run multiple agents in parallel for a given task  
**Auth:** Required  
**Input:**
```json
{
  "task": {
    "type": "DRAFT" | "SCHEDULE" | "RELATIONSHIP" | "SUMMARIZE",
    "subject": "Email subject",
    "body": "Email body",
    "threadId": "optional-thread-id"
  }
}
```

**Output:**
```json
{
  "task": { "id": "...", "type": "DRAFT", ... },
  "results": [
    {
      "taskId": "...",
      "agent": "ToneAgent",
      "output": { "body": "..." },
      "score": 1.0,
      "warnings": []
    }
  ]
}
```

### `coordinate`
**Purpose:** Execute coordinated agent pipeline with transparency  
**Auth:** Required  
**Input:**
```json
{
  "subject": "Email subject",
  "body": "Email body",
  "threadId": "optional-thread-id",
  "contact": "optional-contact-email"
}
```

**Output:**
```json
{
  "ok": true,
  "plan": {
    "subject": "...",
    "body": "Coordinated draft",
    "sendAtISO": "2025-10-14T09:30:00Z",
    "warnings": [],
    "steps": [
      { "agent": "SummarizerAgent", "output": { "summary": "..." } },
      { "agent": "ToneAgent", "output": { "body": "..." } },
      { "agent": "SafetyAgent", "output": { "ok": true }, "warnings": [] }
    ]
  }
}
```

### `traces`
**Purpose:** Fetch recent agent execution traces  
**Auth:** Required  
**Output:**
```json
{
  "traces": [
    {
      "id": "uuid",
      "task_type": "DRAFT",
      "thread_id": "...",
      "input": { "subject": "...", "body": "..." },
      "steps": [...],
      "final": { "subject": "...", "body": "...", "warnings": [] },
      "created_at": "2025-10-13T..."
    }
  ]
}
```

## Database Schema

### `agent_traces` Table

```sql
CREATE TABLE public.agent_traces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  task_type TEXT NOT NULL,
  thread_id TEXT,
  input JSONB NOT NULL,
  steps JSONB NOT NULL,
  final JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Purpose:** Stores transparent audit trail of all agent executions

**RLS Policies:**
- Users can only view/insert/update/delete their own traces

## UI Components

### OrchestrationPanel
**Location:** Dashboard  
**Purpose:** Test multi-agent orchestration with sample tasks  
**Features:**
- One-click test execution
- JSON output display
- Real-time status

### WhyThisDraft
**Location:** Dashboard  
**Purpose:** Display transparent agent execution traces  
**Features:**
- List of recent traces
- Expandable agent step details
- Final draft preview
- Warning badges

## Usage Examples

### Test Orchestration
1. Navigate to Dashboard
2. Find "Multi-Agent Orchestration" panel
3. Click "Run Draft Plan"
4. Review agent results and scores

### View Transparency
1. Navigate to Dashboard
2. Find "Why This Draft?" panel
3. Browse recent traces
4. Expand "Show agent steps" to see detailed execution

### Integrate with Composer
Future enhancement: Add button on EmailCard to call `/coordinate` and bridge result into Composer

## Security Notes

- All agent functions require authentication
- RLS ensures users only access their own traces
- SafetyAgent validates all drafts for sensitive information
- Warnings are surfaced in UI and logged in traces

## Future Enhancements

- Learned evaluator (use `email_events` as training data)
- Additional agents: ComplianceAgent, CRMEnricher, AttachmentsAgent
- Reinforcement learning from user approvals/declines
- Integration with Composer for one-click coordination
- Team-level agent configurations

## Troubleshooting

### Agent Returns Empty Output
- Check LOVABLE_API_KEY is configured
- Verify user has voice profile created
- Check edge function logs for AI API errors

### Traces Not Appearing
- Verify RLS policies are active
- Check user authentication
- Ensure `coordinate` function completes successfully

### Low Confidence Scores
- Review agent prompt clarity
- Check input data quality (voice profile, memory context)
- Consider adding more context to agent prompts
