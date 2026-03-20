-- Extend rechnungen table with new columns for enhanced invoice management
-- Migration: 20260317_rechnungen_extended

ALTER TABLE rechnungen 
ADD COLUMN IF NOT EXISTS kostenart TEXT,
ADD COLUMN IF NOT EXISTS faelligkeitsdatum DATE,
ADD COLUMN IF NOT EXISTS betrag_netto DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS mwst_prozent INTEGER CHECK (mwst_prozent IN (0, 7, 19)),
ADD COLUMN IF NOT EXISTS betrag_brutto DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS notizen TEXT,
ADD COLUMN IF NOT EXISTS datei_pfad TEXT,
ADD COLUMN IF NOT EXISTS storno_von UUID REFERENCES rechnungen(id) ON DELETE SET NULL;

-- Add default for mwst_prozent
ALTER TABLE rechnungen 
ALTER COLUMN mwst_prozent SET DEFAULT 19;

-- Create index for faster queries on kostenart and status
CREATE INDEX IF NOT EXISTS idx_rechnungen_kostenart ON rechnungen(kostenart);
CREATE INDEX IF NOT EXISTS idx_rechnungen_faelligkeitsdatum ON rechnungen(faelligkeitsdatum);
CREATE INDEX IF NOT EXISTS idx_rechnungen_storno_von ON rechnungen(storno_von);
