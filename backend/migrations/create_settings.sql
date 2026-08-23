CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  updated_at INTEGER DEFAULT unixepoch() NOT NULL
);
INSERT OR IGNORE INTO settings (key, value) VALUES ('admin_phone', '85268810677');
SELECT * FROM settings;
