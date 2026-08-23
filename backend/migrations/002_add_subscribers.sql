CREATE TABLE IF NOT EXISTS subscribers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT NOT NULL UNIQUE,
  name TEXT,
  source_code TEXT,
  status TEXT DEFAULT 'pending',
  created_at INTEGER DEFAULT (unixepoch()) NOT NULL
);
