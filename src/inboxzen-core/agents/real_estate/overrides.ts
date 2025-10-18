/**
 * Real Estate Overrides
 * Adjusts AI scoring for real estate-specific terms
 */

import { CATEGORY_KEYWORDS, type RealEstateCategory } from './categories';

export interface ScoringOverride {
  keyword: string;
  scoreAdjustment: number;
  reason: string;
}

/**
 * Real estate specific scoring overrides
 */
export const REAL_ESTATE_OVERRIDES: ScoringOverride[] = [
  {
    keyword: "contingency",
    scoreAdjustment: 15,
    reason: "Contingency matters are time-sensitive",
  },
  {
    keyword: "inspection",
    scoreAdjustment: 15,
    reason: "Inspections have hard deadlines",
  },
  {
    keyword: "closing date",
    scoreAdjustment: 20,
    reason: "Closing coordination is critical",
  },
  {
    keyword: "earnest money",
    scoreAdjustment: 18,
    reason: "Deposit matters require prompt attention",
  },
  {
    keyword: "list price",
    scoreAdjustment: -5,
    reason: "Initial price inquiries are exploratory",
  },
  {
    keyword: "open house",
    scoreAdjustment: 10,
    reason: "Event coordination needs planning",
  },
  // TODO: Add more real estate terms
];

/**
 * Applies real estate scoring overrides
 */
export function applyRealEstateOverrides(
  baseScore: number,
  subject: string,
  body: string
): { adjustedScore: number; appliedOverrides: ScoringOverride[] } {
  // TODO: Implement override application
  let score = baseScore;
  const applied: ScoringOverride[] = [];
  const text = (subject + " " + body).toLowerCase();
  
  for (const override of REAL_ESTATE_OVERRIDES) {
    if (text.includes(override.keyword.toLowerCase())) {
      score += override.scoreAdjustment;
      applied.push(override);
    }
  }
  
  return {
    adjustedScore: Math.max(0, Math.min(100, score)),
    appliedOverrides: applied,
  };
}

/**
 * Detects urgency signals specific to real estate
 */
export function detectRealEstateUrgency(subject: string, body: string): {
  isUrgent: boolean;
  signals: string[];
} {
  // TODO: Implement urgency detection
  const urgencySignals = [
    "expires today",
    "deadline tomorrow",
    "offer expiring",
    "inspection due",
    "final walkthrough",
    "closing in",
  ];
  
  const text = (subject + " " + body).toLowerCase();
  const detected = urgencySignals.filter(signal => text.includes(signal));
  
  return {
    isUrgent: detected.length > 0,
    signals: detected,
  };
}

/**
 * Classifies message and boosts score for real estate workflows
 */
export function classifyAndBoost(msg: { subject: string; body: string }): {
  scoreBoost: number;
  reason: string;
  category: RealEstateCategory;
} {
  const text = (msg.subject + " " + msg.body).toLowerCase();
  
  // Determine category based on keywords
  let category: RealEstateCategory = 'Marketing';
  let maxMatches = 0;
  
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const matches = keywords.filter(kw => text.includes(kw.toLowerCase())).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      category = cat as RealEstateCategory;
    }
  }
  
  // Apply scoring overrides
  const { adjustedScore, appliedOverrides } = applyRealEstateOverrides(0, msg.subject, msg.body);
  
  // Check urgency
  const { isUrgent, signals } = detectRealEstateUrgency(msg.subject, msg.body);
  
  let scoreBoost = adjustedScore;
  let reason = appliedOverrides.map(o => o.reason).join('; ') || 'Categorized';
  
  if (isUrgent) {
    scoreBoost += 15;
    reason += (reason ? ' + ' : '') + `Urgent: ${signals.join(', ')}`;
  }
  
  return { scoreBoost, reason, category };
}
