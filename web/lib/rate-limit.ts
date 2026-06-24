const hits = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  key: string,
  limit = 5,
  windowMs = 60 * 60 * 1000
): boolean {
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count += 1;
  return true;
}
