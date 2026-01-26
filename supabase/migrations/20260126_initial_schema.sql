-- Hausverwaltung Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: objekte (Immobilien/Objekte)
-- ============================================
CREATE TABLE IF NOT EXISTS objekte (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  adresse TEXT NOT NULL,
  typ TEXT NOT NULL CHECK (typ IN ('Miete', 'WEG')),
  einheiten INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('aktiv', 'inaktiv')) DEFAULT 'aktiv',
  
  -- JSON Felder für verschachtelte Daten
  eigentuemer JSONB NOT NULL DEFAULT '{}'::jsonb,
  bankverbindung JSONB NOT NULL DEFAULT '{}'::jsonb,
  objektdaten JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  notizen TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index für schnellere User-Queries
CREATE INDEX IF NOT EXISTS idx_objekte_user_id ON objekte(user_id);
CREATE INDEX IF NOT EXISTS idx_objekte_status ON objekte(status);

-- Row Level Security für objekte
ALTER TABLE objekte ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own objekte" ON objekte;
CREATE POLICY "Users can view their own objekte"
  ON objekte FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own objekte" ON objekte;
CREATE POLICY "Users can insert their own objekte"
  ON objekte FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own objekte" ON objekte;
CREATE POLICY "Users can update their own objekte"
  ON objekte FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own objekte" ON objekte;
CREATE POLICY "Users can delete their own objekte"
  ON objekte FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TABLE: wohnungen
-- ============================================
CREATE TABLE IF NOT EXISTS wohnungen (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  objekt_id UUID NOT NULL REFERENCES objekte(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  bezeichnung TEXT NOT NULL,
  etage TEXT NOT NULL,
  flaeche DECIMAL(10, 2) NOT NULL,
  zimmer INTEGER NOT NULL,
  miete DECIMAL(10, 2) NOT NULL,
  nebenkosten DECIMAL(10, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('vermietet', 'leer', 'eigennutzung')) DEFAULT 'leer',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wohnungen_user_id ON wohnungen(user_id);
CREATE INDEX IF NOT EXISTS idx_wohnungen_objekt_id ON wohnungen(objekt_id);
CREATE INDEX IF NOT EXISTS idx_wohnungen_status ON wohnungen(status);

-- Row Level Security für wohnungen
ALTER TABLE wohnungen ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own wohnungen" ON wohnungen;
CREATE POLICY "Users can view their own wohnungen"
  ON wohnungen FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own wohnungen" ON wohnungen;
CREATE POLICY "Users can insert their own wohnungen"
  ON wohnungen FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own wohnungen" ON wohnungen;
CREATE POLICY "Users can update their own wohnungen"
  ON wohnungen FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own wohnungen" ON wohnungen;
CREATE POLICY "Users can delete their own wohnungen"
  ON wohnungen FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TABLE: mieter
-- ============================================
CREATE TABLE IF NOT EXISTS mieter (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wohnung_id UUID NOT NULL REFERENCES wohnungen(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  telefon TEXT NOT NULL,
  einzugs_datum DATE NOT NULL,
  miete_bis DATE,
  kaltmiete DECIMAL(10, 2) NOT NULL,
  nebenkosten DECIMAL(10, 2) NOT NULL,
  kaution DECIMAL(10, 2) NOT NULL DEFAULT 0,
  
  -- Erweiterte Felder
  is_kurzzeitvermietung BOOLEAN NOT NULL DEFAULT FALSE,
  kurzzeit_bis DATE,
  is_aktiv BOOLEAN NOT NULL DEFAULT TRUE,
  prozentanteil DECIMAL(5, 2),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mieter_user_id ON mieter(user_id);
CREATE INDEX IF NOT EXISTS idx_mieter_wohnung_id ON mieter(wohnung_id);
CREATE INDEX IF NOT EXISTS idx_mieter_is_aktiv ON mieter(is_aktiv);
DROP POLICY IF EXISTS "Users can view their own mieter" ON mieter;
CREATE POLICY "Users can view their own mieter"
  ON mieter FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own mieter" ON mieter;
CREATE POLICY "Users can insert their own mieter"
  ON mieter FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own mieter" ON mieter;
CREATE POLICY "Users can update their own mieter"
  ON mieter FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own mieter" ON mieter;
CREATE POLICY "Users can update their own mieter"
  ON mieter FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own mieter"
  ON mieter FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TABLE: zaehler (Wasserzähler, Stromzähler, etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS zaehler (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wohnung_id UUID NOT NULL REFERENCES wohnungen(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  wohnungnr TEXT NOT NULL,
  geschoss TEXT NOT NULL,
  montageort TEXT NOT NULL,
  geraeteart TEXT NOT NULL,
  geraetnummer TEXT NOT NULL,
  geeicht_bis TEXT NOT NULL,
  hersteller TEXT,
  typ TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zaehler_user_id ON zaehler(user_id);
CREATE INDEX IF NOT EXISTS idx_zaehler_wohnung_id ON zaehler(wohnung_id);
DROP POLICY IF EXISTS "Users can view their own zaehler" ON zaehler;
CREATE POLICY "Users can view their own zaehler"
  ON zaehler FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own zaehler" ON zaehler;
CREATE POLICY "Users can insert their own zaehler"
  ON zaehler FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own zaehler" ON zaehler;
CREATE POLICY "Users can update their own zaehler"
  ON zaehler FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own zaehler" ON zaehler;
CREATE POLICY "Users can update their own zaehler"
  ON zaehler FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own zaehler"
  ON zaehler FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TABLE: rauchmelder
-- ============================================
CREATE TABLE IF NOT EXISTS rauchmelder (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wohnung_id UUID NOT NULL REFERENCES wohnungen(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  wohnungnr TEXT NOT NULL,
  geschoss TEXT NOT NULL,
  montageort TEXT NOT NULL,
  geraeteart TEXT NOT NULL,
  geraetnummer TEXT NOT NULL,
  lebensdauer_bis TEXT NOT NULL,
  hersteller TEXT,
  typ TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rauchmelder_user_id ON rauchmelder(user_id);
CREATE INDEX IF NOT EXISTS idx_rauchmelder_wohnung_id ON rauchmelder(wohnung_id);
DROP POLICY IF EXISTS "Users can view their own rauchmelder" ON rauchmelder;
CREATE POLICY "Users can view their own rauchmelder"
  ON rauchmelder FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own rauchmelder" ON rauchmelder;
CREATE POLICY "Users can insert their own rauchmelder"
  ON rauchmelder FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own rauchmelder" ON rauchmelder;
CREATE POLICY "Users can update their own rauchmelder"
  ON rauchmelder FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own rauchmelder" ON rauchmelder;
CREATE POLICY "Users can update their own rauchmelder"
  ON rauchmelder FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own rauchmelder"
  ON rauchmelder FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TABLE: rechnungen
-- ============================================
CREATE TABLE IF NOT EXISTS rechnungen (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  nummer TEXT NOT NULL,
  datum DATE NOT NULL,
  empfaenger_name TEXT NOT NULL,
  empfaenger_adresse TEXT NOT NULL,
  positionen JSONB NOT NULL DEFAULT '[]'::jsonb,
  bemerkung TEXT,
  status TEXT NOT NULL CHECK (status IN ('offen', 'bezahlt', 'storniert')) DEFAULT 'offen',
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique constraint für Rechnungsnummer pro User
  UNIQUE(user_id, nummer)
);
DROP POLICY IF EXISTS "Users can view their own rechnungen" ON rechnungen;
CREATE POLICY "Users can view their own rechnungen"
  ON rechnungen FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own rechnungen" ON rechnungen;
CREATE POLICY "Users can insert their own rechnungen"
  ON rechnungen FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own rechnungen" ON rechnungen;
CREATE POLICY "Users can update their own rechnungen"
  ON rechnungen FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own rechnungen" ON rechnungen;
CREATE POLICY "Users can insert their own rechnungen"
  ON rechnungen FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rechnungen"
  ON rechnungen FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own rechnungen"
  ON rechnungen FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS: Auto-update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger für alle Tabellen
CREATE TRIGGER update_objekte_updated_at BEFORE UPDATE ON objekte
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wohnungen_updated_at BEFORE UPDATE ON wohnungen
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mieter_updated_at BEFORE UPDATE ON mieter
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_zaehler_updated_at BEFORE UPDATE ON zaehler
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rauchmelder_updated_at BEFORE UPDATE ON rauchmelder
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rechnungen_updated_at BEFORE UPDATE ON rechnungen
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TABLE: hausmanager_stammdaten
-- Flexible Tabelle für alle Hausmanager-Daten (Finanzamt, Steuerberater, etc.)
-- ============================================
CREATE TABLE IF NOT EXISTS hausmanager_stammdaten (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Typ der Stammdaten
  typ TEXT NOT NULL CHECK (typ IN (
    'finanzamt', 
    'steuerberater', 
    'grundbesitzabgabe',
    'energielieferant',
    'messdienst',
    'finanzierungspartner',
    'versicherung',
    'dienstleister',
    'rechtsberatung'
  )),
  
  -- Grunddaten (für alle Typen)
  name TEXT NOT NULL,
  
  -- Flexible Daten als JSONB (typ-spezifische Felder)
  daten JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DROP POLICY IF EXISTS "Users can view their own hausmanager_stammdaten" ON hausmanager_stammdaten;
CREATE POLICY "Users can view their own hausmanager_stammdaten"
  ON hausmanager_stammdaten FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own hausmanager_stammdaten" ON hausmanager_stammdaten;
CREATE POLICY "Users can insert their own hausmanager_stammdaten"
  ON hausmanager_stammdaten FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own hausmanager_stammdaten" ON hausmanager_stammdaten;
CREATE POLICY "Users can update their own hausmanager_stammdaten"
  ON hausmanager_stammdaten FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own hausmanager_stammdaten" ON hausmanager_stammdaten;
CREATE POLICY "Users can insert their own hausmanager_stammdaten"
  ON hausmanager_stammdaten FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own hausmanager_stammdaten"
  ON hausmanager_stammdaten FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own hausmanager_stammdaten"
  ON hausmanager_stammdaten FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_hausmanager_stammdaten_updated_at BEFORE UPDATE ON hausmanager_stammdaten
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS: Helpful views for complex queries
-- ============================================

-- View: Alle Wohnungen mit Objekt-Info
CREATE OR REPLACE VIEW wohnungen_mit_objekt AS
SELECT 
  w.*,
  o.name AS objekt_name,
  o.adresse AS objekt_adresse
FROM wohnungen w
JOIN objekte o ON w.objekt_id = o.id;

-- View: Alle Mieter mit Wohnungs- und Objekt-Info
CREATE OR REPLACE VIEW mieter_overview AS
SELECT 
  m.*,
  w.bezeichnung AS wohnung_bezeichnung,
  w.etage AS wohnung_etage,
  o.name AS objekt_name,
  o.adresse AS objekt_adresse
FROM mieter m
JOIN wohnungen w ON m.wohnung_id = w.id
JOIN objekte o ON w.objekt_id = o.id;

-- ============================================
-- SAMPLE DATA (Optional - for testing)
-- ============================================
-- You can insert sample data here or use the app to create data
