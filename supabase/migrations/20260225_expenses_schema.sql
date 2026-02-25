-- Expenses (Betriebskosten / Nebenkosten) Schema
-- Run this in your Supabase SQL Editor AFTER the initial schema

-- ============================================
-- TABLE: expenses (Betriebskosten pro Objekt)
-- ============================================
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  objekt_id UUID NOT NULL REFERENCES objekte(id) ON DELETE CASCADE,

  kostenart TEXT NOT NULL,
  betrag NUMERIC(12, 2) NOT NULL CHECK (betrag >= 0),

  zeitraum_von DATE NOT NULL,
  zeitraum_bis DATE NOT NULL,

  -- Verteilerschlüssel: wie werden die Kosten auf Einheiten verteilt?
  verteilerschluessel TEXT NOT NULL CHECK (
    verteilerschluessel IN (
      'wohnflaeche',
      'nutzflaeche',
      'einheiten',
      'personen',
      'verbrauch',
      'mea',
      'direkt'
    )
  ) DEFAULT 'wohnflaeche',

  -- Optionaler Link zu einer Rechnung (rechnungen-Tabelle)
  rechnung_id UUID REFERENCES rechnungen(id) ON DELETE SET NULL,

  notiz TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT zeitraum_check CHECK (zeitraum_bis >= zeitraum_von)
);

-- Indizes
CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_objekt_id ON expenses(objekt_id);
CREATE INDEX IF NOT EXISTS idx_expenses_zeitraum ON expenses(zeitraum_von, zeitraum_bis);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_expenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS expenses_updated_at ON expenses;
CREATE TRIGGER expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_expenses_updated_at();

-- Row Level Security
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own expenses" ON expenses;
CREATE POLICY "Users can view their own expenses"
  ON expenses FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own expenses" ON expenses;
CREATE POLICY "Users can insert their own expenses"
  ON expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own expenses" ON expenses;
CREATE POLICY "Users can update their own expenses"
  ON expenses FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own expenses" ON expenses;
CREATE POLICY "Users can delete their own expenses"
  ON expenses FOR DELETE
  USING (auth.uid() = user_id);
