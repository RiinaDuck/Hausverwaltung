"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Badge } from "@/components/ui/badge";
import {
  Save,
  Plus,
  Trash2,
  Mail,
  Search,
  Zap,
  Gauge,
  PiggyBank,
  Shield,
  Wrench,
  Scale,
  Users,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateBriefPDF, downloadPDF } from "@/lib/pdf-generator";

// ─── Types ────────────────────────────────────────────────────────────────────

export type KontaktTyp =
  | "energielieferanten"
  | "messdienst"
  | "finanzierung"
  | "versicherungen"
  | "wartung"
  | "rechtsberatung"
  | "individuell";

export interface Kontakt {
  id: string;
  typ: KontaktTyp;
  name: string;
  // Energielieferant
  energieart?: string;
  lieferant?: string;
  kundennummer?: string;
  zaehlernummer?: string;
  woMontiert?: string;
  tankgroesse?: string;
  ablesetermin?: string;
  // Common contact
  anrede?: string;
  ansprechpartner?: string;
  strasse?: string;
  plz?: string;
  ort?: string;
  telefon?: string;
  fax?: string;
  mobil?: string;
  email?: string;
  briefanrede?: string;
  // Payment / bank
  bank?: string;
  blzBic?: string;
  ktoIban?: string;
  betrag?: string;
  zahltermin?: string;
  zahlungsweise?: string;
  einzugsermaechtigung?: boolean;
  // Finanzierung
  darlehensnummer?: string;
  summe?: string;
  laufzeit?: string;
  darlehensart?: string;
  darlehenssumme?: string;
  zinssatz?: string;
  tilgung?: string;
  rate?: string;
  grundbucheintrag?: boolean;
  // Versicherung
  versicherungsart?: string;
  versicherung?: string;
  versicherungsNr?: string;
  wert1914?: string;
  laufzeitBis?: string;
  kuendigungsfrist?: string;
  jahrespraemie?: string;
  bruttomietwert?: string;
  brennstofftankinhalt?: string;
  glasflaeche?: string;
  // Dienstleister / Wartung
  kategorie?: string;
  firma?: string;
  gewerk?: string;
  // Rechtsberatung
  kanzlei?: string;
  anwalt?: string;
  fachgebiet?: string;
  // Individuell
  bezeichnung?: string;
  notizen?: string;
  // Shared
  besonderheiten?: string;
  // Metadata
  _createdAt?: number;
  _updatedAt?: number;
  _usageCount?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_TYPEN: KontaktTyp[] = [
  "energielieferanten",
  "messdienst",
  "finanzierung",
  "versicherungen",
  "wartung",
  "rechtsberatung",
  "individuell",
];

const TYP_LABELS: Record<KontaktTyp, string> = {
  energielieferanten: "Energielieferanten",
  messdienst: "Meßdienst",
  finanzierung: "Finanzierung",
  versicherungen: "Versicherungen",
  wartung: "Wartung/Handwerker",
  rechtsberatung: "Rechtsberatung",
  individuell: "Individuell",
};

const TYP_ICONS: Record<KontaktTyp, React.ElementType> = {
  energielieferanten: Zap,
  messdienst: Gauge,
  finanzierung: PiggyBank,
  versicherungen: Shield,
  wartung: Wrench,
  rechtsberatung: Scale,
  individuell: Users,
};

const STORAGE_KEY = "hausverwaltung_kontakte";

const OLD_STORAGE_MAP: { key: string; typ: KontaktTyp }[] = [
  { key: "hausverwaltung_energielieferanten", typ: "energielieferanten" },
  { key: "hausverwaltung_messdienst", typ: "messdienst" },
  { key: "hausverwaltung_finanzierungspartner", typ: "finanzierung" },
  { key: "hausverwaltung_versicherungen", typ: "versicherungen" },
  { key: "hausverwaltung_dienstleister", typ: "wartung" },
  { key: "hausverwaltung_rechtsberatung", typ: "rechtsberatung" },
];

// ─── Initial sample data ──────────────────────────────────────────────────────

const INITIAL_KONTAKTE: Kontakt[] = [
  {
    id: "demo-1",
    typ: "energielieferanten",
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
  {
    id: "demo-2",
    typ: "messdienst",
    name: "ista Deutschland GmbH",
    kundennummer: "IST-2024-001",
    ansprechpartner: "Herr Klein",
    telefon: "0800 123456",
    email: "service@ista.de",
  },
  {
    id: "demo-3",
    typ: "finanzierung",
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
  {
    id: "demo-4",
    typ: "versicherungen",
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
  {
    id: "demo-5",
    typ: "wartung",
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
  {
    id: "demo-6",
    typ: "rechtsberatung",
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadKontakte(): Kontakt[] {
  if (typeof window === "undefined") return INITIAL_KONTAKTE;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
    // Migrate from old separate localStorage keys
    const migrated: Kontakt[] = [];
    for (const { key, typ } of OLD_STORAGE_MAP) {
      const old = localStorage.getItem(key);
      if (old) {
        const items = JSON.parse(old) as Array<Record<string, unknown>>;
        migrated.push(...items.map((item, i) => ({ ...item, id: item.id ?? `${typ}-${i}`, typ } as Kontakt)));
      }
    }
    return migrated.length > 0 ? migrated : INITIAL_KONTAKTE;
  } catch {
    return INITIAL_KONTAKTE;
  }
}

function getSubInfo(k: Kontakt): string {
  switch (k.typ) {
    case "energielieferanten": return k.energieart ?? "";
    case "messdienst": return k.kundennummer ?? "";
    case "finanzierung": return k.darlehensart ?? k.darlehensnummer ?? "";
    case "versicherungen": return k.versicherungsart ?? "";
    case "wartung": return k.gewerk ?? k.kategorie ?? "";
    case "rechtsberatung": return k.fachgebiet ?? "";
    case "individuell": return k.bezeichnung ?? "";
  }
}

function createNewKontakt(typ: KontaktTyp): Kontakt {
  const base = { id: String(Date.now()), typ, name: "" };
  switch (typ) {
    case "energielieferanten":
      return {
        ...base, name: "Neuer Lieferant", energieart: "Strom", lieferant: "",
        kundennummer: "", zaehlernummer: "", anrede: "Herr", ansprechpartner: "",
        strasse: "", plz: "", ort: "", telefon: "", fax: "", email: "",
        briefanrede: "", woMontiert: "", tankgroesse: "", ablesetermin: "",
        bank: "", blzBic: "", ktoIban: "", betrag: "", zahltermin: "",
        einzugsermaechtigung: false, besonderheiten: "",
      };
    case "messdienst":
      return { ...base, name: "Neuer Meßdienst", kundennummer: "", ansprechpartner: "", telefon: "", email: "" };
    case "finanzierung":
      return {
        ...base, name: "Neue Bank", ansprechpartner: "", darlehensnummer: "",
        summe: "", laufzeit: "", anrede: "Herr", strasse: "", plz: "", ort: "",
        telefon: "", fax: "", email: "", briefanrede: "",
        darlehensart: "Annuitätendarlehen", darlehenssumme: "", zinssatz: "",
        tilgung: "", rate: "", zahltermin: "", zahlungsweise: "Lastschrift",
        grundbucheintrag: false, besonderheiten: "",
      };
    case "versicherungen":
      return {
        ...base, name: "Neue Versicherung", versicherungsart: "Gebäudeversicherung",
        versicherung: "", versicherungsNr: "", ansprechpartner: "", anrede: "Herr",
        strasse: "", plz: "", ort: "", briefanrede: "", telefon: "", fax: "",
        mobil: "", email: "", bank: "", blzBic: "", ktoIban: "",
        zahlungsweise: "Lastschrift", zahltermin: "", wert1914: "",
        laufzeitBis: "", kuendigungsfrist: "", jahrespraemie: "",
        bruttomietwert: "", brennstofftankinhalt: "", glasflaeche: "", besonderheiten: "",
      };
    case "wartung":
      return {
        ...base, name: "Neuer Dienstleister", kategorie: "Handwerker",
        firma: "", ansprechpartner: "", telefon: "", email: "", gewerk: "",
        strasse: "", plz: "", ort: "",
      };
    case "rechtsberatung":
      return {
        ...base, name: "Neue Kanzlei", kanzlei: "", anwalt: "", fachgebiet: "",
        telefon: "", email: "", strasse: "", plz: "", ort: "",
      };
    case "individuell":
      return {
        ...base, name: "Neuer Kontakt", bezeichnung: "", telefon: "",
        email: "", strasse: "", plz: "", ort: "", notizen: "",
      };
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

type SortCol = "name" | "kategorie" | "details" | "telefon" | "email";
type SortDir = "asc" | "desc";

function sortKontakte(items: Kontakt[], col: SortCol, dir: SortDir): Kontakt[] {
  return [...items].sort((a, b) => {
    let va = "";
    let vb = "";
    switch (col) {
      case "name":     va = a.name; vb = b.name; break;
      case "kategorie": va = TYP_LABELS[a.typ]; vb = TYP_LABELS[b.typ]; break;
      case "details":  va = getSubInfo(a); vb = getSubInfo(b); break;
      case "telefon":  va = a.telefon ?? ""; vb = b.telefon ?? ""; break;
      case "email":    va = a.email ?? ""; vb = b.email ?? ""; break;
    }
    const cmp = va.localeCompare(vb, "de");
    return dir === "asc" ? cmp : -cmp;
  });
}

export function KontakteView() {
  const [kontakte, setKontakte] = useState<Kontakt[]>(() => loadKontakte());
  const [filterTyp, setFilterTyp] = useState<KontaktTyp | "alle">("alle");
  const [sortCol, setSortCol] = useState<SortCol>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [search, setSearch] = useState("");

  const handleHeaderClick = (col: SortCol) => {
    if (col === sortCol) {
      setSortDir((d) => d === "asc" ? "desc" : "asc");
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  };
  const [detailId, setDetailId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newKontakt, setNewKontakt] = useState<Kontakt | null>(null);
  const { toast } = useToast();

  // Brief modal
  const [briefModalOpen, setBriefModalOpen] = useState(false);
  const [briefEmpfaenger, setBriefEmpfaenger] = useState("");
  const [briefBetreff, setBriefBetreff] = useState("");
  const [briefText, setBriefText] = useState("");

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteCallback, setDeleteCallback] = useState<(() => void) | null>(null);

  // Persist
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(kontakte));
  }, [kontakte]);

  const visibleTypen = useMemo(
    () => (filterTyp === "alle" ? ALL_TYPEN : [filterTyp as KontaktTyp]),
    [filterTyp],
  );

  // ─── Actions ────────────────────────────────────────────────────────────────

  const handleStartNew = () => {
    setIsAddingNew(true);
    setDetailId(null);
    setNewKontakt(
      createNewKontakt(filterTyp === "alle" ? "energielieferanten" : filterTyp),
    );
  };

  const handleAddFirstOfType = (typ: KontaktTyp) => {
    setIsAddingNew(true);
    setDetailId(null);
    setNewKontakt(createNewKontakt(typ));
  };

  const handleSaveNew = () => {
    if (!newKontakt) return;
    const now = Date.now();
    setKontakte((prev) => [...prev, { ...newKontakt, _createdAt: now, _updatedAt: now }]);
    setIsAddingNew(false);
    setNewKontakt(null);
    toast({ title: "Kontakt angelegt", description: `"${newKontakt.name}" wurde gespeichert.`, duration: 3000 });
  };

  const handleCancelNew = () => {
    setIsAddingNew(false);
    setNewKontakt(null);
  };

  const handleUpdate = (id: string, updates: Partial<Kontakt>) => {
    setKontakte((prev) => prev.map((k) => k.id === id ? { ...k, ...updates } : k));
  };

  const handleSave = (k: Kontakt) => {
    setKontakte((prev) => prev.map((c) => c.id === k.id ? { ...c, _updatedAt: Date.now() } : c));
    toast({ title: "✓ Gespeichert", description: `"${k.name}" wurde gespeichert.`, duration: 3000 });
  };

  const handleDeleteRequest = (k: Kontakt) => {
    setDeleteCallback(() => () => {
      setKontakte((prev) => prev.filter((c) => c.id !== k.id));
      if (detailId === k.id) setDetailId(null);
    });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    deleteCallback?.();
    setDeleteDialogOpen(false);
    setDeleteCallback(null);
  };

  const openBriefModal = (k: Kontakt) => {
    // increment usage count
    setKontakte((prev) => prev.map((c) => c.id === k.id ? { ...c, _usageCount: (c._usageCount ?? 0) + 1 } : c));
    setBriefEmpfaenger(k.name);
    setBriefBetreff("");
    setBriefText(
      "Sehr geehrte Damen und Herren,\n\n\n\nMit freundlichen Grüßen\nIhre Hausverwaltung Boss",
    );
    setBriefModalOpen(true);
  };

  const handleExportBriefPDF = () => {
    const doc = generateBriefPDF({ empfaenger: briefEmpfaenger, betreff: briefBetreff, text: briefText });
    downloadPDF(doc, `brief_${briefEmpfaenger.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}`);
    setBriefModalOpen(false);
    toast({ title: "PDF exportiert", description: `Brief an "${briefEmpfaenger}" wurde als PDF gespeichert.` });
  };

  // ─── Layout ─────────────────────────────────────────────────────────────────

  const detailKontakt = detailId != null ? (kontakte.find((c) => c.id === detailId) ?? null) : null;
  const allItems = useMemo(() => {
    const base = visibleTypen.flatMap((typ) => kontakte.filter((k) => k.typ === typ));
    const q = search.trim().toLowerCase();
    const filtered = q
      ? base.filter((k) =>
          k.name.toLowerCase().includes(q) ||
          TYP_LABELS[k.typ].toLowerCase().includes(q) ||
          getSubInfo(k).toLowerCase().includes(q)
        )
      : base;
    return sortKontakte(filtered, sortCol, sortDir);
  }, [visibleTypen, kontakte, sortCol, sortDir, search]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {detailKontakt ? (
        /* ── Detail view ──────────────────────────────────────────────────────── */
        <>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 min-w-0">
              <Button variant="ghost" size="sm" className="gap-1 -ml-1 shrink-0" onClick={() => setDetailId(null)}>
                <ChevronLeft className="h-4 w-4" />
                Zurück
              </Button>
              <div className="flex items-baseline gap-2 min-w-0">
                <h2 className="font-semibold truncate">{detailKontakt.name}</h2>
                <span className="text-sm text-muted-foreground shrink-0">{TYP_LABELS[detailKontakt.typ]}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => openBriefModal(detailKontakt)}>
                <Mail className="h-3.5 w-3.5" />
                Brief schreiben
              </Button>
              <Button
                variant="outline" size="sm"
                className="gap-1.5 text-destructive hover:text-destructive border-destructive/40"
                onClick={() => handleDeleteRequest(detailKontakt)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Löschen
              </Button>
              <Button
                size="sm" className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => handleSave(detailKontakt)}
              >
                <Save className="h-3.5 w-3.5" />
                Speichern
              </Button>
            </div>
          </div>
          <KontaktFormFields
            kontakt={detailKontakt}
            onChange={(u) => handleUpdate(detailKontakt.id, u)}
          />
        </>
      ) : (
        /* ── List view ────────────────────────────────────────────────────────── */
        <>
          {/* Top action bar */}
          <div className="flex items-center gap-2">
            <Select value={filterTyp} onValueChange={(v) => setFilterTyp(v as KontaktTyp | "alle")}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alle">Alle Kontakte</SelectItem>
                {ALL_TYPEN.map((t) => (
                  <SelectItem key={t} value={t}>{TYP_LABELS[t]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Suchen…"
                className="pl-8 h-9 text-sm"
              />
            </div>
            <div className="flex-1" />
            <Button size="sm" className="gap-2" onClick={handleStartNew}>
              <Plus className="h-4 w-4" />
              Neuen Kontakt anlegen
            </Button>
          </div>

          {/* Inline new-contact form */}
          {isAddingNew && newKontakt && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">Neuen Kontakt anlegen</CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="gap-1" onClick={handleCancelNew}>
                      <X className="h-3 w-3" />
                      Abbrechen
                    </Button>
                    <Button size="sm" className="gap-1 bg-emerald-600 hover:bg-emerald-700" onClick={handleSaveNew}>
                      <Save className="h-3 w-3" />
                      Anlegen
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs">Kontakttyp</Label>
                  <Select
                    value={newKontakt.typ}
                    onValueChange={(v: KontaktTyp) => {
                      const fresh = createNewKontakt(v);
                      setNewKontakt({ ...fresh, id: newKontakt.id });
                    }}
                  >
                    <SelectTrigger className="w-52">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_TYPEN.map((t) => (
                        <SelectItem key={t} value={t}>{TYP_LABELS[t]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <KontaktFormFields
                  kontakt={newKontakt}
                  onChange={(u) => setNewKontakt((prev) => prev ? { ...prev, ...u } : prev)}
                />
              </CardContent>
            </Card>
          )}

          {/* All contacts — flat table, type as column */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-auto" style={{ maxHeight: "calc(100vh - 220px)" }}>
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    {([
                      ["name",      "Name"],
                      ["kategorie", "Kategorie"],
                      ["details",   "Details"],
                      ["telefon",   "Telefon"],
                      ["email",     "E-Mail"],
                    ] as [SortCol, string][]).map(([col, label]) => (
                      <TableHead
                        key={col}
                        className="cursor-pointer select-none whitespace-nowrap"
                        onClick={() => handleHeaderClick(col)}
                      >
                        <div className="flex items-center gap-1">
                          {label}
                          {sortCol === col
                            ? sortDir === "asc"
                              ? <ArrowUp className="h-3.5 w-3.5 text-foreground" />
                              : <ArrowDown className="h-3.5 w-3.5 text-foreground" />
                            : <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />}
                        </div>
                      </TableHead>
                    ))}
                    <TableHead className="w-[40px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allItems.length === 0 ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={6} className="py-12 text-center text-muted-foreground text-sm">
                        Keine Kontakte vorhanden
                      </TableCell>
                    </TableRow>
                  ) : allItems.map((k) => {
                    const Icon = TYP_ICONS[k.typ];
                    return (
                      <TableRow
                        key={`${k.typ}-${k.id}`}
                        className="cursor-pointer"
                        onClick={() => setDetailId(k.id)}
                      >
                        <TableCell>
                          <span className="font-medium text-sm">{k.name}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground whitespace-nowrap">
                            <Icon className="h-3.5 w-3.5 shrink-0" />
                            {TYP_LABELS[k.typ]}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {getSubInfo(k)}
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {k.telefon ?? ""}
                        </TableCell>
                        <TableCell className="text-sm">
                          {k.email ?? ""}
                        </TableCell>
                        <TableCell>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Brief Modal */}
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
            <Button variant="outline" onClick={() => setBriefModalOpen(false)}>Abbrechen</Button>
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
              Diese Aktion kann nicht rückgängig gemacht werden. Der Kontakt wird dauerhaft gelöscht.
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

// ─── Form field components per type ──────────────────────────────────────────

function KontaktFormFields({
  kontakt,
  onChange,
}: {
  kontakt: Kontakt;
  onChange: (updates: Partial<Kontakt>) => void;
}) {
  switch (kontakt.typ) {
    case "energielieferanten": return <EnergielieferantFields k={kontakt} onChange={onChange} />;
    case "messdienst":         return <MessdienstFields k={kontakt} onChange={onChange} />;
    case "finanzierung":       return <FinanzierungFields k={kontakt} onChange={onChange} />;
    case "versicherungen":     return <VersicherungFields k={kontakt} onChange={onChange} />;
    case "wartung":            return <WartungFields k={kontakt} onChange={onChange} />;
    case "rechtsberatung":     return <RechtsberatungFields k={kontakt} onChange={onChange} />;
    case "individuell":        return <IndividuellFields k={kontakt} onChange={onChange} />;
  }
}

type FProps = { k: Kontakt; onChange: (u: Partial<Kontakt>) => void };

function EnergielieferantFields({ k, onChange }: FProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">Lieferanten-Daten</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Energieart</Label>
              <Select value={k.energieart ?? ""} onValueChange={(v) => onChange({ energieart: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
                value={k.lieferant ?? ""}
                onChange={(e) => onChange({ lieferant: e.target.value, name: `${e.target.value} - ${k.energieart}` })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Kundennummer</Label>
              <Input value={k.kundennummer ?? ""} onChange={(e) => onChange({ kundennummer: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Zählernummer</Label>
              <Input value={k.zaehlernummer ?? ""} onChange={(e) => onChange({ zaehlernummer: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">Kontakt</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Anrede</Label>
              <Select value={k.anrede ?? ""} onValueChange={(v) => onChange({ anrede: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Herr">Herr</SelectItem>
                  <SelectItem value="Frau">Frau</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-3 space-y-1">
              <Label className="text-xs">Ansprechpartner</Label>
              <Input value={k.ansprechpartner ?? ""} onChange={(e) => onChange({ ansprechpartner: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Straße</Label>
            <Input value={k.strasse ?? ""} onChange={(e) => onChange({ strasse: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">PLZ</Label>
              <Input value={k.plz ?? ""} onChange={(e) => onChange({ plz: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Ort</Label>
              <Input value={k.ort ?? ""} onChange={(e) => onChange({ ort: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Telefon</Label>
              <Input value={k.telefon ?? ""} onChange={(e) => onChange({ telefon: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fax</Label>
              <Input value={k.fax ?? ""} onChange={(e) => onChange({ fax: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">E-Mail</Label>
              <Input value={k.email ?? ""} onChange={(e) => onChange({ email: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Briefanrede</Label>
            <Input value={k.briefanrede ?? ""} onChange={(e) => onChange({ briefanrede: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">Technische Daten</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Montageort</Label>
              <Input value={k.woMontiert ?? ""} onChange={(e) => onChange({ woMontiert: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tankgröße (Liter)</Label>
              <Input value={k.tankgroesse ?? ""} onChange={(e) => onChange({ tankgroesse: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Ablesetermin</Label>
            <Input value={k.ablesetermin ?? ""} onChange={(e) => onChange({ ablesetermin: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">Zahlungsdaten</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Bank</Label>
            <Input value={k.bank ?? ""} onChange={(e) => onChange({ bank: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">BLZ/BIC</Label>
              <Input value={k.blzBic ?? ""} onChange={(e) => onChange({ blzBic: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Kto/IBAN</Label>
              <Input value={k.ktoIban ?? ""} onChange={(e) => onChange({ ktoIban: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Monatlicher Betrag (€)</Label>
              <Input value={k.betrag ?? ""} onChange={(e) => onChange({ betrag: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Zahltermin</Label>
              <Input value={k.zahltermin ?? ""} onChange={(e) => onChange({ zahltermin: e.target.value })} />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="einzug-energie"
              checked={k.einzugsermaechtigung ?? false}
              onCheckedChange={(c) => onChange({ einzugsermaechtigung: c === true })}
            />
            <label htmlFor="einzug-energie" className="text-sm">Einzugsermächtigung erteilt</label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">Besonderheiten</CardTitle></CardHeader>
        <CardContent>
          <Textarea rows={4} value={k.besonderheiten ?? ""} onChange={(e) => onChange({ besonderheiten: e.target.value })} />
        </CardContent>
      </Card>
    </div>
  );
}

function MessdienstFields({ k, onChange }: FProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">Meßdienst-Daten</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Firma</Label>
            <Input value={k.name} onChange={(e) => onChange({ name: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Kundennummer</Label>
            <Input value={k.kundennummer ?? ""} onChange={(e) => onChange({ kundennummer: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Ansprechpartner</Label>
            <Input value={k.ansprechpartner ?? ""} onChange={(e) => onChange({ ansprechpartner: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Telefon</Label>
              <Input value={k.telefon ?? ""} onChange={(e) => onChange({ telefon: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">E-Mail</Label>
              <Input value={k.email ?? ""} onChange={(e) => onChange({ email: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FinanzierungFields({ k, onChange }: FProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">Darlehensdaten</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Bank / Kreditinstitut</Label>
            <Input value={k.name} onChange={(e) => onChange({ name: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Darlehensnummer</Label>
              <Input value={k.darlehensnummer ?? ""} onChange={(e) => onChange({ darlehensnummer: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Darlehensart</Label>
              <Select value={k.darlehensart ?? ""} onValueChange={(v) => onChange({ darlehensart: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Annuitätendarlehen">Annuitätendarlehen</SelectItem>
                  <SelectItem value="Tilgungsdarlehen">Tilgungsdarlehen</SelectItem>
                  <SelectItem value="Endfälliges Darlehen">Endfälliges Darlehen</SelectItem>
                  <SelectItem value="KfW-Förderkredit">KfW-Förderkredit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Darlehenssumme (€)</Label>
              <Input value={k.darlehenssumme ?? ""} onChange={(e) => onChange({ darlehenssumme: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Zinssatz (%)</Label>
              <Input value={k.zinssatz ?? ""} onChange={(e) => onChange({ zinssatz: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tilgung (%)</Label>
              <Input value={k.tilgung ?? ""} onChange={(e) => onChange({ tilgung: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Rate (€)</Label>
              <Input value={k.rate ?? ""} onChange={(e) => onChange({ rate: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Laufzeit bis</Label>
              <Input value={k.laufzeit ?? ""} onChange={(e) => onChange({ laufzeit: e.target.value })} />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="grundbuch"
              checked={k.grundbucheintrag ?? false}
              onCheckedChange={(c) => onChange({ grundbucheintrag: c === true })}
            />
            <label htmlFor="grundbuch" className="text-sm">Grundbucheintrag vorhanden</label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">Kontakt</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Anrede</Label>
              <Select value={k.anrede ?? ""} onValueChange={(v) => onChange({ anrede: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Herr">Herr</SelectItem>
                  <SelectItem value="Frau">Frau</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-3 space-y-1">
              <Label className="text-xs">Ansprechpartner</Label>
              <Input value={k.ansprechpartner ?? ""} onChange={(e) => onChange({ ansprechpartner: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Straße</Label>
            <Input value={k.strasse ?? ""} onChange={(e) => onChange({ strasse: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">PLZ</Label>
              <Input value={k.plz ?? ""} onChange={(e) => onChange({ plz: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Ort</Label>
              <Input value={k.ort ?? ""} onChange={(e) => onChange({ ort: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Telefon</Label>
              <Input value={k.telefon ?? ""} onChange={(e) => onChange({ telefon: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fax</Label>
              <Input value={k.fax ?? ""} onChange={(e) => onChange({ fax: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">E-Mail</Label>
              <Input value={k.email ?? ""} onChange={(e) => onChange({ email: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Briefanrede</Label>
            <Input value={k.briefanrede ?? ""} onChange={(e) => onChange({ briefanrede: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Zahltermin</Label>
              <Input value={k.zahltermin ?? ""} onChange={(e) => onChange({ zahltermin: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Zahlungsweise</Label>
              <Input value={k.zahlungsweise ?? ""} onChange={(e) => onChange({ zahlungsweise: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">Besonderheiten</CardTitle></CardHeader>
        <CardContent>
          <Textarea rows={4} value={k.besonderheiten ?? ""} onChange={(e) => onChange({ besonderheiten: e.target.value })} />
        </CardContent>
      </Card>
    </div>
  );
}

function VersicherungFields({ k, onChange }: FProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">Versicherungsdaten</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Versicherungsart</Label>
              <Select value={k.versicherungsart ?? ""} onValueChange={(v) => onChange({ versicherungsart: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Gebäudeversicherung">Gebäudeversicherung</SelectItem>
                  <SelectItem value="Haus- und Grundbesitzerhaftpflicht">Haus- und Grundbesitzerhaftpflicht</SelectItem>
                  <SelectItem value="Gewässerschadenhaftpflicht">Gewässerschadenhaftpflicht</SelectItem>
                  <SelectItem value="Glasversicherung">Glasversicherung</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Versicherung</Label>
              <Input
                value={k.versicherung ?? ""}
                onChange={(e) => onChange({ versicherung: e.target.value, name: `${e.target.value} - ${k.versicherungsart}` })}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Versicherungsnummer</Label>
            <Input value={k.versicherungsNr ?? ""} onChange={(e) => onChange({ versicherungsNr: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Jahresprämie (€)</Label>
              <Input value={k.jahrespraemie ?? ""} onChange={(e) => onChange({ jahrespraemie: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Laufzeit bis</Label>
              <Input value={k.laufzeitBis ?? ""} onChange={(e) => onChange({ laufzeitBis: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Kündigungsfrist</Label>
              <Input value={k.kuendigungsfrist ?? ""} onChange={(e) => onChange({ kuendigungsfrist: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Zahlungsweise</Label>
              <Input value={k.zahlungsweise ?? ""} onChange={(e) => onChange({ zahlungsweise: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Zahltermin</Label>
              <Input value={k.zahltermin ?? ""} onChange={(e) => onChange({ zahltermin: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Wert 1914 (Mark)</Label>
              <Input value={k.wert1914 ?? ""} onChange={(e) => onChange({ wert1914: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Glasfläche (m²)</Label>
              <Input value={k.glasflaeche ?? ""} onChange={(e) => onChange({ glasflaeche: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tankinhalt (Liter)</Label>
              <Input value={k.brennstofftankinhalt ?? ""} onChange={(e) => onChange({ brennstofftankinhalt: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Bruttomietwert (€)</Label>
            <Input value={k.bruttomietwert ?? ""} onChange={(e) => onChange({ bruttomietwert: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">Kontakt</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Anrede</Label>
              <Select value={k.anrede ?? ""} onValueChange={(v) => onChange({ anrede: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Herr">Herr</SelectItem>
                  <SelectItem value="Frau">Frau</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-3 space-y-1">
              <Label className="text-xs">Ansprechpartner</Label>
              <Input value={k.ansprechpartner ?? ""} onChange={(e) => onChange({ ansprechpartner: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Straße</Label>
            <Input value={k.strasse ?? ""} onChange={(e) => onChange({ strasse: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">PLZ</Label>
              <Input value={k.plz ?? ""} onChange={(e) => onChange({ plz: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Ort</Label>
              <Input value={k.ort ?? ""} onChange={(e) => onChange({ ort: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Telefon</Label>
              <Input value={k.telefon ?? ""} onChange={(e) => onChange({ telefon: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fax</Label>
              <Input value={k.fax ?? ""} onChange={(e) => onChange({ fax: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Mobil</Label>
              <Input value={k.mobil ?? ""} onChange={(e) => onChange({ mobil: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">E-Mail</Label>
              <Input value={k.email ?? ""} onChange={(e) => onChange({ email: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Briefanrede</Label>
            <Input value={k.briefanrede ?? ""} onChange={(e) => onChange({ briefanrede: e.target.value })} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">Bankverbindung</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Bank</Label>
            <Input value={k.bank ?? ""} onChange={(e) => onChange({ bank: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">BLZ/BIC</Label>
              <Input value={k.blzBic ?? ""} onChange={(e) => onChange({ blzBic: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Kto/IBAN</Label>
              <Input value={k.ktoIban ?? ""} onChange={(e) => onChange({ ktoIban: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">Besonderheiten</CardTitle></CardHeader>
        <CardContent>
          <Textarea rows={4} value={k.besonderheiten ?? ""} onChange={(e) => onChange({ besonderheiten: e.target.value })} />
        </CardContent>
      </Card>
    </div>
  );
}

function WartungFields({ k, onChange }: FProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">Dienstleister-Daten</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Kategorie</Label>
              <Select value={k.kategorie ?? ""} onValueChange={(v) => onChange({ kategorie: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
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
              <Input value={k.gewerk ?? ""} onChange={(e) => onChange({ gewerk: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Firma</Label>
            <Input
              value={k.firma ?? ""}
              onChange={(e) => onChange({ firma: e.target.value, name: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Ansprechpartner</Label>
            <Input value={k.ansprechpartner ?? ""} onChange={(e) => onChange({ ansprechpartner: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Straße</Label>
            <Input value={k.strasse ?? ""} onChange={(e) => onChange({ strasse: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">PLZ</Label>
              <Input value={k.plz ?? ""} onChange={(e) => onChange({ plz: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Ort</Label>
              <Input value={k.ort ?? ""} onChange={(e) => onChange({ ort: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Telefon</Label>
              <Input value={k.telefon ?? ""} onChange={(e) => onChange({ telefon: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">E-Mail</Label>
              <Input value={k.email ?? ""} onChange={(e) => onChange({ email: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RechtsberatungFields({ k, onChange }: FProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">Kanzlei-Daten</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Kanzlei</Label>
            <Input value={k.kanzlei ?? ""} onChange={(e) => onChange({ kanzlei: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Anwalt</Label>
              <Input
                value={k.anwalt ?? ""}
                onChange={(e) => onChange({ anwalt: e.target.value, name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fachgebiet</Label>
              <Input value={k.fachgebiet ?? ""} onChange={(e) => onChange({ fachgebiet: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Straße</Label>
            <Input value={k.strasse ?? ""} onChange={(e) => onChange({ strasse: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">PLZ</Label>
              <Input value={k.plz ?? ""} onChange={(e) => onChange({ plz: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Ort</Label>
              <Input value={k.ort ?? ""} onChange={(e) => onChange({ ort: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Telefon</Label>
              <Input value={k.telefon ?? ""} onChange={(e) => onChange({ telefon: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">E-Mail</Label>
              <Input value={k.email ?? ""} onChange={(e) => onChange({ email: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function IndividuellFields({ k, onChange }: FProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">Kontakt-Daten</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Name</Label>
              <Input value={k.name} onChange={(e) => onChange({ name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Bezeichnung (z. B. Steuerberater, Notar)</Label>
              <Input value={k.bezeichnung ?? ""} onChange={(e) => onChange({ bezeichnung: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Telefon</Label>
              <Input value={k.telefon ?? ""} onChange={(e) => onChange({ telefon: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">E-Mail</Label>
              <Input value={k.email ?? ""} onChange={(e) => onChange({ email: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Straße</Label>
            <Input value={k.strasse ?? ""} onChange={(e) => onChange({ strasse: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">PLZ</Label>
              <Input value={k.plz ?? ""} onChange={(e) => onChange({ plz: e.target.value })} />
            </div>
            <div className="col-span-2 space-y-1">
              <Label className="text-xs">Ort</Label>
              <Input value={k.ort ?? ""} onChange={(e) => onChange({ ort: e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="py-3"><CardTitle className="text-sm">Notizen</CardTitle></CardHeader>
        <CardContent>
          <Textarea
            rows={6}
            value={k.notizen ?? ""}
            onChange={(e) => onChange({ notizen: e.target.value })}
            placeholder="Notizen..."
          />
        </CardContent>
      </Card>
    </div>
  );
}
