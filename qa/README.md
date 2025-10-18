# InboxAgent.ai QA Suite

## Overview
This directory contains test data and QA scripts for validating the InboxAgent real estate AI functionality.

## Test Data
- `../testdata/seed_realestate_inbox.json` - 12 sample real estate emails covering various scenarios

## Running Tests

### Option 1: Run QA Script (Node.js)
```bash
# Install dependencies if needed
npm install

# Run the test suite
npx tsx qa/run_realtor_sanity.ts
```

### Option 2: Manual Testing via MessageView UI
1. Navigate to `/messages` in your browser
2. The MessageView component loads sample data automatically
3. Verify the following manually:
   - Messages are sorted by priority score (highest first)
   - Category badges match email content
   - Deal Heat scores are calculated correctly
   - Calendar suggestions appear for date/time mentions
   - Feature detection flags are accurate

## What Gets Tested

### 1. Prioritization Scoring
- ✅ Urgent keywords increase score
- ✅ Newsletter/marketing emails deprioritized
- ✅ Active deals (offers, escrow) prioritized
- ✅ Reply threads get higher base scores

### 2. Feature Extraction
- ✅ Offer detection (hasOffer)
- ✅ Escrow keywords (hasEscrow)
- ✅ Inspection terms (hasInspection)
- ✅ Appraisal mentions (hasAppraisal)
- ✅ Property addresses (hasAddress)
- ✅ Date/time extraction (hasDateTime)

### 3. Category Classification
- ✅ ActiveDeals: offers, escrow, inspections, appraisals
- ✅ ClientLeads: inquiries, pre-approved buyers
- ✅ Showings: tour requests, open houses
- ✅ Vendors: lenders, photographers, contractors
- ✅ Marketing: newsletters, promotions

### 4. Attachment Handling
- ✅ PDF detection
- ✅ Image detection
- ✅ Attachment count
- ✅ File size tracking

### 5. Deal Threading
- ✅ Group emails by property address
- ✅ Multi-message thread detection
- ✅ Participant tracking

### 6. Daily Digest
- ✅ Count by category
- ✅ High priority item identification
- ✅ Summary generation

## Expected Results

### High Priority (Score 60-100)
- "URGENT: Inspection contingency expires today" (~75-85)
- "Offer Received – 1420 Maple Ave" (~60-70)
- "Counter offer expires tomorrow" (~65-75)

### Medium Priority (Score 30-60)
- "Schedule showing" (~40-50)
- "Inspection report ready" (~50-60)
- "Appraisal scheduled" (~45-55)

### Low Priority (Score 0-30)
- "Monthly Market Report" (~10-20)
- Generic inquiries (~20-30)

## Adding New Test Cases

1. Add new messages to `../testdata/seed_realestate_inbox.json`
2. Follow the existing JSON schema:
   ```json
   {
     "id": "msg-xxx",
     "subject": "...",
     "body": "...",
     "from": "...",
     "to": ["..."],
     "participants": ["..."],
     "date": "2025-10-13T00:00:00Z",
     "threadId": "thread-xxx",
     "attachments": []
   }
   ```
3. Update test assertions in `run_realtor_sanity.ts` if needed

## Troubleshooting

### Tests fail with import errors
- Ensure you're using `tsx` or `ts-node` to run TypeScript files
- Check that all imports resolve correctly

### Scores don't match expectations
- Review keyword lists in `overrides.ts`
- Adjust scoring weights in `priority_pipeline.ts`
- Check category keyword mappings in `categories.ts`

### Features not detected
- Verify regex patterns in `features.ts`
- Test patterns against actual email content
- Consider adding more flexible matching

## Future Enhancements
- [ ] Add integration tests with real Gmail/Outlook APIs
- [ ] Test draft response generation
- [ ] Validate calendar event creation
- [ ] Test deal digest email formatting
- [ ] Performance benchmarks for large inboxes (1000+ emails)
