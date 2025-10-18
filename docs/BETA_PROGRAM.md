# InboxAgent.ai Closed Beta Program

## Overview
2-week closed beta with 20-50 high-engagement users to validate real-world value and refine before public launch.

## Target Users
- **Primary**: Busy professionals overwhelmed by email
  - Real estate agents
  - Sales representatives
  - Startup founders
  - Executive assistants
- **Criteria**: Handling 100+ emails/day for maximum impact

## Recruitment Strategy

### Channels
- **Reddit**: r/Productivity, r/RealEstateAgents
- **LinkedIn**: Direct messages to target professionals
- **Email**: Invitations to warm contacts

### Invite Message Template
```
We're selecting 20 early testers to help shape InboxAgent.ai — an AI inbox that cuts your daily email time in half.

As a beta pioneer, you'll get:
- 60-day free Pro plan ($49 value)
- Exclusive "Beta Pioneer" badge
- Direct line to our founders
- Shape the product roadmap

Interested? Apply at inboxagent.ai/beta
```

### Landing Page
**URL**: `/beta`

**Collects**:
- Name
- Email
- Profession
- Daily email volume
- Primary platform (Gmail/Outlook)

## Feedback System

### In-App Feedback
Located in dashboard header:
- **Report Bug** button (captures session context automatically)
- **Suggest Improvement** button (captures route and viewport info)

**Session Context Captured**:
- User agent
- Viewport dimensions
- Current route
- Timestamp
- URL

### Weekly Survey
**Format**: Google Form (5 questions)
1. What do you like most?
2. What confuses you?
3. Where does it excel?
4. Where does it fail?
5. Would you pay for this? How much?

**Frequency**: Every Friday during beta

## Success Metrics

### Tracked Automatically
- **Engagement**: Daily Active Users (DAU)
- **Retention**: Users active 3+ days/week
- **AI Usage**: AI actions per day per user
- **Time Saved**: Estimated minutes saved
- **Email Processing**: Emails processed daily

### Targets
- ✅ 70% retention rate by Week 2
- ✅ 20+ AI actions per day per user
- ✅ 50%+ users would pay after trial

## 2-Week Iteration Plan

### Week 1: Observe & Gather
**Days 1-2**: Onboarding & First Impressions
- Monitor onboarding completion rates
- Track initial bug reports
- Identify common confusion points

**Days 3-5**: Usage Patterns
- Analyze which features get used
- Track email processing volume
- Identify power users vs strugglers

**Days 6-7**: Mid-week Check-in
- Send first weekly survey
- Review feedback themes
- Prioritize top 3 issues

### Week 2: Fix & Refine
**Days 8-10**: Ship Fixes
- Deploy critical bug fixes
- Refine prioritization logic
- Improve Gmail threading

**Days 11-12**: UX Polish
- Implement quick-win improvements
- Enhance onboarding flow
- Optimize AI response times

**Days 13-14**: Final Survey & Wrap-up
- Send final feedback survey
- Analyze overall metrics
- Prepare transition plan

## Beta User Benefits

### Immediate
- ✅ 60-day free Pro plan ($49/month value)
- ✅ Exclusive "Beta Pioneer" badge (permanent)
- ✅ Priority support via dedicated channel

### Recognition
- Public acknowledgment for top contributors
- Featured testimonials (with permission)
- Early access to future features

## Post-Beta Transition

### Feedback Aggregation
1. Export all feedback to Notion board: "Beta Insights"
2. Tag by category: Bug, Feature Request, UX, Performance
3. Rank by: Impact × Frequency
4. Prioritize top 3 fixes before public launch

### Beta → Production
- Beta users automatically upgraded to 60-day Pro
- Beta Pioneer badge added to profile
- Email thank you + what's next
- Optional: Interview for case study

### Success Criteria for Public Launch
- Zero critical bugs reported in final week
- 70%+ retention rate
- 50%+ conversion intent
- All P0 issues resolved

## Communication Plan

### Kickoff Email (Day 1)
```
Subject: Welcome to InboxAgent.ai Beta! 🚀

You're one of 50 pioneers shaping the future of email management.

What to expect:
- Week 1: We observe, you explore
- Week 2: We ship fixes based on your feedback
- Throughout: Your input drives our roadmap

Quick start:
1. Connect your Gmail/Outlook
2. Let AI process your inbox
3. Report bugs and suggest improvements

Questions? Reply to this email.

- The InboxAgent Team
```

### Mid-Week Check-in (Day 7)
Survey + progress update

### Week 2 Update (Day 10)
Share what we fixed based on their feedback

### Closing Email (Day 14)
Thank you + transition to Pro + next steps

## Metrics Dashboard (Admin Only)

### Key Metrics
- Total beta signups
- Approved users
- Daily Active Users (DAU)
- Retention (3+ days/week)
- Avg AI actions per user
- Top feedback themes
- Bug resolution rate

### Admin Tools
- View all beta signups (pending/approved)
- Approve/decline applications
- View feedback by user/priority
- Export metrics to CSV
- Send batch invites

## Technical Implementation

### Database Tables
- `beta_signups` - Application submissions
- `beta_feedback` - Bug reports and suggestions
- `beta_metrics` - Usage tracking
- `profiles.beta_pioneer` - Badge status

### Edge Functions
- `beta-signup` - Process applications
- `track-beta-metric` - Record usage metrics

### Frontend Components
- `/beta` - Landing page and application form
- `FeedbackButton` - In-app feedback widget
- `BetaPioneerBadge` - Status badge component
- `useBetaMetrics` - Hook for tracking

## Beta Program Timeline

**Week -1**: Soft launch landing page, recruit first 10 users
**Week 0**: Official beta start, onboard all users
**Week 1**: Observe, gather feedback, identify issues
**Week 2**: Fix, refine, polish
**Week 3**: Analyze results, plan public launch

## Risk Mitigation

### If Adoption is Low
- Extend beta by 1 week
- Increase recruitment efforts
- Offer additional incentives

### If Bugs are Critical
- Pause new signups
- Focus on stability
- Extended beta period

### If Feedback is Negative
- Deep-dive user interviews
- Pivot key features
- Consider soft relaunch

## Success Stories to Capture
- Time saved (before/after)
- Specific workflows improved
- "Aha!" moments
- Comparison to previous tools

Target: 5-10 compelling testimonials for launch

## Resources

- **Beta Landing Page**: `/beta`
- **Feedback System**: Dashboard header
- **Metrics Dashboard**: Admin view (TBD)
- **Documentation**: `/docs/BETA_PROGRAM.md`
