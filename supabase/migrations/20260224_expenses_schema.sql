-- ============================================
-- Nebenkosten-Reform: Objektbezogene Betriebskosten
-- Migration: 20260224_expenses_schema.sql
-- ============================================
-- Ausführen im Supabase SQL-Editor

-- ============================================
-- TABLE: expenses (Betriebskosten je Objekt)
-- ============================================
-- Jede Zeile = ein Beleg / eine Kostenposition für ein Objekt.
-- Die Verteilung auf Einheiten erfolgt rechnerisch (kein eigener
-- Tabelleneintrag pro Mieter – alles wird zur Abrechnungszeit berechnet).

CREATE TABLE IF NOT EXISTS expenses (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID         NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  objekt_id     UUID         NOT NULL REFERENCES objekte(id)    ON DELETE CASCADE,

  -- Inhalt
  kostenart     TEXT         NOT NULL,
  betrag        DECIMAL(12, 2) NOT NULL CHECK (betrag >= 0),

  -- Abrechnungszeitraum
  zeitraum_von  DATE         NOT NULL,
  zeitraum_bis  DATE         NOT NULL,

  -- Wie wird der Betrag auf die Einheiten aufgeteilt?
  -- wohnflaeche  → proportional zur Wohnfläche (m²)
  -- nutzflaeche  → proportional zur Nutzfläche (Wohnfläche × 1.1)
  -- einheiten    → gleichmäßig auf alle Einheiten
  -- personen     → proportional zur Personenzahl (aus Mieter-Daten)
  -- verbrauch    → nach erfasstem Zählerverbrauch
  -- mea          → nach Miteigentumsanteilen (prozentanteil-Feld der Mieter)
  -- direkt       → Betrag wird 1:1 einer einzelnen Einheit zugeordnet
  verteilerschluessel TEXT NOT NULL DEFAULT 'wohnflaeche'
    CHECK (verteilerschluessel IN (
      'wohnflaeche', 'nutzflaeche', 'einheiten',
      'personen', 'verbrauch', 'mea', 'direkt'
    )),

  -- Optional: Verknüpfung mit einem Rechnungsbeleg
  rechnung_id   UUID         REFERENCES rechnungen(id) ON DELETE SET NULL,

  notiz         TEXT,

  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_user_id   ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_objekt_id ON expenses(objekt_id);
CREATE INDEX IF NOT EXISTS idx_expenses_zeitraum  ON expenses(zeitraum_von, zeitraum_bis);

-- Row Level Security
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "expenses: select own" ON expenses;
CREATE POLICY "expenses: select own"
  ON expenses FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "expenses: insert own" ON expenses;
CREATE POLICY "expenses: insert own"
  ON expenses FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "expenses: update own" ON expenses;
CREATE POLICY "expenses: update own"
  ON expenses FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "expenses: delete own" ON expenses;
CREATE POLICY "expenses: delete own"
  ON expenses FOR DELETE USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- ERWEITERBARKEIT: WEG-Unterstützung
-- ============================================
-- Für spätere WEG-Unterstützung kann eine weitere Tabelle
-- "weg_wirtschaftsplaene" ergänzt werden, die auf objekte verweist.
-- Die expenses-Tabelle ist bereits objekt-agnostisch und unterstützt
-- daher sowohl Miet- als auch WEG-Objekte ohne Schemaänderung.
-- Für MEA als Verteilerschlüssel wird das Feld "prozentanteil" der
-- Mieter-Tabelle verwendet (bereits vorhanden).
