"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Plus,
  Save,
  Trash2,
  FileDown,
  Pencil,
  Filter,
  X,
  ChevronDown,
  TrendingUp,
  RotateCcw,
  Download,
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import {
  useAppData,
  type Buchung,
  type Objekt,
  type Wohnung,
} from "@/context/app-data-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { generatePDF, downloadPDF, sanitizeFilename } from "@/lib/pdf-generator";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EINNAHMEN_KATEGORIEN = [
  "Mieteinnahmen",
  "Kaution",
  "NK-Vorauszahlung",
  "Sonstige Einnahmen",
];

const AUSGABEN_KATEGORIEN = [
  "Betriebskosten",
  "Heizkosten",
  "Wasserkosten",
  "Versicherung",
  "Hausmeister",
  "Müllabfuhr",
  "Grundsteuer",
  "Instandhaltung",
  "Reparaturen",
  "Verwaltungskosten",
  "Sonstige Ausgaben",
];

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BuchungFilter {
  typ: "alle" | "einnahme" | "ausgabe";
  kategorien: string[];
  objektId: string;
  vonDatum: string;
  bisDatum: string;
  vonBetrag: number | null;
  bisBetrag: number | null;
}

const EMPTY_FILTER: BuchungFilter = {
  typ: "alle",
  kategorien: [],
  objektId: "",
  vonDatum: "",
  bisDatum: "",
  vonBetrag: null,
  bisBetrag: null,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getObjektName(id: string | null | undefined, objekte: Objekt[]): string {
  if (!id) return "—";
  return objekte.find((o) => o.id === id)?.name ?? "—";
}

function getWohnungName(id: string | null | undefined, wohnungen: Wohnung[]): string {
  if (!id) return "—";
  return wohnungen.find((w) => w.id === id)?.bezeichnung ?? "—";
}

function kategorienForTyp(typ: BuchungFilter["typ"]): string[] {
  if (typ === "einnahme") return EINNAHMEN_KATEGORIEN;
  if (typ === "ausgabe") return AUSGABEN_KATEGORIEN;
  return [...EINNAHMEN_KATEGORIEN, ...AUSGABEN_KATEGORIEN];
}

function recalcBrutto(netto: number, mwst: number): number {
  return netto * (1 + mwst / 100);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function EinnahmenAusgabenView() {
  const { profile, isDemo } = useAuth();
  const { toast } = useToast();
  const {
    buchungen,
    addBuchung,
    updateBuchung,
    deleteBuchung,
    objekte,
    wohnungen,
    mieter,
  } = useAppData();
  const isMobile = useIsMobile();

  // ------ filter ------
  const [filter, setFilter] = useState<BuchungFilter>(EMPTY_FILTER);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ------ booking form ------
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBuchung, setEditingBuchung] = useState<Buchung | null>(null);
  const [formTyp, setFormTyp] = useState<"einnahme" | "ausgabe">("ausgabe");
  const [formDatum, setFormDatum] = useState(new Date().toISOString().split("T")[0]);
  const [formKategorie, setFormKategorie] = useState("");
  const [formRechnungssteller, setFormRechnungssteller] = useState("");
  const [formRechnungsnummer, setFormRechnungsnummer] = useState("");
  const [formObjektId, setFormObjektId] = useState("");
  const [formWohnungId, setFormWohnungId] = useState("");
  const [formMieterId, setFormMieterId] = useState("");
  const [formBetragNetto, setFormBetragNetto] = useState<number>(0);
  const [formMwstProzent, setFormMwstProzent] = useState<number>(19);
  const [formBetragBrutto, setFormBetragBrutto] = useState<number>(0);
  const [formBeschreibung, setFormBeschreibung] = useState("");

  // ------ confirm dialogs ------
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [stornoId, setStornoId] = useState<string | null>(null);

  // ------ mieten buchen ------
  const [mietenOpen, setMietenOpen] = useState(false);
  const [mietenMonat, setMietenMonat] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [mietenSelection, setMietenSelection] = useState<string[]>([]);

  // ---------------------------------------------------------------------------
  // Derived data
  // ---------------------------------------------------------------------------

  const storniertSet = useMemo(
    () => new Set(buchungen.filter((b) => b.stornoVon).map((b) => b.stornoVon!)),
    [buchungen],
  );

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (filter.typ !== "alle") n++;
    if (filter.kategorien.length > 0) n++;
    if (filter.objektId) n++;
    if (filter.vonDatum) n++;
    if (filter.bisDatum) n++;
    if (filter.vonBetrag !== null) n++;
    if (filter.bisBetrag !== null) n++;
    return n;
  }, [filter]);

  const filteredBuchungen = useMemo(() => {
    return buchungen.filter((b) => {
      if (filter.typ !== "alle" && b.typ !== filter.typ) return false;
      if (filter.kategorien.length > 0 && !filter.kategorien.includes(b.kategorie))
        return false;
      if (filter.objektId && b.objektId !== filter.objektId) return false;
      if (filter.vonDatum && b.datum < filter.vonDatum) return false;
      if (filter.bisDatum && b.datum > filter.bisDatum) return false;
      const betrag = Math.abs(b.betragBrutto);
      if (filter.vonBetrag !== null && betrag < filter.vonBetrag) return false;
      if (filter.bisBetrag !== null && betrag > filter.bisBetrag) return false;
      return true;
    });
  }, [buchungen, filter]);

  const summary = useMemo(() => {
    const einnahmen = filteredBuchungen
      .filter((b) => b.typ === "einnahme")
      .reduce((s, b) => s + b.betragBrutto, 0);
    const ausgaben = filteredBuchungen
      .filter((b) => b.typ === "ausgabe")
      .reduce((s, b) => s + Math.abs(b.betragBrutto), 0);
    return {
      einnahmen,
      ausgaben,
      ueberschuss: einnahmen - ausgaben,
      count: filteredBuchungen.length,
    };
  }, [filteredBuchungen]);

  // ---------------------------------------------------------------------------
  // Form helpers
  // ---------------------------------------------------------------------------

  const openCreate = () => {
    setEditingBuchung(null);
    setFormTyp("ausgabe");
    setFormDatum(new Date().toISOString().split("T")[0]);
    setFormKategorie("");
    setFormRechnungssteller("");
    setFormRechnungsnummer("");
    setFormObjektId("");
    setFormWohnungId("");
    setFormMieterId("");
    setFormBetragNetto(0);
    setFormMwstProzent(19);
    setFormBetragBrutto(0);
    setFormBeschreibung("");
    setIsFormOpen(true);
  };

  const openEdit = (b: Buchung) => {
    setEditingBuchung(b);
    setFormTyp(b.typ);
    setFormDatum(b.datum);
    setFormKategorie(b.kategorie);
    setFormRechnungssteller(b.rechnungssteller ?? "");
    setFormRechnungsnummer(b.rechnungsnummer ?? "");
    setFormObjektId(b.objektId ?? "");
    setFormWohnungId(b.wohnungId ?? "");
    setFormMieterId(b.mieterId ?? "");
    setFormBetragNetto(Math.abs(b.betragNetto));
    setFormMwstProzent(b.mwstProzent);
    setFormBetragBrutto(Math.abs(b.betragBrutto));
    setFormBeschreibung(b.beschreibung);
    setIsFormOpen(true);
  };

  // ---------------------------------------------------------------------------
  // CRUD handlers
  // ---------------------------------------------------------------------------

  const handleSave = async () => {
    if (isDemo) {
      toast({
        title: "Demo-Modus",
        description: "Im Demo-Modus keine Änderungen möglich.",
        variant: "destructive",
      });
      return;
    }
    if (!formKategorie) {
      toast({ title: "Kategorie erforderlich", variant: "destructive" });
      return;
    }
    if (formBetragNetto <= 0) {
      toast({
        title: "Betrag erforderlich",
        description: "Bitte geben Sie einen gültigen Betrag ein.",
        variant: "destructive",
      });
      return;
    }
    if (!formObjektId) {
      toast({ title: "Objekt erforderlich", variant: "destructive" });
      return;
    }

    const mwst = formTyp === "ausgabe" ? formMwstProzent : 0;
    const brutto = recalcBrutto(formBetragNetto, mwst);

    try {
      if (editingBuchung) {
        await updateBuchung(editingBuchung.id, {
          typ: formTyp,
          kategorie: formKategorie,
          datum: formDatum,
          betragNetto: formBetragNetto,
          mwstProzent: mwst,
          betragBrutto: brutto,
          objektId: formObjektId || null,
          wohnungId: formWohnungId || null,
          mieterId: formMieterId || null,
          beschreibung: formBeschreibung,
          rechnungssteller: formTyp === "ausgabe" ? (formRechnungssteller || null) : null,
          rechnungsnummer: formTyp === "ausgabe" ? (formRechnungsnummer || null) : null,
        });
        toast({ title: "Buchung aktualisiert" });
      } else {
        await addBuchung({
          typ: formTyp,
          kategorie: formKategorie,
          datum: formDatum,
          betragNetto: formBetragNetto,
          mwstProzent: mwst,
          betragBrutto: brutto,
          objektId: formObjektId || null,
          wohnungId: formWohnungId || null,
          mieterId: formMieterId || null,
          beschreibung: formBeschreibung,
          rechnungssteller: formTyp === "ausgabe" ? (formRechnungssteller || null) : null,
          rechnungsnummer: formTyp === "ausgabe" ? (formRechnungsnummer || null) : null,
          belegPfad: null,
          stornoVon: null,
        });
        toast({ title: "Buchung erstellt" });
      }
      setIsFormOpen(false);
    } catch {
      toast({
        title: "Fehler",
        description: "Buchung konnte nicht gespeichert werden.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      await deleteBuchung(deleteId);
      toast({ title: "Buchung gelöscht" });
    } catch {
      toast({
        title: "Fehler",
        description: "Buchung konnte nicht gelöscht werden.",
        variant: "destructive",
      });
    } finally {
      setDeleteId(null);
    }
  };

  const handleStornoConfirm = async () => {
    if (!stornoId) return;
    const original = buchungen.find((b) => b.id === stornoId);
    if (!original) return;
    try {
      await addBuchung({
        typ: original.typ,
        kategorie: original.kategorie,
        datum: new Date().toISOString().split("T")[0],
        betragNetto: -Math.abs(original.betragNetto),
        mwstProzent: original.mwstProzent,
        betragBrutto: -Math.abs(original.betragBrutto),
        objektId: original.objektId ?? null,
        wohnungId: original.wohnungId ?? null,
        mieterId: original.mieterId ?? null,
        beschreibung: `Storno: ${original.beschreibung || original.kategorie}`,
        rechnungssteller: original.rechnungssteller ?? null,
        rechnungsnummer: original.rechnungsnummer ?? null,
        belegPfad: null,
        stornoVon: original.id,
      });
      toast({ title: "Storno-Buchung erstellt" });
    } catch {
      toast({
        title: "Fehler",
        description: "Storno konnte nicht gebucht werden.",
        variant: "destructive",
      });
    } finally {
      setStornoId(null);
    }
  };

  const handleMietenBuchen = async () => {
    if (isDemo) {
      toast({ title: "Demo-Modus", variant: "destructive" });
      return;
    }
    if (mietenSelection.length === 0) {
      toast({ title: "Keine Mieter ausgewählt", variant: "destructive" });
      return;
    }
    const datum = `${mietenMonat}-01`;
    let created = 0;
    for (const mieterId of mietenSelection) {
      const m = mieter.find((x) => x.id === mieterId);
      if (!m) continue;
      const wohnung = wohnungen.find((w) => w.id === m.wohnungId);
      const betrag = (m.kaltmiete || 0) + (m.nebenkosten || 0);
      try {
        await addBuchung({
          typ: "einnahme",
          kategorie: "Mieteinnahmen",
          datum,
          betragNetto: betrag,
          mwstProzent: 0,
          betragBrutto: betrag,
          objektId: wohnung?.objektId ?? null,
          wohnungId: m.wohnungId ?? null,
          mieterId: m.id,
          beschreibung: `Miete ${mietenMonat} – ${m.name}`,
          rechnungssteller: null,
          rechnungsnummer: null,
          belegPfad: null,
          stornoVon: null,
        });
        created++;
      } catch {
        // continue with remaining entries
      }
    }
    toast({ title: `${created} Buchung${created !== 1 ? "en" : ""} erstellt` });
    setMietenOpen(false);
    setMietenSelection([]);
  };

  // ---------------------------------------------------------------------------
  // Export
  // ---------------------------------------------------------------------------

  const handleExportPDF = () => {
    try {
      const doc = generatePDF({
        title: "Einnahmen & Ausgaben",
        subtitle: `Exportiert am ${new Date().toLocaleDateString("de-DE")}`,
        profile,
        content: [
          {
            type: "table",
            data: {
              headers: ["Datum", "Typ", "Kategorie", "Rechnungssteller", "Betrag"],
              rows: filteredBuchungen.map((b) => [
                new Date(b.datum).toLocaleDateString("de-DE"),
                b.typ === "einnahme" ? "Einnahme" : "Ausgabe",
                b.kategorie,
                b.rechnungssteller ?? "—",
                `${b.betragBrutto > 0 && b.typ === "einnahme" ? "+" : ""}${b.betragBrutto.toFixed(2)} €`,
              ]),
            },
          },
        ],
      });
      downloadPDF(doc, sanitizeFilename("einnahmen_ausgaben"));
      toast({ title: "PDF exportiert" });
    } catch {
      toast({ title: "Fehler beim PDF-Export", variant: "destructive" });
    }
  };

  const handleExportCSV = (datev = false) => {
    const sep = ";";
    const header = datev
      ? ["Datum", "Buchungstext", "Umsatz", "Soll/Haben", "Konto", "Gegenkonto"]
      : [
          "Datum",
          "Typ",
          "Kategorie",
          "Rechnungssteller",
          "Rechnungsnummer",
          "Objekt",
          "Wohnung",
          "Betrag Netto",
          "MwSt%",
          "Betrag Brutto",
          "Beschreibung",
        ];
    const rows = filteredBuchungen.map((b) => {
      if (datev) {
        return [
          b.datum,
          b.beschreibung || b.kategorie,
          Math.abs(b.betragBrutto).toFixed(2).replace(".", ","),
          b.typ === "einnahme" ? "H" : "S",
          "8400",
          "1000",
        ];
      }
      return [
        b.datum,
        b.typ,
        b.kategorie,
        b.rechnungssteller ?? "",
        b.rechnungsnummer ?? "",
        getObjektName(b.objektId, objekte),
        getWohnungName(b.wohnungId, wohnungen),
        Math.abs(b.betragNetto).toFixed(2),
        b.mwstProzent.toString(),
        Math.abs(b.betragBrutto).toFixed(2),
        b.beschreibung ?? "",
      ];
    });
    const csv = [header, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(sep))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      sanitizeFilename(datev ? "datev_export" : "buchungen_export") + ".csv";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: datev ? "DATEV CSV exportiert" : "CSV exportiert" });
  };

  // ---------------------------------------------------------------------------
  // Sub-components (inline to avoid prop drilling)
  // ---------------------------------------------------------------------------

  const FilterSidebar = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[15px] font-medium">
          Filter {activeFilterCount > 0 && `(${activeFilterCount})`}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setFilter(EMPTY_FILTER)}
          disabled={activeFilterCount === 0}
        >
          <X className="h-4 w-4 mr-1" />
          Zurücksetzen
        </Button>
      </div>

      <Separator />

      {/* Typ – radio buttons */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Typ</Label>
        <RadioGroup
          value={filter.typ}
          onValueChange={(v) =>
            setFilter((p) => ({
              ...p,
              typ: v as BuchungFilter["typ"],
              kategorien: [],
            }))
          }
          className="space-y-1"
        >
          {(["alle", "einnahme", "ausgabe"] as const).map((t) => (
            <div key={t} className="flex items-center space-x-2">
              <RadioGroupItem value={t} id={`typ-${t}`} />
              <label htmlFor={`typ-${t}`} className="text-sm cursor-pointer">
                {t === "alle" ? "Alle" : t === "einnahme" ? "Einnahmen" : "Ausgaben"}
              </label>
            </div>
          ))}
        </RadioGroup>
      </div>

      <Separator />

      {/* Kategorie – dynamic based on Typ */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Kategorie</Label>
        <div className="space-y-1 max-h-44 overflow-y-auto">
          {kategorienForTyp(filter.typ).map((cat) => (
            <div key={cat} className="flex items-center space-x-2">
              <Checkbox
                id={`cat-${cat}`}
                checked={filter.kategorien.includes(cat)}
                onCheckedChange={(checked) =>
                  setFilter((p) => ({
                    ...p,
                    kategorien: checked
                      ? [...p.kategorien, cat]
                      : p.kategorien.filter((c) => c !== cat),
                  }))
                }
              />
              <label htmlFor={`cat-${cat}`} className="text-sm cursor-pointer">
                {cat}
              </label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Objekt */}
      <div className="space-y-2">
        <Label htmlFor="objekt-filter" className="text-sm font-medium">
          Objekt
        </Label>
        <Select
          value={filter.objektId || "_alle"}
          onValueChange={(v) =>
            setFilter((p) => ({ ...p, objektId: v === "_alle" ? "" : v }))
          }
        >
          <SelectTrigger id="objekt-filter" className="h-8">
            <SelectValue placeholder="Alle Objekte" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_alle">Alle Objekte</SelectItem>
            {objekte.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Zeitraum */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Zeitraum</Label>
        <Input
          type="date"
          value={filter.vonDatum}
          onChange={(e) => setFilter((p) => ({ ...p, vonDatum: e.target.value }))}
          className="h-8 text-sm"
          placeholder="Von"
        />
        <Input
          type="date"
          value={filter.bisDatum}
          onChange={(e) => setFilter((p) => ({ ...p, bisDatum: e.target.value }))}
          className="h-8 text-sm"
          placeholder="Bis"
        />
      </div>

      <Separator />

      {/* Betrag */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Betrag (€)</Label>
        <Input
          type="number"
          placeholder="Von"
          value={filter.vonBetrag ?? ""}
          onChange={(e) =>
            setFilter((p) => ({
              ...p,
              vonBetrag: e.target.value ? parseFloat(e.target.value) : null,
            }))
          }
          className="h-8 text-sm"
        />
        <Input
          type="number"
          placeholder="Bis"
          value={filter.bisBetrag ?? ""}
          onChange={(e) =>
            setFilter((p) => ({
              ...p,
              bisBetrag: e.target.value ? parseFloat(e.target.value) : null,
            }))
          }
          className="h-8 text-sm"
        />
      </div>
    </div>
  );

  const BookingForm = () => (
    <div className="space-y-4 mt-2">
      {/* Typ toggle */}
      <div className="space-y-2">
        <Label>Typ</Label>
        <ToggleGroup
          type="single"
          value={formTyp}
          onValueChange={(v) => {
            if (v) {
              setFormTyp(v as "einnahme" | "ausgabe");
              setFormKategorie("");
            }
          }}
          className="w-full"
        >
          <ToggleGroupItem value="einnahme" className="flex-1">
            Einnahme
          </ToggleGroupItem>
          <ToggleGroupItem value="ausgabe" className="flex-1">
            Ausgabe
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* Datum + Kategorie */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="form-datum">Datum *</Label>
          <Input
            id="form-datum"
            type="date"
            value={formDatum}
            onChange={(e) => setFormDatum(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="form-kategorie">Kategorie *</Label>
          <Select value={formKategorie} onValueChange={setFormKategorie}>
            <SelectTrigger id="form-kategorie">
              <SelectValue placeholder="Kategorie wählen" />
            </SelectTrigger>
            <SelectContent>
              {(formTyp === "einnahme" ? EINNAHMEN_KATEGORIEN : AUSGABEN_KATEGORIEN).map(
                (c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Rechnungssteller + Rechnungsnummer (Ausgabe only) */}
      {formTyp === "ausgabe" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="form-rechnungssteller">Rechnungssteller</Label>
            <Input
              id="form-rechnungssteller"
              value={formRechnungssteller}
              onChange={(e) => setFormRechnungssteller(e.target.value)}
              placeholder="Firma / Name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="form-rechnungsnummer">Rechnungsnummer</Label>
            <Input
              id="form-rechnungsnummer"
              value={formRechnungsnummer}
              onChange={(e) => setFormRechnungsnummer(e.target.value)}
              placeholder="Optional"
            />
          </div>
        </div>
      )}

      {/* Objekt + Wohnung */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="form-objekt">Objekt *</Label>
          <Select
            value={formObjektId || "_none"}
            onValueChange={(v) => {
              setFormObjektId(v === "_none" ? "" : v);
              setFormWohnungId("");
              setFormMieterId("");
            }}
          >
            <SelectTrigger id="form-objekt">
              <SelectValue placeholder="Objekt wählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">— Objekt wählen —</SelectItem>
              {objekte.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="form-wohnung">Wohnung</Label>
          <Select
            value={formWohnungId || "_none"}
            onValueChange={(v) => {
              setFormWohnungId(v === "_none" ? "" : v);
              setFormMieterId("");
            }}
          >
            <SelectTrigger id="form-wohnung">
              <SelectValue placeholder="Wohnung wählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">Keine</SelectItem>
              {wohnungen
                .filter((w) => !formObjektId || w.objektId === formObjektId)
                .map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.bezeichnung}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mieter (only when a wohnung is selected) */}
      {formWohnungId && (
        <div className="space-y-2">
          <Label htmlFor="form-mieter">Mieter (optional)</Label>
          <Select
            value={formMieterId || "_none"}
            onValueChange={(v) => setFormMieterId(v === "_none" ? "" : v)}
          >
            <SelectTrigger id="form-mieter">
              <SelectValue placeholder="Mieter wählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">Kein Mieter</SelectItem>
              {mieter
                .filter((m) => m.wohnungId === formWohnungId)
                .map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Betrag netto + MwSt (Ausgabe only) + Brutto */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="form-netto">Betrag netto (€) *</Label>
          <Input
            id="form-netto"
            type="number"
            step="0.01"
            min="0"
            value={formBetragNetto || ""}
            onChange={(e) => {
              const n = parseFloat(e.target.value) || 0;
              setFormBetragNetto(n);
              setFormBetragBrutto(
                recalcBrutto(n, formTyp === "ausgabe" ? formMwstProzent : 0),
              );
            }}
          />
        </div>
        {formTyp === "ausgabe" && (
          <div className="space-y-2">
            <Label htmlFor="form-mwst">MwSt. (%)</Label>
            <Select
              value={String(formMwstProzent)}
              onValueChange={(v) => {
                const m = parseInt(v);
                setFormMwstProzent(m);
                setFormBetragBrutto(recalcBrutto(formBetragNetto, m));
              }}
            >
              <SelectTrigger id="form-mwst">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0%</SelectItem>
                <SelectItem value="7">7%</SelectItem>
                <SelectItem value="19">19%</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="form-brutto">Betrag brutto (€)</Label>
          <Input
            id="form-brutto"
            type="number"
            readOnly
            className="bg-muted"
            value={formBetragBrutto.toFixed(2)}
          />
        </div>
      </div>

      {/* Beschreibung */}
      <div className="space-y-2">
        <Label htmlFor="form-beschreibung">Beschreibung</Label>
        <Textarea
          id="form-beschreibung"
          value={formBeschreibung}
          onChange={(e) => setFormBeschreibung(e.target.value)}
          placeholder="Optionale Beschreibung"
          rows={2}
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={() => setIsFormOpen(false)}>
          Abbrechen
        </Button>
        <Button
          onClick={handleSave}
          className="bg-success hover:bg-success/90 text-success-foreground"
        >
          <Save className="h-4 w-4 mr-2" />
          Speichern
        </Button>
      </div>
    </div>
  );

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex gap-6">
      {/* Desktop Filter Sidebar */}
      {!isMobile && (
        <div className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-4 bg-card border rounded-lg p-4 max-h-[calc(100vh-6rem)] overflow-y-auto">
            <FilterSidebar />
          </div>
        </div>
      )}

      {/* Mobile Filter Drawer */}
      {isMobile && (
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 fixed top-4 left-4 z-40">
              <Filter className="h-4 w-4" />
              Filter {activeFilterCount > 0 && `(${activeFilterCount})`}
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Filter</DrawerTitle>
              <DrawerDescription>Filtern Sie Ihre Buchungen.</DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-6 max-h-[70vh] overflow-y-auto">
              <FilterSidebar />
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {/* Main Content */}
      <div className="flex-1 space-y-4 sm:space-y-6 min-w-0">
        {/* Summary Bar – 4 cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="pt-5 pb-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Gesamteinnahmen
              </p>
              <p className="text-2xl font-medium text-green-600">
                {summary.einnahmen.toFixed(2)} €
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Gesamtausgaben
              </p>
              <p className="text-2xl font-medium text-red-600">
                {summary.ausgaben.toFixed(2)} €
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Überschuss
              </p>
              <p
                className={`text-2xl font-medium ${
                  summary.ueberschuss >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {summary.ueberschuss.toFixed(2)} €
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5 pb-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Anzahl Buchungen
              </p>
              <p className="text-2xl font-medium">{summary.count}</p>
            </CardContent>
          </Card>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap gap-2 items-center">
          <Button
            size="sm"
            className="gap-2 bg-green-600 hover:bg-green-700 text-white"
            onClick={() => {
              setMietenSelection(mieter.map((m) => m.id));
              setMietenOpen(true);
            }}
          >
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Mieten buchen</span>
            <span className="sm:hidden">Mieten</span>
          </Button>

          <Button size="sm" className="gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Neue Buchung</span>
            <span className="sm:hidden">Neu</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2 ml-auto">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Exportieren</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportPDF}>
                <FileDown className="h-4 w-4 mr-2" />
                PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportCSV(false)}>
                <FileDown className="h-4 w-4 mr-2" />
                Excel (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportCSV(true)}>
                <FileDown className="h-4 w-4 mr-2" />
                DATEV CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Buchungen ({summary.count})</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Kategorie</TableHead>
                  <TableHead className="hidden md:table-cell">Rechnungssteller</TableHead>
                  <TableHead className="hidden lg:table-cell">Objekt</TableHead>
                  <TableHead className="hidden lg:table-cell">Wohnung</TableHead>
                  <TableHead className="text-right">Betrag</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBuchungen.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-muted-foreground py-10"
                    >
                      Keine Buchungen gefunden.
                    </TableCell>
                  </TableRow>
                )}
                {filteredBuchungen.map((b) => {
                  const isStorniert = storniertSet.has(b.id);
                  const isStornoEntry = !!b.stornoVon;
                  return (
                    <TableRow
                      key={b.id}
                      className={isStorniert ? "opacity-50" : undefined}
                    >
                      <TableCell className="font-medium whitespace-nowrap">
                        <div className="flex flex-wrap items-center gap-1">
                          {new Date(b.datum).toLocaleDateString("de-DE")}
                          {isStorniert && (
                            <Badge variant="secondary" className="text-xs font-normal">
                              storniert
                            </Badge>
                          )}
                          {isStornoEntry && (
                            <Badge
                              variant="outline"
                              className="text-xs font-normal text-orange-600 border-orange-300"
                            >
                              Storno
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {b.typ === "einnahme" ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            Einnahme
                          </Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                            Ausgabe
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{b.kategorie}</TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {b.rechnungssteller ?? "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {getObjektName(b.objektId, objekte)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        {getWohnungName(b.wohnungId, wohnungen)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium whitespace-nowrap ${
                          b.betragBrutto < 0
                            ? "text-orange-600"
                            : b.typ === "einnahme"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {b.typ === "einnahme" && b.betragBrutto > 0 ? "+" : ""}
                        {b.betragBrutto.toFixed(2)} €
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {!isStorniert && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Bearbeiten"
                              onClick={() => openEdit(b)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          {!isStorniert && !isStornoEntry && b.typ === "ausgabe" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-orange-500 hover:text-orange-700"
                              title="Storno buchen"
                              onClick={() => setStornoId(b.id)}
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            title="Löschen"
                            onClick={() => setDeleteId(b.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* New / Edit Buchung Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingBuchung ? "Buchung bearbeiten" : "Neue Buchung"}
            </DialogTitle>
            <DialogDescription>
              {editingBuchung
                ? "Bearbeiten Sie die Buchungsdetails."
                : "Erstellen Sie eine neue Einnahme oder Ausgabe."}
            </DialogDescription>
          </DialogHeader>
          <BookingForm />
        </DialogContent>
      </Dialog>

      {/* Mieten buchen Dialog */}
      <Dialog open={mietenOpen} onOpenChange={setMietenOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mieten buchen</DialogTitle>
            <DialogDescription>
              Wählen Sie die Mieter aus, für die Mieteinnahmen gebucht werden sollen.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="mieten-monat">Monat</Label>
              <Input
                id="mieten-monat"
                type="month"
                value={mietenMonat}
                onChange={(e) => setMietenMonat(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Mieter auswählen</Label>
              <div className="flex gap-2 mb-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMietenSelection(mieter.map((m) => m.id))}
                >
                  Alle
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMietenSelection([])}
                >
                  Keine
                </Button>
              </div>
              <div className="space-y-2 max-h-64 overflow-y-auto border rounded-md p-3">
                {mieter.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Keine aktiven Mieter vorhanden.
                  </p>
                )}
                {mieter.map((m) => {
                  const wohnung = wohnungen.find((w) => w.id === m.wohnungId);
                  const objekt = objekte.find((o) => o.id === wohnung?.objektId);
                  const gesamt = (m.kaltmiete || 0) + (m.nebenkosten || 0);
                  return (
                    <div key={m.id} className="flex items-center space-x-3 py-1">
                      <Checkbox
                        id={`mieten-${m.id}`}
                        checked={mietenSelection.includes(m.id)}
                        onCheckedChange={(checked) =>
                          setMietenSelection((prev) =>
                            checked
                              ? [...prev, m.id]
                              : prev.filter((id) => id !== m.id),
                          )
                        }
                      />
                      <label
                        htmlFor={`mieten-${m.id}`}
                        className="flex-1 cursor-pointer min-w-0"
                      >
                        <span className="font-medium text-sm">{m.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {objekt?.name ?? ""}
                          {wohnung ? ` · ${wohnung.bezeichnung}` : ""}
                        </span>
                      </label>
                      <span className="text-sm font-medium text-green-600 whitespace-nowrap">
                        {gesamt.toFixed(2)} €
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setMietenOpen(false)}>
                Abbrechen
              </Button>
              <Button
                onClick={handleMietenBuchen}
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={mietenSelection.length === 0}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                {mietenSelection.length} Buchung
                {mietenSelection.length !== 1 ? "en" : ""} erstellen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Buchung löschen"
        description="Möchten Sie diese Buchung wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden."
        confirmText="Löschen"
        variant="destructive"
      />

      {/* Storno confirm */}
      <ConfirmDialog
        open={!!stornoId}
        onOpenChange={(open) => {
          if (!open) setStornoId(null);
        }}
        onConfirm={handleStornoConfirm}
        title="Storno buchen"
        description="Möchten Sie für diese Ausgabe eine Storno-Buchung (Gegenbuchung mit negativem Betrag) erstellen?"
        confirmText="Storno buchen"
      />
    </div>
  );
}
