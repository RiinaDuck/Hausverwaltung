-- Zahlungen (Mietzahlungen / DATEV- & CAMT-Import) Schema
-- Einzige Quelle der Wahrheit – alle Fixes sind hier integriert.
-- Ausführen im Supabase SQL Editor (idempotent via DROP … IF EXISTS).

-- ============================================
-- TABLE: zahlungen
-- ============================================
DROP TABLE IF EXISTS zahlungen CASCADE;

CREATE TABLE zahlungen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- mieter_id als TEXT (nullable): DATEV-Buchungen können nicht zugeordnet sein;
  -- kein FK auf mieter, da Mieter-IDs auch als temporäre Client-IDs vorkommen können.
  mieter_id TEXT,

  -- Buchungsinformationen
  buchungsdatum DATE,
  wertstellungsdatum DATE,
  betrag NUMERIC(12, 2) NOT NULL DEFAULT 0,
  waehrung TEXT NOT NULL DEFAULT 'EUR',

  -- Auftraggeber
  auftraggeber_name TEXT,
  auftraggeber_iban TEXT,

  -- Verwendungszweck & Referenz
  verwendungszweck TEXT,
  zahlungsreferenz TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'offen'
    CHECK (status IN ('bezahlt', 'offen', 'ausstehend', 'ueberfaellig')),
  soll_betrag NUMERIC(12, 2) NOT NULL DEFAULT 0,

  -- Differenz (automatisch berechnet)
  differenz NUMERIC(12, 2) GENERATED ALWAYS AS (betrag - soll_betrag) STORED,

  -- Zuordnungsmethode
  zugeordnet_via TEXT CHECK (zugeordnet_via IN ('iban', 'verwendungszweck', 'name', 'manuell')),

  -- Monat (YYYY-MM)
  monat TEXT,

  -- Originaler Import-Eintrag (CAMT XML / DATEV JSON) als Backup
  raw_camt_entry JSONB,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indizes
CREATE INDEX idx_zahlungen_user_id        ON zahlungen(user_id);
CREATE INDEX idx_zahlungen_mieter_id      ON zahlungen(mieter_id);
CREATE INDEX idx_zahlungen_monat          ON zahlungen(monat);
CREATE INDEX idx_zahlungen_status         ON zahlungen(status);
CREATE INDEX idx_zahlungen_buchungsdatum  ON zahlungen(buchungsdatum);

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

DROP POLICY IF EXISTS "Users can view their own zahlungen"   ON zahlungen;
DROP POLICY IF EXISTS "Users can insert their own zahlungen" ON zahlungen;
DROP POLICY IF EXISTS "Users can update their own zahlungen" ON zahlungen;
DROP POLICY IF EXISTS "Users can delete their own zahlungen" ON zahlungen;

CREATE POLICY "Users can view their own zahlungen"
  ON zahlungen FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own zahlungen"
  ON zahlungen FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own zahlungen"
  ON zahlungen FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own zahlungen"
  ON zahlungen FOR DELETE USING (auth.uid() = user_id);
