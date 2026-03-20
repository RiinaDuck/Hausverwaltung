"use client";

import { useState, useMemo } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Save, Plus, Trash2, FileDown, Eye, Pencil, MoreHorizontal, Download, Upload, CheckCircle } from "lucide-react";
import {
  generateRechnungPDF,
  downloadPDF,
  sanitizeFilename,
} from "@/lib/pdf-generator";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useAppData, type Rechnung, type RechnungsPosition } from "@/context/app-data-context";

const KOSTENART_OPTIONS = [
  "Betriebskosten",
  "Heizkosten",
  "Wasserkosten",
  "Versicherung",
  "Hausmeister",
  "Müllabfuhr",
  "Grundsteuer",
  "Instandhaltung",
  "Verwaltungskosten",
  "Sonstiges",
];

const MWST_OPTIONS = [0, 7, 19];

export function RechnungenView() {
  const { profile, isDemo } = useAuth();
  const { toast } = useToast();
  const { rechnungen, addRechnung, updateRechnung, deleteRechnung } = useAppData();
  const [selectedRechnung, setSelectedRechnung] = useState<Rechnung | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingRechnung, setEditingRechnung] = useState<Rechnung | null>(null);
  const [stornoDialogOpen, setStornoDialogOpen] = useState(false);
  const [stornoRechnungId, setStornoRechnungId] = useState<string | null>(null);
  
  // Filter state
  const [filterKostenart, setFilterKostenart] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterSearchEmpfaenger, setFilterSearchEmpfaenger] = useState<string>("");
  const [filterDatumVon, setFilterDatumVon] = useState<string>("");
  const [filterDatumBis, setFilterDatumBis] = useState<string>("");
  
  const THIS_YEAR = new Date().getFullYear();
  const [newRechnung, setNewRechnung] = useState<Partial<Rechnung>>({
    nummer: `${THIS_YEAR}-${String(rechnungen.length + 1).padStart(3, "0")}`,
    datum: new Date().toISOString().split("T")[0],
    empfaengerName: "",
    empfaengerAdresse: "",
    kostenart: "Sonstiges",
    faelligkeitsdatum: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    betragNetto: 0,
    mwstProzent: 19,
    betragBrutto: 0,
    positionen: [{ id: "1", beschreibung: "", menge: 1, einzelpreis: 0 }],
    notizen: "",
    bemerkung: "",
    status: "offen",
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

  const calculateMwst = useMemo(
    () => (netto: number, prozent: number = 19) => netto * (prozent / 100),
    [],
  );

  const calculateBrutto = useMemo(
    () => (netto: number, prozent: number = 19) => netto + netto * (prozent / 100),
    [],
  );

  // Filtered rechnungen
  const filteredRechnungen = useMemo(() => {
    return rechnungen.filter((r) => {
      if (filterKostenart && r.kostenart !== filterKostenart) return false;
      if (filterStatus && r.status !== filterStatus) return false;
      if (filterSearchEmpfaenger && !r.empfaengerName.toLowerCase().includes(filterSearchEmpfaenger.toLowerCase())) return false;
      if (filterDatumVon && r.datum < filterDatumVon) return false;
      if (filterDatumBis && r.datum > filterDatumBis) return false;
      return true;
    });
  }, [rechnungen, filterKostenart, filterStatus, filterSearchEmpfaenger, filterDatumVon, filterDatumBis]);

  // Memoized summary statistics
  const summary = useMemo(() => {
    const gesamt = filteredRechnungen.reduce((sum, r) => {
      const betrag = r.betragBrutto || calculateBrutto(calculateNetto(r.positionen), r.mwstProzent || 19);
      return sum + betrag;
    }, 0);
    const offen = filteredRechnungen
      .filter((r) => r.status === "offen")
      .reduce((sum, r) => {
        const betrag = r.betragBrutto || calculateBrutto(calculateNetto(r.positionen), r.mwstProzent || 19);
        return sum + betrag;
      }, 0);
    const bezahlt = filteredRechnungen
      .filter((r) => r.status === "bezahlt")
      .reduce((sum, r) => {
        const betrag = r.betragBrutto || calculateBrutto(calculateNetto(r.positionen), r.mwstProzent || 19);
        return sum + betrag;
      }, 0);
    return { gesamt, offen, bezahlt, count: filteredRechnungen.length };
  }, [filteredRechnungen, calculateNetto, calculateBrutto]);

  const handleExportPDF = (rechnung: Rechnung) => {
    try {
      const netto = calculateNetto(rechnung.positionen);
      const mwstProzent = rechnung.mwstProzent || 19;
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
        mwst: calculateMwst(netto, mwstProzent),
        summeBrutto: calculateBrutto(netto, mwstProzent),
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

    const netto = calculateNetto(newRechnung.positionen || []);
    const mwstProzent = newRechnung.mwstProzent || 19;
    const brutto = calculateBrutto(netto, mwstProzent);

    await addRechnung({
      nummer: newRechnung.nummer || "",
      datum: newRechnung.datum || "",
      empfaengerName: newRechnung.empfaengerName || "",
      empfaengerAdresse: newRechnung.empfaengerAdresse || "",
      kostenart: newRechnung.kostenart || "Sonstiges",
      faelligkeitsdatum: newRechnung.faelligkeitsdatum || "",
      betragNetto: netto,
      mwstProzent: mwstProzent,
      betragBrutto: brutto,
      positionen: newRechnung.positionen || [],
      notizen: newRechnung.notizen || "",
      bemerkung: newRechnung.bemerkung || "",
      status: newRechnung.status || "offen",
    });
    setIsCreateOpen(false);
    setNewRechnung({
      nummer: `${THIS_YEAR}-${String(rechnungen.length + 2).padStart(3, "0")}`,
      datum: new Date().toISOString().split("T")[0],
      empfaengerName: "",
      empfaengerAdresse: "",
      kostenart: "Sonstiges",
      faelligkeitsdatum: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      betragNetto: 0,
      mwstProzent: 19,
      betragBrutto: 0,
      positionen: [{ id: "1", beschreibung: "", menge: 1, einzelpreis: 0 }],
      notizen: "",
      bemerkung: "",
      status: "offen",
    });
    toast({ title: "Rechnung erstellt" });
  };

  const handleEditRechnung = (rechnung: Rechnung) => {
    setEditingRechnung(rechnung);
    const netto = rechnung.betragNetto || calculateNetto(rechnung.positionen);
    const mwstProzent = rechnung.mwstProzent || 19;
    const brutto = rechnung.betragBrutto || calculateBrutto(netto, mwstProzent);
    
    setNewRechnung({
      nummer: rechnung.nummer,
      datum: rechnung.datum,
      empfaengerName: rechnung.empfaengerName,
      empfaengerAdresse: rechnung.empfaengerAdresse,
      kostenart: rechnung.kostenart || "Sonstiges",
      faelligkeitsdatum: rechnung.faelligkeitsdatum || "",
      betragNetto: netto,
      mwstProzent: mwstProzent,
      betragBrutto: brutto,
      positionen: [...rechnung.positionen],
      notizen: rechnung.notizen || "",
      bemerkung: rechnung.bemerkung,
      status: rechnung.status,
    });
    setIsEditOpen(true);
  };

  const handleSaveEditRechnung = async () => {
    if (!editingRechnung) return;
    
    const netto = calculateNetto(newRechnung.positionen || []);
    const mwstProzent = newRechnung.mwstProzent || 19;
    const brutto = calculateBrutto(netto, mwstProzent);

    await updateRechnung(editingRechnung.id, {
      nummer: newRechnung.nummer || "",
      datum: newRechnung.datum || "",
      empfaengerName: newRechnung.empfaengerName || "",
      empfaengerAdresse: newRechnung.empfaengerAdresse || "",
      kostenart: newRechnung.kostenart || "Sonstiges",
      faelligkeitsdatum: newRechnung.faelligkeitsdatum || "",
      betragNetto: netto,
      mwstProzent: mwstProzent,
      betragBrutto: brutto,
      positionen: newRechnung.positionen || [],
      notizen: newRechnung.notizen || "",
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
      kostenart: "Sonstiges",
      faelligkeitsdatum: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      betragNetto: 0,
      mwstProzent: 19,
      betragBrutto: 0,
      positionen: [{ id: "1", beschreibung: "", menge: 1, einzelpreis: 0 }],
      notizen: "",
      bemerkung: "",
      status: "offen",
    });
    toast({ title: "Rechnung aktualisiert" });
  };

  const handleMarkAsPaid = async (id: string) => {
    const rechnung = rechnungen.find(r => r.id === id);
    if (!rechnung) return;
    await updateRechnung(id, { ...rechnung, status: "bezahlt" });
    toast({ title: "Rechnung als bezahlt markiert" });
  };

  const handleStorno = async (id: string) => {
    const rechnung = rechnungen.find(r => r.id === id);
    if (!rechnung) return;
    
    // Create storno entry
    const stornoNummer = `${rechnung.nummer}-STORNO`;
    const netto = rechnung.betragNetto || calculateNetto(rechnung.positionen);
    const mwstProzent = rechnung.mwstProzent || 19;
    const brutto = rechnung.betragBrutto || calculateBrutto(netto, mwstProzent);
    
    await addRechnung({
      nummer: stornoNummer,
      datum: new Date().toISOString().split("T")[0],
      empfaengerName: rechnung.empfaengerName,
      empfaengerAdresse: rechnung.empfaengerAdresse,
      kostenart: rechnung.kostenart || "Sonstiges",
      faelligkeitsdatum: new Date().toISOString().split("T")[0],
      betragNetto: -netto,
      mwstProzent: mwstProzent,
      betragBrutto: -brutto,
      positionen: rechnung.positionen.map(p => ({ ...p, einzelpreis: -p.einzelpreis })),
      notizen: `Storno für Rechnung ${rechnung.nummer}`,
      bemerkung: rechnung.bemerkung,
      status: "storniert",
      stornoVon: id,
    });
    
    // Mark original as storniert
    await updateRechnung(id, { ...rechnung, status: "storniert" });
    setStornoDialogOpen(false);
    setStornoRechnungId(null);
    toast({ title: "Rechnung storniert", description: "Eine Storno-Rechnung wurde erstellt." });
  };

  const handleDeleteRechnung = async (id: string) => {
    if (confirm("Möchten Sie diese Rechnung wirklich löschen?")) {
      await deleteRechnung(id);
      toast({ title: "Rechnung gelöscht" });
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

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm sm:text-base text-muted-foreground">
          Verwalten Sie Ihre Rechnungen und Kalkulationen.
        </p>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="gap-2">
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Importieren</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled>
                <span className="text-xs">DATEV Import (CSV)</span>
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <span className="text-xs">Lexware Import (CSV)</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Exportieren</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled>
                <span className="text-xs">DATEV Export (CSV)</span>
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <span className="text-xs">Lexware Export (CSV)</span>
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <span className="text-xs">Excel Export</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

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
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Neue Rechnung erstellen</DialogTitle>
                <DialogDescription>
                  Erstellen Sie eine neue Rechnung für einen Mieter oder Eigentümer.
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
                    <Label htmlFor="datum">Rechnungsdatum</Label>
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="kostenart">Kostenart</Label>
                    <Select
                      value={newRechnung.kostenart || "Sonstiges"}
                      onValueChange={(value) =>
                        setNewRechnung((prev) => ({
                          ...prev,
                          kostenart: value,
                        }))
                      }
                    >
                      <SelectTrigger id="kostenart">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {KOSTENART_OPTIONS.map((art) => (
                          <SelectItem key={art} value={art}>
                            {art}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="faelligkeitsdatum">Fälligkeitsdatum</Label>
                    <Input
                      id="faelligkeitsdatum"
                      type="date"
                      value={newRechnung.faelligkeitsdatum}
                      onChange={(e) =>
                        setNewRechnung((prev) => ({
                          ...prev,
                          faelligkeitsdatum: e.target.value,
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

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Betrag netto</Label>
                    <Input
                      value={`${(newRechnung.betragNetto || 0).toFixed(2)} €`}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mwst">MwSt %</Label>
                    <Select
                      value={String(newRechnung.mwstProzent || 19)}
                      onValueChange={(value) =>
                        setNewRechnung((prev) => ({
                          ...prev,
                          mwstProzent: Number(value),
                        }))
                      }
                    >
                      <SelectTrigger id="mwst">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MWST_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={String(opt)}>
                            {opt}%
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Betrag brutto</Label>
                    <Input
                      value={`${(newRechnung.betragBrutto || 0).toFixed(2)} €`}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notizen">Notizen</Label>
                  <Textarea
                    id="notizen"
                    value={newRechnung.notizen}
                    onChange={(e) =>
                      setNewRechnung((prev) => ({
                        ...prev,
                        notizen: e.target.value,
                      }))
                    }
                    placeholder="Interne Notizen zur Rechnung"
                    rows={2}
                  />
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
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Rechnung bearbeiten</DialogTitle>
            <DialogDescription>
              Bearbeiten Sie die Daten der Rechnung.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {editingRechnung?.status === "storniert" ? (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                Diese Rechnung ist storniert und kann nicht mehr bearbeitet werden.
              </div>
            ) : (
              <>
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
                    <Label htmlFor="edit-datum">Rechnungsdatum</Label>
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

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-kostenart">Kostenart</Label>
                    <Select
                      value={newRechnung.kostenart || "Sonstiges"}
                      onValueChange={(value) =>
                        setNewRechnung((prev) => ({
                          ...prev,
                          kostenart: value,
                        }))
                      }
                    >
                      <SelectTrigger id="edit-kostenart">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {KOSTENART_OPTIONS.map((art) => (
                          <SelectItem key={art} value={art}>
                            {art}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-faelligkeitsdatum">Fälligkeitsdatum</Label>
                    <Input
                      id="edit-faelligkeitsdatum"
                      type="date"
                      value={newRechnung.faelligkeitsdatum}
                      onChange={(e) =>
                        setNewRechnung((prev) => ({
                          ...prev,
                          faelligkeitsdatum: e.target.value,
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

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Betrag netto</Label>
                    <Input
                      value={`${(newRechnung.betragNetto || 0).toFixed(2)} €`}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-mwst">MwSt %</Label>
                    <Select
                      value={String(newRechnung.mwstProzent || 19)}
                      onValueChange={(value) =>
                        setNewRechnung((prev) => ({
                          ...prev,
                          mwstProzent: Number(value),
                        }))
                      }
                    >
                      <SelectTrigger id="edit-mwst">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MWST_OPTIONS.map((opt) => (
                          <SelectItem key={opt} value={String(opt)}>
                            {opt}%
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Betrag brutto</Label>
                    <Input
                      value={`${(newRechnung.betragBrutto || 0).toFixed(2)} €`}
                      readOnly
                      className="bg-muted"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-notizen">Notizen</Label>
                  <Textarea
                    id="edit-notizen"
                    value={newRechnung.notizen}
                    onChange={(e) =>
                      setNewRechnung((prev) => ({
                        ...prev,
                        notizen: e.target.value,
                      }))
                    }
                    placeholder="Interne Notizen zur Rechnung"
                    rows={2}
                  />
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
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Summary Bar */}
      <Card className="bg-gradient-to-r from-blue-50 to-blue-100/50 border-blue-200">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Gesamt offen</p>
              <p className="text-lg sm:text-xl font-bold text-yellow-700">{summary.offen.toFixed(2)} €</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Gesamt bezahlt</p>
              <p className="text-lg sm:text-xl font-bold text-green-700">{summary.bezahlt.toFixed(2)} €</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Gesamt</p>
              <p className="text-lg sm:text-xl font-bold">{summary.gesamt.toFixed(2)} €</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Anzahl Rechnungen</p>
              <p className="text-lg sm:text-xl font-bold">{summary.count}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filter Bar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="space-y-2">
              <Label htmlFor="filter-kostenart" className="text-xs">Kostenart</Label>
              <Select value={filterKostenart} onValueChange={setFilterKostenart}>
                <SelectTrigger id="filter-kostenart" className="text-sm">
                  <SelectValue placeholder="Alle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Alle</SelectItem>
                  {KOSTENART_OPTIONS.map((art) => (
                    <SelectItem key={art} value={art}>
                      {art}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-status" className="text-xs">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger id="filter-status" className="text-sm">
                  <SelectValue placeholder="Alle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Alle</SelectItem>
                  <SelectItem value="offen">Offen</SelectItem>
                  <SelectItem value="bezahlt">Bezahlt</SelectItem>
                  <SelectItem value="storniert">Storniert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-datum-von" className="text-xs">Datum von</Label>
              <Input
                id="filter-datum-von"
                type="date"
                value={filterDatumVon}
                onChange={(e) => setFilterDatumVon(e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-datum-bis" className="text-xs">Datum bis</Label>
              <Input
                id="filter-datum-bis"
                type="date"
                value={filterDatumBis}
                onChange={(e) => setFilterDatumBis(e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="filter-empfaenger" className="text-xs">Empfänger</Label>
              <Input
                id="filter-empfaenger"
                placeholder="Suchen..."
                value={filterSearchEmpfaenger}
                onChange={(e) => setFilterSearchEmpfaenger(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Storno Dialog */}
      <Dialog open={stornoDialogOpen} onOpenChange={setStornoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechnung stornieren?</DialogTitle>
            <DialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Es wird eine Storno-Rechnung mit negativem Betrag erstellt.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setStornoDialogOpen(false);
                setStornoRechnungId(null);
              }}
            >
              Abbrechen
            </Button>
            <Button
              onClick={() => stornoRechnungId && handleStorno(stornoRechnungId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Stornieren
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rechnungen Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Alle Rechnungen ({summary.count})</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead>Nr.</TableHead>
                <TableHead className="hidden sm:table-cell">Datum</TableHead>
                <TableHead>Empfänger</TableHead>
                <TableHead className="hidden md:table-cell">Kostenart</TableHead>
                <TableHead className="hidden lg:table-cell">Fälligk.</TableHead>
                <TableHead className="text-right">Betrag</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRechnungen.map((rechnung) => {
                const netto = rechnung.betragNetto || calculateNetto(rechnung.positionen);
                const mwstProzent = rechnung.mwstProzent || 19;
                const brutto = rechnung.betragBrutto || calculateBrutto(netto, mwstProzent);
                const isStorniert = rechnung.status === "storniert";
                return (
                  <TableRow key={rechnung.id} className={isStorniert ? "opacity-60" : ""}>
                    <TableCell className="font-medium">{rechnung.nummer}</TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">
                      {new Date(rechnung.datum).toLocaleDateString("de-DE")}
                    </TableCell>
                    <TableCell className="max-w-[100px] truncate text-sm">
                      {rechnung.empfaengerName}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {rechnung.kostenart || "-"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">
                      {rechnung.faelligkeitsdatum ? new Date(rechnung.faelligkeitsdatum).toLocaleDateString("de-DE") : "-"}
                    </TableCell>
                    <TableCell className="text-right font-medium text-sm">
                      {brutto.toFixed(2)} €
                    </TableCell>
                    <TableCell>{getStatusBadge(rechnung.status)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem asChild>
                            <Dialog>
                              <DialogTrigger asChild>
                                <button 
                                  className="w-full text-left flex items-center gap-2 px-2 py-1.5 text-sm"
                                  onClick={() => setSelectedRechnung(rechnung)}
                                >
                                  <Eye className="h-4 w-4" />
                                  Ansehen
                                </button>
                              </DialogTrigger>
                              <DialogContent className="max-w-lg">
                                <DialogHeader>
                                  <DialogTitle>Rechnung {selectedRechnung?.nummer}</DialogTitle>
                                </DialogHeader>
                                {selectedRechnung && (
                                  <div className="space-y-4 mt-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <p className="text-muted-foreground">Datum</p>
                                        <p className="font-medium">
                                          {new Date(selectedRechnung.datum).toLocaleDateString("de-DE")}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-muted-foreground">Status</p>
                                        <p>{getStatusBadge(selectedRechnung.status)}</p>
                                      </div>
                                    </div>
                                    <div className="text-sm">
                                      <p className="text-muted-foreground">Empfänger</p>
                                      <p className="font-medium">{selectedRechnung.empfaengerName}</p>
                                      <p className="whitespace-pre-line">{selectedRechnung.empfaengerAdresse}</p>
                                    </div>
                                    {selectedRechnung.kostenart && (
                                      <div className="text-sm">
                                        <p className="text-muted-foreground">Kostenart</p>
                                        <p className="font-medium">{selectedRechnung.kostenart}</p>
                                      </div>
                                    )}
                                    {selectedRechnung.faelligkeitsdatum && (
                                      <div className="text-sm">
                                        <p className="text-muted-foreground">Fälligkeitsdatum</p>
                                        <p className="font-medium">
                                          {new Date(selectedRechnung.faelligkeitsdatum).toLocaleDateString("de-DE")}
                                        </p>
                                      </div>
                                    )}
                                    <div>
                                      <p className="text-muted-foreground text-sm mb-2">Positionen</p>
                                      <Table>
                                        <TableBody>
                                          {selectedRechnung.positionen.map((p) => (
                                            <TableRow key={p.id}>
                                              <TableCell className="py-1">{p.beschreibung}</TableCell>
                                              <TableCell className="py-1 text-right">{p.menge}x</TableCell>
                                              <TableCell className="py-1 text-right">{p.einzelpreis.toFixed(2)} €</TableCell>
                                              <TableCell className="py-1 text-right font-medium">
                                                {calculatePositionTotal(p).toFixed(2)} €
                                              </TableCell>
                                            </TableRow>
                                          ))}
                                        </TableBody>
                                        <TableFooter>
                                          <TableRow>
                                            <TableCell colSpan={3}>Netto</TableCell>
                                            <TableCell className="text-right">
                                              {(selectedRechnung.betragNetto || calculateNetto(selectedRechnung.positionen)).toFixed(2)} €
                                            </TableCell>
                                          </TableRow>
                                          <TableRow>
                                            <TableCell colSpan={3}>
                                              MwSt. {selectedRechnung.mwstProzent || 19}%
                                            </TableCell>
                                            <TableCell className="text-right">
                                              {calculateMwst(selectedRechnung.betragNetto || calculateNetto(selectedRechnung.positionen), selectedRechnung.mwstProzent || 19).toFixed(2)} €
                                            </TableCell>
                                          </TableRow>
                                          <TableRow>
                                            <TableCell colSpan={3} className="font-bold">Brutto</TableCell>
                                            <TableCell className="text-right font-bold">
                                              {(selectedRechnung.betragBrutto || calculateBrutto(selectedRechnung.betragNetto || calculateNetto(selectedRechnung.positionen), selectedRechnung.mwstProzent || 19)).toFixed(2)} €
                                            </TableCell>
                                          </TableRow>
                                        </TableFooter>
                                      </Table>
                                    </div>
                                    {selectedRechnung.notizen && (
                                      <div className="text-sm">
                                        <p className="text-muted-foreground">Notizen</p>
                                        <p>{selectedRechnung.notizen}</p>
                                      </div>
                                    )}
                                    {selectedRechnung.bemerkung && (
                                      <div className="text-sm">
                                        <p className="text-muted-foreground">Bemerkung</p>
                                        <p>{selectedRechnung.bemerkung}</p>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {!isStorniert && (
                            <>
                              <DropdownMenuItem 
                                onClick={() => handleEditRechnung(rechnung)}
                              >
                                <Pencil className="h-4 w-4 mr-2" />
                                Bearbeiten
                              </DropdownMenuItem>
                              {rechnung.status === "offen" && (
                                <DropdownMenuItem 
                                  onClick={() => handleMarkAsPaid(rechnung.id)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Als bezahlt markieren
                                </DropdownMenuItem>
                              )}
                            </>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleExportPDF(rechnung)}
                          >
                            <FileDown className="h-4 w-4 mr-2" />
                            PDF exportieren
                          </DropdownMenuItem>
                          {!isStorniert && rechnung.status !== "storniert" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setStornoRechnungId(rechnung.id);
                                  setStornoDialogOpen(true);
                                }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Stornieren
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteRechnung(rechnung.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Löschen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {filteredRechnungen.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Keine Rechnungen gefunden
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
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
          <CardTitle className="text-base">Alle Rechnungen</CardTitle>
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
              {rechnungen.map((rechnung) => {
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
    </div>
  );
}
