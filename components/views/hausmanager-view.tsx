"use client";

import type React from "react";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Save,
  Plus,
  Trash2,
  Mail,
  Building2,
  Landmark,
  Receipt,
  Zap,
  Gauge,
  PiggyBank,
  Shield,
  Wrench,
  Scale,
  Search,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateBriefPDF, downloadPDF } from "@/lib/pdf-generator";

// Types
interface BaseItem {
  id: string;
  name: string;
}

interface Finanzamt extends BaseItem {
  steuernummer: string;
  ansprechpartner: string;
  anrede: string;
  strasse: string;
  plz: string;
  ort: string;
  briefanrede: string;
  telefon: string;
  fax: string;
  email: string;
  bank: string;
  blzBic: string;
  ktoIban: string;
  einzugsermaechtigung: boolean;
  besonderheiten: string;
}

interface Steuerberater extends BaseItem {
  ansprechpartner: string;
  telefon: string;
  email: string;
  strasse: string;
  plz: string;
  ort: string;
}

interface Grundbesitzabgabe extends BaseItem {
  gemeinde: string;
  aktenzeichen: string;
  betrag: string;
}

interface Energielieferant extends BaseItem {
  energieart: string;
  lieferant: string;
  kundennummer: string;
  zaehlernummer: string;
  anrede: string;
  ansprechpartner: string;
  strasse: string;
  plz: string;
  ort: string;
  telefon: string;
  fax: string;
  email: string;
  briefanrede: string;
  woMontiert: string;
  tankgroesse: string;
  ablesetermin: string;
  bank: string;
  blzBic: string;
  ktoIban: string;
  betrag: string;
  zahltermin: string;
  einzugsermaechtigung: boolean;
  besonderheiten: string;
}

interface Messdienst extends BaseItem {
  kundennummer: string;
  ansprechpartner: string;
  telefon: string;
  email: string;
}

interface Finanzierungspartner extends BaseItem {
  ansprechpartner: string;
  darlehensnummer: string;
  summe: string;
  laufzeit: string;
  anrede: string;
  strasse: string;
  plz: string;
  ort: string;
  telefon: string;
  fax: string;
  email: string;
  briefanrede: string;
  darlehensart: string;
  darlehenssumme: string;
  zinssatz: string;
  tilgung: string;
  rate: string;
  zahltermin: string;
  zahlungsweise: string;
  grundbucheintrag: boolean;
  besonderheiten: string;
}

interface Versicherung extends BaseItem {
  versicherungsart: string;
  versicherung: string;
  versicherungsNr: string;
  ansprechpartner: string;
  anrede: string;
  strasse: string;
  plz: string;
  ort: string;
  briefanrede: string;
  telefon: string;
  fax: string;
  mobil: string;
  email: string;
  bank: string;
  blzBic: string;
  ktoIban: string;
  zahlungsweise: string;
  zahltermin: string;
  wert1914: string;
  laufzeitBis: string;
  kuendigungsfrist: string;
  jahrespraemie: string;
  bruttomietwert: string;
  brennstofftankinhalt: string;
  glasflaeche: string;
  besonderheiten: string;
}

interface Dienstleister extends BaseItem {
  kategorie: string;
  firma: string;
  ansprechpartner: string;
  telefon: string;
  email: string;
  gewerk: string;
  strasse: string;
  plz: string;
  ort: string;
}

interface Rechtsberatung extends BaseItem {
  kanzlei: string;
  anwalt: string;
  fachgebiet: string;
  telefon: string;
  email: string;
  strasse: string;
  plz: string;
  ort: string;
}

// Initial Data
const initialFinanzaemter: Finanzamt[] = [
  {
    id: "1",
    name: "Finanzamt Berlin Mitte",
    steuernummer: "30/123/45678",
    ansprechpartner: "Herr Schulz",
    anrede: "Herr",
    strasse: "Neue Jakobstraße 6",
    plz: "10179",
    ort: "Berlin",
    briefanrede: "Sehr geehrter Herr Schulz",
    telefon: "030 9024-0",
    fax: "030 9024-1234",
    email: "poststelle@fa-mitte.berlin.de",
    bank: "Landeshauptkasse Berlin",
    blzBic: "MARKDEF1100",
    ktoIban: "DE12 1000 0000 0000 0000 12",
    einzugsermaechtigung: true,
    besonderheiten:
      "Zuständig für Einkünfte aus Vermietung und Verpachtung im Bezirk Mitte.",
  },
];

const initialSteuerberater: Steuerberater[] = [
  {
    id: "1",
    name: "Kanzlei Müller & Partner",
    ansprechpartner: "Dr. Hans Müller",
    telefon: "030 1234567",
    email: "mueller@steuerberater.de",
    strasse: "Friedrichstraße 100",
    plz: "10117",
    ort: "Berlin",
  },
];

const initialGrundbesitzabgaben: Grundbesitzabgabe[] = [
  {
    id: "1",
    name: "Grundsteuer Berlin Mitte",
    gemeinde: "Berlin Mitte",
    aktenzeichen: "GB-2024-001",
    betrag: "1.250,00",
  },
];

const initialEnergielieferanten: Energielieferant[] = [
  {
    id: "1",
    name: "Vattenfall Europe - Strom",
    energieart: "Strom",
    lieferant: "Vattenfall Europe",
    kundennummer: "KD-123456789",
    zaehlernummer: "1ESM123456789",
    anrede: "Herr",
    ansprechpartner: "Max Schmidt",
    strasse: "Chausseestraße 23",
    plz: "10115",
    ort: "Berlin",
    telefon: "030 267-0",
    fax: "030 267-1234",
    email: "service@vattenfall.de",
    briefanrede: "Sehr geehrter Herr Schmidt",
    woMontiert: "Keller Raum 1.01",
    tankgroesse: "",
    ablesetermin: "31.12. jährlich",
    bank: "Deutsche Bank",
    blzBic: "DEUTDEDB",
    ktoIban: "DE89 3704 0044 0532 0130 00",
    betrag: "185,00",
    zahltermin: "15. jeden Monats",
    einzugsermaechtigung: true,
    besonderheiten: "Ökostrom-Tarif seit 01.01.2023",
  },
];

const initialMessdienst: Messdienst[] = [
  {
    id: "1",
    name: "ista Deutschland GmbH",
    kundennummer: "IST-2024-001",
    ansprechpartner: "Herr Klein",
    telefon: "0800 123456",
    email: "service@ista.de",
  },
];

const initialFinanzierungspartner: Finanzierungspartner[] = [
  {
    id: "1",
    name: "Deutsche Bank AG",
    ansprechpartner: "Dr. Thomas Richter",
    darlehensnummer: "DAR-2020-123456",
    summe: "450.000,00 €",
    laufzeit: "31.12.2040",
    anrede: "Herr",
    strasse: "Taunusanlage 12",
    plz: "60325",
    ort: "Frankfurt am Main",
    telefon: "069 910-00",
    fax: "069 910-34225",
    email: "immobilien@deutsche-bank.de",
    briefanrede: "Sehr geehrter Herr Dr. Richter",
    darlehensart: "Annuitätendarlehen",
    darlehenssumme: "450.000,00",
    zinssatz: "2,85",
    tilgung: "2,00",
    rate: "1.818,75",
    zahltermin: "1. jeden Monats",
    zahlungsweise: "Lastschrift",
    grundbucheintrag: true,
    besonderheiten: "Sondertilgung 5% p.a. möglich",
  },
];

const initialVersicherungen: Versicherung[] = [
  {
    id: "1",
    name: "Allianz - Gebäudeversicherung",
    versicherungsart: "Gebäudeversicherung",
    versicherung: "Allianz Versicherungs-AG",
    versicherungsNr: "VS-2020-4711-0815",
    ansprechpartner: "Herr Bauer",
    anrede: "Herr",
    strasse: "Königinstraße 28",
    plz: "80802",
    ort: "München",
    briefanrede: "Sehr geehrter Herr Bauer",
    telefon: "089 3800-0",
    fax: "089 3800-1234",
    mobil: "0171 1234567",
    email: "gebaeudeversicherung@allianz.de",
    bank: "Allianz Bank",
    blzBic: "ALLIDEM1",
    ktoIban: "DE89 5021 1000 0000 0000 00",
    zahlungsweise: "Lastschrift",
    zahltermin: "01.01. jährlich",
    wert1914: "125.000",
    laufzeitBis: "31.12.2030",
    kuendigungsfrist: "3 Monate zum Jahresende",
    jahrespraemie: "1.850,00",
    bruttomietwert: "48.000,00",
    brennstofftankinhalt: "",
    glasflaeche: "45",
    besonderheiten: "Elementarschäden eingeschlossen",
  },
];

const initialDienstleister: Dienstleister[] = [
  {
    id: "1",
    name: "Sanitär Schulze GmbH",
    kategorie: "Handwerker",
    firma: "Sanitär Schulze GmbH",
    ansprechpartner: "Peter Schulze",
    telefon: "030 5551234",
    email: "info@sanitaer-schulze.de",
    gewerk: "Sanitär/Heizung",
    strasse: "Handwerkerstraße 15",
    plz: "10115",
    ort: "Berlin",
  },
];

const initialRechtsberatung: Rechtsberatung[] = [
  {
    id: "1",
    name: "RA Dr. Michael Schmidt",
    kanzlei: "Rechtsanwälte Schmidt & Partner",
    anwalt: "RA Dr. Michael Schmidt",
    fachgebiet: "Mietrecht",
    telefon: "030 2345678",
    email: "schmidt@mietrecht-berlin.de",
    strasse: "Kurfürstendamm 100",
    plz: "10709",
    ort: "Berlin",
  },
];

// Sub-navigation items
const navSections = [
  {
    title: "Steuern & Abgaben",
    items: [
      { id: "finanzamt", label: "Finanzamt", icon: Landmark },
      { id: "steuerberater", label: "Steuerberater", icon: Receipt },
      {
        id: "grundbesitzabgaben",
        label: "Grundbesitzabgaben",
        icon: Building2,
      },
    ],
  },
  {
    title: "Energie & Versorgung",
    items: [
      { id: "energielieferanten", label: "Energielieferanten", icon: Zap },
      { id: "messdienst", label: "Meßdienst", icon: Gauge },
    ],
  },
  {
    title: "Finanzierung & Versicherung",
    items: [
      {
        id: "finanzierungspartner",
        label: "Finanzierungspartner",
        icon: PiggyBank,
      },
      { id: "versicherungen", label: "Versicherungen", icon: Shield },
    ],
  },
  {
    title: "Dienstleister",
    items: [
      { id: "wartung", label: "Wartung/Pflege/Handwerker", icon: Wrench },
      { id: "rechtsberatung", label: "Rechtsberatung", icon: Scale },
    ],
  },
];

export function HausmanagerView() {
  const [activeView, setActiveView] = useState("finanzamt");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  // State for all data
  const [finanzaemter, setFinanzaemter] =
    useState<Finanzamt[]>(initialFinanzaemter);
  const [steuerberater, setSteuerberater] =
    useState<Steuerberater[]>(initialSteuerberater);
  const [grundbesitzabgaben, setGrundbesitzabgaben] = useState<
    Grundbesitzabgabe[]
  >(initialGrundbesitzabgaben);
  const [energielieferanten, setEnergielieferanten] = useState<
    Energielieferant[]
  >(initialEnergielieferanten);
  const [messdienst, setMessdienst] = useState<Messdienst[]>(initialMessdienst);
  const [finanzierungspartner, setFinanzierungspartner] = useState<
    Finanzierungspartner[]
  >(initialFinanzierungspartner);
  const [versicherungen, setVersicherungen] = useState<Versicherung[]>(
    initialVersicherungen
  );
  const [dienstleister, setDienstleister] =
    useState<Dienstleister[]>(initialDienstleister);
  const [rechtsberatung, setRechtsberatung] = useState<Rechtsberatung[]>(
    initialRechtsberatung
  );

  // Modal state
  const [briefModalOpen, setBriefModalOpen] = useState(false);
  const [briefEmpfaenger, setBriefEmpfaenger] = useState("");
  const [briefBetreff, setBriefBetreff] = useState("");
  const [briefText, setBriefText] = useState("");

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteCallback, setDeleteCallback] = useState<(() => void) | null>(
    null
  );

  const openBriefModal = (empfaenger: string) => {
    setBriefEmpfaenger(empfaenger);
    setBriefBetreff("");
    setBriefText(
      "Sehr geehrte Damen und Herren,\n\n\n\nMit freundlichen Grüßen\nIhre Hausverwaltung Boss"
    );
    setBriefModalOpen(true);
  };

  const handleExportBriefPDF = () => {
    const doc = generateBriefPDF({
      empfaenger: briefEmpfaenger,
      betreff: briefBetreff,
      text: briefText,
    });
    downloadPDF(
      doc,
      `brief_${briefEmpfaenger.replace(/\s+/g, "_")}_${
        new Date().toISOString().split("T")[0]
      }`
    );
    setBriefModalOpen(false);
    toast({
      title: "PDF exportiert",
      description: `Brief an "${briefEmpfaenger}" wurde als PDF gespeichert.`,
    });
  };

  const confirmDelete = (callback: () => void) => {
    setDeleteCallback(() => callback);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (deleteCallback) {
      deleteCallback();
    }
    setDeleteDialogOpen(false);
    setDeleteCallback(null);
  };

  const handleSave = (item: BaseItem) => {
    toast({
      title: "Gespeichert",
      description: `"${item.name}" wurde gespeichert.`,
    });
  };

  // Memoized filtered lists based on search query
  const filteredFinanzaemter = useMemo(
    () =>
      finanzaemter.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.steuernummer.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [finanzaemter, searchQuery]
  );

  const filteredSteuerberater = useMemo(
    () =>
      steuerberater.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.ansprechpartner.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [steuerberater, searchQuery]
  );

  const filteredDienstleister = useMemo(
    () =>
      dienstleister.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.gewerk?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.kategorie.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [dienstleister, searchQuery]
  );

  const filteredVersicherungen = useMemo(
    () =>
      versicherungen.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.versicherungsart
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
      ),
    [versicherungen, searchQuery]
  );

  return (
    <div className="flex flex-col md:flex-row h-auto md:h-[calc(100vh-8rem)] gap-0">
      {/* Sub-Navigation Sidebar */}
      <div className="w-full md:w-64 shrink-0 border-b md:border-b-0 md:border-r bg-muted/30">
        <ScrollArea className="h-auto max-h-[200px] md:max-h-full md:h-full">
          <div className="p-3 md:p-4 space-y-3 md:space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>

            <div className="flex md:flex-col gap-2 md:gap-6 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
              {navSections.map((section) => (
                <div key={section.title} className="min-w-fit md:min-w-0">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 hidden md:block">
                    {section.title}
                  </h3>
                  <div className="flex md:flex-col gap-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveView(item.id)}
                          className={`flex items-center gap-2 px-3 py-2 text-xs md:text-sm rounded-md transition-colors whitespace-nowrap ${
                            activeView === item.id
                              ? "bg-primary text-primary-foreground"
                              : "hover:bg-muted text-foreground"
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span className="truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        {activeView === "finanzamt" && (
          <GenericMasterDetail
            title="Finanzämter"
            items={filteredFinanzaemter}
            setItems={setFinanzaemter}
            columns={[
              { key: "name", label: "Finanzamt" },
              { key: "steuernummer", label: "Steuernummer" },
              { key: "ansprechpartner", label: "Ansprechpartner" },
            ]}
            createNew={() => ({
              id: String(Date.now()),
              name: "Neues Finanzamt",
              steuernummer: "",
              ansprechpartner: "",
              anrede: "Herr",
              strasse: "",
              plz: "",
              ort: "",
              briefanrede: "",
              telefon: "",
              fax: "",
              email: "",
              bank: "",
              blzBic: "",
              ktoIban: "",
              einzugsermaechtigung: false,
              besonderheiten: "",
            })}
            renderForm={(item, updateItem) => (
              <FinanzamtForm item={item} updateItem={updateItem} />
            )}
            onBrief={openBriefModal}
            onDelete={confirmDelete}
            onSave={handleSave}
          />
        )}
        {activeView === "steuerberater" && (
          <GenericMasterDetail
            title="Steuerberater"
            items={filteredSteuerberater}
            setItems={setSteuerberater}
            columns={[
              { key: "name", label: "Kanzlei" },
              { key: "ansprechpartner", label: "Ansprechpartner" },
              { key: "telefon", label: "Telefon" },
            ]}
            createNew={() => ({
              id: String(Date.now()),
              name: "Neue Kanzlei",
              ansprechpartner: "",
              telefon: "",
              email: "",
              strasse: "",
              plz: "",
              ort: "",
            })}
            renderForm={(item, updateItem) => (
              <SteuerberaterForm item={item} updateItem={updateItem} />
            )}
            onBrief={openBriefModal}
            onDelete={confirmDelete}
            onSave={handleSave}
          />
        )}
        {activeView === "grundbesitzabgaben" && (
          <GenericMasterDetail
            title="Grundbesitzabgaben"
            items={grundbesitzabgaben}
            setItems={setGrundbesitzabgaben}
            columns={[
              { key: "gemeinde", label: "Gemeinde" },
              { key: "aktenzeichen", label: "Aktenzeichen" },
              { key: "betrag", label: "Betrag" },
            ]}
            createNew={() => ({
              id: String(Date.now()),
              name: "Neue Abgabe",
              gemeinde: "",
              aktenzeichen: "",
              betrag: "",
            })}
            renderForm={(item, updateItem) => (
              <GrundbesitzabgabenForm item={item} updateItem={updateItem} />
            )}
            onDelete={confirmDelete}
            onSave={handleSave}
          />
        )}
        {activeView === "energielieferanten" && (
          <GenericMasterDetail
            title="Energielieferanten"
            items={energielieferanten}
            setItems={setEnergielieferanten}
            columns={[
              { key: "energieart", label: "Energieart" },
              { key: "lieferant", label: "Lieferant" },
              { key: "kundennummer", label: "Kundennummer" },
            ]}
            createNew={() => ({
              id: String(Date.now()),
              name: "Neuer Lieferant",
              energieart: "Strom",
              lieferant: "",
              kundennummer: "",
              zaehlernummer: "",
              anrede: "Herr",
              ansprechpartner: "",
              strasse: "",
              plz: "",
              ort: "",
              telefon: "",
              fax: "",
              email: "",
              briefanrede: "",
              woMontiert: "",
              tankgroesse: "",
              ablesetermin: "",
              bank: "",
              blzBic: "",
              ktoIban: "",
              betrag: "",
              zahltermin: "",
              einzugsermaechtigung: false,
              besonderheiten: "",
            })}
            renderForm={(item, updateItem) => (
              <EnergielieferantForm item={item} updateItem={updateItem} />
            )}
            onBrief={openBriefModal}
            onDelete={confirmDelete}
            onSave={handleSave}
          />
        )}
        {activeView === "messdienst" && (
          <GenericMasterDetail
            title="Meßdienst"
            items={messdienst}
            setItems={setMessdienst}
            columns={[
              { key: "name", label: "Firma" },
              { key: "kundennummer", label: "Kundennummer" },
              { key: "ansprechpartner", label: "Ansprechpartner" },
            ]}
            createNew={() => ({
              id: String(Date.now()),
              name: "Neuer Meßdienst",
              kundennummer: "",
              ansprechpartner: "",
              telefon: "",
              email: "",
            })}
            renderForm={(item, updateItem) => (
              <MessdienstForm item={item} updateItem={updateItem} />
            )}
            onBrief={openBriefModal}
            onDelete={confirmDelete}
            onSave={handleSave}
          />
        )}
        {activeView === "finanzierungspartner" && (
          <GenericMasterDetail
            title="Finanzierungspartner"
            items={finanzierungspartner}
            setItems={setFinanzierungspartner}
            columns={[
              { key: "name", label: "Bank" },
              { key: "darlehensnummer", label: "Darlehensnr." },
              { key: "summe", label: "Summe" },
            ]}
            createNew={() => ({
              id: String(Date.now()),
              name: "Neue Bank",
              ansprechpartner: "",
              darlehensnummer: "",
              summe: "",
              laufzeit: "",
              anrede: "Herr",
              strasse: "",
              plz: "",
              ort: "",
              telefon: "",
              fax: "",
              email: "",
              briefanrede: "",
              darlehensart: "Annuitätendarlehen",
              darlehenssumme: "",
              zinssatz: "",
              tilgung: "",
              rate: "",
              zahltermin: "",
              zahlungsweise: "Lastschrift",
              grundbucheintrag: false,
              besonderheiten: "",
            })}
            renderForm={(item, updateItem) => (
              <FinanzierungspartnerForm item={item} updateItem={updateItem} />
            )}
            onBrief={openBriefModal}
            onDelete={confirmDelete}
            onSave={handleSave}
          />
        )}
        {activeView === "versicherungen" && (
          <GenericMasterDetail
            title="Versicherungen"
            items={versicherungen}
            setItems={setVersicherungen}
            columns={[
              { key: "versicherungsart", label: "Art" },
              { key: "versicherung", label: "Versicherung" },
              { key: "jahrespraemie", label: "Prämie" },
            ]}
            createNew={() => ({
              id: String(Date.now()),
              name: "Neue Versicherung",
              versicherungsart: "Gebäudeversicherung",
              versicherung: "",
              versicherungsNr: "",
              ansprechpartner: "",
              anrede: "Herr",
              strasse: "",
              plz: "",
              ort: "",
              briefanrede: "",
              telefon: "",
              fax: "",
              mobil: "",
              email: "",
              bank: "",
              blzBic: "",
              ktoIban: "",
              zahlungsweise: "Lastschrift",
              zahltermin: "",
              wert1914: "",
              laufzeitBis: "",
              kuendigungsfrist: "",
              jahrespraemie: "",
              bruttomietwert: "",
              brennstofftankinhalt: "",
              glasflaeche: "",
              besonderheiten: "",
            })}
            renderForm={(item, updateItem) => (
              <VersicherungForm item={item} updateItem={updateItem} />
            )}
            onBrief={openBriefModal}
            onDelete={confirmDelete}
            onSave={handleSave}
          />
        )}
        {activeView === "wartung" && (
          <GenericMasterDetail
            title="Wartung/Pflege/Handwerker"
            items={dienstleister}
            setItems={setDienstleister}
            columns={[
              { key: "firma", label: "Firma" },
              { key: "gewerk", label: "Gewerk" },
              { key: "telefon", label: "Telefon" },
            ]}
            createNew={() => ({
              id: String(Date.now()),
              name: "Neuer Dienstleister",
              kategorie: "Handwerker",
              firma: "",
              ansprechpartner: "",
              telefon: "",
              email: "",
              gewerk: "",
              strasse: "",
              plz: "",
              ort: "",
            })}
            renderForm={(item, updateItem) => (
              <DienstleisterForm item={item} updateItem={updateItem} />
            )}
            onBrief={openBriefModal}
            onDelete={confirmDelete}
            onSave={handleSave}
          />
        )}
        {activeView === "rechtsberatung" && (
          <GenericMasterDetail
            title="Rechtsberatung"
            items={rechtsberatung}
            setItems={setRechtsberatung}
            columns={[
              { key: "kanzlei", label: "Kanzlei" },
              { key: "anwalt", label: "Anwalt" },
              { key: "fachgebiet", label: "Fachgebiet" },
            ]}
            createNew={() => ({
              id: String(Date.now()),
              name: "Neue Kanzlei",
              kanzlei: "",
              anwalt: "",
              fachgebiet: "",
              telefon: "",
              email: "",
              strasse: "",
              plz: "",
              ort: "",
            })}
            renderForm={(item, updateItem) => (
              <RechtsberatungForm item={item} updateItem={updateItem} />
            )}
            onBrief={openBriefModal}
            onDelete={confirmDelete}
            onSave={handleSave}
          />
        )}
      </div>

      {/* Brief schreiben Modal */}
      <Dialog open={briefModalOpen} onOpenChange={setBriefModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Brief schreiben</DialogTitle>
            <DialogDescription>
              Erstellen Sie ein Schreiben an {briefEmpfaenger}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="brief-betreff">Betreff</Label>
              <Input
                id="brief-betreff"
                value={briefBetreff}
                onChange={(e) => setBriefBetreff(e.target.value)}
                placeholder="Betreff eingeben"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brief-text">Nachricht</Label>
              <Textarea
                id="brief-text"
                rows={10}
                value={briefText}
                onChange={(e) => setBriefText(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBriefModalOpen(false)}>
              Abbrechen
            </Button>
            <Button
              className="bg-success hover:bg-success/90 text-success-foreground"
              onClick={handleExportBriefPDF}
            >
              Als PDF exportieren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Der Eintrag
              wird dauerhaft gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Generic Master-Detail Component
interface Column {
  key: string;
  label: string;
}

interface GenericMasterDetailProps<T extends BaseItem> {
  title: string;
  items: T[];
  setItems: React.Dispatch<React.SetStateAction<T[]>>;
  columns: Column[];
  createNew: () => T;
  renderForm: (
    item: T,
    updateItem: (updates: Partial<T>) => void
  ) => React.ReactNode;
  onBrief?: (empfaenger: string) => void;
  onDelete: (callback: () => void) => void;
  onSave?: (item: T) => void;
}

function GenericMasterDetail<T extends BaseItem>({
  title,
  items,
  setItems,
  columns,
  createNew,
  renderForm,
  onBrief,
  onDelete,
  onSave,
}: GenericMasterDetailProps<T>) {
  const [selected, setSelected] = useState<T>(items[0]);

  const handleCreate = () => {
    const newItem = createNew();
    setItems((prev) => [...prev, newItem]);
    setSelected(newItem);
  };

  const handleDelete = () => {
    onDelete(() => {
      if (items.length <= 1) return;
      const newItems = items.filter((item) => item.id !== selected.id);
      setItems(newItems);
      setSelected(newItems[0]);
    });
  };

  const updateSelected = (updates: Partial<T>) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === selected.id ? { ...item, ...updates } : item
      )
    );
    setSelected((prev) => ({ ...prev, ...updates }));
  };

  return (
    <div className="flex flex-col lg:flex-row h-full">
      {/* List */}
      <div className="w-full lg:w-80 shrink-0 border-b lg:border-b-0 lg:border-r flex flex-col max-h-[250px] lg:max-h-full">
        <div className="p-3 border-b flex items-center justify-between">
          <span className="font-semibold text-sm">{title}</span>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1 bg-transparent"
            onClick={handleCreate}
          >
            <Plus className="h-3 w-3" />
            Neu
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="overflow-x-auto">
            <Table className="min-w-[300px]">
              <TableHeader>
                <TableRow>
                  {columns.slice(0, 2).map((col) => (
                    <TableHead key={col.key} className="text-xs">
                      {col.label}
                    </TableHead>
                  ))}
                  {columns.length > 2 && (
                    <TableHead className="text-xs hidden sm:table-cell">
                      {columns[2].label}
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow
                    key={item.id}
                    className={`cursor-pointer ${
                      selected.id === item.id ? "bg-accent" : ""
                    }`}
                    onClick={() => setSelected(item)}
                  >
                    {columns.slice(0, 2).map((col) => (
                      <TableCell key={col.key} className="text-xs py-2">
                        {(item as any)[col.key]}
                      </TableCell>
                    ))}
                    {columns.length > 2 && (
                      <TableCell className="text-xs py-2 hidden sm:table-cell">
                        {(item as any)[columns[2].key]}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
      </div>

      {/* Detail Form */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="p-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-muted/30">
          <span className="font-semibold text-sm sm:text-base truncate">
            {selected.name}
          </span>
          <div className="flex gap-2 flex-wrap">
            {onBrief && (
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1 bg-transparent"
                onClick={() => onBrief(selected.name)}
              >
                <Mail className="h-3 w-3" />
                <span className="hidden sm:inline">Brief schreiben</span>
                <span className="sm:hidden">Brief</span>
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-destructive gap-1 bg-transparent"
              onClick={handleDelete}
              disabled={items.length <= 1}
            >
              <Trash2 className="h-3 w-3" />
              <span className="hidden sm:inline">Löschen</span>
            </Button>
            <Button
              size="sm"
              className="h-8 gap-1 bg-emerald-600 hover:bg-emerald-700"
              onClick={() => onSave?.(selected)}
            >
              <Save className="h-3 w-3" />
              <span className="hidden sm:inline">Speichern</span>
            </Button>
          </div>
        </div>
        <ScrollArea className="flex-1 p-3 sm:p-4">
          {renderForm(selected, updateSelected)}
        </ScrollArea>
      </div>
    </div>
  );
}

// Form Components
function FinanzamtForm({
  item,
  updateItem,
}: {
  item: Finanzamt;
  updateItem: (u: Partial<Finanzamt>) => void;
}) {
  return (
    <div className="space-y-4 max-w-4xl">
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Steuerangaben</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Steuernummer</Label>
              <Input
                value={item.steuernummer}
                onChange={(e) => updateItem({ steuernummer: e.target.value })}
                className="font-mono text-lg font-semibold"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Finanzamt Name</Label>
              <Input
                value={item.name}
                onChange={(e) => updateItem({ name: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Ansprechpartner & Anschrift</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
          <div className="grid grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Anrede</Label>
              <Select
                value={item.anrede}
                onValueChange={(v) => updateItem({ anrede: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Herr">Herr</SelectItem>
                  <SelectItem value="Frau">Frau</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-3 space-y-1">
              <Label className="text-xs">Ansprechpartner</Label>
              <Input
                value={item.ansprechpartner}
                onChange={(e) =>
                  updateItem({ ansprechpartner: e.target.value })
                }
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Straße</Label>
            <Input
              value={item.strasse}
              onChange={(e) => updateItem({ strasse: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">PLZ</Label>
              <Input
                value={item.plz}
                onChange={(e) => updateItem({ plz: e.target.value })}
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Ort</Label>
              <Input
                value={item.ort}
                onChange={(e) => updateItem({ ort: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Kommunikation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
          <div className="space-y-1">
            <Label className="text-xs">Briefanrede</Label>
            <Input
              value={item.briefanrede}
              onChange={(e) => updateItem({ briefanrede: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Telefon</Label>
              <Input
                value={item.telefon}
                onChange={(e) => updateItem({ telefon: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fax</Label>
              <Input
                value={item.fax}
                onChange={(e) => updateItem({ fax: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">E-Mail</Label>
              <Input
                value={item.email}
                onChange={(e) => updateItem({ email: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Bankverbindung</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
          <div className="space-y-1">
            <Label className="text-xs">Bank</Label>
            <Input
              value={item.bank}
              onChange={(e) => updateItem({ bank: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">BLZ/BIC</Label>
              <Input
                value={item.blzBic}
                onChange={(e) => updateItem({ blzBic: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Kto/IBAN</Label>
              <Input
                value={item.ktoIban}
                onChange={(e) => updateItem({ ktoIban: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="einzug"
              checked={item.einzugsermaechtigung}
              onCheckedChange={(c) =>
                updateItem({ einzugsermaechtigung: c === true })
              }
            />
            <label htmlFor="einzug" className="text-sm">
              Einzugsermächtigung erteilt
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Besonderheiten</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={4}
            value={item.besonderheiten}
            onChange={(e) => updateItem({ besonderheiten: e.target.value })}
            placeholder="Notizen und Besonderheiten..."
          />
        </CardContent>
      </Card>
    </div>
  );
}

function SteuerberaterForm({
  item,
  updateItem,
}: {
  item: Steuerberater;
  updateItem: (u: Partial<Steuerberater>) => void;
}) {
  return (
    <div className="space-y-4 max-w-4xl">
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Kanzlei-Daten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
          <div className="space-y-1">
            <Label className="text-xs">Kanzlei Name</Label>
            <Input
              value={item.name}
              onChange={(e) => updateItem({ name: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Ansprechpartner</Label>
            <Input
              value={item.ansprechpartner}
              onChange={(e) => updateItem({ ansprechpartner: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Straße</Label>
            <Input
              value={item.strasse}
              onChange={(e) => updateItem({ strasse: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">PLZ</Label>
              <Input
                value={item.plz}
                onChange={(e) => updateItem({ plz: e.target.value })}
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Ort</Label>
              <Input
                value={item.ort}
                onChange={(e) => updateItem({ ort: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Telefon</Label>
              <Input
                value={item.telefon}
                onChange={(e) => updateItem({ telefon: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">E-Mail</Label>
              <Input
                value={item.email}
                onChange={(e) => updateItem({ email: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function GrundbesitzabgabenForm({
  item,
  updateItem,
}: {
  item: Grundbesitzabgabe;
  updateItem: (u: Partial<Grundbesitzabgabe>) => void;
}) {
  return (
    <div className="space-y-4 max-w-4xl">
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Abgaben-Daten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
          <div className="space-y-1">
            <Label className="text-xs">Bezeichnung</Label>
            <Input
              value={item.name}
              onChange={(e) => updateItem({ name: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Gemeinde</Label>
            <Input
              value={item.gemeinde}
              onChange={(e) => updateItem({ gemeinde: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Aktenzeichen</Label>
              <Input
                value={item.aktenzeichen}
                onChange={(e) => updateItem({ aktenzeichen: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Betrag (€)</Label>
              <Input
                value={item.betrag}
                onChange={(e) => updateItem({ betrag: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EnergielieferantForm({
  item,
  updateItem,
}: {
  item: Energielieferant;
  updateItem: (u: Partial<Energielieferant>) => void;
}) {
  return (
    <div className="space-y-4 max-w-4xl">
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Lieferanten-Daten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Energieart</Label>
              <Select
                value={item.energieart}
                onValueChange={(v) => updateItem({ energieart: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Strom">Strom</SelectItem>
                  <SelectItem value="Gas">Gas</SelectItem>
                  <SelectItem value="Öl">Öl</SelectItem>
                  <SelectItem value="Fernwärme">Fernwärme</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Lieferant</Label>
              <Input
                value={item.lieferant}
                onChange={(e) =>
                  updateItem({
                    lieferant: e.target.value,
                    name: `${e.target.value} - ${item.energieart}`,
                  })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Kundennummer</Label>
              <Input
                value={item.kundennummer}
                onChange={(e) => updateItem({ kundennummer: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Zählernummer</Label>
              <Input
                value={item.zaehlernummer}
                onChange={(e) => updateItem({ zaehlernummer: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Kontakt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
          <div className="grid grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Anrede</Label>
              <Select
                value={item.anrede}
                onValueChange={(v) => updateItem({ anrede: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Herr">Herr</SelectItem>
                  <SelectItem value="Frau">Frau</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-3 space-y-1">
              <Label className="text-xs">Ansprechpartner</Label>
              <Input
                value={item.ansprechpartner}
                onChange={(e) =>
                  updateItem({ ansprechpartner: e.target.value })
                }
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Straße</Label>
            <Input
              value={item.strasse}
              onChange={(e) => updateItem({ strasse: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">PLZ</Label>
              <Input
                value={item.plz}
                onChange={(e) => updateItem({ plz: e.target.value })}
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Ort</Label>
              <Input
                value={item.ort}
                onChange={(e) => updateItem({ ort: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Telefon</Label>
              <Input
                value={item.telefon}
                onChange={(e) => updateItem({ telefon: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fax</Label>
              <Input
                value={item.fax}
                onChange={(e) => updateItem({ fax: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">E-Mail</Label>
              <Input
                value={item.email}
                onChange={(e) => updateItem({ email: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Technische Daten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Montageort</Label>
              <Input
                value={item.woMontiert}
                onChange={(e) => updateItem({ woMontiert: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tankgröße (Liter)</Label>
              <Input
                value={item.tankgroesse}
                onChange={(e) => updateItem({ tankgroesse: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Ablesetermin</Label>
            <Input
              value={item.ablesetermin}
              onChange={(e) => updateItem({ ablesetermin: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Zahlungsdaten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
          <div className="space-y-1">
            <Label className="text-xs">Bank</Label>
            <Input
              value={item.bank}
              onChange={(e) => updateItem({ bank: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">BLZ/BIC</Label>
              <Input
                value={item.blzBic}
                onChange={(e) => updateItem({ blzBic: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Kto/IBAN</Label>
              <Input
                value={item.ktoIban}
                onChange={(e) => updateItem({ ktoIban: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Monatlicher Betrag (€)</Label>
              <Input
                value={item.betrag}
                onChange={(e) => updateItem({ betrag: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Zahltermin</Label>
              <Input
                value={item.zahltermin}
                onChange={(e) => updateItem({ zahltermin: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="einzug-energie"
              checked={item.einzugsermaechtigung}
              onCheckedChange={(c) =>
                updateItem({ einzugsermaechtigung: c === true })
              }
            />
            <label htmlFor="einzug-energie" className="text-sm">
              Einzugsermächtigung erteilt
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Besonderheiten</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={4}
            value={item.besonderheiten}
            onChange={(e) => updateItem({ besonderheiten: e.target.value })}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function MessdienstForm({
  item,
  updateItem,
}: {
  item: Messdienst;
  updateItem: (u: Partial<Messdienst>) => void;
}) {
  return (
    <div className="space-y-4 max-w-4xl">
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Meßdienst-Daten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
          <div className="space-y-1">
            <Label className="text-xs">Firma</Label>
            <Input
              value={item.name}
              onChange={(e) => updateItem({ name: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Kundennummer</Label>
            <Input
              value={item.kundennummer}
              onChange={(e) => updateItem({ kundennummer: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Ansprechpartner</Label>
            <Input
              value={item.ansprechpartner}
              onChange={(e) => updateItem({ ansprechpartner: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Telefon</Label>
              <Input
                value={item.telefon}
                onChange={(e) => updateItem({ telefon: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">E-Mail</Label>
              <Input
                value={item.email}
                onChange={(e) => updateItem({ email: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FinanzierungspartnerForm({
  item,
  updateItem,
}: {
  item: Finanzierungspartner;
  updateItem: (u: Partial<Finanzierungspartner>) => void;
}) {
  return (
    <div className="space-y-4 max-w-4xl">
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Darlehensdaten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
          <div className="space-y-1">
            <Label className="text-xs">Bank / Kreditinstitut</Label>
            <Input
              value={item.name}
              onChange={(e) => updateItem({ name: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Darlehensnummer</Label>
              <Input
                value={item.darlehensnummer}
                onChange={(e) =>
                  updateItem({ darlehensnummer: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Darlehensart</Label>
              <Select
                value={item.darlehensart}
                onValueChange={(v) => updateItem({ darlehensart: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Annuitätendarlehen">
                    Annuitätendarlehen
                  </SelectItem>
                  <SelectItem value="Tilgungsdarlehen">
                    Tilgungsdarlehen
                  </SelectItem>
                  <SelectItem value="Endfälliges Darlehen">
                    Endfälliges Darlehen
                  </SelectItem>
                  <SelectItem value="KfW-Förderkredit">
                    KfW-Förderkredit
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Darlehenssumme (€)</Label>
              <Input
                value={item.darlehenssumme}
                onChange={(e) => updateItem({ darlehenssumme: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Zinssatz (%)</Label>
              <Input
                value={item.zinssatz}
                onChange={(e) => updateItem({ zinssatz: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tilgung (%)</Label>
              <Input
                value={item.tilgung}
                onChange={(e) => updateItem({ tilgung: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Rate (€)</Label>
              <Input
                value={item.rate}
                onChange={(e) => updateItem({ rate: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Laufzeit bis</Label>
              <Input
                value={item.laufzeit}
                onChange={(e) => updateItem({ laufzeit: e.target.value })}
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="grundbuch"
              checked={item.grundbucheintrag}
              onCheckedChange={(c) =>
                updateItem({ grundbucheintrag: c === true })
              }
            />
            <label htmlFor="grundbuch" className="text-sm">
              Grundbucheintrag vorhanden
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Kontakt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
          <div className="space-y-1">
            <Label className="text-xs">Ansprechpartner</Label>
            <Input
              value={item.ansprechpartner}
              onChange={(e) => updateItem({ ansprechpartner: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Straße</Label>
            <Input
              value={item.strasse}
              onChange={(e) => updateItem({ strasse: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">PLZ</Label>
              <Input
                value={item.plz}
                onChange={(e) => updateItem({ plz: e.target.value })}
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Ort</Label>
              <Input
                value={item.ort}
                onChange={(e) => updateItem({ ort: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Telefon</Label>
              <Input
                value={item.telefon}
                onChange={(e) => updateItem({ telefon: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fax</Label>
              <Input
                value={item.fax}
                onChange={(e) => updateItem({ fax: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">E-Mail</Label>
              <Input
                value={item.email}
                onChange={(e) => updateItem({ email: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Besonderheiten</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={4}
            value={item.besonderheiten}
            onChange={(e) => updateItem({ besonderheiten: e.target.value })}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function VersicherungForm({
  item,
  updateItem,
}: {
  item: Versicherung;
  updateItem: (u: Partial<Versicherung>) => void;
}) {
  return (
    <div className="space-y-4 max-w-4xl">
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Versicherungsdaten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Versicherungsart</Label>
              <Select
                value={item.versicherungsart}
                onValueChange={(v) => updateItem({ versicherungsart: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Gebäudeversicherung">
                    Gebäudeversicherung
                  </SelectItem>
                  <SelectItem value="Haus- und Grundbesitzerhaftpflicht">
                    Haus- und Grundbesitzerhaftpflicht
                  </SelectItem>
                  <SelectItem value="Gewässerschadenhaftpflicht">
                    Gewässerschadenhaftpflicht
                  </SelectItem>
                  <SelectItem value="Glasversicherung">
                    Glasversicherung
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Versicherung</Label>
              <Input
                value={item.versicherung}
                onChange={(e) =>
                  updateItem({
                    versicherung: e.target.value,
                    name: `${e.target.value} - ${item.versicherungsart}`,
                  })
                }
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Versicherungsnummer</Label>
            <Input
              value={item.versicherungsNr}
              onChange={(e) => updateItem({ versicherungsNr: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Jahresprämie (€)</Label>
              <Input
                value={item.jahrespraemie}
                onChange={(e) => updateItem({ jahrespraemie: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Laufzeit bis</Label>
              <Input
                value={item.laufzeitBis}
                onChange={(e) => updateItem({ laufzeitBis: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Kündigungsfrist</Label>
              <Input
                value={item.kuendigungsfrist}
                onChange={(e) =>
                  updateItem({ kuendigungsfrist: e.target.value })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Wert 1914 (Mark)</Label>
              <Input
                value={item.wert1914}
                onChange={(e) => updateItem({ wert1914: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Glasfläche (m²)</Label>
              <Input
                value={item.glasflaeche}
                onChange={(e) => updateItem({ glasflaeche: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tankinhalt (Liter)</Label>
              <Input
                value={item.brennstofftankinhalt}
                onChange={(e) =>
                  updateItem({ brennstofftankinhalt: e.target.value })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Kontakt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
          <div className="space-y-1">
            <Label className="text-xs">Ansprechpartner</Label>
            <Input
              value={item.ansprechpartner}
              onChange={(e) => updateItem({ ansprechpartner: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Straße</Label>
            <Input
              value={item.strasse}
              onChange={(e) => updateItem({ strasse: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">PLZ</Label>
              <Input
                value={item.plz}
                onChange={(e) => updateItem({ plz: e.target.value })}
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Ort</Label>
              <Input
                value={item.ort}
                onChange={(e) => updateItem({ ort: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Telefon</Label>
              <Input
                value={item.telefon}
                onChange={(e) => updateItem({ telefon: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fax</Label>
              <Input
                value={item.fax}
                onChange={(e) => updateItem({ fax: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">E-Mail</Label>
              <Input
                value={item.email}
                onChange={(e) => updateItem({ email: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Besonderheiten</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={4}
            value={item.besonderheiten}
            onChange={(e) => updateItem({ besonderheiten: e.target.value })}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function DienstleisterForm({
  item,
  updateItem,
}: {
  item: Dienstleister;
  updateItem: (u: Partial<Dienstleister>) => void;
}) {
  return (
    <div className="space-y-4 max-w-4xl">
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Dienstleister-Daten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Kategorie</Label>
              <Select
                value={item.kategorie}
                onValueChange={(v) => updateItem({ kategorie: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Handwerker">Handwerker</SelectItem>
                  <SelectItem value="Wartung">Wartung</SelectItem>
                  <SelectItem value="Pflege">Pflege</SelectItem>
                  <SelectItem value="Reinigung">Reinigung</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Gewerk</Label>
              <Input
                value={item.gewerk}
                onChange={(e) => updateItem({ gewerk: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Firma</Label>
            <Input
              value={item.firma}
              onChange={(e) =>
                updateItem({ firma: e.target.value, name: e.target.value })
              }
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Ansprechpartner</Label>
            <Input
              value={item.ansprechpartner}
              onChange={(e) => updateItem({ ansprechpartner: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Straße</Label>
            <Input
              value={item.strasse}
              onChange={(e) => updateItem({ strasse: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">PLZ</Label>
              <Input
                value={item.plz}
                onChange={(e) => updateItem({ plz: e.target.value })}
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Ort</Label>
              <Input
                value={item.ort}
                onChange={(e) => updateItem({ ort: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Telefon</Label>
              <Input
                value={item.telefon}
                onChange={(e) => updateItem({ telefon: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">E-Mail</Label>
              <Input
                value={item.email}
                onChange={(e) => updateItem({ email: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RechtsberatungForm({
  item,
  updateItem,
}: {
  item: Rechtsberatung;
  updateItem: (u: Partial<Rechtsberatung>) => void;
}) {
  return (
    <div className="space-y-4 max-w-4xl">
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-sm">Kanzlei-Daten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
          <div className="space-y-1">
            <Label className="text-xs">Kanzlei</Label>
            <Input
              value={item.kanzlei}
              onChange={(e) => updateItem({ kanzlei: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Anwalt</Label>
              <Input
                value={item.anwalt}
                onChange={(e) =>
                  updateItem({ anwalt: e.target.value, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fachgebiet</Label>
              <Input
                value={item.fachgebiet}
                onChange={(e) => updateItem({ fachgebiet: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Straße</Label>
            <Input
              value={item.strasse}
              onChange={(e) => updateItem({ strasse: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">PLZ</Label>
              <Input
                value={item.plz}
                onChange={(e) => updateItem({ plz: e.target.value })}
              />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Ort</Label>
              <Input
                value={item.ort}
                onChange={(e) => updateItem({ ort: e.target.value })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Telefon</Label>
              <Input
                value={item.telefon}
                onChange={(e) => updateItem({ telefon: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">E-Mail</Label>
              <Input
                value={item.email}
                onChange={(e) => updateItem({ email: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
