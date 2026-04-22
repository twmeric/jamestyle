-- D1 Schema for JameStyle Analytics

CREATE TABLE IF NOT EXISTS reactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slide_id INTEGER NOT NULL,
  reaction_type TEXT NOT NULL,
  session_id TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_reactions_slide ON reactions(slide_id);
CREATE INDEX IF NOT EXISTS idx_reactions_type ON reactions(reaction_type);
CREATE INDEX IF NOT EXISTS idx_reactions_session ON reactions(session_id);

CREATE TABLE IF NOT EXISTS visitor_sessions (
  id TEXT PRIMARY KEY,
  fingerprint TEXT,
  user_agent TEXT,
  referrer TEXT,
  device_type TEXT DEFAULT 'unknown',
  screen_width INTEGER,
  screen_height INTEGER,
  language TEXT,
  session_start INTEGER DEFAULT (unixepoch()),
  last_active INTEGER DEFAULT (unixepoch()),
  total_slides_viewed INTEGER DEFAULT 0,
  max_slide_reached INTEGER DEFAULT 0,
  completed_gallery INTEGER DEFAULT 0,
  took_quiz INTEGER DEFAULT 0,
  quiz_result INTEGER
);

CREATE INDEX IF NOT EXISTS idx_sessions_device ON visitor_sessions(device_type);
CREATE INDEX IF NOT EXISTS idx_sessions_start ON visitor_sessions(session_start);

CREATE TABLE IF NOT EXISTS visitor_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  slide_id INTEGER,
  event_data TEXT,
  duration_ms INTEGER,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_events_session ON visitor_events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON visitor_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_slide ON visitor_events(slide_id);
CREATE INDEX IF NOT EXISTS idx_events_created ON visitor_events(created_at);
