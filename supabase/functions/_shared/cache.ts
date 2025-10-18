/**
 * In-Memory Cache
 * Simple cache with TTL support (Note: resets between function invocations)
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<any>>();

/**
 * Sets a value in cache with TTL
 */
export async function set<T>(
  key: string,
  value: T,
  ttlSeconds: number
): Promise<void> {
  const expiresAt = Date.now() + ttlSeconds * 1000;
  cache.set(key, { value, expiresAt });
}

/**
 * Gets a value from cache
 */
export async function get<T>(key: string): Promise<T | null> {
  const entry = cache.get(key);

  if (!entry) {
    return null;
  }

  // Check if expired
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.value as T;
}

/**
 * Deletes a value from cache
 */
export async function del(key: string): Promise<void> {
  cache.delete(key);
}

/**
 * Clears all cache entries
 */
export async function clear(): Promise<void> {
  cache.clear();
}

/**
 * Gets cache size
 */
export function size(): number {
  return cache.size;
}

/**
 * Gets or sets a value (cache-aside pattern)
 */
export async function getOrSet<T>(
  key: string,
  factory: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  const cached = await get<T>(key);
  
  if (cached !== null) {
    return cached;
  }

  const value = await factory();
  await set(key, value, ttlSeconds);
  return value;
}

/**
 * Removes expired entries
 */
export function cleanup(): void {
  const now = Date.now();
  
  for (const [key, entry] of cache.entries()) {
    if (now > entry.expiresAt) {
      cache.delete(key);
    }
  }
}
