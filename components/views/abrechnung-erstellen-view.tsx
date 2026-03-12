"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calculator,
  FileDown,
  ChevronDown,
  ChevronRight,
  Info,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppData } from "@/context/app-data-context";
import { useAuth } from "@/context/auth-context";
import type { Expense, Wohnung, Mieter, Verteilerschluessel } from "@/context/app-data-context";
import {
  generateNebenkostenPDF,
  downloadPDF,
  sanitizeFilename,
} from "@/lib/pdf-generator";
import { VERTEILERSCHLUESSEL_OPTIONEN } from "@/components/views/kosten-erfassen-view";

// ============================================================
// Berechnungslogik
// ============================================================

/**
 * Berechnet den Kostenanteil einer Wohneinheit für eine einzelne Ausgabe.
 * Alle Anteile werden auf 2 Dezimalstellen gerundet.
 */
export function berechneAnteil(
  expense: Expense,
  wohnung: Wohnung,
  alleWohnungen: Wohnung[],           // Alle Einheiten des Objekts
  mieterFuerWohnung: Mieter | undefined, // Aktueller Mieter der Einheit (oder undefined)
): number {
  const total = expense.betrag;
  const n = alleWohnungen.length;
  if (n === 0) return 0;

  const round2 = (v: number) => Math.round(v * 100) / 100;

  switch (expense.verteilerschluessel as Verteilerschluessel) {
    case "wohnflaeche": {
      const summe = alleWohnungen.reduce((s, w) => s + w.flaeche, 0);
      return summe > 0 ? round2((wohnung.flaeche / summe) * total) : 0;
    }
    case "nutzflaeche": {
      // Nutzfläche = Wohnfläche × 1,1 (vereinfacht; exaktes MEA wäre besser)
      const toNutz = (w: Wohnung) => w.flaeche * 1.1;
      const summe = alleWohnungen.reduce((s, w) => s + toNutz(w), 0);
      return summe > 0 ? round2((toNutz(wohnung) / summe) * total) : 0;
    }
    case "einheiten": {
      return round2(total / n);
    }
    case "personen": {
      // V1: Jede Wohneinheit zählt als 1 Person.
      // Erweiterung: Personenfeld an Wohnungen oder Mietern ergänzen.
      return round2(total / n);
    }
    case "verbrauch": {
      // V1: Gleichmäßige Aufteilung als Fallback bis Zählerintegration.
      // TODO: Zähler-Ablesewerte aus "zaehler"-Tabelle verwenden.
      return round2(total / n);
    }
    case "mea": {
      // MEA = Miteigentumsanteil aus dem Feld "prozentanteil" des Mieters
      const mea = mieterFuerWohnung?.prozentanteil ?? 100 / n;
      const sumMea = alleWohnungen.reduce((s, _) => s, 0); // Platzhalter
      // Normiert auf 100 %: Anteil = mea / Summe_alle_MEA × total
      // Da wir pro Wohnung keinen Gesamt-MEA haben, nutzen wir den MEA direkt als %
      return round2((mea / 100) * total);
    }
    case "direkt": {
      // Direktzuordnung: In V1 gleichmäßig – für spätere Implementierung
      return round2(total / n);
    }
    default:
      return 0;
  }
}

// ============================================================
// Typen für die Vorschau
// ============================================================

interface EinheitAbrechnung {
  wohnung: Wohnung;
  mieter: Mieter | undefined;
  anteile: { expenseId: string; kostenart: string; anteil: number }[];
  gesamt: number;
  // Für PDF
  vorausleistung: number; // was monatlich gezahlt wurde
}

// ============================================================
// Component
// ============================================================

export function AbrechnungErstellenView() {
  const {
    objekte,
    wohnungen,
    mieter,
    expenses,
    selectedObjektId,
  } = useAppData();
  const { profile } = useAuth();
  const { toast } = useToast();

  const currentYear = new Date().getFullYear();
  const [vonDatum, setVonDatum] = useState(`${currentYear - 1}-01-01`);
  const [bisDatum, setBisDatum] = useState(`${currentYear - 1}-12-31`);
  const [abrechnung, setAbrechnung] = useState<EinheitAbrechnung[] | null>(
    null,
  );
  const [detailOffen, setDetailOffen] = useState<Record<string, boolean>>({});

  const currentObjekt = useMemo(
    () => objekte.find((o) => o.id === selectedObjektId),
    [objekte, selectedObjektId],
  );

  // Wohnungen des gewählten Objekts
  const objektWohnungen = useMemo(
    () =>
      wohnungen.filter((w) => w.objektId === selectedObjektId),
    [wohnungen, selectedObjektId],
  );

  // Expenses im Abrechnungszeitraum für dieses Objekt
  const relevantExpenses = useMemo(() => {
    if (!selectedObjektId) return [];
    return expenses.filter(
      (e) =>
        e.objektId === selectedObjektId &&
        e.zeitraumVon <= bisDatum &&
        e.zeitraumBis >= vonDatum,
    );
  }, [expenses, selectedObjektId, vonDatum, bisDatum]);

  // ---- Berechnung ausführen ----

  const handleBerechnen = () => {
    if (!selectedObjektId) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie ein Objekt aus.",
        variant: "destructive",
      });
      return;
    }
    if (objektWohnungen.length === 0) {
      toast({
        title: "Keine Einheiten",
        description: "Dieses Objekt hat noch keine Wohneinheiten.",
        variant: "destructive",
      });
      return;
    }
    if (relevantExpenses.length === 0) {
      toast({
        title: "Keine Kosten",
        description:
          "Für den gewählten Zeitraum wurden keine Kosten erfasst. Bitte zuerst unter 'Kosten erfassen' Einträge anlegen.",
        variant: "destructive",
      });
      return;
    }

    // Mieter-Lookup: wohnungId → aktivster Mieter
    const mieterMap = new Map<string, Mieter>();
    mieter
      .filter((m) => m.isAktiv !== false)
      .forEach((m) => {
        if (!mieterMap.has(m.wohnungId)) {
          mieterMap.set(m.wohnungId, m);
        }
      });

    const result: EinheitAbrechnung[] = objektWohnungen.map((w) => {
      const m = mieterMap.get(w.id);
      const anteile = relevantExpenses.map((e) => ({
        expenseId: e.id,
        kostenart: e.kostenart,
        anteil: berechneAnteil(e, w, objektWohnungen, m),
      }));
      const gesamt = anteile.reduce((s, a) => s + a.anteil, 0);
      // Vorausleistungen: Monatliche Nebenkosten × Monate im Zeitraum
      const monate =
        (new Date(bisDatum).getFullYear() -
          new Date(vonDatum).getFullYear()) *
          12 +
          new Date(bisDatum).getMonth() -
          new Date(vonDatum).getMonth() +
          1;
      const vorausleistung = (m?.nebenkosten ?? w.nebenkosten) * monate;

      return { wohnung: w, mieter: m, anteile, gesamt, vorausleistung };
    });

    setAbrechnung(result);
  };

  // ---- PDF für eine Einheit exportieren ----

  const handleExportPDF = (einheit: EinheitAbrechnung) => {
    try {
      const kostenarten = einheit.anteile.map((a) => ({
        name: a.kostenart,
        kosten: a.anteil.toFixed(2),
        schluessel:
          relevantExpenses.find((e) => e.id === a.expenseId)
            ?.verteilerschluessel ?? "wohnflaeche",
      }));

      const saldo = einheit.vorausleistung - einheit.gesamt;
      const saldoText =
        saldo >= 0
          ? `Guthaben: ${saldo.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €`
          : `Nachzahlung: ${Math.abs(saldo).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €`;

      const doc = generateNebenkostenPDF({
        title: "Nebenkostenabrechnung",
        dateVon: vonDatum,
        dateBis: bisDatum,
        introText: `Sehr geehrte/r ${einheit.mieter?.name ?? "Mieter/in"},\n\nnachfolgend erhalten Sie die Abrechnung der Betriebskosten für den oben genannten Zeitraum.`,
        kostenarten,
        total: einheit.gesamt.toFixed(2),
        outroText: `Ihre Vorausleistungen: ${einheit.vorausleistung.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €\n${saldoText}\n\nEin Nachzahlungsbetrag ist innerhalb von 14 Tagen nach Erhalt dieser Abrechnung fällig.\n\nMit freundlichen Grüßen\nIhre Hausverwaltung`,
        mieterName: einheit.mieter?.name ?? einheit.wohnung.bezeichnung,
        objektAdresse: currentObjekt?.adresse ?? "",
        profile,
      });

      downloadPDF(
        doc,
        sanitizeFilename(
          `nebenkostenabrechnung_${einheit.wohnung.bezeichnung}_${vonDatum}_${bisDatum}`,
        ),
      );

      toast({ title: "PDF erstellt", description: `Abrechnung für ${einheit.wohnung.bezeichnung} exportiert.` });
    } catch (e) {
      console.error(e);
      toast({
        title: "Fehler",
        description: "PDF konnte nicht erstellt werden.",
        variant: "destructive",
      });
    }
  };

  const formatEuro = (n: number) =>
    n.toLocaleString("de-DE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const toggleDetail = (id: string) =>
    setDetailOffen((prev) => ({ ...prev, [id]: !prev[id] }));

  // ---- Render ----

  return (
    <div className="space-y-4 sm:space-y-6">
      <p className="text-sm text-muted-foreground">
        Wählen Sie den Abrechnungszeitraum. Das System lädt alle erfassten
        Betriebskosten und verteilt sie automatisch auf die Einheiten.
      </p>

      {!selectedObjektId && (
        <Card className="p-8 text-center">
          <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-1">Kein Objekt ausgewählt</h2>
          <p className="text-muted-foreground">
            Wählen Sie oben in der Kopfzeile ein Objekt aus, um die Abrechnung zu erstellen.
          </p>
        </Card>
      )}

      {/* Parameter */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Abrechnungsparameter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            {/* Zeitraum */}
            <div className="space-y-2">
              <Label>Von</Label>
              <Input
                type="date"
                value={vonDatum}
                onChange={(e) => {
                  setVonDatum(e.target.value);
                  setAbrechnung(null);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Bis</Label>
              <Input
                type="date"
                value={bisDatum}
                onChange={(e) => {
                  setBisDatum(e.target.value);
                  setAbrechnung(null);
                }}
              />
            </div>
          </div>

          {/* Expense-Infos */}
          {selectedObjektId && (
            <div className="mt-4 flex flex-wrap gap-2 text-sm text-muted-foreground">
              <Badge variant="outline" className="gap-1">
                <Info className="h-3 w-3" />
                {relevantExpenses.length} Kostenpositionen im Zeitraum
              </Badge>
              <Badge variant="outline">
                {objektWohnungen.length} Einheiten im Objekt
              </Badge>
              <Badge variant="outline">
                Gesamtkosten:{" "}
                {formatEuro(
                  relevantExpenses.reduce((s, e) => s + e.betrag, 0),
                )}{" "}
                €
              </Badge>
            </div>
          )}

          <div className="mt-4">
            <Button
              className="gap-2 bg-success hover:bg-success/90 text-success-foreground"
              onClick={handleBerechnen}
              disabled={!selectedObjektId || relevantExpenses.length === 0}
            >
              <Calculator className="h-4 w-4" />
              Abrechnung berechnen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Vorschau */}
      {abrechnung && (
        <>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">
                    Abrechnungsvorschau
                  </CardTitle>
                  <CardDescription>
                    {currentObjekt?.name} · {vonDatum} bis {bisDatum}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table className="min-w-[700px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[160px]">Einheit</TableHead>
                    <TableHead className="w-[160px]">Mieter</TableHead>
                    <TableHead className="w-[100px] text-right">
                      Voraus­leistung
                    </TableHead>
                    <TableHead className="w-[100px] text-right">
                      Gesamtkosten
                    </TableHead>
                    <TableHead className="w-[100px] text-right">
                      Saldo
                    </TableHead>
                    <TableHead className="w-[80px]">Detail</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {abrechnung.map((e) => {
                    const saldo = e.vorausleistung - e.gesamt;
                    const isOpen = detailOffen[e.wohnung.id] ?? false;
                    return (
                      <>
                        <TableRow key={e.wohnung.id}>
                          <TableCell className="font-medium">
                            {e.wohnung.bezeichnung}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {e.mieter?.name ?? (
                              <Badge variant="secondary">Leer</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">
                            {formatEuro(e.vorausleistung)} €
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm font-medium">
                            {formatEuro(e.gesamt)} €
                          </TableCell>
                          <TableCell
                            className={`text-right font-mono text-sm font-semibold ${
                              saldo >= 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-destructive"
                            }`}
                          >
                            {saldo >= 0 ? "+ " : "− "}
                            {formatEuro(Math.abs(saldo))} €
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => toggleDetail(e.wohnung.id)}
                            >
                              {isOpen ? (
                                <ChevronDown className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronRight className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleExportPDF(e)}
                            >
                              <FileDown className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>

                        {/* Detail-Aufschlüsselung */}
                        {isOpen &&
                          e.anteile.map((a) => (
                            <TableRow
                              key={`${e.wohnung.id}-${a.expenseId}`}
                              className="bg-muted/30 text-xs"
                            >
                              <TableCell
                                className="pl-8 text-muted-foreground"
                                colSpan={3}
                              >
                                ↳ {a.kostenart}
                              </TableCell>
                              <TableCell className="text-right font-mono text-muted-foreground">
                                {formatEuro(a.anteil)} €
                              </TableCell>
                              <TableCell colSpan={3} />
                            </TableRow>
                          ))}
                      </>
                    );
                  })}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={2} className="font-bold">
                      Gesamtsumme
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      {formatEuro(
                        abrechnung.reduce(
                          (s, e) => s + e.vorausleistung,
                          0,
                        ),
                      )}{" "}
                      €
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      {formatEuro(
                        abrechnung.reduce((s, e) => s + e.gesamt, 0),
                      )}{" "}
                      €
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono font-bold ${
                        abrechnung.reduce(
                          (s, e) => s + e.vorausleistung - e.gesamt,
                          0,
                        ) >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-destructive"
                      }`}
                    >
                      {(() => {
                        const total = abrechnung.reduce(
                          (s, e) => s + e.vorausleistung - e.gesamt,
                          0,
                        );
                        return `${total >= 0 ? "+ " : "− "}${formatEuro(Math.abs(total))} €`;
                      })()}
                    </TableCell>
                    <TableCell colSpan={2} />
                  </TableRow>
                </TableFooter>
              </Table>
            </CardContent>
          </Card>

          {/* Erklärung der verwendeten Schlüssel */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground font-normal">
                Verwendete Verteilerschlüssel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {[
                  ...new Set(
                    relevantExpenses.map((e) => e.verteilerschluessel),
                  ),
                ].map((v) => {
                  const opt = VERTEILERSCHLUESSEL_OPTIONEN.find(
                    (o) => o.value === v,
                  );
                  return (
                    <Badge key={v} variant="secondary" className="gap-1 text-xs">
                      {opt?.label ?? v}
                      <span className="text-muted-foreground">
                        – {opt?.beschreibung}
                      </span>
                    </Badge>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                <Info className="inline h-3 w-3 mr-1" />
                <strong>Verbrauch</strong> und <strong>MEA</strong> werden in
                V1 gleichmäßig verteilt. Für exakte Verbrauchswerte verknüpfen
                Sie zukünftig die Zählerablesungen. Für WEG-Objekte können MEA
                (Miteigentumsanteile) im Mieter-Datensatz als Prozentanteil
                hinterlegt werden.
              </p>
            </CardContent>
          </Card>
        </>
      )}

      {/* Keine Daten */}
      {!abrechnung && selectedObjektId && relevantExpenses.length === 0 && (
        <Card className="p-8 text-center">
          <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-1">
            Keine Kosten im Zeitraum
          </h2>
          <p className="text-muted-foreground">
            Für dieses Objekt und den gewählten Zeitraum wurden noch keine
            Betriebskosten erfasst. Erfassen Sie zuerst Kosten unter &nbsp;
            <strong>Nebenkosten → Kosten erfassen</strong>.
          </p>
        </Card>
      )}
    </div>
  );
}
