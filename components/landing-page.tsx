"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Building2,
  Calculator,
  FileText,
  Shield,
  Users,
  BarChart3,
  Download,
  CheckCircle2,
  Home,
  ArrowRight,
  Menu,
  X,
  HelpCircle,
  LayoutDashboard,
  DoorOpen,
  Receipt,
  Gauge,
  Briefcase,
} from "lucide-react";

interface LandingPageProps {
  onOpenApp: () => void;
  onLogin: (username: string, password: string) => boolean;
  onStartDemo: () => void;
}

export function LandingPage({ onOpenApp, onLogin, onStartDemo }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const handleLogin = () => {
    setLoginError("");
    if (onLogin(loginUsername, loginPassword)) {
      setLoginDialogOpen(false);
      setLoginUsername("");
      setLoginPassword("");
      onOpenApp();
    } else {
      setLoginError("Ungültige Anmeldedaten. Bitte versuchen Sie es erneut.");
    }
  };

  const handleStartDemo = () => {
    onStartDemo();
    onOpenApp();
  };

  // Hilfe-Sektionen für den Dialog
  const helpSections = [
    {
      id: "dashboard",
      title: "Dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
      description: "Das Dashboard bietet Ihnen eine Übersicht über alle wichtigen Kennzahlen.",
      fields: [
        { name: "Gesamtübersicht", description: "Zeigt Objekte, Wohnungen, Mieter und Leerstand." },
        { name: "Monatliche Einnahmen", description: "Summe aller Mieteinnahmen des aktuellen Monats." },
      ],
    },
    {
      id: "objekte",
      title: "Objekte",
      icon: <Building2 className="h-4 w-4" />,
      description: "Verwalten Sie alle Ihre Immobilienobjekte.",
      fields: [
        { name: "Objektname", description: "Eindeutiger Name für das Objekt." },
        { name: "Objekttyp", description: "'Miete' oder 'WEG' für Wohnungseigentümergemeinschaften." },
      ],
    },
    {
      id: "wohnungen",
      title: "Wohnungen",
      icon: <DoorOpen className="h-4 w-4" />,
      description: "Verwalten Sie einzelne Wohneinheiten innerhalb eines Objekts.",
      fields: [
        { name: "Bezeichnung", description: "Eindeutige Bezeichnung der Wohnung." },
        { name: "Wohnfläche", description: "Relevant für Nebenkostenverteilung." },
      ],
    },
    {
      id: "mieter",
      title: "Mieter & Mieten",
      icon: <Users className="h-4 w-4" />,
      description: "Erfassen Sie Mieterdaten, Verträge und Zahlungsinformationen.",
      fields: [
        { name: "Mietvertrag", description: "Einzugsdatum und Mietkonditionen." },
        { name: "Kommunikation", description: "Briefe und Nachrichten an Mieter." },
      ],
    },
    {
      id: "nebenkosten",
      title: "Nebenkosten",
      icon: <Receipt className="h-4 w-4" />,
      description: "Erstellen Sie die jährliche Nebenkostenabrechnung.",
      fields: [
        { name: "Kostenarten", description: "Betriebskosten nach Kategorien." },
        { name: "Verteilerschlüssel", description: "Wohnfläche, Personen, Verbrauch etc." },
      ],
    },
    {
      id: "zaehler",
      title: "Zähler & Rauchmelder",
      icon: <Gauge className="h-4 w-4" />,
      description: "Erfassen Sie alle Zähler mit Eichdaten und Standorten.",
      fields: [
        { name: "Eichfristen", description: "Überwachung der Eichgültigkeit." },
        { name: "Rauchmelder", description: "Wartungsintervalle und Lebensdauer." },
      ],
    },
    {
      id: "hausmanager",
      title: "Hausmanager",
      icon: <Briefcase className="h-4 w-4" />,
      description: "Verwaltung aller externen Kontakte und Dienstleister.",
      fields: [
        { name: "Versicherungen", description: "Policen und Ansprechpartner." },
        { name: "Handwerker", description: "Kontakte für Reparaturen." },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-14 md:h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-lg bg-primary">
              <Home className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground" />
            </div>
            <span className="font-semibold text-base md:text-lg">
              Hausverwaltung <span className="text-success">Boss</span>
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a
              href="#features"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Funktionen
            </a>
            <a
              href="#how-it-works"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              So funktioniert's
            </a>
            <a
              href="#faq"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              FAQ
            </a>
          </nav>
          <div className="flex items-center gap-2 md:gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className="hidden sm:flex"
              onClick={() => setLoginDialogOpen(true)}
            >
              Anmelden
            </Button>
            <Button
              size="sm"
              onClick={handleStartDemo}
              className="bg-success hover:bg-success/90 text-success-foreground"
            >
              <span className="hidden sm:inline">Jetzt starten</span>
              <span className="sm:hidden">Start</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-card p-4 space-y-3">
            <a
              href="#features"
              className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              Funktionen
            </a>
            <a
              href="#how-it-works"
              className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              So funktioniert's
            </a>
            <a
              href="#faq"
              className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
            >
              FAQ
            </a>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => setLoginDialogOpen(true)}
            >
              Anmelden
            </Button>
          </div>
        )}
      </header>

      {/* Login Dialog */}
      <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success">
                <Home className="h-4 w-4 text-success-foreground" />
              </div>
              Anmelden
            </DialogTitle>
            <DialogDescription>
              Melden Sie sich an, um auf Ihre Hausverwaltung zuzugreifen.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username">Benutzername</Label>
              <Input
                id="username"
                type="text"
                placeholder="Benutzername eingeben"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                placeholder="Passwort eingeben"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            {loginError && (
              <p className="text-sm text-destructive">{loginError}</p>
            )}
            <Button 
              className="w-full bg-success hover:bg-success/90 text-success-foreground" 
              onClick={handleLogin}
            >
              Anmelden
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Help Dialog */}
      <Dialog open={helpDialogOpen} onOpenChange={setHelpDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-success" />
              Hilfe & Dokumentation
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <p className="text-sm text-muted-foreground mb-4">
              Willkommen bei Hausverwaltung Boss! Hier finden Sie Erklärungen zu allen Bereichen.
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
                      <div className="space-y-2">
                        {section.fields.map((field, index) => (
                          <div key={index} className="rounded-lg bg-muted/50 p-3">
                            <p className="font-medium text-sm">{field.name}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {field.description}
                            </p>
                          </div>
                        ))}
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
                <li>Beginnen Sie mit dem Anlegen eines Objekts</li>
                <li>Fügen Sie dann Wohnungen hinzu</li>
                <li>Erfassen Sie die Mieter für jede Wohnung</li>
                <li>Nutzen Sie das Dashboard für eine schnelle Übersicht</li>
              </ul>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 md:py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <div className="space-y-4 md:space-y-6">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance">
                Immobilienverwaltung,{" "}
                <span className="text-success">endlich einfach.</span>
              </h1>
              <p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-lg text-pretty">
                Die moderne Lösung für private Vermieter und WEG-Verwalter.
                Keine doppelte Buchführung nötig. Starten Sie kostenlos.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                <Button
                  size="lg"
                  onClick={handleStartDemo}
                  className="bg-success hover:bg-success/90 text-success-foreground gap-2 w-full sm:w-auto"
                >
                  Demo starten
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto gap-2"
                  onClick={() => setHelpDialogOpen(true)}
                >
                  <HelpCircle className="h-4 w-4" />
                  Video-Tutorial ansehen
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-4 md:gap-6 pt-2 md:pt-4">
                <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                  Kostenlos testen
                </div>
                <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                  Keine Kreditkarte
                </div>
                <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                  DSGVO-konform
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
                <div className="bg-primary p-3 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <span className="text-xs text-primary-foreground/70 ml-2">
                    app.hausverwaltung-boss.de
                  </span>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-4 rounded-lg bg-secondary">
                      <p className="text-xs text-muted-foreground">
                        Einnahmen YTD
                      </p>
                      <p className="text-xl font-bold text-success">€48.250</p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary">
                      <p className="text-xs text-muted-foreground">Offen</p>
                      <p className="text-xl font-bold text-destructive">
                        €1.850
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary">
                      <p className="text-xs text-muted-foreground">Einheiten</p>
                      <p className="text-xl font-bold">24</p>
                    </div>
                  </div>
                  <div className="h-32 rounded-lg bg-secondary flex items-center justify-center">
                    <BarChart3 className="h-16 w-16 text-muted-foreground/30" />
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-success/20 rounded-full blur-2xl" />
              <div className="absolute -top-6 -right-6 w-32 h-32 bg-primary/20 rounded-full blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Alles was Sie brauchen
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Verwalten Sie Ihre Immobilien effizient mit unserer umfassenden
              Software-Lösung.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-border bg-card hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center mb-2">
                  <Building2 className="h-6 w-6 text-success" />
                </div>
                <CardTitle className="text-lg">
                  Miet- & WEG-Verwaltung
                </CardTitle>
                <CardDescription>
                  Umschaltbar per Objekt. Verwalten Sie Mietobjekte und WEG in
                  einer Anwendung.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-border bg-card hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center mb-2">
                  <Calculator className="h-6 w-6 text-success" />
                </div>
                <CardTitle className="text-lg">Smarte Buchhaltung</CardTitle>
                <CardDescription>
                  Einfache Einnahmen/Ausgaben-Erfassung ohne komplizierte
                  Buchführung.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-border bg-card hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center mb-2">
                  <FileText className="h-6 w-6 text-success" />
                </div>
                <CardTitle className="text-lg">
                  Automatisierte Abrechnung
                </CardTitle>
                <CardDescription>
                  Hausgeld & Nebenkosten-Berichte inkl. §35a EStG auf
                  Knopfdruck.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="border-border bg-card hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center mb-2">
                  <Shield className="h-6 w-6 text-success" />
                </div>
                <CardTitle className="text-lg">Rechtssicher</CardTitle>
                <CardDescription>
                  Immer aktuell mit deutschem Mietrecht und WEG-Gesetz.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              So funktioniert's
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              In nur vier einfachen Schritten zur professionellen
              Immobilienverwaltung.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Building2,
                step: "1",
                title: "Objekt & Einheiten anlegen",
                desc: "Erfassen Sie Ihre Immobilien mit allen Details und Wohneinheiten.",
              },
              {
                icon: Users,
                step: "2",
                title: "Mieter/Eigentümer hinzufügen",
                desc: "Verwalten Sie alle Kontakte zentral an einem Ort.",
              },
              {
                icon: Calculator,
                step: "3",
                title: "Ausgaben erfassen",
                desc: "Per Bankimport oder manuell – schnell und einfach.",
              },
              {
                icon: Download,
                step: "4",
                title: "Berichte herunterladen",
                desc: "Generieren Sie Abrechnungen mit einem Klick.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="relative inline-flex items-center justify-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                    <item.icon className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-success text-success-foreground text-sm font-bold flex items-center justify-center">
                    {item.step}
                  </span>
                </div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ - Updated all references to Hausverwaltung Boss */}
      <section id="faq" className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Häufige Fragen
            </h2>
            <p className="text-muted-foreground">
              Antworten auf die wichtigsten Fragen zu Hausverwaltung Boss.
            </p>
          </div>
          <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem
              value="item-1"
              className="bg-card border border-border rounded-lg px-6"
            >
              <AccordionTrigger className="text-left font-medium">
                Ist Hausverwaltung Boss für Mehrfamilienhäuser geeignet?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Ja, absolut! Sie können beliebig viele Objekte und Einheiten
                verwalten. Die Software ist sowohl für kleine Vermietungen als
                auch für größere Mehrfamilienhäuser optimiert.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value="item-2"
              className="bg-card border border-border rounded-lg px-6"
            >
              <AccordionTrigger className="text-left font-medium">
                Kann ich die Software kostenlos testen?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Ja! Sie können Hausverwaltung Boss 30 Tage lang kostenlos und
                unverbindlich testen. Es ist keine Kreditkarte erforderlich.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value="item-3"
              className="bg-card border border-border rounded-lg px-6"
            >
              <AccordionTrigger className="text-left font-medium">
                Welche Abrechnungen kann ich erstellen?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Sie können Nebenkostenabrechnungen, Hausgeldabrechnungen,
                Wirtschaftspläne und §35a EStG-Bescheinigungen mit einem Klick
                generieren.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem
              value="item-4"
              className="bg-card border border-border rounded-lg px-6"
            >
              <AccordionTrigger className="text-left font-medium">
                Sind meine Daten sicher?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Ja, alle Daten werden verschlüsselt auf deutschen Servern
                gespeichert. Wir sind vollständig DSGVO-konform und führen
                regelmäßige Sicherheits-Audits durch.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Bereit für moderne Immobilienverwaltung?
            </h2>
            <p className="text-muted-foreground text-lg">
              Starten Sie noch heute kostenlos und überzeugen Sie sich selbst.
            </p>
            <Button
              size="lg"
              onClick={handleStartDemo}
              className="bg-success hover:bg-success/90 text-success-foreground gap-2"
            >
              Kostenlos registrieren
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer - Updated to Hausverwaltung Boss */}
      <footer className="border-t border-border bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success">
                  <Home className="h-4 w-4 text-success-foreground" />
                </div>
                <span className="font-semibold">Hausverwaltung Boss</span>
              </div>
              <p className="text-sm text-primary-foreground/70">
                Die moderne Lösung für private Vermieter und WEG-Verwalter.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produkt</h4>
              <ul className="space-y-2 text-sm text-primary-foreground/70">
                <li>
                  <a
                    href="#features"
                    className="hover:text-primary-foreground transition-colors"
                  >
                    Funktionen
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary-foreground transition-colors"
                  >
                    Preise
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary-foreground transition-colors"
                  >
                    Updates
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-primary-foreground/70">
                <li>
                  <a
                    href="#faq"
                    className="hover:text-primary-foreground transition-colors"
                  >
                    Hilfe-Center
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary-foreground transition-colors"
                  >
                    Kontakt
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary-foreground transition-colors"
                  >
                    Video-Tutorials
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Rechtliches</h4>
              <ul className="space-y-2 text-sm text-primary-foreground/70">
                <li>
                  <a
                    href="#"
                    className="hover:text-primary-foreground transition-colors"
                  >
                    Impressum
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary-foreground transition-colors"
                  >
                    Datenschutz
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="hover:text-primary-foreground transition-colors"
                  >
                    AGB
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-sm text-primary-foreground/60">
            <p>© 2026 HV-Boss. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
