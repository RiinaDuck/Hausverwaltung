/**
 * CAMT.053 XML Parser
 * Parst einen Kontoauszug im CAMT.053-Format (ISO 20022) und
 * gibt eine strukturierte Liste von Transaktionen zurück.
 *
 * Verwendung:
 *   import { parseCamtXml, type CamtTransaktion } from "@/lib/parseCamt";
 *   const transaktionen = parseCamtXml(xmlString);
 */

export interface CamtTransaktion {
  /** Buchungsdatum (ISO: YYYY-MM-DD) */
  buchungsdatum: string;
  /** Wertstellungsdatum (ISO: YYYY-MM-DD) */
  wertstellungsdatum: string;
  /** Betrag in der angegebenen Währung */
  betrag: number;
  /** Währungscode, z. B. "EUR" */
  waehrung: string;
  /** Name des Auftraggebers / Schuldners */
  auftraggeberName: string;
  /** IBAN des Auftraggebers / Schuldners */
  auftraggeberIban: string;
  /** Unstrukturierter Verwendungszweck */
  verwendungszweck: string;
  /** End-to-End-Referenz (z. B. MIETE-2025-02-YIL) */
  endToEndId: string;
  /** Originalinhalt des <Ntry>-Blocks als strukturiertes Objekt (Backup) */
  rawEntry: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Hilfsfunktionen für namespace-unabhängige DOM-Suche
// ---------------------------------------------------------------------------

/**
 * Gibt den Text-Content des ersten gefundenen Elements zurück,
 * unabhängig von XML-Namespaces.
 */
function getText(parent: Element, localName: string): string {
  // Zuerst ohne Namespace versuchen
  const direct = parent.getElementsByTagName(localName)[0];
  if (direct) return direct.textContent?.trim() ?? "";

  // Dann mit Namespace-Wildcard versuchen (z. B. "urn:iso:std:iso:20022:...")
  const all = parent.getElementsByTagName("*");
  for (let i = 0; i < all.length; i++) {
    if (all[i].localName === localName) {
      return all[i].textContent?.trim() ?? "";
    }
  }
  return "";
}

/**
 * Gibt das erste Element zurück, das dem localName entspricht,
 * unabhängig von Namespaces.
 */
function getElement(parent: Element | Document, localName: string): Element | null {
  const direct = (parent as Element).getElementsByTagName?.(localName)[0];
  if (direct) return direct;

  const all = (parent as Element).getElementsByTagName("*");
  for (let i = 0; i < all.length; i++) {
    if (all[i].localName === localName) return all[i];
  }
  return null;
}

/**
 * Gibt alle Elemente zurück, die dem localName entsprechen,
 * unabhängig von Namespaces.
 */
function getElements(parent: Element | Document, localName: string): Element[] {
  const result: Element[] = [];
  const all = (parent as Element).getElementsByTagName?.("*") ?? [];
  for (let i = 0; i < all.length; i++) {
    if (all[i].localName === localName) result.push(all[i]);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Element → flaches JSON-Objekt konvertieren (für raw_camt_entry)
// ---------------------------------------------------------------------------

function elementToObject(el: Element): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  if (el.children.length === 0) {
    return { _text: el.textContent?.trim() ?? "" };
  }
  for (let i = 0; i < el.children.length; i++) {
    const child = el.children[i];
    const key = child.localName;
    const val = elementToObject(child);
    if (key in obj) {
      // Bei mehrfachem Vorkommen → Array
      const existing = obj[key];
      obj[key] = Array.isArray(existing) ? [...existing, val] : [existing, val];
    } else {
      obj[key] = val;
    }
  }
  // Attribut Ccy (Währung) übernehmen
  const ccy = el.getAttribute("Ccy");
  if (ccy) obj["_Ccy"] = ccy;
  return obj;
}

// ---------------------------------------------------------------------------
// Haupt-Parser
// ---------------------------------------------------------------------------

/**
 * Parst einen CAMT.053 XML-String und gibt alle Transaktionen zurück.
 *
 * @param xmlString - Roher XML-Inhalt der CAMT-Datei
 * @returns Array von CamtTransaktion
 * @throws Error wenn das Dokument kein gültiges CAMT.053 ist
 */
export function parseCamtXml(xmlString: string): CamtTransaktion[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlString, "application/xml");

  // Parse-Fehler prüfen
  const parseError = doc.querySelector("parsererror");
  if (parseError) {
    throw new Error(`XML-Parsefehler: ${parseError.textContent?.slice(0, 200)}`);
  }

  // Root-Element prüfen: BkToCstmrStmt erwartet
  const root = doc.documentElement;
  const stmtEl =
    getElement(root, "BkToCstmrStmt") ??
    getElement(root, "Stmt");

  if (!stmtEl) {
    throw new Error(
      "Ungültiges CAMT-Format: Element <BkToCstmrStmt> nicht gefunden. " +
        "Bitte eine CAMT.053 XML-Datei verwenden."
    );
  }

  // Alle <Ntry>-Einträge (Transaktionen) sammeln
  const ntryElements = getElements(stmtEl, "Ntry");

  if (ntryElements.length === 0) {
    throw new Error(
      "Keine Transaktionen (<Ntry>) in der CAMT-Datei gefunden."
    );
  }

  const transaktionen: CamtTransaktion[] = [];

  for (const ntry of ntryElements) {
    // Betrag & Währung
    const amtEl = getElement(ntry, "Amt");
    const betragRaw = amtEl?.textContent?.trim() ?? "0";
    const betrag = parseFloat(betragRaw.replace(",", ".")) || 0;
    const waehrung = amtEl?.getAttribute("Ccy") ?? "EUR";

    // Buchungsdatum: <BookgDt><Dt>
    const bookgDtEl = getElement(ntry, "BookgDt");
    const buchungsdatum = bookgDtEl ? getText(bookgDtEl, "Dt") : "";

    // Wertstellungsdatum: <ValDt><Dt>
    const valDtEl = getElement(ntry, "ValDt");
    const wertstellungsdatum = valDtEl ? getText(valDtEl, "Dt") : "";

    // Transaktionsdetails: erster <TxDtls>-Block
    const txDtls = getElement(ntry, "TxDtls");

    // Auftraggeber: Dbtr (Schuldner / Debtor)
    let auftraggeberName = "";
    let auftraggeberIban = "";

    if (txDtls) {
      const dbtrEl = getElement(txDtls, "Dbtr");
      if (dbtrEl) {
        auftraggeberName = getText(dbtrEl, "Nm");
      }

      const dbtrAcctEl = getElement(txDtls, "DbtrAcct");
      if (dbtrAcctEl) {
        auftraggeberIban = getText(dbtrAcctEl, "IBAN");
      }

      // Fallback: Cdtr (Kreditor) wenn kein Dbtr vorhanden
      if (!auftraggeberName) {
        const cdtrEl = getElement(txDtls, "Cdtr");
        if (cdtrEl) auftraggeberName = getText(cdtrEl, "Nm");
      }
    }

    // Verwendungszweck: <RmtInf><Ustrd>
    let verwendungszweck = "";
    if (txDtls) {
      const rmtInfEl = getElement(txDtls, "RmtInf");
      if (rmtInfEl) {
        verwendungszweck = getText(rmtInfEl, "Ustrd");
      }
    }

    // End-to-End-Referenz: <Refs><EndToEndId>
    let endToEndId = "";
    if (txDtls) {
      const refsEl = getElement(txDtls, "Refs");
      if (refsEl) {
        endToEndId = getText(refsEl, "EndToEndId");
      }
    }

    // Raw-Backup des gesamten <Ntry>-Blocks
    const rawEntry = elementToObject(ntry);

    transaktionen.push({
      buchungsdatum,
      wertstellungsdatum,
      betrag,
      waehrung,
      auftraggeberName,
      auftraggeberIban,
      verwendungszweck,
      endToEndId,
      rawEntry,
    });
  }

  return transaktionen;
}

// ---------------------------------------------------------------------------
// Zuordnungs-Hilfsfunktion: Transaktion → Mieter-ID
// ---------------------------------------------------------------------------

export interface MieterMatchInfo {
  id: string;
  name: string;
  iban?: string; // falls irgendwann in der mieter-Tabelle ergänzt
}

/**
 * Versucht, eine CAMT-Transaktion einem Mieter zuzuordnen.
 *
 * Priorität:
 *   1. IBAN-Abgleich (exakt, falls mieter.iban vorhanden)
 *   2. Name-Abgleich: Auftraggeber-Name enthält Nachnamen des Mieters
 *   3. Verwendungszweck: enthält Nachnamen oder Mieternummer
 *
 * @returns { mieterId, methode } oder null wenn keine Übereinstimmung
 */
export function matchTransaktionToMieter(
  t: CamtTransaktion,
  mieter: MieterMatchInfo[]
): { mieterId: string; methode: "iban" | "verwendungszweck" | "name" } | null {
  const auftraggeberLower = t.auftraggeberName.toLowerCase();
  const verwendungLower = t.verwendungszweck.toLowerCase();

  for (const m of mieter) {
    // 1. IBAN-Abgleich
    if (
      m.iban &&
      t.auftraggeberIban &&
      m.iban.replace(/\s/g, "") === t.auftraggeberIban.replace(/\s/g, "")
    ) {
      return { mieterId: m.id, methode: "iban" };
    }

    // 2. Name-Abgleich: Nachname des Mieters im Auftraggeber-Namen
    const nameParts = m.name.trim().split(/\s+/);
    const nachname = nameParts[nameParts.length - 1].toLowerCase();
    if (nachname.length >= 3 && auftraggeberLower.includes(nachname)) {
      return { mieterId: m.id, methode: "name" };
    }

    // 3. Verwendungszweck enthält Nachnamen
    if (nachname.length >= 3 && verwendungLower.includes(nachname)) {
      return { mieterId: m.id, methode: "verwendungszweck" };
    }
  }

  return null;
}
