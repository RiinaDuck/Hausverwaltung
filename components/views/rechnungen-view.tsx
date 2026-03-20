"use client";

import { useState, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
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
  DialogTrigger,
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
import {
  Save,
  Plus,
  Trash2,
  FileDown,
  Eye,
  Pencil,
  Upload,
  ChevronDown,
  Filter,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  generateRechnungPDF,
  downloadPDF,
  sanitizeFilename,
} from "@/lib/pdf-generator";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useAppData, type Rechnung, type RechnungsPosition } from "@/context/app-data-context";
import { useIsMobile } from "@/hooks/use-mobile";

const KOSTENART_OPTIONS = [
  "Miete",
  "Nebenkosten",
  "Reparatur",
  "Instandhaltung",
  "Verwaltung",
  "Versicherung",
  "Makler",
  "Sonstiges",
];

interface RechnungFilter {
  status: ("offen" | "bezahlt" | "storniert")[];
  kostenart: string[];
  vonDatum: string;
  bisDatum: string;
  empfaenger: string;
  vonBetrag: number | null;
  bisBetrag: number | null;
}



export function RechnungenView() {
  const { profile, isDemo } = useAuth();
  const { toast } = useToast();
  const { rechnungen, addRechnung, updateRechnung, deleteRechnung } = useAppData();
  const isMobile = useIsMobile();
  const [selectedRechnung, setSelectedRechnung] = useState<Rechnung | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingRechnung, setEditingRechnung] = useState<Rechnung | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importFormat, setImportFormat] = useState<"datev" | "lexware" | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const THIS_YEAR = new Date().getFullYear();

  // Filter state
  const [filter, setFilter] = useState<RechnungFilter>({
    status: [],
    kostenart: [],
    vonDatum: "",
    bisDatum: "",
    empfaenger: "",
    vonBetrag: null,
    bisBetrag: null,
  });

  const [newRechnung, setNewRechnung] = useState<Partial<Rechnung>>({
    nummer: `${THIS_YEAR}-${String(rechnungen.length + 1).padStart(3, "0")}`,
    datum: new Date().toISOString().split("T")[0],
    empfaengerName: "",
    empfaengerAdresse: "",
    positionen: [{ id: "1", beschreibung: "", menge: 1, einzelpreis: 0 }],
    bemerkung: "",
    status: "offen",
    kostenart: "",
  });

  // Memoized calculation functions
  const calculatePositionTotal = useMemo(
    () => (pos: RechnungsPosition) => pos.menge * pos.einzelpreis,
    [],
  );

  const calculateNetto = useMemo(
    () => (positionen: RechnungsPosition[]) =>
      positionen.reduce((sum, p) => sum + p.menge * p.einzelpreis, 0),
    [],
  );

  const calculateMwst = useMemo(() => (netto: number) => netto * 0.19, []);
  const calculateBrutto = useMemo(() => (netto: number) => netto * 1.19, []);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filter.status.length > 0) count++;
    if (filter.kostenart.length > 0) count++;
    if (filter.vonDatum) count++;
    if (filter.bisDatum) count++;
    if (filter.empfaenger) count++;
    if (filter.vonBetrag !== null) count++;
    if (filter.bisBetrag !== null) count++;
    return count;
  }, [filter]);

  // Filter rechnungen
  const filteredRechnungen = useMemo(() => {
    return rechnungen.filter((rechnung) => {
      // Status filter
      if (filter.status.length > 0 && !filter.status.includes(rechnung.status)) {
        return false;
      }

      // Kostenart filter
      if (
        filter.kostenart.length > 0 &&
        (!rechnung.kostenart || !filter.kostenart.includes(rechnung.kostenart))
      ) {
        return false;
      }

      // Date range filter
      if (filter.vonDatum && rechnung.datum < filter.vonDatum) {
        return false;
      }
      if (filter.bisDatum && rechnung.datum > filter.bisDatum) {
        return false;
      }

      // Empfänger search filter
      if (
        filter.empfaenger &&
        !rechnung.empfaengerName
          .toLowerCase()
          .includes(filter.empfaenger.toLowerCase())
      ) {
        return false;
      }

      // Amount range filter
      const netto = calculateNetto(rechnung.positionen);
      const brutto = calculateBrutto(netto);
      if (filter.vonBetrag !== null && brutto < filter.vonBetrag) {
        return false;
      }
      if (filter.bisBetrag !== null && brutto > filter.bisBetrag) {
        return false;
      }

      return true;
    });
  }, [rechnungen, filter, calculateNetto, calculateBrutto]);

  // Reset filters
  const handleResetFilters = () => {
    setFilter({
      status: [],
      kostenart: [],
      vonDatum: "",
      bisDatum: "",
      empfaenger: "",
      vonBetrag: null,
      bisBetrag: null,
    });
  };

  // Memoized summary statistics
  const summary = useMemo(() => {
    const gesamt = filteredRechnungen.reduce((sum, r) => {
      const netto = calculateNetto(r.positionen);
      return sum + calculateBrutto(netto);
    }, 0);
    const offen = filteredRechnungen
      .filter((r) => r.status === "offen")
      .reduce((sum, r) => {
        const netto = calculateNetto(r.positionen);
        return sum + calculateBrutto(netto);
      }, 0);
    const bezahlt = filteredRechnungen
      .filter((r) => r.status === "bezahlt")
      .reduce((sum, r) => {
        const netto = calculateNetto(r.positionen);
        return sum + calculateBrutto(netto);
      }, 0);
    return { gesamt, offen, bezahlt, count: filteredRechnungen.length };
  }, [filteredRechnungen, calculateNetto, calculateBrutto]);

  const handleExportPDF = (rechnung: Rechnung) => {
    try {
      const netto = calculateNetto(rechnung.positionen);
      const doc = generateRechnungPDF({
        rechnungsNr: rechnung.nummer,
        datum: new Date(rechnung.datum).toLocaleDateString("de-DE"),
        empfaenger: {
          name: rechnung.empfaengerName,
          adresse: rechnung.empfaengerAdresse,
        },
        positionen: rechnung.positionen.map((p) => ({
          beschreibung: p.beschreibung,
          menge: p.menge,
          einzelpreis: p.einzelpreis,
          gesamt: calculatePositionTotal(p),
        })),
        summeNetto: netto,
        mwst: calculateMwst(netto),
        summeBrutto: calculateBrutto(netto),
        bemerkung: rechnung.bemerkung,
        profile: profile,
      });
      downloadPDF(doc, sanitizeFilename(`rechnung_${rechnung.nummer}`));
      toast({
        title: "PDF erstellt",
        description: "Die Rechnung wurde erfolgreich exportiert.",
      });
    } catch (error) {
      console.error("PDF Export Fehler:", error);
      toast({
        title: "Fehler beim Export",
        description: "Die Rechnung konnte nicht erstellt werden.",
        variant: "destructive",
      });
    }
  };

  const addPosition = () => {
    const newId = String((newRechnung.positionen?.length || 0) + 1);
    setNewRechnung((prev) => ({
      ...prev,
      positionen: [
        ...(prev.positionen || []),
        { id: newId, beschreibung: "", menge: 1, einzelpreis: 0 },
      ],
    }));
  };

  const updatePosition = (
    id: string,
    field: keyof RechnungsPosition,
    value: string | number,
  ) => {
    setNewRechnung((prev) => ({
      ...prev,
      positionen: prev.positionen?.map((p) =>
        p.id === id ? { ...p, [field]: value } : p,
      ),
    }));
  };

  const removePosition = (id: string) => {
    setNewRechnung((prev) => ({
      ...prev,
      positionen: prev.positionen?.filter((p) => p.id !== id),
    }));
  };

  const handleCreateRechnung = async () => {
    if (isDemo) {
      toast({
        title: "Demo-Modus",
        description:
          "Im Demo-Modus können keine neuen Rechnungen angelegt werden. Bitte melden Sie sich an, um diese Funktion zu nutzen.",
        variant: "destructive",
      });
      return;
    }

    await addRechnung({
      nummer: newRechnung.nummer || "",
      datum: newRechnung.datum || "",
      empfaengerName: newRechnung.empfaengerName || "",
      empfaengerAdresse: newRechnung.empfaengerAdresse || "",
      positionen: newRechnung.positionen || [],
      bemerkung: newRechnung.bemerkung || "",
      status: newRechnung.status || "offen",
    });
    setIsCreateOpen(false);
    setNewRechnung({
      nummer: `${THIS_YEAR}-${String(rechnungen.length + 2).padStart(3, "0")}`,
      datum: new Date().toISOString().split("T")[0],
      empfaengerName: "",
      empfaengerAdresse: "",
      positionen: [{ id: "1", beschreibung: "", menge: 1, einzelpreis: 0 }],
      bemerkung: "",
      status: "offen",
    });
    toast({ title: "Rechnung erstellt" });
  };

  const handleEditRechnung = (rechnung: Rechnung) => {
    setEditingRechnung(rechnung);
    setNewRechnung({
      nummer: rechnung.nummer,
      datum: rechnung.datum,
      empfaengerName: rechnung.empfaengerName,
      empfaengerAdresse: rechnung.empfaengerAdresse,
      positionen: [...rechnung.positionen],
      bemerkung: rechnung.bemerkung,
      status: rechnung.status,
    });
    setIsEditOpen(true);
  };

  const handleSaveEditRechnung = async () => {
    if (!editingRechnung) return;
    await updateRechnung(editingRechnung.id, {
      nummer: newRechnung.nummer || "",
      datum: newRechnung.datum || "",
      empfaengerName: newRechnung.empfaengerName || "",
      empfaengerAdresse: newRechnung.empfaengerAdresse || "",
      positionen: newRechnung.positionen || [],
      bemerkung: newRechnung.bemerkung || "",
      status: newRechnung.status || "offen",
    });
    setIsEditOpen(false);
    setEditingRechnung(null);
    setNewRechnung({
      nummer: `${THIS_YEAR}-${String(rechnungen.length + 1).padStart(3, "0")}`,
      datum: new Date().toISOString().split("T")[0],
      empfaengerName: "",
      empfaengerAdresse: "",
      positionen: [{ id: "1", beschreibung: "", menge: 1, einzelpreis: 0 }],
      bemerkung: "",
      status: "offen",
    });
    toast({ title: "Rechnung aktualisiert" });
  };

  const handleDeleteRechnung = async (id: string) => {
    if (confirm("Möchten Sie diese Rechnung wirklich löschen?")) {
      await deleteRechnung(id);
      toast({ title: "Rechnung gelöscht" });
    }
  };

  // CSV Import Handler
  const handleImportCSV = async (format: "datev" | "lexware") => {
    fileInputRef.current?.click();
    setImportFormat(format);
  };

  const processImportFile = async (file: File) => {
    if (!importFormat) return;
    
    try {
      const text = await file.text();
      const lines = text.split("\n").filter((line) => line.trim());
      let imported = 0;

      if (importFormat === "datev") {
        // DATEV Format: skip header, parse each line
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(";");
          if (parts.length < 5) continue;

          await addRechnung({
            nummer: parts[0]?.trim() || `${THIS_YEAR}-${i}`,
            datum: parts[1]?.trim() || new Date().toISOString().split("T")[0],
            empfaengerName: parts[2]?.trim() || "Unbekannt",
            empfaengerAdresse: parts[3]?.trim() || "",
            positionen: [
              {
                id: "1",
                beschreibung: parts[4]?.trim() || "Import",
                menge: 1,
                einzelpreis: parseFloat(parts[5]?.trim() || "0") || 0,
              },
            ],
            bemerkung: parts[6]?.trim() || "",
            status: "offen",
          });
          imported++;
        }
      } else if (importFormat === "lexware") {
        // Lexware Format: skip header, parse each line
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split("\t");
          if (parts.length < 5) continue;

          await addRechnung({
            nummer: parts[0]?.trim() || `${THIS_YEAR}-${i}`,
            datum: parts[1]?.trim() || new Date().toISOString().split("T")[0],
            empfaengerName: parts[2]?.trim() || "Unbekannt",
            empfaengerAdresse: parts[3]?.trim() || "",
            positionen: [
              {
                id: "1",
                beschreibung: parts[4]?.trim() || "Import",
                menge: 1,
                einzelpreis: parseFloat(parts[5]?.trim() || "0") || 0,
              },
            ],
            bemerkung: parts[6]?.trim() || "",
            status: "offen",
          });
          imported++;
        }
      }

      toast({
        title: "Import erfolgreich",
        description: `${imported} Rechnungen importiert.`,
      });
      setImportFormat(null);
    } catch (error: any) {
      console.error("Import Fehler:", error);
      toast({
        title: "Import Fehler",
        description: error?.message ?? "Die Datei konnte nicht importiert werden.",
        variant: "destructive",
      });
      setImportFormat(null);
    }
  };

  // CSV Export Handler
  const handleExportCSV = (format: "datev" | "lexware") => {
    try {
      let csv = "";
      
      if (format === "datev") {
        // DATEV Header
        csv = "Rechnungsnummer;Datum;Empfänger;Adresse;Beschreibung;Betrag;Bemerkung\n";
        rechnungen.forEach((r) => {
          const netto = r.positionen.reduce((sum, p) => sum + p.menge * p.einzelpreis, 0);
          csv += `${r.nummer};${r.datum};${r.empfaengerName};"${r.empfaengerAdresse}";${r.positionen[0]?.beschreibung || ""};${netto.toFixed(2)};"${r.bemerkung}"\n`;
        });
      } else if (format === "lexware") {
        // Lexware Header  
        csv = "Rechnungsnummer\tDatum\tEmpfänger\tAdresse\tBeschreibung\tBetrag\tBemerkung\n";
        rechnungen.forEach((r) => {
          const netto = r.positionen.reduce((sum, p) => sum + p.menge * p.einzelpreis, 0);
          csv += `${r.nummer}\t${r.datum}\t${r.empfaengerName}\t${r.empfaengerAdresse}\t${r.positionen[0]?.beschreibung || ""}\t${netto.toFixed(2)}\t${r.bemerkung}\n`;
        });
      }

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `rechnungen_${format}_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();

      toast({
        title: "Export erfolgreich",
        description: `${rechnungen.length} Rechnungen im ${format.toUpperCase()}-Format exportiert.`,
      });
    } catch (error: any) {
      console.error("Export Fehler:", error);
      toast({
        title: "Export Fehler",
        description: error?.message ?? "Der Export konnte nicht durchgeführt werden.",
        variant: "destructive",
      });
    }
  };

  // Excel Export Handler
  const handleExportExcel = () => {
    try {
      // Create a simple Excel-compatible CSV
      let excel = "Rechnungsnummer\tDatum\tEmpfänger\tAdresse\tBeschreibung\tMenge\tEinzelpreis\tGesamt\tStatus\n";
      
      rechnungen.forEach((r) => {
        r.positionen.forEach((p, idx) => {
          const gesamt = p.menge * p.einzelpreis;
          excel += `${r.nummer}\t${r.datum}\t${r.empfaengerName}\t${r.empfaengerAdresse}\t${p.beschreibung}\t${p.menge}\t${p.einzelpreis.toFixed(2)}\t${gesamt.toFixed(2)}\t${r.status}\n`;
        });
      });

      const blob = new Blob([excel], { type: "application/vnd.ms-excel;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `rechnungen_${new Date().toISOString().split("T")[0]}.xlsx`;
      link.click();

      toast({
        title: "Export erfolgreich",
        description: `${rechnungen.length} Rechnungen ins Excel-Format exportiert.`,
      });
    } catch (error: any) {
      console.error("Excel Export Fehler:", error);
      toast({
        title: "Export Fehler",
        description: error?.message ?? "Der Excel-Export konnte nicht durchgeführt werden.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: Rechnung["status"]) => {
    const styles = {
      offen: "bg-yellow-100 text-yellow-800",
      bezahlt: "bg-green-100 text-green-800",
      storniert: "bg-red-100 text-red-800",
    };
    const labels = {
      offen: "Offen",
      bezahlt: "Bezahlt",
      storniert: "Storniert",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

  // Filter Sidebar Component
  const FilterSidebar = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Filter {activeFilterCount > 0 && `(${activeFilterCount})`}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleResetFilters}
          disabled={activeFilterCount === 0}
        >
          <X className="h-4 w-4 mr-1" />
          Zurücksetzen
        </Button>
      </div>

      <Separator />

      {/* Status Filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Status</Label>
        <div className="space-y-2">
          {(["offen", "bezahlt", "storniert"] as const).map((status) => (
            <div key={status} className="flex items-center space-x-2">
              <Checkbox
                id={`status-${status}`}
                checked={filter.status.includes(status)}
                onCheckedChange={(checked) => {
                  setFilter((prev) => ({
                    ...prev,
                    status: checked
                      ? [...prev.status, status]
                      : prev.status.filter((s) => s !== status),
                  }));
                }}
              />
              <label
                htmlFor={`status-${status}`}
                className="text-sm cursor-pointer capitalize"
              >
                {status === "offen" ? "Offen" : status === "bezahlt" ? "Bezahlt" : "Storniert"}
              </label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Kostenart Filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Kostenart</Label>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {KOSTENART_OPTIONS.map((kostenart) => (
            <div key={kostenart} className="flex items-center space-x-2">
              <Checkbox
                id={`kostenart-${kostenart}`}
                checked={filter.kostenart.includes(kostenart)}
                onCheckedChange={(checked) => {
                  setFilter((prev) => ({
                    ...prev,
                    kostenart: checked
                      ? [...prev.kostenart, kostenart]
                      : prev.kostenart.filter((k) => k !== kostenart),
                  }));
                }}
              />
              <label
                htmlFor={`kostenart-${kostenart}`}
                className="text-sm cursor-pointer"
              >
                {kostenart}
              </label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Date Range Filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Zeitraum</Label>
        <div className="space-y-2">
          <div>
            <Label htmlFor="von-datum" className="text-xs text-muted-foreground">
              Von
            </Label>
            <Input
              id="von-datum"
              type="date"
              value={filter.vonDatum}
              onChange={(e) =>
                setFilter((prev) => ({
                  ...prev,
                  vonDatum: e.target.value,
                }))
              }
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label htmlFor="bis-datum" className="text-xs text-muted-foreground">
              Bis
            </Label>
            <Input
              id="bis-datum"
              type="date"
              value={filter.bisDatum}
              onChange={(e) =>
                setFilter((prev) => ({
                  ...prev,
                  bisDatum: e.target.value,
                }))
              }
              className="h-8 text-sm"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Empfänger Search Filter */}
      <div className="space-y-2">
        <Label htmlFor="empfaenger-search" className="text-sm font-medium">
          Empfänger
        </Label>
        <Input
          id="empfaenger-search"
          type="text"
          placeholder="Name durchsuchen..."
          value={filter.empfaenger}
          onChange={(e) =>
            setFilter((prev) => ({
              ...prev,
              empfaenger: e.target.value,
            }))
          }
          className="h-8 text-sm"
        />
      </div>

      <Separator />

      {/* Amount Range Filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Betrag</Label>
        <div className="space-y-2">
          <div>
            <Label htmlFor="von-betrag" className="text-xs text-muted-foreground">
              Von (€)
            </Label>
            <Input
              id="von-betrag"
              type="number"
              placeholder="0,00"
              value={filter.vonBetrag ?? ""}
              onChange={(e) =>
                setFilter((prev) => ({
                  ...prev,
                  vonBetrag: e.target.value ? parseFloat(e.target.value) : null,
                }))
              }
              className="h-8 text-sm"
            />
          </div>
          <div>
            <Label htmlFor="bis-betrag" className="text-xs text-muted-foreground">
              Bis (€)
            </Label>
            <Input
              id="bis-betrag"
              type="number"
              placeholder="∞"
              value={filter.bisBetrag ?? ""}
              onChange={(e) =>
                setFilter((prev) => ({
                  ...prev,
                  bisBetrag: e.target.value ? parseFloat(e.target.value) : null,
                }))
              }
              className="h-8 text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex gap-6">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-4 bg-card border rounded-lg p-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
            <FilterSidebar />
          </div>
        </div>
      )}

      {/* Mobile Filter Drawer */}
      {isMobile && (
        <div className="absolute top-0 left-0">
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
                <DrawerDescription>
                  Filtern Sie Ihre Rechnungen nach verschiedenen Kriterien.
                </DrawerDescription>
              </DrawerHeader>
              <div className="px-4 pb-6 max-h-[70vh] overflow-y-auto">
                <FilterSidebar />
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm sm:text-base text-muted-foreground">
            Verwalten Sie Ihre Rechnungen und Kalkulationen.
          </p>
        </div>

        {/* Summary Bar */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Gesamt
                </p>
                <p className="text-2xl font-bold">
                  {summary.gesamt.toFixed(2)} €
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Offen
                </p>
                <p className="text-2xl font-bold text-yellow-600">
                  {summary.offen.toFixed(2)} €
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Bezahlt
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {summary.bezahlt.toFixed(2)} €
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Anzahl
                </p>
                <p className="text-2xl font-bold">
                  {summary.count}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap gap-2">
          {/* Import Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="gap-2">
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Importieren</span>
                <span className="sm:hidden">Imp.</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleImportCSV("datev")}>
                DATEV Import (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleImportCSV("lexware")}>
                Lexware Import (CSV)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="gap-2">
                <FileDown className="h-4 w-4" />
                <span className="hidden sm:inline">Exportieren</span>
                <span className="sm:hidden">Exp.</span>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExportCSV("datev")}>
                DATEV Export (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportCSV("lexware")}>
                Lexware Export (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportExcel}>
                Excel Export (.xlsx)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Create Rechnung */}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="gap-2 bg-success hover:bg-success/90 text-success-foreground"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Neue Rechnung</span>
                <span className="sm:hidden">Neu</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Neue Rechnung erstellen</DialogTitle>
                <DialogDescription>
                  Erstellen Sie eine neue Rechnung für einen Mieter oder
                  Eigentümer.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nummer">Rechnungsnummer</Label>
                    <Input
                      id="nummer"
                      value={newRechnung.nummer}
                      onChange={(e) =>
                        setNewRechnung((prev) => ({
                          ...prev,
                          nummer: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="datum">Datum</Label>
                    <Input
                      id="datum"
                      type="date"
                      value={newRechnung.datum}
                      onChange={(e) =>
                        setNewRechnung((prev) => ({
                          ...prev,
                          datum: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="empfaenger">Empfänger Name</Label>
                  <Input
                    id="empfaenger"
                    value={newRechnung.empfaengerName}
                    onChange={(e) =>
                      setNewRechnung((prev) => ({
                        ...prev,
                        empfaengerName: e.target.value,
                      }))
                    }
                    placeholder="z.B. Familie Müller"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adresse">Empfänger Adresse</Label>
                  <Textarea
                    id="adresse"
                    value={newRechnung.empfaengerAdresse}
                    onChange={(e) =>
                      setNewRechnung((prev) => ({
                        ...prev,
                        empfaengerAdresse: e.target.value,
                      }))
                    }
                    placeholder="Straße, PLZ Ort"
                    rows={2}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Rechnungspositionen</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addPosition}
                      className="gap-1 bg-transparent"
                    >
                      <Plus className="h-3 w-3" />
                      Position
                    </Button>
                  </div>
                  {newRechnung.positionen?.map((pos) => (
                    <div
                      key={pos.id}
                      className="grid grid-cols-12 gap-2 items-end"
                    >
                      <div className="col-span-5 space-y-1">
                        <Label className="text-xs">Beschreibung</Label>
                        <Input
                          value={pos.beschreibung}
                          onChange={(e) =>
                            updatePosition(pos.id, "beschreibung", e.target.value)
                          }
                          placeholder="Beschreibung"
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs">Menge</Label>
                        <Input
                          type="number"
                          value={pos.menge}
                          onChange={(e) =>
                            updatePosition(
                              pos.id,
                              "menge",
                              Number(e.target.value),
                            )
                          }
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs">Preis (€)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={pos.einzelpreis}
                          onChange={(e) =>
                            updatePosition(
                              pos.id,
                              "einzelpreis",
                              Number(e.target.value),
                            )
                          }
                        />
                      </div>
                      <div className="col-span-2 space-y-1">
                        <Label className="text-xs">Gesamt</Label>
                        <Input
                          value={`${calculatePositionTotal(pos).toFixed(2)} €`}
                          readOnly
                          className="bg-muted"
                        />
                      </div>
                      <div className="col-span-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-destructive"
                          onClick={() => removePosition(pos.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={newRechnung.status || "offen"}
                    onValueChange={(value) =>
                      setNewRechnung((prev) => ({
                        ...prev,
                        status: value as Rechnung["status"],
                      }))
                    }
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Status wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="offen">Offen</SelectItem>
                      <SelectItem value="bezahlt">Bezahlt</SelectItem>
                      <SelectItem value="storniert">Storniert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kostenart">Kostenart</Label>
                  <Select
                    value={newRechnung.kostenart || ""}
                    onValueChange={(value) =>
                      setNewRechnung((prev) => ({
                        ...prev,
                        kostenart: value,
                      }))
                    }
                  >
                    <SelectTrigger id="kostenart">
                      <SelectValue placeholder="Kostenart wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {KOSTENART_OPTIONS.map((kostenart) => (
                        <SelectItem key={kostenart} value={kostenart}>
                          {kostenart}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bemerkung">Bemerkung</Label>
                  <Textarea
                    id="bemerkung"
                    value={newRechnung.bemerkung}
                    onChange={(e) =>
                      setNewRechnung((prev) => ({
                        ...prev,
                        bemerkung: e.target.value,
                      }))
                    }
                    placeholder="Optionale Bemerkungen zur Rechnung"
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                  >
                    Abbrechen
                  </Button>
                  <Button
                    onClick={handleCreateRechnung}
                    className="bg-success hover:bg-success/90 text-success-foreground"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Rechnung erstellen
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Rechnung bearbeiten</DialogTitle>
              <DialogDescription>
                Bearbeiten Sie die Daten der Rechnung.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-nummer">Rechnungsnummer</Label>
                  <Input
                    id="edit-nummer"
                    value={newRechnung.nummer}
                    onChange={(e) =>
                      setNewRechnung((prev) => ({
                        ...prev,
                        nummer: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-datum">Datum</Label>
                  <Input
                    id="edit-datum"
                    type="date"
                    value={newRechnung.datum}
                    onChange={(e) =>
                      setNewRechnung((prev) => ({
                        ...prev,
                        datum: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-empfaenger">Empfänger Name</Label>
                <Input
                  id="edit-empfaenger"
                  value={newRechnung.empfaengerName}
                  onChange={(e) =>
                    setNewRechnung((prev) => ({
                      ...prev,
                      empfaengerName: e.target.value,
                    }))
                  }
                  placeholder="z.B. Familie Müller"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-adresse">Empfänger Adresse</Label>
                <Textarea
                  id="edit-adresse"
                  value={newRechnung.empfaengerAdresse}
                  onChange={(e) =>
                    setNewRechnung((prev) => ({
                      ...prev,
                      empfaengerAdresse: e.target.value,
                    }))
                  }
                  placeholder="Straße, PLZ Ort"
                  rows={2}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Rechnungspositionen</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPosition}
                    className="gap-1 bg-transparent"
                  >
                    <Plus className="h-3 w-3" />
                    Position
                  </Button>
                </div>
                {newRechnung.positionen?.map((pos) => (
                  <div key={pos.id} className="grid grid-cols-12 gap-2 items-end">
                    <div className="col-span-5 space-y-1">
                      <Label className="text-xs">Beschreibung</Label>
                      <Input
                        value={pos.beschreibung}
                        onChange={(e) =>
                          updatePosition(pos.id, "beschreibung", e.target.value)
                        }
                        placeholder="Beschreibung"
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Menge</Label>
                      <Input
                        type="number"
                        value={pos.menge}
                        onChange={(e) =>
                          updatePosition(pos.id, "menge", Number(e.target.value))
                        }
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Preis (€)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={pos.einzelpreis}
                        onChange={(e) =>
                          updatePosition(
                            pos.id,
                            "einzelpreis",
                            Number(e.target.value),
                          )
                        }
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label className="text-xs">Gesamt</Label>
                      <Input
                        value={`${calculatePositionTotal(pos).toFixed(2)} €`}
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                    <div className="col-span-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removePosition(pos.id)}
                        className="h-8 w-8"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={newRechnung.status || "offen"}
                  onValueChange={(value) =>
                    setNewRechnung((prev) => ({
                      ...prev,
                      status: value as Rechnung["status"],
                    }))
                  }
                >
                  <SelectTrigger id="edit-status">
                    <SelectValue placeholder="Status wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="offen">Offen</SelectItem>
                    <SelectItem value="bezahlt">Bezahlt</SelectItem>
                    <SelectItem value="storniert">Storniert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-kostenart">Kostenart</Label>
                <Select
                  value={newRechnung.kostenart || ""}
                  onValueChange={(value) =>
                    setNewRechnung((prev) => ({
                      ...prev,
                      kostenart: value,
                    }))
                  }
                >
                  <SelectTrigger id="edit-kostenart">
                    <SelectValue placeholder="Kostenart wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {KOSTENART_OPTIONS.map((kostenart) => (
                      <SelectItem key={kostenart} value={kostenart}>
                        {kostenart}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-bemerkung">Bemerkung</Label>
                <Textarea
                  id="edit-bemerkung"
                  value={newRechnung.bemerkung}
                  onChange={(e) =>
                    setNewRechnung((prev) => ({
                      ...prev,
                      bemerkung: e.target.value,
                    }))
                  }
                  placeholder="Optionale Bemerkungen zur Rechnung"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                  Abbrechen
                </Button>
                <Button
                  onClick={handleSaveEditRechnung}
                  className="bg-success hover:bg-success/90 text-success-foreground"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Änderungen speichern
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Rechnungen Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Rechnungen ({summary.count})
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Nr.</TableHead>
                  <TableHead className="hidden sm:table-cell">Datum</TableHead>
                  <TableHead>Empfänger</TableHead>
                  <TableHead className="text-right">Betrag</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRechnungen.map((rechnung) => {
                  const netto = calculateNetto(rechnung.positionen);
                  const brutto = calculateBrutto(netto);
                  return (
                    <TableRow key={rechnung.id}>
                      <TableCell className="font-medium">
                        {rechnung.nummer}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {new Date(rechnung.datum).toLocaleDateString("de-DE")}
                      </TableCell>
                      <TableCell className="max-w-[100px] truncate">
                        {rechnung.empfaengerName}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {brutto.toFixed(2)} €
                      </TableCell>
                      <TableCell>{getStatusBadge(rechnung.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setSelectedRechnung(rechnung)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-lg">
                              <DialogHeader>
                                <DialogTitle>
                                  Rechnung {rechnung.nummer}
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 mt-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p className="text-muted-foreground">Datum</p>
                                    <p className="font-medium">
                                      {new Date(
                                        rechnung.datum,
                                      ).toLocaleDateString("de-DE")}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-muted-foreground">
                                      Status
                                    </p>
                                    <p>{getStatusBadge(rechnung.status)}</p>
                                  </div>
                                </div>
                                <div className="text-sm">
                                  <p className="text-muted-foreground">
                                    Empfänger
                                  </p>
                                  <p className="font-medium">
                                    {rechnung.empfaengerName}
                                  </p>
                                  <p className="whitespace-pre-line">
                                    {rechnung.empfaengerAdresse}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground text-sm mb-2">
                                    Positionen
                                  </p>
                                  <Table>
                                    <TableBody>
                                      {rechnung.positionen.map((p) => (
                                        <TableRow key={p.id}>
                                          <TableCell className="py-1">
                                            {p.beschreibung}
                                          </TableCell>
                                          <TableCell className="py-1 text-right">
                                            {p.menge}x
                                          </TableCell>
                                          <TableCell className="py-1 text-right">
                                            {p.einzelpreis.toFixed(2)} €
                                          </TableCell>
                                          <TableCell className="py-1 text-right font-medium">
                                            {calculatePositionTotal(p).toFixed(2)}{" "}
                                            €
                                          </TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                    <TableFooter>
                                      <TableRow>
                                        <TableCell colSpan={3}>Netto</TableCell>
                                        <TableCell className="text-right">
                                          {netto.toFixed(2)} €
                                        </TableCell>
                                      </TableRow>
                                      <TableRow>
                                        <TableCell colSpan={3}>
                                          MwSt. 19%
                                        </TableCell>
                                        <TableCell className="text-right">
                                          {calculateMwst(netto).toFixed(2)} €
                                        </TableCell>
                                      </TableRow>
                                      <TableRow>
                                        <TableCell
                                          colSpan={3}
                                          className="font-bold"
                                        >
                                          Brutto
                                        </TableCell>
                                        <TableCell className="text-right font-bold">
                                          {brutto.toFixed(2)} €
                                        </TableCell>
                                      </TableRow>
                                    </TableFooter>
                                  </Table>
                                </div>
                                {rechnung.bemerkung && (
                                  <div className="text-sm">
                                    <p className="text-muted-foreground">
                                      Bemerkung
                                    </p>
                                    <p>{rechnung.bemerkung}</p>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditRechnung(rechnung)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleExportPDF(rechnung)}
                          >
                            <FileDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDeleteRechnung(rechnung.id)}
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

        {/* Hidden file input for CSV import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          style={{ display: "none" }}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) processImportFile(file);
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        />
      </div>
    </div>
  );
}
