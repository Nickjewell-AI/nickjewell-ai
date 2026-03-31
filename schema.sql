-- Jewell Assessment — D1 Database Schema
-- Run this in Cloudflare Dashboard: Workers & Pages → D1 → jewell-assessment → Console

CREATE TABLE IF NOT EXISTS assessment_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  name TEXT,
  email TEXT,
  company TEXT,
  role TEXT,
  role_context TEXT,
  industry TEXT,
  maturity_stage TEXT,
  foundation_score INTEGER,
  architecture_score INTEGER,
  accountability_score INTEGER,
  culture_score INTEGER,
  taste_signature TEXT NOT NULL,
  taste_frame_recognition INTEGER,
  taste_kill_discipline INTEGER,
  taste_edge_case_instinct INTEGER,
  verdict TEXT NOT NULL,
  composite_score INTEGER NOT NULL,
  binding_constraint TEXT,
  all_responses TEXT NOT NULL,
  time_to_complete_seconds INTEGER
);

CREATE TABLE IF NOT EXISTS email_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL DEFAULT (datetime('now')),
  assessment_id INTEGER,
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  email_type TEXT NOT NULL,
  subject TEXT,
  resend_id TEXT,
  status TEXT DEFAULT 'sent',
  metadata TEXT
);
