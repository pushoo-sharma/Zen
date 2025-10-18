/**
 * Rules Engine
 * Applies rule-based scoring adjustments
 */

export interface ScoringRule {
  id: string;
  name: string;
  condition: (email: any) => boolean;
  adjustment: number; // +/- score modifier
  priority: number; // rule evaluation order
}

export interface RuleSet {
  userId: string;
  rules: ScoringRule[];
}

/**
 * Default scoring rules
 */
export const DEFAULT_RULES: ScoringRule[] = [
  {
    id: "urgent_keywords",
    name: "Urgent Keywords",
    condition: (email) => 
      /urgent|asap|immediately|critical/i.test(email.subject + email.body),
    adjustment: 20,
    priority: 1,
  },
  {
    id: "newsletter_penalty",
    name: "Newsletter Detection",
    condition: (email) =>
      /unsubscribe|newsletter|no-?reply/i.test(email.from),
    adjustment: -30,
    priority: 2,
  },
  // TODO: Add more default rules
];

/**
 * Applies rules to adjust base priority score
 */
export function applyRules(
  baseScore: number,
  email: any,
  ruleSet: RuleSet = { userId: "", rules: DEFAULT_RULES }
): number {
  // TODO: Implement rule application
  // - Sort rules by priority
  // - Evaluate conditions
  // - Apply adjustments
  // - Clamp to 0-100 range
  let score = baseScore;
  
  for (const rule of ruleSet.rules) {
    if (rule.condition(email)) {
      score += rule.adjustment;
    }
  }
  
  return Math.max(0, Math.min(100, score));
}

/**
 * Creates a custom rule for a user
 */
export async function createCustomRule(
  userId: string,
  rule: Omit<ScoringRule, "id">
): Promise<ScoringRule> {
  // TODO: Implement custom rule creation
  // - Validate rule
  // - Store in database
  // - Return with generated ID
  throw new Error("Not implemented");
}
