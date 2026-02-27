-- Zahlungen (Mietzahlungen / CAMT-Import) Schema
-- Run this in your Supabase SQL Editor AFTER the initial schema

-- ============================================
-- TABLE: zahlungen (Mietzahlungen pro Mieter)
-- ============================================
CREATE TABLE IF NOT EXISTS zahlungen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mieter_id UUID NOT NULL REFERENCES mieter(id) ON DELETE CASCADE,

  -- Buchungsinformationen aus CAMT / Bank
  buchungsdatum DATE,
  wertstellungsdatum DATE,
  betrag NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (betrag >= 0),
  waehrung TEXT NOT NULL DEFAULT 'EUR',

  -- Auftraggeber-Daten aus CAMT
  auftraggeber_name TEXT,
  auftraggeber_iban TEXT,

  -- Verwendungszweck & Referenz
  verwendungszweck TEXT,
  zahlungsreferenz TEXT,

  -- Status & Soll/Ist-Abgleich
  status TEXT NOT NULL DEFAULT 'offen'
    CHECK (status IN ('bezahlt', 'offen', 'ueberfaellig')),
  soll_betrag NUMERIC(12, 2) NOT NULL DEFAULT 0,

  -- Generierte Spalte: Differenz (betrag - soll_betrag)
  differenz NUMERIC(12, 2) GENERATED ALWAYS AS (betrag - soll_betrag) STORED,

  -- Wie wurde die Zahlung dem Mieter zugeordnet?
  zugeordnet_via TEXT CHECK (zugeordnet_via IN ('iban', 'verwendungszweck', 'manuell')),

  -- Monat dem die Zahlung zugeordnet ist (YYYY-MM)
  monat TEXT,

  -- Vollständiger originaler CAMT XML-Eintrag als Backup
  raw_camt_entry JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indizes
CREATE INDEX IF NOT EXISTS idx_zahlungen_user_id ON zahlungen(user_id);
CREATE INDEX IF NOT EXISTS idx_zahlungen_mieter_id ON zahlungen(mieter_id);
CREATE INDEX IF NOT EXISTS idx_zahlungen_monat ON zahlungen(monat);
CREATE INDEX IF NOT EXISTS idx_zahlungen_status ON zahlungen(status);
CREATE INDEX IF NOT EXISTS idx_zahlungen_buchungsdatum ON zahlungen(buchungsdatum);

-- Unique: pro Mieter nur eine Zahlung gleicher Zahlungsreferenz (CAMT EndToEndId)
CREATE UNIQUE INDEX IF NOT EXISTS idx_zahlungen_unique_referenz
  ON zahlungen(mieter_id, zahlungsreferenz)
  WHERE zahlungsreferenz IS NOT NULL;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_zahlungen_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS zahlungen_updated_at ON zahlungen;
CREATE TRIGGER zahlungen_updated_at
  BEFORE UPDATE ON zahlungen
  FOR EACH ROW
  EXECUTE FUNCTION update_zahlungen_updated_at();

-- Row Level Security
ALTER TABLE zahlungen ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own zahlungen" ON zahlungen;
CREATE POLICY "Users can view their own zahlungen"
  ON zahlungen FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own zahlungen" ON zahlungen;
CREATE POLICY "Users can insert their own zahlungen"
  ON zahlungen FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own zahlungen" ON zahlungen;
CREATE POLICY "Users can update their own zahlungen"
  ON zahlungen FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own zahlungen" ON zahlungen;
CREATE POLICY "Users can delete their own zahlungen"
  ON zahlungen FOR DELETE
  USING (auth.uid() = user_id);
