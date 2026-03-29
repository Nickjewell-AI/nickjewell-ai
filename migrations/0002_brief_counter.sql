-- Brief counter table for daily rate-limiting executive brief generation
-- Each row tracks how many briefs were generated on a given date
-- The daily cap resets naturally: a new date gets a fresh row

CREATE TABLE IF NOT EXISTS brief_counter (
  date TEXT PRIMARY KEY,   -- YYYY-MM-DD
  count INTEGER NOT NULL DEFAULT 0
);
