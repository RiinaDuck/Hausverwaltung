/**
 * Nebenkosten-Berechnungslogik
 *
 * Architektur:
 * - Betriebskosten werden objektweit erfasst (expenses-Tabelle)
 * - Die Verteilung auf Einheiten erfolgt hier rein rechnerisch
 * - Kein persistierter Eintrag pro Mieter nötig
 *
 * Erweiterbarkeit WEG:
 * - MEA-Schlüssel nutzt prozentanteil aus Mieter-Tabelle
 * - Für WEG: statt Mieter → Eigentümer mit MEA-Anteilen
 */

import type { Expense } from "@/context/app-data-context";

// ---- Input-Typen -------------------------------------------------------

export interface EinheitInput {
  wohnungId: string;
  bezeichnung: string;
  flaeche: number;          // m² Wohnfläche
  personenAnzahl: number;   // aus Mieter-Datensatz
  mea: number;              // Miteigentumsanteil in % (0‥100)
  verbrauch?: number;       // z.B. m³ Wasser oder kWh – für "verbrauch"-Schlüssel
  mieterName: string;
  mieterEmail?: string;
}

export interface AbrechnungsInput {
  objektId: string;
  objektName: string;
  objektAdresse: string;
  zeitraumVon: string;      // ISO-Date "2025-01-01"
  zeitraumBis: string;      // ISO-Date "2025-12-31"
  expenses: Expense[];
  einheiten: EinheitInput[];
}

// ---- Output-Typen ------------------------------------------------------

export interface KostenPosition {
  expenseId: string;
  kostenart: string;
  gesamtbetrag: number;
  verteilerschluessel: Expense["verteilerschluessel"];
  anteil: number;           // Anteil dieser Einheit (0.0 – 1.0)
  betragAnteilig: number;   // = gesamtbetrag × anteil
}

export interface EinheitAbrechnung {
  wohnungId: string;
  bezeichnung: string;
  mieterName: string;
  mieterEmail?: string;
  positionen: KostenPosition[];
  gesamtBetrag: number;
  // Vorauszahlungen (aus Mieter.nebenkosten × Monate)
  vorauszahlung: number;
  saldo: number;            // negativ = Erstattung, positiv = Nachzahlung
}

export interface ObjektAbrechnung {
  objektId: string;
  objektName: string;
  objektAdresse: string;
  zeitraumVon: string;
  zeitraumBis: string;
  gesamtkostenBrutto: number;
  einheitenAbrechnungen: EinheitAbrechnung[];
  erstelltAm: string;
}

// ---- Hilfsfunktionen ---------------------------------------------------

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function getDaysBetween(von: string, bis: string): number {
  const d1 = new Date(von).getTime();
  const d2 = new Date(bis).getTime();
  return Math.max(1, Math.round((d2 - d1) / 86_400_000) + 1);
}

/**
 * Berechnet den Anteil (0.0 – 1.0) einer Einheit an den Gesamtkosten
 * gemäß dem gewählten Verteilerschlüssel.
 */
export function berechneAnteil(
  schluessel: Expense["verteilerschluessel"],
  einheit: EinheitInput,
  alleEinheiten: EinheitInput[],
): number {
  switch (schluessel) {
    case "wohnflaeche": {
      const gesamt = alleEinheiten.reduce((s, e) => s + e.flaeche, 0);
      return gesamt === 0 ? 0 : einheit.flaeche / gesamt;
    }
    case "nutzflaeche": {
      // Nutzfläche = Wohnfläche × 1.1 (Konvention; ggf. konfigurierbar)
      const nutz = (e: EinheitInput) => e.flaeche * 1.1;
      const gesamt = alleEinheiten.reduce((s, e) => s + nutz(e), 0);
      return gesamt === 0 ? 0 : nutz(einheit) / gesamt;
    }
    case "einheiten": {
      return alleEinheiten.length === 0 ? 0 : 1 / alleEinheiten.length;
    }
    case "personen": {
      const gesamt = alleEinheiten.reduce((s, e) => s + e.personenAnzahl, 0);
      return gesamt === 0 ? 0 : einheit.personenAnzahl / gesamt;
    }
    case "verbrauch": {
      const gesamt = alleEinheiten.reduce((s, e) => s + (e.verbrauch ?? 0), 0);
      return gesamt === 0 ? 0 : (einheit.verbrauch ?? 0) / gesamt;
    }
    case "mea": {
      // MEA-Anteile sollten 100% ergeben; wir normieren sicherheitshalber
      const gesamt = alleEinheiten.reduce((s, e) => s + e.mea, 0);
      return gesamt === 0 ? 0 : einheit.mea / gesamt;
    }
    case "direkt": {
      // Bei "direkt" trägt jede Einheit den vollen Betrag
      // (wird in der Praxis nur für eine Einheit gesetzt)
      return 1;
    }
    default:
      return 0;
  }
}

/**
 * Hauptfunktion: Erstellt die vollständige Betriebskostenabrechnung
 * für alle Einheiten eines Objekts.
 */
export function berechneAbrechnung(input: AbrechnungsInput): ObjektAbrechnung {
  const { einheiten, expenses, zeitraumVon, zeitraumBis } = input;

  // Expenses auf den Abrechnungszeitraum filtern (überlappend)
  const relevanteExpenses = expenses.filter((exp) => {
    return exp.zeitraumVon <= zeitraumBis && exp.zeitraumBis >= zeitraumVon;
  });

  // Pro Einheit alle Kostenpositionen berechnen
  const einheitenAbrechnungen: EinheitAbrechnung[] = einheiten.map((einheit) => {
    const positionen: KostenPosition[] = relevanteExpenses.map((exp) => {
      // Anteiligen Zeitraum berechnen (falls Expense nicht deckungsgleich)
      const expVon = exp.zeitraumVon > zeitraumVon ? exp.zeitraumVon : zeitraumVon;
      const expBis = exp.zeitraumBis < zeitraumBis ? exp.zeitraumBis : zeitraumBis;
      const tageGesamt = getDaysBetween(exp.zeitraumVon, exp.zeitraumBis);
      const tageAnteil = getDaysBetween(expVon, expBis);
      const zeitFaktor = tageGesamt === 0 ? 1 : tageAnteil / tageGesamt;

      const anteil = berechneAnteil(exp.verteilerschluessel, einheit, einheiten);
      const betragAnteilig = round2(exp.betrag * zeitFaktor * anteil);

      return {
        expenseId: exp.id,
        kostenart: exp.kostenart,
        gesamtbetrag: round2(exp.betrag * zeitFaktor),
        verteilerschluessel: exp.verteilerschluessel,
        anteil,
        betragAnteilig,
      };
    });

    const gesamtBetrag = round2(
      positionen.reduce((s, p) => s + p.betragAnteilig, 0),
    );

    return {
      wohnungId: einheit.wohnungId,
      bezeichnung: einheit.bezeichnung,
      mieterName: einheit.mieterName,
      mieterEmail: einheit.mieterEmail,
      positionen,
      gesamtBetrag,
      vorauszahlung: 0,   // wird von der View befüllt
      saldo: 0,           // wird von der View befüllt
    };
  });

  const gesamtkostenBrutto = round2(
    relevanteExpenses.reduce((s, e) => s + e.betrag, 0),
  );

  return {
    objektId: input.objektId,
    objektName: input.objektName,
    objektAdresse: input.objektAdresse,
    zeitraumVon,
    zeitraumBis,
    gesamtkostenBrutto,
    einheitenAbrechnungen,
    erstelltAm: new Date().toISOString(),
  };
}

/** Formatiert einen Betrag als Euro-String */
export function formatEuro(betrag: number): string {
  return betrag.toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " €";
}

/** Formatiert einen Anteil als Prozent-String */
export function formatProzent(anteil: number): string {
  return (anteil * 100).toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " %";
}

/** Lesbare Namen der Verteilerschlüssel */
export const VERTEILERSCHLUESSEL_LABELS: Record<
  Expense["verteilerschluessel"],
  string
> = {
  wohnflaeche: "Wohnfläche (m²)",
  nutzflaeche: "Nutzfläche (m²)",
  einheiten: "Anzahl Einheiten",
  personen: "Personenanzahl",
  verbrauch: "Verbrauch",
  mea: "MEA / Miteigentumsanteil",
  direkt: "Direkt",
};
