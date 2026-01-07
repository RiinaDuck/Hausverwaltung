"use client";

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
} from "lucide-react";
import type { AppView } from "@/components/app-dashboard";
import { useAppData } from "@/context/app-data-context";

interface DashboardViewProps {
  onNavigate: (view: AppView) => void;
}

const aktivitaeten = [
  {
    text: "Miete eingegangen: Wohnung 1.OG links",
    zeit: "vor 2 Std.",
    betrag: "+€850",
    typ: "einnahme",
  },
  {
    text: "Nebenkostenabrechnung erstellt",
    zeit: "vor 5 Std.",
    betrag: null,
    typ: "info",
  },
  {
    text: "Zählerablesung fällig: Musterhaus Berlin",
    zeit: "vor 1 Tag",
    betrag: null,
    typ: "warnung",
  },
  {
    text: "Hausgeld eingegangen: WEG Parkresidenz",
    zeit: "vor 2 Tagen",
    betrag: "+€2.450",
    typ: "einnahme",
  },
];

export function DashboardView({ onNavigate }: DashboardViewProps) {
  const { objekte, selectedObjektId, setSelectedObjektId } = useAppData();

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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gesamteinnahmen YTD
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">€48.250,00</div>
            <div className="flex items-center gap-1 text-xs text-success mt-1">
              <ArrowUpRight className="h-3 w-3" />
              +12,5% gegenüber Vorjahr
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Offene Forderungen
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">€1.850,00</div>
            <p className="text-xs text-muted-foreground mt-1">
              2 ausstehende Zahlungen
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Leerstand
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1 Einheit</div>
            <p className="text-xs text-muted-foreground mt-1">
              4,2% Leerstandsquote
            </p>
          </CardContent>
        </Card>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Active Objects Table */}
        <Card className="lg:col-span-2">
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

        {/* Recent Activities */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Letzte Aktivitäten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {aktivitaeten.map((aktivitaet, index) => (
              <div
                key={index}
                className="flex items-start justify-between gap-3 text-sm"
              >
                <div className="space-y-1">
                  <p className="leading-snug">{aktivitaet.text}</p>
                  <p className="text-xs text-muted-foreground">
                    {aktivitaet.zeit}
                  </p>
                </div>
                {aktivitaet.betrag && (
                  <span className="text-success font-medium whitespace-nowrap">
                    {aktivitaet.betrag}
                  </span>
                )}
              </div>
            ))}
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
                "_blank"
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
