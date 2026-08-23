-- Migration: Enhance WhatsApp tracking with session linkage and download tracking

-- Add session_id, share_token, first_slide_id, card_url to whatsapp_leads
ALTER TABLE whatsapp_leads ADD COLUMN session_id TEXT;
ALTER TABLE whatsapp_leads ADD COLUMN share_token TEXT;
ALTER TABLE whatsapp_leads ADD COLUMN first_slide_id INTEGER;
ALTER TABLE whatsapp_leads ADD COLUMN card_url TEXT;

-- Add phone to card_shares for bidirectional lookup
ALTER TABLE card_shares ADD COLUMN phone TEXT;

-- Add downloaded_at to card_shares for download tracking
ALTER TABLE card_shares ADD COLUMN downloaded_at INTEGER;
