"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Calculator,
  FileDown,
  Building2,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Download,
  RotateCcw,
  FileJson,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppData } from "@/context/app-data-context";
import type { Expense, Verteilerschluessel } from "@/context/app-data-context";
import {
  berechneAbrechnung,
  formatEuro,
  formatProzent,
  VERTEILERSCHLUESSEL_LABELS,
} from "@/lib/nebenkosten-berechnung";
import type { AbrechnungsInput, ObjektAbrechnung, EinheitAbrechnung } from "@/lib/nebenkosten-berechnung";
import {
  generateNebenkostenPDF,
  downloadPDF,
  sanitizeFilename,
} from "@/lib/pdf-generator";

// ── Wizard-Schritte ────────────────────────────────────────────────────────────
type WizardStep = "schritt1" | "schritt2" | "schritt3" | "schritt4";

const WIZARD_STEPS: { key: WizardStep; label: string; kurz: string }[] = [
  { key: "schritt1", label: "Objekt & Zeitraum", kurz: "1" },
  { key: "schritt2", label: "Kosten prüfen",     kurz: "2" },
  { key: "schritt3", label: "Verteilungsvorschau", kurz: "3" },
  { key: "schritt4", label: "Export & Abschluss", kurz: "4" },
];

const SCHLUESSEL_OPTIONS: Verteilerschluessel[] = [
  "wohnflaeche", "nutzflaeche", "einheiten", "personen", "verbrauch", "mea", "direkt",
];

// ── Snapshot-Typ (für JSON-Export / spätere DB-Speicherung) ───────────────────
export interface AbrechnungsSnapshot {
  version: 1;
  erstelltAm: string;
  objekt: { id: string; name: string; adresse: string };
  zeitraum: { von: string; bis: string };
  gesamtkosten: number;
  einheiten: Array<{
    wohnungId: string;
    bezeichnung: string;
    mieterName: string;
    gesamtBetrag: number;
    vorauszahlung: number;
    saldo: number;
    positionen: Array<{
      kostenart: string;
      schluessel: Verteilerschluessel;
      gesamtbetrag: number;
      anteil: number;
      betragAnteilig: number;
    }>;
  }>;
}

const THIS_YEAR = new Date().getFullYear();

// ── Hilfsfunktion: Vorauszahlungen ────────────────────────────────────────────
function berechneVorauszahlung(
  wohnungId: string,
  zeitraumVon: string,
  zeitraumBis: string,
  mieterList: ReturnType<typeof useAppData>["mieter"],
): number {
  const vonDate = new Date(zeitraumVon);
  const bisDate = new Date(zeitraumBis);
  const monate =
    (bisDate.getFullYear() - vonDate.getFullYear()) * 12 +
    (bisDate.getMonth() - vonDate.getMonth()) + 1;
  const aktiverMieter = mieterList.find((m) => m.wohnungId === wohnungId && m.isAktiv);
  return (aktiverMieter?.nebenkosten ?? 0) * monate;
}

// ── Hauptkomponente ────────────────────────────────────────────────────────────
export function NebenkostenAbrechnungView() {
  const { objekte, wohnungen, mieter, expenses, selectedObjektId, setSelectedObjektId } =
    useAppData();
  const { toast } = useToast();

  // ── Wizard-Zustand ─────────────────────────────────────────────────────────
  const [step, setStep] = useState<WizardStep>("schritt1");

  // Schritt 1 – Auswahl
  const [wizardObjektId, setWizardObjektId] = useState<string>(selectedObjektId ?? "");
  const [zeitraumVon, setZeitraumVon] = useState(`${THIS_YEAR}-01-01`);
  const [zeitraumBis, setZeitraumBis] = useState(`${THIS_YEAR}-12-31`);

  // Schritt 2 – lokale Kopie der Expenses mit editierbarem Schlüssel
  const [localExpenses, setLocalExpenses] = useState<Expense[]>([]);

  // Schritt 3 / 4 – Berechnungsergebnis
  const [abrechnung, setAbrechnung] = useState<ObjektAbrechnung | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // ── Abgeleitete Werte ──────────────────────────────────────────────────────
  const currentObjekt = useMemo(
    () => objekte.find((o) => o.id === wizardObjektId),
    [objekte, wizardObjektId],
  );

  const objektWohnungen = useMemo(
    () => wohnungen.filter((w) => w.objektId === wizardObjektId),
    [wohnungen, wizardObjektId],
  );

  const stepIndex = WIZARD_STEPS.findIndex((s) => s.key === step);

  // ── Hilfsfunktionen ────────────────────────────────────────────────────────
  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  /** Schritt 1 → 2: Expenses aus Context laden und lokale Kopie aufbauen */
  function handleWeiterZuSchritt2() {
    if (!wizardObjektId) {
      toast({ title: "Kein Objekt gewählt", variant: "destructive" });
      return;
    }
    if (!zeitraumVon || !zeitraumBis || zeitraumVon > zeitraumBis) {
      toast({ title: "Ungültiger Zeitraum", variant: "destructive" });
      return;
    }
    // Sync den globalen selectedObjektId wenn nötig
    if (wizardObjektId !== selectedObjektId) setSelectedObjektId(wizardObjektId);

    const relevant = expenses.filter(
      (e) =>
        e.objektId === wizardObjektId &&
        e.zeitraumVon <= zeitraumBis &&
        e.zeitraumBis >= zeitraumVon,
    );
    setLocalExpenses(relevant);
    setAbrechnung(null);
    setStep("schritt2");
  }

  /** Einzelnen Verteilerschlüssel einer Expense überschreiben */
  function handleSchluesselChange(expenseId: string, value: Verteilerschluessel) {
    setLocalExpenses((prev) =>
      prev.map((e) => (e.id === expenseId ? { ...e, verteilerschluessel: value } : e)),
    );
  }

  /** Schritt 2 → 3: Abrechnung berechnen */
  function handleBerechnen() {
    if (!currentObjekt) return;

    const einheiten = objektWohnungen.map((w) => {
      const aktiverMieter = mieter.find((m) => m.wohnungId === w.id && m.isAktiv);
      return {
        wohnungId: w.id,
        bezeichnung: w.bezeichnung,
        flaeche: w.flaeche,
        personenAnzahl: 1,
        mea: aktiverMieter?.prozentanteil ?? 0,
        verbrauch: 0,
        mieterName: aktiverMieter?.name ?? "(Leerstand)",
        mieterEmail: aktiverMieter?.email,
      };
    });

    const input: AbrechnungsInput = {
      objektId: currentObjekt.id,
      objektName: currentObjekt.name,
      objektAdresse: currentObjekt.adresse,
      zeitraumVon,
      zeitraumBis,
      expenses: localExpenses,
      einheiten,
    };

    const result = berechneAbrechnung(input);

    // Vorauszahlungen pro Einheit befüllen
    result.einheitenAbrechnungen.forEach((ea) => {
      const vz = berechneVorauszahlung(ea.wohnungId, zeitraumVon, zeitraumBis, mieter);
      ea.vorauszahlung = vz;
      ea.saldo = ea.gesamtBetrag - vz;
    });

    setAbrechnung(result);
    setExpandedIds(new Set(result.einheitenAbrechnungen.map((e) => e.wohnungId)));
    setStep("schritt3");
    toast({
      title: "Abrechnung berechnet",
      description: `${result.einheitenAbrechnungen.length} Einheit(en), ${formatEuro(result.gesamtkostenBrutto)} Gesamtkosten.`,
    });
  }

  /** PDF für eine Einheit generieren */
  function handlePDF(ea: EinheitAbrechnung) {
    if (!abrechnung) return;
    try {
      const doc = generateNebenkostenPDF({
        title: "Nebenkostenabrechnung",
        dateVon: abrechnung.zeitraumVon,
        dateBis: abrechnung.zeitraumBis,
        mieterName: ea.mieterName,
        objektAdresse: abrechnung.objektAdresse,
        introText: `Sehr geehrte/r ${ea.mieterName},\n\nnachfolgend erhalten Sie die Betriebskostenabrechnung für die Wohnung ${ea.bezeichnung} für den Abrechnungszeitraum ${abrechnung.zeitraumVon} bis ${abrechnung.zeitraumBis}.`,
        kostenarten: ea.positionen.map((p) => ({
          name: p.kostenart,
          kosten: p.betragAnteilig.toFixed(2),
          schluessel: p.verteilerschluessel,
        })),
        total: ea.gesamtBetrag.toFixed(2),
        outroText: `Vorauszahlungen: ${formatEuro(ea.vorauszahlung)}\nSaldo (Nachzahlung / Erstattung): ${formatEuro(ea.saldo)}\n\nMit freundlichen Grüßen\nIhre Hausverwaltung`,
      });
      downloadPDF(
        doc,
        sanitizeFilename(`Nebenkosten_${ea.mieterName}_${abrechnung.zeitraumVon.substring(0, 4)}.pdf`),
      );
    } catch {
      toast({ title: "PDF Fehler", variant: "destructive" });
    }
  }

  /** Alle PDFs auf einmal generieren */
  function handleAllePDFs() {
    abrechnung?.einheitenAbrechnungen.forEach(handlePDF);
  }

  /** Snapshot als JSON herunterladen */
  function handleSnapshotDownload() {
    if (!abrechnung || !currentObjekt) return;
    const snapshot: AbrechnungsSnapshot = {
      version: 1,
      erstelltAm: abrechnung.erstelltAm,
      objekt: { id: currentObjekt.id, name: currentObjekt.name, adresse: currentObjekt.adresse },
      zeitraum: { von: zeitraumVon, bis: zeitraumBis },
      gesamtkosten: abrechnung.gesamtkostenBrutto,
      einheiten: abrechnung.einheitenAbrechnungen.map((ea) => ({
        wohnungId: ea.wohnungId,
        bezeichnung: ea.bezeichnung,
        mieterName: ea.mieterName,
        gesamtBetrag: ea.gesamtBetrag,
        vorauszahlung: ea.vorauszahlung,
        saldo: ea.saldo,
        positionen: ea.positionen.map((p) => ({
          kostenart: p.kostenart,
          schluessel: p.verteilerschluessel,
          gesamtbetrag: p.gesamtbetrag,
          anteil: p.anteil,
          betragAnteilig: p.betragAnteilig,
        })),
      })),
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = sanitizeFilename(
      `Abrechnung_${currentObjekt.name}_${zeitraumVon.substring(0, 4)}.json`,
    );
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Snapshot heruntergeladen" });
  }

  /** Wizard zurücksetzen */
  function handleReset() {
    setStep("schritt1");
    setLocalExpenses([]);
    setAbrechnung(null);
    setExpandedIds(new Set());
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 sm:space-y-6">

      {/* ── Schritt-Anzeige ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-0">
        {WIZARD_STEPS.map((s, i) => {
          const isActive = s.key === step;
          const isDone = i < stepIndex;
          const isClickable = isDone;
          return (
            <div key={s.key} className="flex items-center flex-1">
              <button
                disabled={!isClickable}
                onClick={() => isClickable && setStep(s.key)}
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium transition-colors w-full
                  ${isActive ? "bg-primary text-primary-foreground" : ""}
                  ${isDone ? "text-primary cursor-pointer hover:bg-primary/10" : ""}
                  ${!isActive && !isDone ? "text-muted-foreground" : ""}
                `}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold
                    ${isActive ? "border-primary-foreground bg-primary-foreground text-primary" : ""}
                    ${isDone ? "border-primary bg-primary text-primary-foreground" : ""}
                    ${!isActive && !isDone ? "border-muted-foreground/40" : ""}
                  `}
                >
                  {isDone ? <CheckCircle2 className="h-3 w-3" /> : s.kurz}
                </span>
                <span className="hidden sm:inline truncate">{s.label}</span>
              </button>
              {i < WIZARD_STEPS.length - 1 && (
                <div className={`h-px flex-1 mx-1 ${i < stepIndex ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* ══ SCHRITT 1: Objekt & Zeitraum ═══════════════════════════════════════ */}
      {step === "schritt1" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Objekt & Abrechnungszeitraum wählen
            </CardTitle>
            <CardDescription>
              Wählen Sie das Objekt und den Zeitraum für die Betriebskostenabrechnung.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Objekt */}
            <div className="space-y-1.5">
              <Label>Objekt</Label>
              <Select
                value={wizardObjektId}
                onValueChange={(v) => { setWizardObjektId(v); setAbrechnung(null); }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Objekt auswählen …" />
                </SelectTrigger>
                <SelectContent>
                  {objekte.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name} — {o.adresse}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Zeitraum */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Von</Label>
                <Input
                  type="date"
                  value={zeitraumVon}
                  onChange={(e) => setZeitraumVon(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Bis</Label>
                <Input
                  type="date"
                  value={zeitraumBis}
                  onChange={(e) => setZeitraumBis(e.target.value)}
                />
              </div>
            </div>

            {/* Info-Zeile */}
            {wizardObjektId && (
              <div className="rounded-md bg-muted/50 px-3 py-2 text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-1">
                <span>
                  <span className="font-medium text-foreground">{currentObjekt?.name}</span>
                </span>
                <span>
                  {objektWohnungen.length} Einheit(en)
                </span>
                <span>
                  {expenses.filter(
                    (e) =>
                      e.objektId === wizardObjektId &&
                      e.zeitraumVon <= zeitraumBis &&
                      e.zeitraumBis >= zeitraumVon,
                  ).length} Kostenpositionen im Zeitraum
                </span>
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={handleWeiterZuSchritt2} className="gap-2" disabled={!wizardObjektId}>
                Kosten prüfen
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ══ SCHRITT 2: Kosten prüfen ════════════════════════════════════════════ */}
      {step === "schritt2" && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Geladene Kostenpositionen prüfen
            </CardTitle>
            <CardDescription>
              Alle Expenses im gewählten Zeitraum. Sie können den Verteilerschlüssel pro
              Position noch anpassen, bevor die Abrechnung berechnet wird.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {localExpenses.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
                <AlertTriangle className="h-8 w-8 opacity-40" />
                <p className="text-sm">Keine Kostenpositionen im gewählten Zeitraum gefunden.</p>
                <p className="text-xs">Bitte erfassen Sie zuerst Kosten unter „Kosten erfassen".</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kostenart</TableHead>
                      <TableHead className="text-right">Betrag</TableHead>
                      <TableHead>Zeitraum</TableHead>
                      <TableHead>Verteilerschlüssel</TableHead>
                      <TableHead className="hidden sm:table-cell text-muted-foreground text-xs font-normal">Notiz</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {localExpenses.map((exp) => (
                      <TableRow key={exp.id}>
                        <TableCell className="text-sm font-medium">{exp.kostenart}</TableCell>
                        <TableCell className="text-right tabular-nums text-sm">
                          {formatEuro(exp.betrag)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {exp.zeitraumVon} – {exp.zeitraumBis}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={exp.verteilerschluessel}
                            onValueChange={(v) =>
                              handleSchluesselChange(exp.id, v as Verteilerschluessel)
                            }
                          >
                            <SelectTrigger className="h-8 text-xs w-44">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {SCHLUESSEL_OPTIONS.map((s) => (
                                <SelectItem key={s} value={s} className="text-xs">
                                  {VERTEILERSCHLUESSEL_LABELS[s]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-xs text-muted-foreground max-w-[160px] truncate">
                          {exp.notiz ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="px-4 py-3 border-t bg-muted/30 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {localExpenses.length} Position(en) &mdash; Summe:{" "}
                    <span className="font-semibold text-foreground tabular-nums">
                      {formatEuro(localExpenses.reduce((s, e) => s + e.betrag, 0))}
                    </span>
                  </span>
                </div>
              </div>
            )}
          </CardContent>
          <div className="flex justify-between px-6 py-4 border-t">
            <Button variant="outline" onClick={() => setStep("schritt1")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Zurück
            </Button>
            <Button onClick={handleBerechnen} className="gap-2" disabled={localExpenses.length === 0}>
              <Calculator className="h-4 w-4" />
              Verteilung berechnen
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* ══ SCHRITT 3: Verteilungsvorschau ══════════════════════════════════════ */}
      {step === "schritt3" && abrechnung && (
        <>
          {/* KPI-Zusammenfassung */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Gesamtkosten", value: formatEuro(abrechnung.gesamtkostenBrutto) },
              { label: "Einheiten", value: abrechnung.einheitenAbrechnungen.length.toString() },
              {
                label: "Kostenpositionen",
                value: (abrechnung.einheitenAbrechnungen[0]?.positionen.length ?? 0).toString(),
              },
              {
                label: "Gesamtsaldo",
                value: formatEuro(
                  abrechnung.einheitenAbrechnungen.reduce((s, e) => s + e.saldo, 0),
                ),
              },
            ].map(({ label, value }) => (
              <Card key={label}>
                <CardContent className="pt-4 pb-3">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-xl font-bold tabular-nums">{value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pro Einheit */}
          {abrechnung.einheitenAbrechnungen.map((ea) => (
            <Card key={ea.wohnungId}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <button
                    className="flex items-center gap-3 text-left"
                    onClick={() => toggleExpand(ea.wohnungId)}
                  >
                    {expandedIds.has(ea.wohnungId) ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                    )}
                    <div>
                      <p className="font-semibold text-sm">{ea.bezeichnung}</p>
                      <p className="text-xs text-muted-foreground">{ea.mieterName}</p>
                    </div>
                  </button>
                  <div className="flex items-center gap-3 ml-auto">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-muted-foreground">Kosten / VZ / Saldo</p>
                      <p className="text-sm font-medium tabular-nums">
                        {formatEuro(ea.gesamtBetrag)} / {formatEuro(ea.vorauszahlung)} /{" "}
                        <span className={ea.saldo > 0 ? "text-destructive" : "text-green-600"}>
                          {formatEuro(ea.saldo)}
                        </span>
                      </p>
                    </div>
                    <Badge
                      variant={ea.saldo > 0 ? "destructive" : "secondary"}
                      className="hidden sm:inline-flex"
                    >
                      {ea.saldo > 0 ? "Nachzahlung" : ea.saldo < 0 ? "Erstattung" : "Ausgeglichen"}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              {expandedIds.has(ea.wohnungId) && ea.positionen.length > 0 && (
                <CardContent className="overflow-x-auto p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Kostenart</TableHead>
                        <TableHead>Schlüssel</TableHead>
                        <TableHead className="text-right">Gesamtbetrag</TableHead>
                        <TableHead className="text-right">Anteil</TableHead>
                        <TableHead className="text-right">Ihr Anteil</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ea.positionen.map((p) => (
                        <TableRow key={p.expenseId}>
                          <TableCell className="text-sm">{p.kostenart}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs font-normal whitespace-nowrap">
                              {VERTEILERSCHLUESSEL_LABELS[p.verteilerschluessel]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm">
                            {formatEuro(p.gesamtbetrag)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm text-muted-foreground">
                            {formatProzent(p.anteil)}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm font-medium">
                            {formatEuro(p.betragAnteilig)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="flex justify-between items-center px-4 py-3 border-t bg-muted/30 text-sm">
                    <span className="text-muted-foreground">Vorauszahlungen</span>
                    <span className="tabular-nums">{formatEuro(ea.vorauszahlung)}</span>
                  </div>
                  <div className="flex justify-between items-center px-4 py-3 border-t text-sm font-semibold">
                    <span>Saldo ({ea.saldo > 0 ? "Nachzahlung" : "Erstattung"})</span>
                    <span
                      className={`tabular-nums ${ea.saldo > 0 ? "text-destructive" : "text-green-600"}`}
                    >
                      {formatEuro(Math.abs(ea.saldo))}
                    </span>
                  </div>
                </CardContent>
              )}

              {expandedIds.has(ea.wohnungId) && ea.positionen.length === 0 && (
                <CardContent>
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Keine Kostenpositionen für diesen Zeitraum.
                  </p>
                </CardContent>
              )}
            </Card>
          ))}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep("schritt2")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Schlüssel anpassen
            </Button>
            <Button onClick={() => setStep("schritt4")} className="gap-2">
              Weiter zu Export
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}

      {/* ══ SCHRITT 4: Export & Abschluss ════════════════════════════════════════ */}
      {step === "schritt4" && abrechnung && (
        <div className="space-y-4">
          {/* Zusammenfassung */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Abrechnung abgeschlossen
              </CardTitle>
              <CardDescription>
                {currentObjekt?.name} &mdash; {zeitraumVon} bis {zeitraumBis}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-md border p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Gesamtkosten</p>
                  <p className="font-semibold tabular-nums">{formatEuro(abrechnung.gesamtkostenBrutto)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Einheiten</p>
                  <p className="font-semibold">{abrechnung.einheitenAbrechnungen.length}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Gesamtsaldo</p>
                  <p className={`font-semibold tabular-nums ${
                    abrechnung.einheitenAbrechnungen.reduce((s, e) => s + e.saldo, 0) > 0
                      ? "text-destructive"
                      : "text-green-600"
                  }`}>
                    {formatEuro(abrechnung.einheitenAbrechnungen.reduce((s, e) => s + e.saldo, 0))}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Erstellt am</p>
                  <p className="font-semibold">
                    {new Date(abrechnung.erstelltAm).toLocaleDateString("de-DE")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Aktionen gesamt */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Gesamt-Export</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button onClick={handleAllePDFs} className="gap-2">
                <Download className="h-4 w-4" />
                Alle PDFs herunterladen
              </Button>
              <Button variant="outline" onClick={handleSnapshotDownload} className="gap-2">
                <FileJson className="h-4 w-4" />
                Als JSON-Snapshot speichern
              </Button>
            </CardContent>
          </Card>

          {/* Pro Einheit */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">PDF pro Einheit</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Einheit</TableHead>
                    <TableHead>Mieter</TableHead>
                    <TableHead className="text-right">Kosten</TableHead>
                    <TableHead className="text-right">Vorauszahlung</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {abrechnung.einheitenAbrechnungen.map((ea) => (
                    <TableRow key={ea.wohnungId}>
                      <TableCell className="text-sm font-medium">{ea.bezeichnung}</TableCell>
                      <TableCell className="text-sm">{ea.mieterName}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {formatEuro(ea.gesamtBetrag)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm text-muted-foreground">
                        {formatEuro(ea.vorauszahlung)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        <span className={ea.saldo > 0 ? "text-destructive font-medium" : "text-green-600 font-medium"}>
                          {ea.saldo > 0 ? "+" : ""}{formatEuro(ea.saldo)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => handlePDF(ea)}
                        >
                          <FileDown className="h-3 w-3" />
                          PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Neue Abrechnung */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep("schritt3")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Vorschau
            </Button>
            <Button variant="ghost" onClick={handleReset} className="gap-2 text-muted-foreground">
              <RotateCcw className="h-4 w-4" />
              Neue Abrechnung
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
