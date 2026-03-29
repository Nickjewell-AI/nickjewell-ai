-- Per-IP rate limiting for executive brief generation
CREATE TABLE IF NOT EXISTS brief_ip_counter (
  ip_date TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0
);
