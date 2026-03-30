// Per-route rate limiting via D1

export async function rateLimit(request, env, { maxRequests = 100, windowSeconds = 3600, keyPrefix = 'api' } = {}) {
  const db = env.DB;
  if (!db) return { allowed: true, remaining: maxRequests };

  const ip = request.headers.get('CF-Connecting-IP') || '0.0.0.0';
  const now = new Date();
  const windowKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}-${String(now.getUTCHours()).padStart(2, '0')}`;
  const key = `${keyPrefix}:${ip}:${windowKey}`;

  try {
    const row = await db.prepare(
      'SELECT count FROM rate_limits WHERE key = ? AND window_key = ?'
    ).bind(key, windowKey).first();

    const current = row ? row.count : 0;

    if (current >= maxRequests) {
      return { allowed: false, remaining: 0 };
    }

    await db.prepare(
      'INSERT INTO rate_limits (key, window_key, count) VALUES (?, ?, 1) ON CONFLICT(key) DO UPDATE SET count = count + 1'
    ).bind(key, windowKey).run();

    return { allowed: true, remaining: maxRequests - current - 1 };
  } catch (err) {
    console.error('Rate limit error:', err.message);
    // Fail open — don't block requests if rate limiting breaks
    return { allowed: true, remaining: maxRequests };
  }
}
