/**
 * Rate Limiter
 * Tracks and limits request rates per key
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const limits = new Map<string, RateLimitEntry>();

/**
 * Checks if a key is within rate limit
 */
export function allowKey(
  key: string,
  limit: number,
  windowMs: number
): boolean {
  const now = Date.now();
  let entry = limits.get(key);

  // Initialize or reset if window expired
  if (!entry || now > entry.resetAt) {
    entry = {
      count: 0,
      resetAt: now + windowMs,
    };
  }

  // Increment count
  entry.count++;
  limits.set(key, entry);

  // Check if limit exceeded
  return entry.count <= limit;
}

/**
 * Gets remaining requests for a key
 */
export function remaining(
  key: string,
  limit: number
): number {
  const entry = limits.get(key);
  
  if (!entry) {
    return limit;
  }

  const now = Date.now();
  
  // If window expired, return full limit
  if (now > entry.resetAt) {
    return limit;
  }

  return Math.max(0, limit - entry.count);
}

/**
 * Gets reset time for a key
 */
export function resetAt(key: string): number | null {
  const entry = limits.get(key);
  return entry ? entry.resetAt : null;
}

/**
 * Resets rate limit for a key
 */
export function reset(key: string): void {
  limits.delete(key);
}

/**
 * Clears all rate limits
 */
export function clearAll(): void {
  limits.clear();
}

/**
 * Rate limit middleware for Supabase functions
 */
export function checkRateLimit(
  userId: string,
  endpoint: string,
  limit: number = 60,
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetAt: number } {
  const key = `${userId}:${endpoint}`;
  const allowed = allowKey(key, limit, windowMs);
  const remainingCount = remaining(key, limit);
  const resetTime = resetAt(key) || Date.now() + windowMs;

  return {
    allowed,
    remaining: remainingCount,
    resetAt: resetTime,
  };
}

/**
 * Cleanup expired entries
 */
export function cleanup(): void {
  const now = Date.now();
  
  for (const [key, entry] of limits.entries()) {
    if (now > entry.resetAt) {
      limits.delete(key);
    }
  }
}
