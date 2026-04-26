-- Card share tracking + WhatsApp lead capture

CREATE TABLE IF NOT EXISTS card_shares (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT,
  slide_id INTEGER NOT NULL,
  share_token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending',
  shared_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_card_shares_token ON card_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_card_shares_session ON card_shares(session_id);
CREATE INDEX IF NOT EXISTS idx_card_shares_slide ON card_shares(slide_id);

CREATE TABLE IF NOT EXISTS whatsapp_leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT UNIQUE NOT NULL,
  first_contact_at INTEGER DEFAULT (unixepoch()),
  source TEXT DEFAULT 'card_share',
  share_count INTEGER DEFAULT 1,
  last_share_at INTEGER,
  conversation_history TEXT
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_leads_phone ON whatsapp_leads(phone);
