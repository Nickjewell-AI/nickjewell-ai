// Brief-specific rate limiting using brief_ip_counter table

const DAILY_BRIEF_CAP = 100;

// Check per-IP daily limit for briefs (3/IP/day).
// Returns null if under limit, or a Response if at limit.
export async function checkIpLimit(db, ip) {
  const today = new Date().toISOString().slice(0, 10);
  const key = ip + ':' + today;

  const row = await db.prepare(
    'SELECT count FROM brief_ip_counter WHERE ip_date = ?'
  ).bind(key).first();

  const currentCount = row ? row.count : 0;

  if (currentCount >= 3) {
    return new Response(JSON.stringify({
      error: 'ip_limit',
      message: "You've reached the maximum number of executive briefs for today. Try again tomorrow.",
    }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  await db.prepare(
    'INSERT OR REPLACE INTO brief_ip_counter (ip_date, count) VALUES (?, ?)'
  ).bind(key, currentCount + 1).run();

  return null;
}

// Check global daily brief cap (100/day) by summing all IP counts for today.
// Returns null if under cap, or a Response if at capacity.
export async function checkBriefCap(db) {
  const today = new Date().toISOString().slice(0, 10);

  const row = await db.prepare(
    "SELECT SUM(count) as total FROM brief_ip_counter WHERE ip_date LIKE '%:' || ?"
  ).bind(today).first();

  const currentTotal = row ? (row.total || 0) : 0;

  if (currentTotal >= DAILY_BRIEF_CAP) {
    return new Response(JSON.stringify({
      error: 'briefs_at_capacity',
      message: 'Executive briefs are at capacity today. Try again tomorrow.',
    }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return null;
}
