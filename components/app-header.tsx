"use client";

import { useState } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  HelpCircle,
  Menu,
  LayoutDashboard,
  Building2,
  Home,
  Users,
  Receipt,
  FileText,
  Gauge,
  BarChart3,
  Briefcase,
  User,
  Save,
} from "lucide-react";
import type { AppView } from "@/components/app-dashboard";
import { useAppData } from "@/context/app-data-context";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";

interface HelpSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  fields: { name: string; description: string }[];
}

const helpSections: HelpSection[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: <LayoutDashboard className="h-4 w-4" />,
    description:
      "Das Dashboard bietet Ihnen eine Übersicht über alle wichtigen Kennzahlen Ihrer Immobilienverwaltung auf einen Blick.",
    fields: [
      {
        name: "Gesamtübersicht",
        description:
          "Zeigt die Anzahl Ihrer Objekte, Wohnungen, Mieter und den aktuellen Leerstand.",
      },
      {
        name: "Monatliche Einnahmen",
        description:
          "Summe aller Mieteinnahmen (Kaltmiete + Nebenkosten) des aktuellen Monats.",
      },
      {
        name: "Offene Posten",
        description: "Anzahl und Summe der noch nicht bezahlten Rechnungen.",
      },
      {
        name: "Anstehende Aufgaben",
        description:
          "Übersicht über bald ablaufende Zähler-Eichungen, Versicherungen oder Wartungen.",
      },
    ],
  },
  {
    id: "objekte",
    title: "Objekte",
    icon: <Building2 className="h-4 w-4" />,
    description:
      "Hier verwalten Sie alle Ihre Immobilienobjekte (Häuser, Wohnanlagen). Jedes Objekt kann mehrere Wohnungen enthalten.",
    fields: [
      {
        name: "Objektname",
        description:
          "Ein eindeutiger Name für das Objekt, z.B. 'Mehrfamilienhaus Berliner Str. 42'.",
      },
      {
        name: "Straße/PLZ/Ort",
        description: "Die vollständige Adresse des Objekts.",
      },
      {
        name: "Objekttyp",
        description:
          "'Miete' für reine Mietobjekte oder 'WEG' für Wohnungseigentümergemeinschaften.",
      },
      {
        name: "Eigentümer",
        description: "Name, Adresse und Kontaktdaten des Eigentümers.",
      },
      {
        name: "Bankverbindung",
        description:
          "Kontoverbindung für Mieteingänge und Zahlungen (IBAN, BIC, Bank).",
      },
      {
        name: "Objektdaten",
        description:
          "Baujahr, Sanierungsjahr, Gesamtflächen und Anzahl der Einheiten.",
      },
      {
        name: "Notizen",
        description: "Freies Textfeld für wichtige Informationen zum Objekt.",
      },
    ],
  },
  {
    id: "wohnungen",
    title: "Wohnungen",
    icon: <Home className="h-4 w-4" />,
    description:
      "Verwalten Sie hier die einzelnen Wohneinheiten innerhalb eines Objekts mit allen relevanten Flächendaten.",
    fields: [
      {
        name: "Bezeichnung",
        description:
          "Eindeutige Bezeichnung der Wohnung, z.B. 'Whg. 1 - EG links' oder 'Apartment 3.2'.",
      },
      {
        name: "Etage",
        description: "Stockwerk der Wohnung (EG, 1.OG, 2.OG, DG, etc.).",
      },
      {
        name: "Wohnfläche (m²)",
        description:
          "Die Wohnfläche nach Wohnflächenverordnung - relevant für Nebenkostenverteilung.",
      },
      {
        name: "Nutzfläche (m²)",
        description:
          "Zusätzliche Nutzflächen wie Keller, Dachboden (oft anders gewichtet).",
      },
      {
        name: "Zimmeranzahl",
        description:
          "Anzahl der Zimmer (ohne Küche/Bad) für Wohnungsbeschreibung.",
      },
      {
        name: "Heizfläche (m²)",
        description:
          "Fläche für die Heizkostenverteilung - kann von Wohnfläche abweichen.",
      },
      {
        name: "Status",
        description: "'Vermietet', 'Leer' (für Leerstand) oder 'Eigennutzung'.",
      },
      {
        name: "Miete/Nebenkosten",
        description: "Aktuelle Kaltmiete und Nebenkostenvorauszahlung in Euro.",
      },
    ],
  },
  {
    id: "mieter",
    title: "Mieter & Mieten",
    icon: <Users className="h-4 w-4" />,
    description:
      "Erfassen Sie hier alle Mieterdaten, Mietverträge und zugehörige Informationen zu Zahlungen und Kaution.",
    fields: [
      {
        name: "Wohnung",
        description:
          "Die Wohnung, die der Mieter gemietet hat - wählen Sie aus den verfügbaren Einheiten.",
      },
      {
        name: "Name/Anrede",
        description:
          "Vollständiger Name des Mieters mit Anrede (Herr/Frau/Familie/Firma).",
      },
      {
        name: "Einzugsdatum",
        description:
          "Beginn des Mietverhältnisses - wichtig für Nebenkostenabrechnung.",
      },
      {
        name: "Kaltmiete (€)",
        description: "Die monatliche Grundmiete ohne Nebenkosten.",
      },
      {
        name: "Nebenkosten (€)",
        description: "Monatliche Vorauszahlung für Betriebskosten.",
      },
      {
        name: "Kaution (€)",
        description:
          "Hinterlegte Mietkaution (üblicherweise 2-3 Monatskaltmieten).",
      },
      {
        name: "Kontaktdaten",
        description:
          "E-Mail und Telefonnummer für die Kommunikation mit dem Mieter.",
      },
      {
        name: "Verteilerschlüssel",
        description:
          "Individuelle Schlüssel für die Nebenkostenverteilung (Personen, MEA, etc.).",
      },
      {
        name: "Zählerstände",
        description: "Verknüpfung zu den Zählern in der Wohnung des Mieters.",
      },
    ],
  },
  {
    id: "nebenkosten",
    title: "Nebenkosten",
    icon: <Receipt className="h-4 w-4" />,
    description:
      "Erstellen Sie hier die jährliche Nebenkostenabrechnung für Ihre Mieter mit allen umlagefähigen Kosten.",
    fields: [
      {
        name: "Mieter auswählen",
        description:
          "Wählen Sie den Mieter, für den die Abrechnung erstellt werden soll.",
      },
      {
        name: "Abrechnungszeitraum",
        description:
          "Von/Bis-Datum der Abrechnungsperiode (meist Kalenderjahr).",
      },
      {
        name: "Kostenart",
        description:
          "Art der Betriebskosten aus der Dropdown-Liste oder eigene Eingabe.",
      },
      {
        name: "Kosten (€)",
        description:
          "Gesamtkosten dieser Kostenart für das gesamte Objekt im Abrechnungszeitraum.",
      },
      {
        name: "Verteilerschlüssel",
        description:
          "Wie werden die Kosten verteilt: nach Wohnfläche, Personenanzahl, Verbrauch, etc.",
      },
      {
        name: "Einleitungstext",
        description:
          "Anrede und Einleitung für die Abrechnung - wird im PDF oben angezeigt.",
      },
      {
        name: "Schlusstext",
        description:
          "Zahlungshinweise und Grußformel - erscheint am Ende der Abrechnung.",
      },
      {
        name: "PDF Export",
        description:
          "Erstellt ein druckfertiges PDF mit allen Angaben und der Mieteranschrift.",
      },
    ],
  },
  {
    id: "rechnungen",
    title: "Rechnungen",
    icon: <FileText className="h-4 w-4" />,
    description:
      "Verwalten Sie hier Rechnungen an Mieter oder Eigentümer, z.B. für Nachzahlungen, Reparaturen oder Gebühren.",
    fields: [
      {
        name: "Rechnungsnummer",
        description: "Eindeutige Nummer zur Identifikation (z.B. 2024-001).",
      },
      {
        name: "Datum",
        description: "Rechnungsdatum - relevant für Zahlungsfristen.",
      },
      {
        name: "Empfänger Name",
        description:
          "Name des Rechnungsempfängers (Mieter, Eigentümer, Firma).",
      },
      {
        name: "Empfänger Adresse",
        description: "Vollständige Anschrift für den Rechnungsversand.",
      },
      {
        name: "Positionen",
        description:
          "Einzelne Rechnungspositionen mit Beschreibung, Menge und Einzelpreis.",
      },
      {
        name: "Bemerkung",
        description:
          "Optionale Hinweise wie Zahlungsziel oder Verwendungszweck.",
      },
      {
        name: "Status",
        description:
          "'Offen' für unbezahlt, 'Bezahlt' nach Zahlungseingang, 'Storniert' für ungültige Rechnungen.",
      },
      {
        name: "Bearbeiten/Löschen",
        description:
          "Klicken Sie auf das Stift-Symbol zum Bearbeiten oder den Papierkorb zum Löschen.",
      },
    ],
  },
  {
    id: "zaehler",
    title: "Zähler",
    icon: <Gauge className="h-4 w-4" />,
    description:
      "Erfassen Sie hier alle Wasserzähler, Wärmezähler und Rauchmelder mit Eichdaten und Standorten.",
    fields: [
      {
        name: "Wohnung",
        description:
          "Die Wohnung, in der sich der Zähler befindet - wählen Sie aus dem aktuellen Objekt.",
      },
      {
        name: "Montageort",
        description:
          "Genauer Standort des Zählers (z.B. 'Küche', 'Bad', 'Flur').",
      },
      {
        name: "Geräteart",
        description:
          "Art des Zählers: Kaltwasser, Warmwasser, Wärmemengenzähler, etc.",
      },
      {
        name: "Gerätenummer",
        description:
          "Seriennummer oder Zählernummer zur eindeutigen Identifikation.",
      },
      {
        name: "Geeicht bis",
        description:
          "Datum bis wann die Eichung gültig ist - nach Ablauf ist Austausch erforderlich.",
      },
      {
        name: "Hersteller/Typ",
        description: "Hersteller und Modellbezeichnung für Ersatzbeschaffung.",
      },
      {
        name: "Rauchmelder",
        description: "Toggle um zwischen Zählern und Rauchmeldern zu wechseln.",
      },
      {
        name: "Lebensdauer bis",
        description:
          "Bei Rauchmeldern: Datum bis wann das Gerät ausgetauscht werden muss (meist 10 Jahre).",
      },
    ],
  },
  {
    id: "statistiken",
    title: "Statistiken",
    icon: <BarChart3 className="h-4 w-4" />,
    description:
      "Visualisierung Ihrer Immobiliendaten mit Diagrammen und Auswertungen für bessere Übersicht.",
    fields: [
      {
        name: "Einnahmenübersicht",
        description: "Diagramm der monatlichen Mieteinnahmen über das Jahr.",
      },
      {
        name: "Leerstandsquote",
        description:
          "Prozentualer Anteil leerstehender Wohnungen an Gesamtbestand.",
      },
      {
        name: "Kostenverteilung",
        description: "Aufschlüsselung der Betriebskosten nach Kategorien.",
      },
      {
        name: "Mietentwicklung",
        description: "Historische Entwicklung der Mieten pro Quadratmeter.",
      },
      {
        name: "Objektvergleich",
        description:
          "Vergleich von Kennzahlen zwischen verschiedenen Objekten.",
      },
    ],
  },
  {
    id: "hausmanager",
    title: "Hausmanager",
    icon: <Briefcase className="h-4 w-4" />,
    description:
      "Zentrale Verwaltung aller externen Kontakte, Dienstleister, Versicherungen und Behörden rund um Ihre Immobilien.",
    fields: [
      {
        name: "Finanzamt",
        description:
          "Zuständiges Finanzamt mit Steuernummer, Ansprechpartner und Bankverbindung.",
      },
      {
        name: "Steuerberater",
        description:
          "Kontaktdaten Ihres Steuerberaters für Rückfragen und Unterlagen.",
      },
      {
        name: "Grundbesitzabgaben",
        description:
          "Gemeinde, Aktenzeichen und jährliche Beträge für Grundsteuer etc.",
      },
      {
        name: "Energieversorger",
        description:
          "Strom- und Gasversorger mit Vertragsnummern und Kontaktdaten.",
      },
      {
        name: "Wasserversorger",
        description: "Wasserwerk mit Kundennummer und Ansprechpartner.",
      },
      {
        name: "Bank/Sparkasse",
        description:
          "Bankverbindungen mit Ansprechpartnern für Finanzierungsfragen.",
      },
      {
        name: "Versicherungen",
        description:
          "Alle Versicherungen (Gebäude, Haftpflicht, Glas, etc.) mit Policennummern.",
      },
      {
        name: "Handwerker",
        description:
          "Kontakte zu Handwerkern verschiedener Gewerke für Reparaturen.",
      },
      {
        name: "Rechtsanwalt",
        description: "Anwalt für mietrechtliche Fragen und Streitigkeiten.",
      },
      {
        name: "Brief erstellen",
        description:
          "Direkt aus dem Hausmanager Briefe an Kontakte erstellen und als PDF exportieren.",
      },
    ],
  },
];

interface AppHeaderProps {
  currentView: AppView;
  onMenuClick?: () => void;
}

const viewTitles: Record<AppView, string> = {
  dashboard: "Dashboard",
  objekte: "Objektdaten (Stammdaten)",
  wohnungen: "Wohnungsdaten",
  mieter: "Mieter & Mieten",
  nebenkosten: "Nebenkosten – Kosten erfassen",
  "nebenkosten-abrechnung": "Nebenkosten – Abrechnung erstellen",
  zaehler: "Zähler & Rauchmelder",
  hausmanager: "Hausmanager / Finanzamt",
  rechnungen: "Rechnungen",
  statistiken: "Statistiken",
};

export function AppHeader({ currentView, onMenuClick }: AppHeaderProps) {
  const { objekte, selectedObjektId, setSelectedObjektId } = useAppData();
  const { profile, updateProfile, getInitials, isDemo } = useAuth();
  const { toast } = useToast();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [editedProfile, setEditedProfile] = useState(profile);

  const handleOpenProfileDialog = () => {
    setEditedProfile({ ...profile });
    setProfileDialogOpen(true);
  };

  const handleSaveProfile = () => {
    if (isDemo) {
      toast({
        title: "Demo-Modus",
        description:
          "Im Demo-Modus können keine Änderungen gespeichert werden. Bitte melden Sie sich an, um Ihr Profil zu bearbeiten.",
        variant: "destructive",
      });
      return;
    }
    updateProfile(editedProfile);
    setProfileDialogOpen(false);
    toast({
      title: "Profil gespeichert",
      description: "Ihre Profildaten wurden erfolgreich aktualisiert.",
    });
  };

  return (
    <header className="h-14 md:h-16 border-b border-border bg-card px-4 md:px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-9 w-9"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-base md:text-xl font-semibold truncate">
          {viewTitles[currentView]}
        </h1>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        {objekte.length > 0 && (
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden lg:inline">
              Aktuelles Objekt:
            </span>
            <Select
              value={selectedObjektId || ""}
              onValueChange={setSelectedObjektId}
            >
              <SelectTrigger className="w-[140px] md:w-[200px] h-9">
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
        )}
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Bell className="h-4 w-4" />
        </Button>

        {/* Profil-Button */}
        <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 hidden sm:flex"
              onClick={handleOpenProfileDialog}
            >
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-success" />
                Profil bearbeiten
                {isDemo && (
                  <Badge variant="secondary" className="ml-2">
                    Demo
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                {isDemo
                  ? "Im Demo-Modus können Profildaten nicht geändert werden."
                  : "Aktualisieren Sie Ihre persönlichen Daten und Kontaktinformationen."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="profile-name">Name</Label>
                <Input
                  id="profile-name"
                  value={editedProfile.name}
                  onChange={(e) =>
                    setEditedProfile({ ...editedProfile, name: e.target.value })
                  }
                  disabled={isDemo}
                  placeholder="Ihr vollständiger Name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-email">E-Mail</Label>
                <Input
                  id="profile-email"
                  type="email"
                  value={editedProfile.email}
                  onChange={(e) =>
                    setEditedProfile({
                      ...editedProfile,
                      email: e.target.value,
                    })
                  }
                  disabled={isDemo}
                  placeholder="ihre@email.de"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-anschrift">Anschrift</Label>
                <Input
                  id="profile-anschrift"
                  value={editedProfile.anschrift}
                  onChange={(e) =>
                    setEditedProfile({
                      ...editedProfile,
                      anschrift: e.target.value,
                    })
                  }
                  disabled={isDemo}
                  placeholder="Straße, PLZ Ort"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-ansprechpartner">Ansprechpartner</Label>
                <Input
                  id="profile-ansprechpartner"
                  value={editedProfile.ansprechpartner}
                  onChange={(e) =>
                    setEditedProfile({
                      ...editedProfile,
                      ansprechpartner: e.target.value,
                    })
                  }
                  disabled={isDemo}
                  placeholder="Name des Ansprechpartners"
                />
              </div>
              <div className="pt-2 p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">
                  <strong>Initialen:</strong> {getInitials()} (automatisch
                  generiert)
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setProfileDialogOpen(false)}
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleSaveProfile}
                disabled={isDemo}
                className="gap-2 bg-success hover:bg-success/90 text-success-foreground"
              >
                <Save className="h-4 w-4" />
                Speichern
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 hidden sm:flex"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-success" />
                Hilfe & Dokumentation
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[60vh] pr-4">
              <p className="text-sm text-muted-foreground mb-4">
                Willkommen bei der Hausverwaltungs-Software! Hier finden Sie
                Erklärungen zu allen Bereichen und Eingabefeldern.
              </p>
              <Accordion type="single" collapsible className="w-full">
                {helpSections.map((section) => (
                  <AccordionItem key={section.id} value={section.id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-success/10 text-success">
                          {section.icon}
                        </div>
                        <span className="font-semibold">{section.title}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pl-11 space-y-4">
                        <p className="text-sm text-muted-foreground">
                          {section.description}
                        </p>
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium">
                            Felder & Funktionen:
                          </h4>
                          <div className="space-y-2">
                            {section.fields.map((field, index) => (
                              <div
                                key={index}
                                className="rounded-lg bg-muted/50 p-3"
                              >
                                <p className="font-medium text-sm">
                                  {field.name}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {field.description}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              <div className="mt-6 p-4 rounded-lg bg-success/10 border border-success/20">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-success" />
                  Tipps für den Einstieg
                </h4>
                <ul className="mt-2 text-xs text-muted-foreground space-y-1 list-disc list-inside">
                  <li>
                    Beginnen Sie mit dem Anlegen eines Objekts unter "Objekte"
                  </li>
                  <li>Fügen Sie dann Wohnungen zu diesem Objekt hinzu</li>
                  <li>Erfassen Sie die Mieter für jede vermietete Wohnung</li>
                  <li>
                    Tragen Sie Zähler und Rauchmelder für die Wohnungen ein
                  </li>
                  <li>Nutzen Sie das Dashboard für eine schnelle Übersicht</li>
                </ul>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
