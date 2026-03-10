-- Ereignis-Protokoll pro Mieter (Zahlungen, Mahnungen, Mitteilungen, Notizen)
CREATE TABLE IF NOT EXISTS mieter_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mieter_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'einzug', 'auszug',
    'zahlung_eingegangen', 'zahlung_manuell', 'zahlung_ueberfaellig',
    'erinnerung', 'mahnung_1', 'mahnung_2',
    'mitteilung', 'notiz'
  )),
  title TEXT NOT NULL,
  description TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mieter_events_mieter_id ON mieter_events(mieter_id);
CREATE INDEX IF NOT EXISTS idx_mieter_events_user_id   ON mieter_events(user_id);
CREATE INDEX IF NOT EXISTS idx_mieter_events_created_at ON mieter_events(created_at DESC);

ALTER TABLE mieter_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mieter_events"
  ON mieter_events FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mieter_events"
  ON mieter_events FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mieter_events"
  ON mieter_events FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own mieter_events"
  ON mieter_events FOR DELETE USING (auth.uid() = user_id);
