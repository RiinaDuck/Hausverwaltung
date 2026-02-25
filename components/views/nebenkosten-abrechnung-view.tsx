"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calculator, FileDown, Building2, ChevronDown, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppData } from "@/context/app-data-context";
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

const THIS_YEAR = new Date().getFullYear();

export function NebenkostenAbrechnungView() {
  const { objekte, wohnungen, mieter, expenses, selectedObjektId } = useAppData();
  const { toast } = useToast();

  const [zeitraumVon, setZeitraumVon] = useState(`${THIS_YEAR}-01-01`);
  const [zeitraumBis, setZeitraumBis] = useState(`${THIS_YEAR}-12-31`);
  const [abrechnung, setAbrechnung] = useState<ObjektAbrechnung | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const currentObjekt = useMemo(
    () => objekte.find((o) => o.id === selectedObjektId),
    [objekte, selectedObjektId],
  );

  const objektWohnungen = useMemo(
    () => wohnungen.filter((w) => w.objektId === selectedObjektId),
    [wohnungen, selectedObjektId],
  );

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleBerechnen() {
    if (!selectedObjektId || !currentObjekt) {
      toast({ title: "Kein Objekt gewaehlt", variant: "destructive" });
      return;
    }

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
      expenses: expenses.filter((e) => e.objektId === selectedObjektId),
      einheiten,
    };

    const result = berechneAbrechnung(input);

    // Vorauszahlungen berechnen (Monate im Zeitraum * monatl. Nebenkosten Mieter)
    const vonDate = new Date(zeitraumVon);
    const bisDate = new Date(zeitraumBis);
    const monate =
      (bisDate.getFullYear() - vonDate.getFullYear()) * 12 +
      (bisDate.getMonth() - vonDate.getMonth()) + 1;

    result.einheitenAbrechnungen.forEach((ea) => {
      const aktiverMieter = mieter.find(
        (m) => m.wohnungId === ea.wohnungId && m.isAktiv,
      );
      const vz = (aktiverMieter?.nebenkosten ?? 0) * monate;
      ea.vorauszahlung = vz;
      ea.saldo = ea.gesamtBetrag - vz; // positiv = Nachzahlung
    });

    setAbrechnung(result);
    setExpandedIds(new Set(result.einheitenAbrechnungen.map((e) => e.wohnungId)));
    toast({ title: "Abrechnung berechnet", description: `${result.einheitenAbrechnungen.length} Einheiten.` });
  }

  function handlePDF(ea: EinheitAbrechnung) {
    if (!abrechnung) return;
    try {
      const doc = generateNebenkostenPDF({
        title: "Nebenkostenabrechnung",
        dateVon: abrechnung.zeitraumVon,
        dateBis: abrechnung.zeitraumBis,
        mieterName: ea.mieterName,
        objektAdresse: abrechnung.objektAdresse,
        introText: `Sehr geehrte/r ${ea.mieterName},\n\nnachfolgend erhalten Sie die Betriebskostenabrechnung fuer die Wohnung ${ea.bezeichnung} fuer den Abrechnungszeitraum ${abrechnung.zeitraumVon} bis ${abrechnung.zeitraumBis}.`,
        kostenarten: ea.positionen.map((p) => ({
          name: p.kostenart,
          kosten: p.betragAnteilig.toFixed(2),
          schluessel: p.verteilerschluessel,
        })),
        total: ea.gesamtBetrag.toFixed(2),
        outroText: `Vorauszahlungen: ${formatEuro(ea.vorauszahlung)}\nSaldo (Nachzahlung / Erstattung): ${formatEuro(ea.saldo)}\n\nMit freundlichen Gruessen\nIhre Hausverwaltung`,
      });
      downloadPDF(doc, sanitizeFilename(`Nebenkosten_${ea.mieterName}_${abrechnung.zeitraumVon.substring(0,4)}.pdf`));
    } catch {
      toast({ title: "PDF Fehler", variant: "destructive" });
    }
  }

  if (!selectedObjektId) {
    return (
      <div className="flex flex-col items-center justify-center h-60 gap-3 text-muted-foreground">
        <Building2 className="h-10 w-10 opacity-30" />
        <p>Bitte zuerst ein Objekt auswaehlen.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Einstellungen */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Abrechnungszeitraum</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="space-y-1 flex-1">
              <Label>Von</Label>
              <Input
                type="date"
                value={zeitraumVon}
                onChange={(e) => { setZeitraumVon(e.target.value); setAbrechnung(null); }}
              />
            </div>
            <div className="space-y-1 flex-1">
              <Label>Bis</Label>
              <Input
                type="date"
                value={zeitraumBis}
                onChange={(e) => { setZeitraumBis(e.target.value); setAbrechnung(null); }}
              />
            </div>
            <Button
              onClick={handleBerechnen}
              className="gap-2 shrink-0"
            >
              <Calculator className="h-4 w-4" />
              Abrechnung berechnen
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Objekt: <span className="font-medium text-foreground">{currentObjekt?.name}</span>
            &nbsp;&mdash;&nbsp;
            {expenses.filter((e) => e.objektId === selectedObjektId).length} Kostenpositionen erfasst
          </p>
        </CardContent>
      </Card>

      {/* Ergebnis */}
      {abrechnung && (
        <>
          {/* Zusammenfassung */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Gesamtkosten</p>
                <p className="text-xl font-bold tabular-nums">{formatEuro(abrechnung.gesamtkostenBrutto)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Einheiten</p>
                <p className="text-xl font-bold">{abrechnung.einheitenAbrechnungen.length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Kostenpositionen</p>
                <p className="text-xl font-bold">
                  {abrechnung.einheitenAbrechnungen[0]?.positionen.length ?? 0}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Gesamtsaldo</p>
                <p className="text-xl font-bold tabular-nums">
                  {formatEuro(abrechnung.einheitenAbrechnungen.reduce((s, e) => s + e.saldo, 0))}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Pro Einheit */}
          {abrechnung.einheitenAbrechnungen.map((ea) => (
            <Card key={ea.wohnungId}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggleExpand(ea.wohnungId)}>
                    {expandedIds.has(ea.wohnungId)
                      ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    }
                    <div>
                      <p className="font-semibold text-sm">{ea.bezeichnung}</p>
                      <p className="text-xs text-muted-foreground">{ea.mieterName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-muted-foreground">Kosten / VZ / Saldo</p>
                      <p className="text-sm font-medium tabular-nums">
                        {formatEuro(ea.gesamtBetrag)} / {formatEuro(ea.vorauszahlung)} /{" "}
                        <span className={ea.saldo > 0 ? "text-destructive" : "text-green-600"}>
                          {formatEuro(ea.saldo)}
                        </span>
                      </p>
                    </div>
                    <Badge variant={ea.saldo > 0 ? "destructive" : "secondary"} className="hidden sm:inline-flex">
                      {ea.saldo > 0 ? "Nachzahlung" : ea.saldo < 0 ? "Erstattung" : "Ausgeglichen"}
                    </Badge>
                    <Button variant="outline" size="sm" className="gap-1" onClick={() => handlePDF(ea)}>
                      <FileDown className="h-3 w-3" />
                      PDF
                    </Button>
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
                            <Badge variant="outline" className="text-xs font-normal">
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
                    <span className={`tabular-nums ${ea.saldo > 0 ? "text-destructive" : "text-green-600"}`}>
                      {formatEuro(Math.abs(ea.saldo))}
                    </span>
                  </div>
                </CardContent>
              )}

              {expandedIds.has(ea.wohnungId) && ea.positionen.length === 0 && (
                <CardContent>
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Keine Kostenpositionen fuer diesen Zeitraum.
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </>
      )}
    </div>
  );
}
