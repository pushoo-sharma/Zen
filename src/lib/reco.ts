export type EmailFeatures = {
  id: string;
  fromVIP: number;
  hasDeadlineWords: number;
  isThread: number;
  hourBucket: number;
  isNewsletter: number;
  recencyHours: number;
};

const DEADLINE_WORDS = [
  "contract",
  "invoice",
  "timeline",
  "due",
  "urgent",
  "nda",
  "renewal",
  "quote",
  "delivery",
  "meeting",
  "asap",
  "deadline",
  "action required",
];

export function extractFeatures(e: {
  id: string;
  from?: string;
  subject?: string;
  snippet?: string;
  threadId?: string;
  dateISO?: string;
}): EmailFeatures {
  const subj = (e.subject || "").toLowerCase();
  const snip = (e.snippet || "").toLowerCase();
  const from = (e.from || "").toLowerCase();
  const now = Date.now();
  const ts = e.dateISO ? Date.parse(e.dateISO) : now;
  const hours = Math.max(0, (now - ts) / 36e5);

  return {
    id: e.id,
    fromVIP: Number(
      /vip|ceo|founder|@bigco\.com|client|director|manager/.test(from)
    ),
    hasDeadlineWords: Number(
      DEADLINE_WORDS.some((w) => subj.includes(w) || snip.includes(w))
    ),
    isThread: Number(Boolean(e.threadId)),
    hourBucket: new Date(ts).getHours(),
    isNewsletter: Number(
      /newsletter|unsubscribe|no-reply|updates@|noreply/.test(from) ||
        subj.includes("newsletter") ||
        subj.includes("digest")
    ),
    recencyHours: hours,
  };
}

export type Weights = {
  fromVIP: number;
  hasDeadlineWords: number;
  isThread: number;
  hourBucket: number;
  isNewsletter: number;
  recencyHours: number;
};

export const DEFAULT_WEIGHTS: Weights = {
  fromVIP: 2.5,
  hasDeadlineWords: 2.0,
  isThread: 0.8,
  hourBucket: 0.0,
  isNewsletter: -1.0,
  recencyHours: -0.05,
};

export function scoreEmail(
  f: EmailFeatures,
  w: Weights,
  hourBias: number = 0
): number {
  return (
    f.fromVIP * w.fromVIP +
    f.hasDeadlineWords * w.hasDeadlineWords +
    f.isThread * w.isThread +
    hourBias +
    f.isNewsletter * w.isNewsletter +
    f.recencyHours * w.recencyHours
  );
}

// Epsilon-greedy bandit: with small probability, surface exploratory items
export function selectTop(
  idsWithScores: { id: string; score: number }[],
  epsilon = 0.1,
  k = 5
): { id: string; score: number }[] {
  const out: { id: string; score: number }[] = [];
  const pool = [...idsWithScores];

  for (let i = 0; i < Math.min(k, pool.length); i++) {
    if (Math.random() < epsilon && pool.length > 1) {
      // Explore: pick random remaining
      const j = Math.floor(Math.random() * pool.length);
      out.push(pool.splice(j, 1)[0]);
    } else {
      // Exploit: pick max score
      let best = 0;
      for (let t = 1; t < pool.length; t++) {
        if (pool[t].score > pool[best].score) best = t;
      }
      out.push(pool.splice(best, 1)[0]);
    }
  }

  return out;
}
