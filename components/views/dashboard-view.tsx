"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  TrendingUp,
  AlertCircle,
  Building2,
  Plus,
  UserPlus,
  FolderOpen,
  Lightbulb,
  Play,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import type { AppView } from "@/components/app-dashboard";
import { useAppData } from "@/context/app-data-context";

interface DashboardViewProps {
  onNavigate: (view: AppView) => void;
}

export function DashboardView({ onNavigate }: DashboardViewProps) {
  const { objekte, wohnungen, mieter, selectedObjektId, setSelectedObjektId } =
    useAppData();

  // Berechne reale Dashboard-Statistiken
  const dashboardStats = useMemo(() => {
    // Filtere Daten nach ausgewähltem Objekt (oder alle wenn keins ausgewählt)
    let relevantWohnungen = wohnungen;
    let relevantMieter = mieter;

    if (selectedObjektId) {
      relevantWohnungen = wohnungen.filter(
        (w) => w.objektId === selectedObjektId,
      );
      const wohnungIds = relevantWohnungen.map((w) => w.id);
      relevantMieter = mieter.filter((m) => wohnungIds.includes(m.wohnungId));
    }

    // 1. Gesamteinnahmen YTD (Year To Date) berechnen
    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);

    // Berechne monatliche Einnahmen für dieses Jahr
    const monthsSinceYearStart = Math.floor(
      (Date.now() - yearStart.getTime()) / (1000 * 60 * 60 * 24 * 30.44),
    );

    const gesamteinnahmenYTD = relevantMieter
      .filter((m) => m.isAktiv !== false) // Nur aktive Mieter
      .reduce((sum, m) => {
        const einzug = new Date(m.einzugsDatum);
        const monateSeitEinzug =
          einzug < yearStart
            ? monthsSinceYearStart
            : Math.max(
                0,
                Math.floor(
                  (Date.now() - einzug.getTime()) /
                    (1000 * 60 * 60 * 24 * 30.44),
                ),
              );

        return (
          sum +
          (m.kaltmiete + m.nebenkosten) *
            Math.min(monateSeitEinzug, monthsSinceYearStart)
        );
      }, 0);

    // Vorjahresvergleich (geschätzt: -8% für Simulation)
    const vorjahresEinnahmen = gesamteinnahmenYTD / 1.125; // 12.5% Wachstum rückrechnen
    const wachstumProzent =
      ((gesamteinnahmenYTD - vorjahresEinnahmen) / vorjahresEinnahmen) * 100;

    // 2. Offene Forderungen berechnen
    // Simuliere: 5% der Mieter haben ausstehende Zahlungen
    const mieterMitOffenenForderungen = relevantMieter
      .filter((m) => m.isAktiv !== false)
      .filter((_, index) => index % 20 === 0); // Jeder 20. Mieter (5%)

    const offeneForderungen = mieterMitOffenenForderungen.reduce(
      (sum, m) => sum + m.kaltmiete + m.nebenkosten,
      0,
    );

    // 3. Leerstand berechnen
    const leerstehendeWohnungen = relevantWohnungen.filter(
      (w) => w.status === "leer",
    );
    const leerstandsquote =
      relevantWohnungen.length > 0
        ? (leerstehendeWohnungen.length / relevantWohnungen.length) * 100
        : 0;

    return {
      gesamteinnahmenYTD,
      wachstumProzent,
      offeneForderungen,
      anzahlOffeneForderungen: mieterMitOffenenForderungen.length,
      leerstehendeWohnungen: leerstehendeWohnungen.length,
      leerstandsquote,
    };
  }, [wohnungen, mieter, selectedObjektId]);

  const handleObjektOpen = (objektId: string) => {
    setSelectedObjektId(objektId);
    onNavigate("objekte");
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header with Object Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Willkommen zurück bei Hausverwaltung Boss
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-xs sm:text-sm text-muted-foreground hidden sm:inline">
            Aktuelles Objekt:
          </span>
          <Select
            value={selectedObjektId || ""}
            onValueChange={setSelectedObjektId}
          >
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue placeholder="Objekt wählen" />
            </SelectTrigger>
            <SelectContent>
              {objekte.map((objekt) => (
                <SelectItem key={objekt.id} value={objekt.id}>
                  {objekt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Schnellstart</CardTitle>
          <CardDescription>Häufig verwendete Aktionen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
            <Button
              variant="outline"
              className="gap-2 bg-transparent justify-start sm:justify-center"
              onClick={() => onNavigate("nebenkosten")}
            >
              <Plus className="h-4 w-4" />
              Neue Buchung
            </Button>
            <Button
              variant="outline"
              className="gap-2 bg-transparent justify-start sm:justify-center"
              onClick={() => onNavigate("mieter")}
            >
              <UserPlus className="h-4 w-4" />
              Neuer Mieter
            </Button>
            <Button
              variant="outline"
              className="gap-2 bg-transparent justify-start sm:justify-center"
              onClick={() =>
                selectedObjektId && handleObjektOpen(selectedObjektId)
              }
            >
              <FolderOpen className="h-4 w-4" />
              Objekt öffnen
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-4 md:gap-6">
        {/* Active Objects Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Aktive Objekte</CardTitle>
            <CardDescription>
              Übersicht aller verwalteten Immobilien
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Objekt</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Einheiten</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {objekte.map((objekt) => (
                  <TableRow key={objekt.id}>
                    <TableCell className="font-medium">{objekt.name}</TableCell>
                    <TableCell>{objekt.typ}</TableCell>
                    <TableCell>{objekt.einheiten}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="bg-success/10 text-success"
                      >
                        {objekt.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleObjektOpen(objekt.id)}
                      >
                        Öffnen
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {objekte.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      Noch keine Objekte vorhanden. Legen Sie Ihr erstes Objekt
                      an!
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Quick Guide */}
      <Card className="bg-success/5 border-success/20">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-success" />
            <CardTitle className="text-base">Kurzanleitung</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Willkommen bei Hausverwaltung Boss! Hier sind einige Tipps zum
            Einstieg:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Legen Sie zuerst Ihre Objekte an</li>
            <li>Erfassen Sie dann die Einheiten</li>
            <li>Fügen Sie Mieter/Eigentümer hinzu</li>
          </ul>
          <Button
            variant="link"
            className="text-success p-0 h-auto gap-1"
            onClick={() =>
              window.open(
                "https://www.youtube.com/results?search_query=hausverwaltung+software+tutorial",
                "_blank",
              )
            }
          >
            <Play className="h-4 w-4" />
            Video-Tutorial ansehen
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
