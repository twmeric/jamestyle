-- Fix subscribers table: make phone nullable and remove unique constraint
DROP TABLE IF EXISTS subscribers;

CREATE TABLE subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT,
  name TEXT,
  source_code TEXT,
  status TEXT DEFAULT 'pending',
  created_at INTEGER DEFAULT (unixepoch()) NOT NULL
);
