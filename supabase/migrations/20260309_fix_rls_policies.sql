-- Fix: Doppelte/falsch benannte RLS Policies reparieren
-- Dieses Script im Supabase SQL Editor ausführen

-- ============================================
-- MIETER: anrede Spalte + RLS fix
-- ============================================
ALTER TABLE mieter ADD COLUMN IF NOT EXISTS anrede TEXT NOT NULL DEFAULT 'familie';
ALTER TABLE mieter ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own mieter" ON mieter;
CREATE POLICY "Users can view their own mieter"
  ON mieter FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own mieter" ON mieter;
CREATE POLICY "Users can insert their own mieter"
  ON mieter FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own mieter" ON mieter;
CREATE POLICY "Users can update their own mieter"
  ON mieter FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own mieter" ON mieter;
CREATE POLICY "Users can delete their own mieter"
  ON mieter FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- ZAEHLER: RLS fix
-- ============================================
ALTER TABLE zaehler ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own zaehler" ON zaehler;
CREATE POLICY "Users can view their own zaehler"
  ON zaehler FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own zaehler" ON zaehler;
CREATE POLICY "Users can insert their own zaehler"
  ON zaehler FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own zaehler" ON zaehler;
CREATE POLICY "Users can update their own zaehler"
  ON zaehler FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own zaehler" ON zaehler;
CREATE POLICY "Users can delete their own zaehler"
  ON zaehler FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- RAUCHMELDER: RLS fix
-- ============================================
ALTER TABLE rauchmelder ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own rauchmelder" ON rauchmelder;
CREATE POLICY "Users can view their own rauchmelder"
  ON rauchmelder FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own rauchmelder" ON rauchmelder;
CREATE POLICY "Users can insert their own rauchmelder"
  ON rauchmelder FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own rauchmelder" ON rauchmelder;
CREATE POLICY "Users can update their own rauchmelder"
  ON rauchmelder FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own rauchmelder" ON rauchmelder;
CREATE POLICY "Users can delete their own rauchmelder"
  ON rauchmelder FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- RECHNUNGEN: RLS fix
-- ============================================
ALTER TABLE rechnungen ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own rechnungen" ON rechnungen;
CREATE POLICY "Users can view their own rechnungen"
  ON rechnungen FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own rechnungen" ON rechnungen;
CREATE POLICY "Users can insert their own rechnungen"
  ON rechnungen FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own rechnungen" ON rechnungen;
CREATE POLICY "Users can update their own rechnungen"
  ON rechnungen FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own rechnungen" ON rechnungen;
CREATE POLICY "Users can delete their own rechnungen"
  ON rechnungen FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- HAUSMANAGER_STAMMDATEN: RLS fix
-- ============================================
ALTER TABLE hausmanager_stammdaten ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own hausmanager_stammdaten" ON hausmanager_stammdaten;
CREATE POLICY "Users can view their own hausmanager_stammdaten"
  ON hausmanager_stammdaten FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own hausmanager_stammdaten" ON hausmanager_stammdaten;
CREATE POLICY "Users can insert their own hausmanager_stammdaten"
  ON hausmanager_stammdaten FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own hausmanager_stammdaten" ON hausmanager_stammdaten;
CREATE POLICY "Users can update their own hausmanager_stammdaten"
  ON hausmanager_stammdaten FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own hausmanager_stammdaten" ON hausmanager_stammdaten;
CREATE POLICY "Users can delete their own hausmanager_stammdaten"
  ON hausmanager_stammdaten FOR DELETE USING (auth.uid() = user_id);
