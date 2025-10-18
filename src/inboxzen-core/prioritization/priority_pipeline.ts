/**
 * Priority Pipeline
 * Assigns priority scores to emails (0-100)
 */

export type Msg = { 
  id: string; 
  subject: string; 
  body: string; 
  from?: string; 
  to?: string[]; 
  date?: string;
};

export type ScoreResult = { 
  base: number; 
  boost: number; 
  total: number; 
  reason?: string; 
  category?: string;
};

import { classifyAndBoost } from '../agents/real_estate/overrides';

export function baseScore(msg: Msg): number {
  // Simple baseline: replies or threads with your name get higher base
  let score = 10;
  if (/^re:/i.test(msg.subject)) score += 10;
  if (/urgent|asap|important/i.test(`${msg.subject} ${msg.body}`)) score += 10;
  return score;
}

export function scoreMessage(msg: Msg): ScoreResult {
  const base = baseScore(msg);
  const { scoreBoost, reason, category } = (() => {
    try { 
      const r = classifyAndBoost(msg as any); 
      return { scoreBoost: r.scoreBoost, reason: r.reason, category: r.category }; 
    }
    catch { 
      return { scoreBoost: 0, reason: 'no override', category: 'Marketing' }; 
    }
  })();
  const total = Math.min(100, base + scoreBoost);
  return { base, boost: scoreBoost, total, reason, category };
}

// TODO: expose a sort function that orders a batch by total desc
export function rank(messages: Msg[]): ScoreResult[] {
  return messages.map(scoreMessage).sort((a, b) => b.total - a.total);
}
