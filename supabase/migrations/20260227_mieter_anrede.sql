-- Migration: Anrede-Feld zur mieter-Tabelle hinzufügen
-- Ausführen im Supabase SQL Editor

ALTER TABLE mieter
  ADD COLUMN IF NOT EXISTS anrede TEXT NOT NULL DEFAULT 'familie'
  CHECK (anrede IN ('herr', 'frau', 'familie'));
