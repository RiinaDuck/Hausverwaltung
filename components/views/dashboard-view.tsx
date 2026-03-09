"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  AlertTriangle,
  CheckCircle2,
  Building2,
  Plus,
  UserPlus,
  FolderOpen,
  Lightbulb,
  Play,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  ExternalLink,
  Handshake,
} from "lucide-react";
import type { AppView } from "@/components/app-dashboard";
import { useAppData } from "@/context/app-data-context";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { ImportErinnerungBanner } from "@/components/import-erinnerung-banner";
import { ProfileBanner } from "@/components/profile-banner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DashboardViewProps {
  onNavigate: (view: AppView) => void;
}

export function DashboardView({ onNavigate }: DashboardViewProps) {
  const { objekte, wohnungen, mieter, zahlungen, selectedObjektId, setSelectedObjektId } =
    useAppData();
  const { isDemo, profile } = useAuth();
  const { toast } = useToast();
  const [statusContainer, setStatusContainer] = useState<HTMLDivElement | null>(null);
  const [inkassoOpen, setInkassoOpen] = useState(false);

  // Vorname extrahieren
  const firstName = profile.vorname || "User";

  const handleDemoRestriction = (action: string) => {
    toast({
      title: "Demo-Modus",
      description: `Im Demo-Modus können Sie keine ${action} anlegen. Bitte melden Sie sich an, um diese Funktion zu nutzen.`,
      variant: "destructive",
    });
  };

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
      {/* Profil-Banner */}
      <ProfileBanner />

      {/* Header */}
      <p className="text-sm md:text-base text-muted-foreground">
        Willkommen zurück {firstName}
      </p>

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
              onClick={() => {
                if (isDemo) {
                  handleDemoRestriction("neue Buchung");
                } else {
                  onNavigate("nebenkosten");
                }
              }}
            >
              <Plus className="h-4 w-4" />
              Neue Buchung
            </Button>
            <Button
              variant="outline"
              className="gap-2 bg-transparent justify-start sm:justify-center"
              onClick={() => {
                if (isDemo) {
                  handleDemoRestriction("neuen Mieter");
                } else {
                  onNavigate("mieter");
                }
              }}
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

      {/* Status-Banner: In Verzug + Import-Erinnerung nebeneinander */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* In Verzug */}
        {(() => {
          // Zähle nur Mieter, die tatsächlich einen "ueberfaellig"-Eintrag in den Zahlungen haben
          const mieterInVerzug = zahlungen.filter((z) => z.status === "ueberfaellig" && z.mieterId !== "unbekannt");
          // Dedupliziere nach Mieter-ID (ein Mieter kann mehrere Monate überfällig sein)
          const uniqueMieterIds = [...new Set(mieterInVerzug.map((z) => z.mieterId))];
          const anzahl = uniqueMieterIds.length;
          if (anzahl === 0) return (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-4 pb-4 h-full flex items-center">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-green-100 p-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-800">Alle Zahlungen aktuell</p>
                      <p className="text-xs text-green-700">Kein Mieter hat ausstehende Zahlungen</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-green-300 text-green-700 hover:bg-green-100"
                    onClick={() => onNavigate("mieter")}
                  >
                    Anzeigen
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
          return (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="pt-4 pb-4 h-full flex items-center">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-destructive/10 p-2">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Mieter in Verzug</p>
                      <p className="text-xs text-muted-foreground">
                        {anzahl} {anzahl === 1 ? "Mieter hat" : "Mieter haben"} ausstehende Zahlungen
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-destructive/30 text-destructive hover:bg-destructive/10"
                    onClick={() => onNavigate("mieter")}
                  >
                    Anzeigen
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })()}

        {/* Import-Erinnerung Banner */}
        <ImportErinnerungBanner onNavigate={onNavigate} statusContainer={statusContainer} />
      </div>

      {/* Full-width Status-Karten (gelb/grün/rot) unterhalb beider Karten */}
      <div ref={setStatusContainer} className="flex flex-col gap-2 empty:hidden" />

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-4 md:gap-6">

        {/* Inkasso-Partner Anzeige */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-100 p-2">
                  <Handshake className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Mietschulden? Professionelle Hilfe nutzen</p>
                  <p className="text-xs text-muted-foreground">Geprüfte Inkasso-Partner für Hausverwaltungen</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                  onClick={() => setInkassoOpen(true)}
                >
                  Jetzt informieren
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

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
                    <TableCell>{wohnungen.filter((w) => w.objektId === objekt.id).length}</TableCell>
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

      {/* Inkasso-Partner Dialog */}
      <Dialog open={inkassoOpen} onOpenChange={setInkassoOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Inkasso-Partner</DialogTitle>
            <DialogDescription>Professionelle Hilfe bei Mietschulden</DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 overflow-auto px-6">
            <div className="space-y-4 pb-4">
              {[
                { initials: "IP", name: "INKASSO PRO GmbH", desc: "Spezialisiert auf Mietforderungen. Bundesweit tätig mit über 15 Jahren Erfahrung.", rating: 5, tags: ["Empfohlen", "Schnell"] },
                { initials: "MF", name: "MietFord24 AG", desc: "Digitales Inkasso für Hausverwaltungen. Automatisierte Mahnläufe und transparentes Reporting.", rating: 4, tags: ["Digital", "Günstig"] },
                { initials: "RK", name: "Recht & Klar Inkasso", desc: "Persönliche Betreuung und außergerichtliche Einigung als Schwerpunkt.", rating: 4, tags: ["Persönlich", "Fair"] },
                { initials: "DI", name: "Deutsche Immobilien-Inkasso", desc: "Marktführer im Bereich Immobilien-Inkasso mit eigener Rechtsabteilung.", rating: 5, tags: ["Marktführer", "Rechtsberatung"] },
                { initials: "SE", name: "SchuldnerExperte e.K.", desc: "Kleine Kanzlei mit hoher Erfolgsquote bei Mietrückständen.", rating: 3, tags: ["Günstig", "Regional"] },
              ].map((partner) => (
                <Card key={partner.initials} className="relative">
                  <span className="absolute top-2 right-3 text-[10px] text-muted-foreground">Anzeige</span>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex gap-3">
                      <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground shrink-0">
                        {partner.initials}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <p className="text-sm font-medium">{partner.name}</p>
                        <p className="text-xs text-muted-foreground">{partner.desc}</p>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${i < partner.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
                            />
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {partner.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-1 h-7 text-xs gap-1"
                          onClick={() => window.open("#", "_blank")}
                        >
                          <ExternalLink className="h-3 w-3" />
                          Jetzt anfragen
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
          <div className="border-t px-6 py-3">
            <p className="text-[10px] text-muted-foreground leading-tight">
              * Bezahlte Partneranzeigen. Wir erhalten eine Provision bei Vermittlung.
            </p>
          </div>
        </DialogContent>
      </Dialog>

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
