/**
 * DATEV CSV Parser
 * Parst eine DATEV-Buchungsstapel-Datei (CSV, Semikolon-getrennt, CP1252)
 * und gibt eine strukturierte Liste von Buchungen zurück.
 *
 * Verwendung:
 *   import { parseDatevCsv, matchDatevToMieter, type DatevBuchung } from "@/lib/parseDatev";
 *   const buchungen = await parseDatevCsv(file);
 */

export interface DatevBuchung {
  /** Umsatz/Betrag in EUR */
  umsatz: number;
  /** Soll/Haben-Kennzeichen: "S" = Soll (Ausgang), "H" = Haben (Eingang) */
  sollHaben: "S" | "H";
  /** Währungscode, z. B. "EUR" */
  waehrung: string;
  /** Konto (z. B. "1200" = Bank) */
  konto: string;
  /** Gegenkonto (z. B. "4100" = Mieteinnahmen) */
  gegenkonto: string;
  /** BU-Schlüssel (Steuerschlüssel) */
  buSchluessel: string;
  /** Belegdatum als ISO-String YYYY-MM-DD */
  belegdatum: string;
  /** Belegfeld 1 (Belegnummer / Rechnungsnummer) */
  belegfeld1: string;
  /** Belegfeld 2 */
  belegfeld2: string;
  /** Skonto-Betrag */
  skonto: number;
  /** Buchungstext (enthält oft Mieter-Name / Verwendungszweck) */
  buchungstext: string;
}

export interface DatevImportResult {
  buchungen: DatevBuchung[];
  /** Anzahl übersprungener Zeilen (Header, leer etc.) */
  uebersprungen: number;
}

// ---------------------------------------------------------------------------
// CSV-Zeile parsen (Semikolon-getrennt, Felder optional in Anführungszeichen)
// ---------------------------------------------------------------------------

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ";") {
        fields.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}

// ---------------------------------------------------------------------------
// Deutsches Zahlenformat parsen: "850,00" → 850.00
// ---------------------------------------------------------------------------

function parseGermanNumber(s: string): number {
  if (!s || !s.trim()) return 0;
  const cleaned = s.trim().replace(/\./g, "").replace(",", ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// ---------------------------------------------------------------------------
// Belegdatum parsen: DATEV-Format "TTMM" (4 Stellen) → ISO YYYY-MM-DD
// Wirtschaftsjahr wird aus dem Header oder dem aktuellen Jahr abgeleitet.
// ---------------------------------------------------------------------------

function parseBelegdatum(raw: string, jahr: number): string {
  const s = raw.trim();
  if (!s) return "";

  // Format TTMM (4 Stellen, z.B. "1003" = 10. März)
  if (/^\d{4}$/.test(s)) {
    const tag = s.slice(0, 2);
    const monat = s.slice(2, 4);
    return `${jahr}-${monat}-${tag}`;
  }

  // Format TT.MM.JJJJ oder TT.MM.JJ
  const parts = s.split(".");
  if (parts.length === 3) {
    const tag = parts[0].padStart(2, "0");
    const monat = parts[1].padStart(2, "0");
    let jStr = parts[2];
    if (jStr.length === 2) jStr = `20${jStr}`;
    return `${jStr}-${monat}-${tag}`;
  }

  return "";
}

// ---------------------------------------------------------------------------
// DATEV-Header parsen: Wirtschaftsjahr aus Zeile 1 extrahieren
// ---------------------------------------------------------------------------

function parseHeaderJahr(headerLine: string): number {
  const fields = parseCsvLine(headerLine);
  // Feld 6 (Index 5) enthält das Datum im Format YYYYMMDD
  if (fields.length > 5) {
    const datumStr = fields[5].trim();
    if (/^\d{8}$/.test(datumStr)) {
      return parseInt(datumStr.slice(0, 4), 10);
    }
  }
  return new Date().getFullYear();
}

// ---------------------------------------------------------------------------
// Datei als Text lesen – versucht CP1252, fällt auf UTF-8 zurück
// ---------------------------------------------------------------------------

async function readFileAsText(file: File): Promise<string> {
  // Versuche CP1252 (Western European / Windows-1252)
  try {
    const buffer = await file.arrayBuffer();
    const decoder = new TextDecoder("windows-1252");
    return decoder.decode(buffer);
  } catch {
    // Fallback: UTF-8
    return file.text();
  }
}

// ---------------------------------------------------------------------------
// Spalten-Mapping: Header-Zeile → Index-Map
// ---------------------------------------------------------------------------

const EXPECTED_COLUMNS = [
  "umsatz", "soll/haben", "währung", "waehrung", "kurs",
  "basisumsatz", "basiswährung", "basiswaehrung",
  "konto", "gegenkonto", "bu-schlüssel", "bu-schluessel",
  "belegdatum", "belegfeld1", "belegfeld2", "skonto", "buchungstext",
] as const;

function buildColumnMap(headerFields: string[]): Map<string, number> {
  const map = new Map<string, number>();
  for (let i = 0; i < headerFields.length; i++) {
    const normalized = headerFields[i]
      .trim()
      .toLowerCase()
      .replace(/[""]/g, "");
    map.set(normalized, i);
  }
  return map;
}

function getField(fields: string[], colMap: Map<string, number>, ...names: string[]): string {
  for (const name of names) {
    const idx = colMap.get(name);
    if (idx !== undefined && idx < fields.length) {
      return fields[idx].trim().replace(/^"|"$/g, "");
    }
  }
  return "";
}

// ---------------------------------------------------------------------------
// Haupt-Parser
// ---------------------------------------------------------------------------

/**
 * Parst eine DATEV-Buchungsstapel-CSV-Datei.
 *
 * @param file - Die hochgeladene Datei (File-Objekt)
 * @returns DatevImportResult mit allen geparsten Buchungen
 * @throws Error wenn das Format ungültig ist
 */
export async function parseDatevCsv(file: File): Promise<DatevImportResult> {
  const text = await readFileAsText(file);
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);

  if (lines.length < 2) {
    throw new Error(
      "Ungültiges DATEV-Format: Datei enthält zu wenig Zeilen."
    );
  }

  // DATEV-Header erkennen (Zeile 1 beginnt mit "EXTF" oder "DTVF")
  let dataStartIndex = 0;
  let jahr = new Date().getFullYear();
  const firstFields = parseCsvLine(lines[0]);
  const firstFieldClean = firstFields[0]?.replace(/"/g, "").trim().toUpperCase();

  if (firstFieldClean === "EXTF" || firstFieldClean === "DTVF") {
    // Zeile 1 = DATEV-Metadaten, Zeile 2 = Spaltenüberschriften
    jahr = parseHeaderJahr(lines[0]);
    dataStartIndex = 2;
  } else {
    // Keine Header-Zeile → Zeile 1 = Spaltenüberschriften
    dataStartIndex = 1;
  }

  if (lines.length <= dataStartIndex) {
    throw new Error(
      "Ungültiges DATEV-Format: Keine Buchungszeilen gefunden."
    );
  }

  // Spaltenüberschriften parsen
  const headerLine = lines[dataStartIndex - 1];
  const headerFields = parseCsvLine(headerLine);
  const colMap = buildColumnMap(headerFields);

  // Prüfe ob wichtige Spalten vorhanden sind
  const hatUmsatz = colMap.has("umsatz");
  const hatBuchungstext = colMap.has("buchungstext");
  if (!hatUmsatz && !hatBuchungstext) {
    throw new Error(
      'Ungültiges DATEV-Format: Spalten "Umsatz" und "Buchungstext" nicht gefunden. ' +
      "Bitte eine DATEV-Buchungsstapel-CSV verwenden."
    );
  }

  const buchungen: DatevBuchung[] = [];
  let uebersprungen = 0;

  for (let i = dataStartIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      uebersprungen++;
      continue;
    }

    const fields = parseCsvLine(line);

    const umsatzStr = getField(fields, colMap, "umsatz");
    const umsatz = parseGermanNumber(umsatzStr);
    if (umsatz === 0) {
      uebersprungen++;
      continue;
    }

    const sollHabenRaw = getField(fields, colMap, "soll/haben").toUpperCase();
    const sollHaben: "S" | "H" = sollHabenRaw === "S" ? "S" : "H";

    const buchung: DatevBuchung = {
      umsatz,
      sollHaben,
      waehrung: getField(fields, colMap, "währung", "waehrung") || "EUR",
      konto: getField(fields, colMap, "konto"),
      gegenkonto: getField(fields, colMap, "gegenkonto"),
      buSchluessel: getField(fields, colMap, "bu-schlüssel", "bu-schluessel"),
      belegdatum: parseBelegdatum(getField(fields, colMap, "belegdatum"), jahr),
      belegfeld1: getField(fields, colMap, "belegfeld1"),
      belegfeld2: getField(fields, colMap, "belegfeld2"),
      skonto: parseGermanNumber(getField(fields, colMap, "skonto")),
      buchungstext: getField(fields, colMap, "buchungstext"),
    };

    buchungen.push(buchung);
  }

  if (buchungen.length === 0) {
    throw new Error(
      "Keine gültigen Buchungen in der DATEV-Datei gefunden."
    );
  }

  return { buchungen, uebersprungen };
}

// ---------------------------------------------------------------------------
// Zuordnungs-Hilfsfunktion: DATEV-Buchung → Mieter-ID
// ---------------------------------------------------------------------------

export interface MieterMatchInfo {
  id: string;
  name: string;
  iban?: string;
}

/**
 * Versucht, eine DATEV-Buchung einem Mieter zuzuordnen.
 *
 * Matching anhand des Buchungstexts:
 *   1. Nachname des Mieters im Buchungstext enthalten
 *   2. Vollständiger Name im Buchungstext enthalten
 *
 * @returns { mieterId, methode } oder null wenn keine Übereinstimmung
 */
export function matchDatevToMieter(
  buchung: DatevBuchung,
  mieter: MieterMatchInfo[]
): { mieterId: string; methode: "buchungstext" } | null {
  const textLower = buchung.buchungstext.toLowerCase();
  if (!textLower) return null;

  for (const m of mieter) {
    const nameParts = m.name.trim().split(/\s+/);
    const nachname = nameParts[nameParts.length - 1].toLowerCase();

    // Nachname im Buchungstext
    if (nachname.length >= 3 && textLower.includes(nachname)) {
      return { mieterId: m.id, methode: "buchungstext" };
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Monat aus Belegdatum extrahieren (YYYY-MM)
// ---------------------------------------------------------------------------

export function getMonatFromBelegdatum(belegdatum: string): string {
  if (!belegdatum || belegdatum.length < 7) {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }
  return belegdatum.slice(0, 7);
}
