-- Hausverwaltung Buchungen Table
-- Created: 2026-03-20
-- Replaces the rechnungen table with expanded financial tracking

-- ============================================
-- TABLE: buchungen (Financial Entries)
-- ============================================
CREATE TABLE IF NOT EXISTS buchungen (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Core booking data
  typ TEXT NOT NULL CHECK (typ IN ('einnahme', 'ausgabe')),
  kategorie TEXT NOT NULL,
  datum DATE NOT NULL,
  
  -- Amount fields
  betrag_netto DECIMAL(10, 2) NOT NULL,
  mwst_prozent INTEGER DEFAULT 0,
  betrag_brutto DECIMAL(10, 2) NOT NULL,
  
  -- References to objects
  objekt_id UUID REFERENCES objekte(id) ON DELETE SET NULL,
  wohnung_id UUID REFERENCES wohnungen(id) ON DELETE SET NULL,
  mieter_id UUID REFERENCES mieter(id) ON DELETE SET NULL,
  
  -- Additional fields
  beschreibung TEXT NOT NULL,
  rechnungssteller TEXT,  -- For Ausgaben (invoice issuer)
  rechnungsnummer TEXT,   -- For Ausgaben (invoice number)
  beleg_pfad TEXT,        -- Path to PDF receipt in Supabase Storage
  
  -- Storno reference (for reversals)
  storno_von UUID REFERENCES buchungen(id) ON DELETE SET NULL,
  
  -- Legacy rechnungen fields (for reference during migration)
  legacy_rechnung_id TEXT,
  legacy_status TEXT,  -- offen/bezahlt/storniert
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_buchungen_user_id ON buchungen(user_id);
CREATE INDEX IF NOT EXISTS idx_buchungen_typ ON buchungen(typ);
CREATE INDEX IF NOT EXISTS idx_buchungen_kategorie ON buchungen(kategorie);
CREATE INDEX IF NOT EXISTS idx_buchungen_datum ON buchungen(datum);
CREATE INDEX IF NOT EXISTS idx_buchungen_objekt_id ON buchungen(objekt_id);
CREATE INDEX IF NOT EXISTS idx_buchungen_wohnung_id ON buchungen(wohnung_id);
CREATE INDEX IF NOT EXISTS idx_buchungen_mieter_id ON buchungen(mieter_id);
CREATE INDEX IF NOT EXISTS idx_buchungen_status_legacy ON buchungen(legacy_status);

-- Row Level Security
ALTER TABLE buchungen ENABLE ROW LEVEL SECURITY;

-- Users can only see their own buchungen
DROP POLICY IF EXISTS "Users can view their own buchungen" ON buchungen;
CREATE POLICY "Users can view their own buchungen"
  ON buchungen FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own buchungen
DROP POLICY IF EXISTS "Users can insert their own buchungen" ON buchungen;
CREATE POLICY "Users can insert their own buchungen"
  ON buchungen FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own buchungen
DROP POLICY IF EXISTS "Users can update their own buchungen" ON buchungen;
CREATE POLICY "Users can update their own buchungen"
  ON buchungen FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own buchungen
DROP POLICY IF EXISTS "Users can delete their own buchungen" ON buchungen;
CREATE POLICY "Users can delete their own buchungen"
  ON buchungen FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TABLE: buchungen_kategorien (Reference table for categories)
-- ============================================
CREATE TABLE IF NOT EXISTS buchungen_kategorien (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  typ TEXT NOT NULL CHECK (typ IN ('einnahme', 'ausgabe')),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_buchungen_kategorien_user_id ON buchungen_kategorien(user_id);
CREATE INDEX IF NOT EXISTS idx_buchungen_kategorien_typ ON buchungen_kategorien(typ);

-- RLS for categories
ALTER TABLE buchungen_kategorien ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own categories" ON buchungen_kategorien;
CREATE POLICY "Users can view their own categories"
  ON buchungen_kategorien FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own categories" ON buchungen_kategorien;
CREATE POLICY "Users can insert their own categories"
  ON buchungen_kategorien FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- MIGRATION: Insert default categories
-- ============================================
-- Note: Run this after user login to populate user-specific categories
-- For now, we'll rely on the application to create these

-- ============================================
-- MIGRATION: Migrate existing rechnungen to buchungen
-- ============================================
-- This will be run on deployment, migrating all rechnungen as "ausgabe" entries
-- Raw SQL:
-- INSERT INTO buchungen (
--   user_id, typ, kategorie, datum, betrag_netto, mwst_prozent, betrag_brutto,
--   objekt_id, wohnung_id, mieter_id, beschreibung, rechnungssteller,
--   rechnungsnummer, legacy_rechnung_id, legacy_status, created_at, updated_at
-- )
-- SELECT
--   r.user_id, 'ausgabe', COALESCE(r.kostenart, 'Sonstiges'), r.datum,
--   COALESCE(r.betrag_netto, 0), COALESCE(r.mwst_prozent, 19),
--   COALESCE(r.betrag_brutto, (r.betrag_netto * (1 + r.mwst_prozent / 100))),
--   NULL, NULL, NULL, r.empfaenger_name, r.empfaenger_name,
--   r.nummer, r.id, r.status, r.created_at, r.updated_at
-- FROM rechnungen r;

-- ============================================
-- STORAGE: Create storage bucket for belege
-- ============================================
-- This would be created via Supabase dashboard
-- Storage path: storage/objects/public/belege/{user_id}/{buchung_id}/{filename}
