-- D1 REST API v1 — new tables for rate limiting, webhooks, signals, drafts, and agent runs
-- Run in Cloudflare Dashboard: Workers & Pages → D1 → jewell-assessment-db → Console

-- Rate limiting (general-purpose, hourly windows)
CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  window_key TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 0
);

-- Webhook registrations
CREATE TABLE IF NOT EXISTS webhook_registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  url TEXT NOT NULL,
  events TEXT NOT NULL,
  secret TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Intent signals (lead/engagement tracking)
CREATE TABLE IF NOT EXISTS intent_signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_name TEXT,
  company TEXT,
  industry TEXT,
  channel TEXT,
  signal_type TEXT,
  content TEXT,
  assessment_id INTEGER,
  timestamp TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Agent-generated drafts (emails, messages, etc.)
CREATE TABLE IF NOT EXISTS agent_drafts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  draft_type TEXT,
  recipient TEXT,
  subject TEXT,
  body TEXT,
  confidence_score REAL,
  agent_run_id INTEGER,
  assessment_id INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Agent run logs (cost, tokens, duration tracking)
CREATE TABLE IF NOT EXISTS agent_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_type TEXT,
  trigger_source TEXT,
  input_summary TEXT,
  output_summary TEXT,
  status TEXT,
  cost_usd REAL,
  duration_ms INTEGER,
  tokens_in INTEGER,
  tokens_out INTEGER,
  error_detail TEXT,
  started_at TEXT NOT NULL DEFAULT (datetime('now'))
);
