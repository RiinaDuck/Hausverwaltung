"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Save,
  Plus,
  FileDown,
  Trash2,
  Users,
  Home,
  Calendar,
  UserCheck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  generateMieterKommunikationPDF,
  generatePDF,
  downloadPDF,
  sanitizeFilename,
} from "@/lib/pdf-generator";
import { useAppData } from "@/context/app-data-context";
import { useAuth } from "@/context/auth-context";

// Lokales Interface für die Ansicht (kombiniert Mieter + Wohnungsdaten)
interface MieterDisplay {
  id: string;
  nr: number;
  geschoss: string;
  name: string;
  einzug: string;
  auszug: string;
  wohnungId: string;
  email: string;
  telefon: string;
  kaltmiete: number;
  nebenkosten: number;
  kaution: number;
  // Erweiterte Felder
  einzugsDatumRaw: string; // ISO-Format für Date-Input
  mieteBisRaw: string | null;
  isKurzzeitvermietung: boolean;
  kurzzeitBis?: string | null;
  isAktiv: boolean;
  prozentanteil: number;
}

export function MieterdatenView() {
  const {
    mieter,
    wohnungen,
    selectedObjektId,
    objekte,
    ehemaligeMieter,
    addMieter,
    updateMieter,
    deleteMieter,
    archiviereMieter,
    reaktiviereMieter,
  } = useAppData();
  const { isDemo, profile } = useAuth();

  // Finde das aktuelle Objekt für den Namen
  const currentObjekt = objekte.find((o) => o.id === selectedObjektId);

  // Finde alle Wohnungs-IDs für das ausgewählte Objekt
  const objektWohnungIds = useMemo(() => {
    if (!selectedObjektId) return [];
    return wohnungen
      .filter((w) => w.objektId === selectedObjektId)
      .map((w) => w.id);
  }, [wohnungen, selectedObjektId]);

  // Konvertiere Context-Mieter zu MieterDisplay-Format und filtere nach Objekt
  const mieterData: MieterDisplay[] = useMemo(() => {
    // Zeige nur aktive Mieter in der Hauptliste
    const filtered = mieter.filter(
      (m) => objektWohnungIds.includes(m.wohnungId) && m.isAktiv !== false,
    );

    return filtered.map((m, index) => {
      const wohnung = wohnungen.find((w) => w.id === m.wohnungId);
      return {
        id: m.id,
        nr: index + 1,
        geschoss: wohnung?.bezeichnung || "Unbekannt",
        name: m.name,
        einzug: m.einzugsDatum
          ? new Date(m.einzugsDatum).toLocaleDateString("de-DE")
          : "",
        auszug: m.mieteBis
          ? new Date(m.mieteBis).toLocaleDateString("de-DE")
          : "",
        wohnungId: m.wohnungId,
        email: m.email,
        telefon: m.telefon,
        kaltmiete: m.kaltmiete,
        nebenkosten: m.nebenkosten,
        kaution: m.kaution,
        // Erweiterte Felder
        einzugsDatumRaw: m.einzugsDatum,
        mieteBisRaw: m.mieteBis,
        isKurzzeitvermietung: m.isKurzzeitvermietung || false,
        kurzzeitBis: m.kurzzeitBis,
        isAktiv: m.isAktiv !== false,
        prozentanteil: m.prozentanteil || 0,
      };
    });
  }, [mieter, objektWohnungIds, wohnungen]);

  const [selectedMieter, setSelectedMieter] = useState<MieterDisplay | null>(
    null,
  );
  const [editedMieter, setEditedMieter] = useState<MieterDisplay | null>(null);

  // Alle Mieter (inkl. ehemalige) für die Wohnung des aktuell gewählten Mieters - für Historie
  const alleMieterFuerWohnung = useMemo(() => {
    if (!selectedMieter) return [];
    return mieter.filter((m) => m.wohnungId === selectedMieter.wohnungId);
  }, [mieter, selectedMieter]);

  const [betreff, setBetreff] = useState("Mitteilung");
  const [nachricht, setNachricht] = useState(
    "Sehr geehrte Damen und Herren,\n\nbitte beachten Sie, dass die jährliche Nebenkostenabrechnung bis Ende Februar zugestellt wird.\n\nMit freundlichen Grüßen\nIhre Hausverwaltung",
  );
  const [isNewMieterOpen, setIsNewMieterOpen] = useState(false);
  const [isSavingMieter, setIsSavingMieter] = useState(false);
  const [isEhemaligeMieterOpen, setIsEhemaligeMieterOpen] = useState(false);
  const [isHistorieMieterOpen, setIsHistorieMieterOpen] = useState(false);
  const [editingHistorieMieterId, setEditingHistorieMieterId] = useState<
    string | null
  >(null);
  const [newMieter, setNewMieter] = useState<{
    name: string;
    anrede: string;
    wohnungId: string;
    email: string;
    telefon: string;
    einzugsDatum: string;
    kaltmiete: number;
    nebenkosten: number;
    kaution: number;
    isKurzzeitvermietung: boolean;
    kurzzeitBis: string;
    prozentanteil: number;
  }>({
    name: "",
    anrede: "familie",
    wohnungId: "",
    email: "",
    telefon: "",
    einzugsDatum: new Date().toISOString().split("T")[0],
    kaltmiete: 0,
    nebenkosten: 0,
    kaution: 0,
    isKurzzeitvermietung: false,
    kurzzeitBis: "",
    prozentanteil: 0,
  });
  const [historieMieter, setHistorieMieter] = useState<{
    name: string;
    einzugsDatum: string;
    auszugsDatum: string;
    kaltmiete: number;
    nebenkosten: number;
    prozentanteil: number;
    isKurzzeitvermietung: boolean;
  }>({
    name: "",
    einzugsDatum: "",
    auszugsDatum: "",
    kaltmiete: 0,
    nebenkosten: 0,
    prozentanteil: 0,
    isKurzzeitvermietung: false,
  });
  const [selectedEhemaligerMieter, setSelectedEhemaligerMieter] =
    useState<string>("");
  const { toast } = useToast();

  // Aktualisiere selectedMieter wenn sich mieterData ändert
  useEffect(() => {
    if (mieterData.length > 0) {
      if (
        !selectedMieter ||
        !mieterData.find((m) => m.id === selectedMieter.id)
      ) {
        setSelectedMieter(mieterData[0]);
      } else {
        // Aktualisiere selectedMieter mit neuen Daten aus mieterData
        const updatedMieter = mieterData.find(
          (m) => m.id === selectedMieter.id,
        );
        if (updatedMieter) {
          setSelectedMieter(updatedMieter);
        }
      }
    } else {
      setSelectedMieter(null);
    }
  }, [mieterData, selectedObjektId]);

  // Aktualisiere editedMieter wenn selectedMieter sich ändert
  useEffect(() => {
    if (selectedMieter) {
      setEditedMieter({ ...selectedMieter });
      // Aktualisiere auch die Nachricht
      setNachricht(
        `Sehr geehrte/r ${selectedMieter.name},\n\nbitte beachten Sie, dass die jährliche Nebenkostenabrechnung bis Ende Februar zugestellt wird.\n\nMit freundlichen Grüßen\nIhre Hausverwaltung`,
      );
    } else {
      setEditedMieter(null);
    }
  }, [selectedMieter]);

  // Hilfsfunktion zum Aktualisieren der bearbeiteten Mieter-Daten
  const updateEditedMieter = (
    field: keyof MieterDisplay,
    value: string | number | boolean | null,
  ) => {
    if (!editedMieter) return;
    setEditedMieter((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  // Verfügbare Wohnungen für das ausgewählte Objekt (für Dropdown)
  const availableWohnungen = useMemo(() => {
    if (!selectedObjektId) return [];
    return wohnungen.filter((w) => w.objektId === selectedObjektId);
  }, [wohnungen, selectedObjektId]);

  const handleSave = async () => {
    if (!selectedMieter || !editedMieter) return;

    // Update in Context
    await updateMieter(selectedMieter.id, {
      name: editedMieter.name,
      email: editedMieter.email,
      telefon: editedMieter.telefon,
      kaltmiete: editedMieter.kaltmiete,
      nebenkosten: editedMieter.nebenkosten,
      kaution: editedMieter.kaution,
      einzugsDatum: editedMieter.einzugsDatumRaw,
      mieteBis: editedMieter.mieteBisRaw,
      isKurzzeitvermietung: editedMieter.isKurzzeitvermietung,
      kurzzeitBis: editedMieter.kurzzeitBis,
      prozentanteil: editedMieter.prozentanteil,
    });

    // selectedMieter wird automatisch durch useEffect aktualisiert

    toast({
      title: "Gespeichert",
      description: `Mieterdaten für "${editedMieter.name}" wurden gespeichert.`,
    });
  };

  const handleAddHistorieMieter = () => {
    if (
      !selectedMieter ||
      !historieMieter.name ||
      !historieMieter.einzugsDatum
    ) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie mindestens Name und Einzugsdatum aus.",
        variant: "destructive",
      });
      return;
    }

    // Füge neuen ehemaligen Mieter hinzu
    addMieter({
      wohnungId: selectedMieter.wohnungId,
      name: historieMieter.name,
      email: "",
      telefon: "",
      einzugsDatum: historieMieter.einzugsDatum,
      kaltmiete: historieMieter.kaltmiete,
      nebenkosten: historieMieter.nebenkosten,
      kaution: 0,
      mieteBis: historieMieter.auszugsDatum || null,
      isAktiv: false,
      isKurzzeitvermietung: historieMieter.isKurzzeitvermietung,
      kurzzeitBis: null,
      prozentanteil: historieMieter.prozentanteil,
    });

    setIsHistorieMieterOpen(false);
    setHistorieMieter({
      name: "",
      einzugsDatum: "",
      auszugsDatum: "",
      kaltmiete: 0,
      nebenkosten: 0,
      prozentanteil: 0,
      isKurzzeitvermietung: false,
    });

    toast({
      title: "Historie-Eintrag hinzugefügt",
      description: `${historieMieter.name} wurde zur Historie hinzugefügt.`,
    });
  };

  const handleExportAllDataPDF = () => {
    if (!selectedMieter || !editedMieter) return;

    const content: any[] = [];

    // Stammdaten
    content.push(
      { type: "heading", text: "Stammdaten" },
      {
        type: "table",
        data: {
          headers: ["Feld", "Wert"],
          rows: [
            ["Name", editedMieter.name],
            ["Wohnung", editedMieter.geschoss],
            ["E-Mail", editedMieter.email || "-"],
            ["Telefon", editedMieter.telefon || "-"],
            [
              "Einzugsdatum",
              new Date(editedMieter.einzugsDatumRaw).toLocaleDateString(
                "de-DE",
              ),
            ],
            [
              "Auszugsdatum",
              editedMieter.mieteBisRaw
                ? new Date(editedMieter.mieteBisRaw).toLocaleDateString("de-DE")
                : "Unbefristet",
            ],
            [
              "Kaltmiete",
              `${editedMieter.kaltmiete.toLocaleString("de-DE")} €`,
            ],
            [
              "Nebenkosten",
              `${editedMieter.nebenkosten.toLocaleString("de-DE")} €`,
            ],
            ["Kaution", `${editedMieter.kaution.toLocaleString("de-DE")} €`],
            [
              "Kurzzeitvermietung",
              editedMieter.isKurzzeitvermietung ? "Ja" : "Nein",
            ],
          ],
        },
      },
      { type: "spacer", height: 10 },
    );

    // Historie
    content.push(
      { type: "heading", text: "Mieterhistorie" },
      {
        type: "table",
        data: {
          headers: ["Name", "Von", "Bis", "Miete", "Status"],
          rows: alleMieterFuerWohnung.map((m) => [
            m.name,
            new Date(m.einzugsDatum).toLocaleDateString("de-DE"),
            m.mieteBis
              ? new Date(m.mieteBis).toLocaleDateString("de-DE")
              : "heute",
            `${m.kaltmiete.toLocaleString("de-DE")} €`,
            m.isAktiv !== false && !m.mieteBis ? "Aktuell" : "Ehemalig",
          ]),
        },
      },
      { type: "spacer", height: 10 },
    );

    // Verteilungsschlüssel
    content.push(
      { type: "heading", text: "Verteilungsschlüssel" },
      {
        type: "table",
        data: {
          headers: ["Feld", "Wert"],
          rows: [
            ["Wohnung", editedMieter.geschoss],
            ["Prozentanteil", `${editedMieter.prozentanteil}%`],
          ],
        },
      },
    );

    const doc = generatePDF({
      title: `Mieterdaten - ${editedMieter.name}`,
      subtitle: `${currentObjekt?.name || ""} - ${editedMieter.geschoss}`,
      content,
      profile: profile,
      footer: `Hausverwaltung Boss - ${currentObjekt?.objektdaten.strasse || ""}, ${currentObjekt?.objektdaten.plz || ""} ${currentObjekt?.objektdaten.ort || ""}`,
    });

    downloadPDF(
      doc,
      sanitizeFilename(
        `Mieterdaten_${editedMieter.name}_${new Date().toISOString().split("T")[0]}`,
      ),
    );

    toast({
      title: "PDF erstellt",
      description: `Mieterdaten für ${editedMieter.name} wurden als PDF exportiert.`,
    });
  };

  const handleExportKommunikationPDF = () => {
    if (!selectedMieter) return;
    const doc = generateMieterKommunikationPDF({
      mieterName: selectedMieter.name,
      mieterAdresse: `${currentObjekt?.objektdaten.strasse || ""}\n${
        currentObjekt?.objektdaten.plz || ""
      } ${currentObjekt?.objektdaten.ort || ""}`,
      betreff,
      nachricht,
      absender: "Mit freundlichen Grüßen\nIhre Hausverwaltung Boss",
      profile: profile,
    });
    downloadPDF(
      doc,
      sanitizeFilename(
        `mitteilung_${selectedMieter.name}_${new Date().toISOString().split("T")[0]}`,
      ),
    );
  };

  const handleCreateMieter = async () => {
    if (!newMieter.wohnungId || !newMieter.name) {
      toast({
        title: "Fehler",
        description:
          "Bitte wählen Sie eine Wohnung und geben Sie einen Namen ein.",
        variant: "destructive",
      });
      return;
    }

    // Demo-Modus Einschränkung
    if (isDemo) {
      toast({
        title: "Demo-Modus",
        description:
          "Im Demo-Modus können keine neuen Mieter angelegt werden. Bitte melden Sie sich an, um diese Funktion zu nutzen.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingMieter(true);
    try {
      // Füge neuen Mieter über Context hinzu
      await addMieter({
        wohnungId: newMieter.wohnungId,
        name: newMieter.name,
        email: newMieter.email,
        telefon: newMieter.telefon,
        einzugsDatum: newMieter.einzugsDatum,
        mieteBis: null,
        kaltmiete: newMieter.kaltmiete,
        nebenkosten: newMieter.nebenkosten,
        kaution: newMieter.kaution,
        isKurzzeitvermietung: newMieter.isKurzzeitvermietung,
        kurzzeitBis: newMieter.isKurzzeitvermietung
          ? newMieter.kurzzeitBis
          : null,
        isAktiv: true,
        prozentanteil: newMieter.prozentanteil,
      });

      const createdName = newMieter.name;
      setIsNewMieterOpen(false);
      setNewMieter({
        name: "",
        anrede: "familie",
        wohnungId: "",
        email: "",
        telefon: "",
        einzugsDatum: new Date().toISOString().split("T")[0],
        kaltmiete: 0,
        nebenkosten: 0,
        kaution: 0,
        isKurzzeitvermietung: false,
        kurzzeitBis: "",
        prozentanteil: 0,
      });

      toast({
        title: "Mieter angelegt",
        description: `${createdName} wurde erfolgreich angelegt.`,
      });
    } catch (error) {
      console.error("Error creating mieter:", error);
      toast({
        title: "Fehler",
        description:
          "Mieter konnte nicht angelegt werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    } finally {
      setIsSavingMieter(false);
    }
  };

  const handleDeleteMieter = () => {
    if (!selectedMieter || mieterData.length <= 1) return;

    // Lösche über Context
    deleteMieter(selectedMieter.id);

    toast({
      title: "Mieter gelöscht",
      description: `${selectedMieter.name} wurde erfolgreich gelöscht.`,
    });
  };

  // Wenn kein Objekt ausgewählt
  if (!selectedObjektId) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <Card className="p-8 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Kein Objekt ausgewählt</h2>
          <p className="text-muted-foreground">
            Bitte wählen Sie oben ein Objekt aus, um die Mieter anzuzeigen.
          </p>
        </Card>
      </div>
    );
  }

  // Wenn keine Mieter vorhanden
  if (mieterData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <Card className="p-8 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Keine Mieter</h2>
          <p className="text-muted-foreground mb-4">
            Für &quot;{currentObjekt?.name}&quot; sind noch keine Mieter
            angelegt.
          </p>
          {availableWohnungen.length > 0 ? (
            <Button
              className="gap-2 bg-success hover:bg-success/90 text-success-foreground"
              onClick={() => setIsNewMieterOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Ersten Mieter anlegen
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              Bitte legen Sie zuerst Wohnungen an.
            </p>
          )}
        </Card>

        <Dialog open={isNewMieterOpen} onOpenChange={setIsNewMieterOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Neuen Mieter anlegen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-wohnung">Wohnung</Label>
                <Select
                  value={newMieter.wohnungId}
                  onValueChange={(value) =>
                    setNewMieter((prev) => ({ ...prev, wohnungId: value }))
                  }
                >
                  <SelectTrigger id="new-wohnung">
                    <SelectValue placeholder="Wohnung auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableWohnungen.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.bezeichnung} ({w.flaeche} m²)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-anrede">Anrede</Label>
                  <Select
                    value={newMieter.anrede}
                    onValueChange={(value) =>
                      setNewMieter((prev) => ({ ...prev, anrede: value }))
                    }
                  >
                    <SelectTrigger id="new-anrede">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="familie">Familie</SelectItem>
                      <SelectItem value="herr">Herr</SelectItem>
                      <SelectItem value="frau">Frau</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-name">Name</Label>
                  <Input
                    id="new-name"
                    value={newMieter.name}
                    onChange={(e) =>
                      setNewMieter((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="z.B. Familie Schmidt"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-einzug">Einzugsdatum</Label>
                  <Input
                    id="new-einzug"
                    type="date"
                    value={newMieter.einzugsDatum}
                    onChange={(e) =>
                      setNewMieter((prev) => ({
                        ...prev,
                        einzugsDatum: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-kaltmiete">Kaltmiete (€)</Label>
                  <Input
                    id="new-kaltmiete"
                    type="number"
                    value={newMieter.kaltmiete}
                    onChange={(e) =>
                      setNewMieter((prev) => ({
                        ...prev,
                        kaltmiete: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-nebenkosten">Nebenkosten (€)</Label>
                  <Input
                    id="new-nebenkosten"
                    type="number"
                    value={newMieter.nebenkosten}
                    onChange={(e) =>
                      setNewMieter((prev) => ({
                        ...prev,
                        nebenkosten: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-kaution">Kaution (€)</Label>
                  <Input
                    id="new-kaution"
                    type="number"
                    value={newMieter.kaution}
                    onChange={(e) =>
                      setNewMieter((prev) => ({
                        ...prev,
                        kaution: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsNewMieterOpen(false)}
              >
                Abbrechen
              </Button>
              <Button
                className="bg-success hover:bg-success/90 text-success-foreground"
                onClick={handleCreateMieter}
                disabled={isSavingMieter}
              >
                {isSavingMieter ? "Wird angelegt..." : "Mieter anlegen"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-6 h-auto md:h-[calc(100vh-8rem)]">
      {/* Left: Tenants List */}
      <Card className="w-full md:w-72 shrink-0 flex flex-col max-h-[300px] md:max-h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">
                {currentObjekt?.name || "Mieter"}
              </CardTitle>
              <CardDescription className="text-xs">
                {mieterData.length} Mieter
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="gap-1 h-8 bg-transparent"
              onClick={() => setIsNewMieterOpen(true)}
            >
              <Plus className="h-3 w-3" />
              <span className="hidden sm:inline">Neu</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="sticky top-0 bg-card text-xs w-10">
                  Nr
                </TableHead>
                <TableHead className="sticky top-0 bg-card text-xs">
                  Geschoss
                </TableHead>
                <TableHead className="sticky top-0 bg-card text-xs">
                  Name
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mieterData.map((m) => (
                <TableRow
                  key={m.id}
                  className={`cursor-pointer ${
                    selectedMieter?.id === m.id ? "bg-accent" : ""
                  }`}
                  onClick={() => setSelectedMieter(m)}
                >
                  <TableCell className="text-sm py-2">{m.nr}</TableCell>
                  <TableCell className="text-sm py-2">{m.geschoss}</TableCell>
                  <TableCell className="font-medium text-sm py-2">
                    {m.name}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Right: Tenant Details with Tabs */}
      {selectedMieter && (
        <div className="flex-1 overflow-auto space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">
              Mieter: {selectedMieter.name}
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-destructive bg-transparent"
                onClick={handleDeleteMieter}
                disabled={mieterData.length <= 1}
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Löschen</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleExportAllDataPDF}
              >
                <FileDown className="h-4 w-4" />
                <span className="hidden sm:inline">In PDF Exportieren</span>
              </Button>
              <Button
                size="sm"
                className="gap-2 bg-success hover:bg-success/90 text-success-foreground"
                onClick={handleSave}
              >
                <Save className="h-4 w-4" />
                <span className="hidden sm:inline">Speichern</span>
              </Button>
            </div>
          </div>

          <Tabs defaultValue="stammdaten" className="w-full">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 max-w-4xl h-auto">
              <TabsTrigger
                value="stammdaten"
                className="text-xs sm:text-sm py-2"
              >
                Stammdaten
              </TabsTrigger>
              <TabsTrigger value="historie" className="text-xs sm:text-sm py-2">
                <Calendar className="h-3 w-3 mr-1 hidden sm:inline" />
                Historie
              </TabsTrigger>
              <TabsTrigger
                value="verteilung"
                className="text-xs sm:text-sm py-2"
              >
                Schlüssel
              </TabsTrigger>
              <TabsTrigger value="zaehler" className="text-xs sm:text-sm py-2">
                Zähler
              </TabsTrigger>
              <TabsTrigger
                value="zahlungen"
                className="text-xs sm:text-sm py-2"
              >
                Zahlungen
              </TabsTrigger>
              <TabsTrigger
                value="kommunikation"
                className="text-xs sm:text-sm py-2"
              >
                Kontakt
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Stammdaten */}
            <TabsContent
              value="stammdaten"
              className="mt-4 sm:mt-6 space-y-4 sm:space-y-6"
            >
              <Card>
                <CardContent className="pt-4 sm:pt-6 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="mieter-nr">Mieter Nr</Label>
                      <Input
                        id="mieter-nr"
                        value={editedMieter?.nr || 0}
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="geschoss">Wohnung</Label>
                      <Input
                        id="geschoss"
                        value={editedMieter?.geschoss || ""}
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={editedMieter?.name || ""}
                        onChange={(e) =>
                          updateEditedMieter("name", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-Mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editedMieter?.email || ""}
                        onChange={(e) =>
                          updateEditedMieter("email", e.target.value)
                        }
                        placeholder="mieter@email.de"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="telefon">Telefon</Label>
                      <Input
                        id="telefon"
                        value={editedMieter?.telefon || ""}
                        onChange={(e) =>
                          updateEditedMieter("telefon", e.target.value)
                        }
                        placeholder="030 12345678"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="einzug">Einzugsdatum</Label>
                      <Input
                        id="einzug"
                        type="date"
                        value={editedMieter?.einzugsDatumRaw || ""}
                        onChange={(e) =>
                          updateEditedMieter("einzugsDatumRaw", e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="auszug">Auszugsdatum</Label>
                      <Input
                        id="auszug"
                        type="date"
                        value={editedMieter?.mieteBisRaw || ""}
                        onChange={(e) =>
                          updateEditedMieter(
                            "mieteBisRaw",
                            e.target.value || null,
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2 flex items-end gap-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="kurzzeitvermietung"
                          checked={editedMieter?.isKurzzeitvermietung || false}
                          onCheckedChange={(checked) =>
                            setEditedMieter((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    isKurzzeitvermietung: checked === true,
                                  }
                                : null,
                            )
                          }
                        />
                        <Label
                          htmlFor="kurzzeitvermietung"
                          className="text-sm font-medium"
                        >
                          Kurzzeitvermietung
                        </Label>
                      </div>
                    </div>
                  </div>
                  {editedMieter?.isKurzzeitvermietung && (
                    <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
                      <h4 className="text-sm font-medium">
                        Kurzzeitvermietung Zeitraum
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="kurzzeit-von">Von (Einzug)</Label>
                          <Input
                            id="kurzzeit-von"
                            type="date"
                            value={editedMieter?.einzugsDatumRaw || ""}
                            onChange={(e) =>
                              updateEditedMieter(
                                "einzugsDatumRaw",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="kurzzeit-bis">Bis (Auszug)</Label>
                          <Input
                            id="kurzzeit-bis"
                            type="date"
                            value={editedMieter?.kurzzeitBis || ""}
                            onChange={(e) =>
                              updateEditedMieter("kurzzeitBis", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="kaltmiete">Kaltmiete (€)</Label>
                      <Input
                        id="kaltmiete"
                        type="number"
                        value={editedMieter?.kaltmiete || 0}
                        onChange={(e) =>
                          updateEditedMieter(
                            "kaltmiete",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nebenkosten">Nebenkosten (€)</Label>
                      <Input
                        id="nebenkosten"
                        type="number"
                        value={editedMieter?.nebenkosten || 0}
                        onChange={(e) =>
                          updateEditedMieter(
                            "nebenkosten",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="kaution">Kaution (€)</Label>
                      <Input
                        id="kaution"
                        type="number"
                        value={editedMieter?.kaution || 0}
                        onChange={(e) =>
                          updateEditedMieter(
                            "kaution",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 2: Mieterhistorie / Timeline */}
            <TabsContent value="historie" className="mt-6 space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Mietzeiträume für {editedMieter?.geschoss}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Übersicht aller Mieter dieser Wohnung inkl. Zeiträume
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={() => setIsHistorieMieterOpen(true)}
                    >
                      <Plus className="h-3 w-3" />
                      Vorherigen Mieter hinzufügen
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Timeline Visualisierung */}
                  <div className="space-y-3">
                    {alleMieterFuerWohnung
                      .sort(
                        (a, b) =>
                          new Date(a.einzugsDatum).getTime() -
                          new Date(b.einzugsDatum).getTime(),
                      ) // Chronologisch: älteste zuerst
                      .map((m, index, array) => {
                        const isCurrentMieter = m.id === editedMieter?.id;
                        const einzug = new Date(m.einzugsDatum);
                        const auszug = m.mieteBis ? new Date(m.mieteBis) : null;
                        const isAktiv = m.isAktiv !== false && !m.mieteBis;

                        // Berechne Mietdauer
                        const endDate = auszug || new Date();
                        const durationMs = endDate.getTime() - einzug.getTime();
                        const durationMonths = Math.floor(
                          durationMs / (1000 * 60 * 60 * 24 * 30.44),
                        );
                        const durationYears = Math.floor(durationMonths / 12);
                        const remainingMonths = durationMonths % 12;

                        let durationText = "";
                        if (durationYears > 0) {
                          durationText = `${durationYears} Jahr${durationYears !== 1 ? "e" : ""}`;
                          if (remainingMonths > 0) {
                            durationText += `, ${remainingMonths} Monat${remainingMonths !== 1 ? "e" : ""}`;
                          }
                        } else {
                          durationText = `${durationMonths} Monat${durationMonths !== 1 ? "e" : ""}`;
                        }

                        return (
                          <div
                            key={m.id}
                            className={`relative pl-8 pb-4 ${
                              index !== array.length - 1
                                ? "border-l-2 border-muted-foreground/20"
                                : ""
                            }`}
                          >
                            {/* Timeline Punkt */}
                            <div
                              className={`absolute left-[-5px] top-0 w-3 h-3 rounded-full border-2 border-background ${
                                isAktiv
                                  ? "bg-success ring-2 ring-success/20"
                                  : "bg-muted-foreground/50"
                              }`}
                            />

                            <div
                              className={`p-3 rounded-lg border ${
                                isCurrentMieter
                                  ? "border-primary bg-primary/5"
                                  : "border-muted"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{m.name}</span>
                                  {isAktiv && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs bg-success/10 text-success border-success/20"
                                    >
                                      Aktuell
                                    </Badge>
                                  )}
                                  {m.isKurzzeitvermietung && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs bg-amber-500/10 text-amber-500 border-amber-500/20"
                                    >
                                      Kurzzeit
                                    </Badge>
                                  )}
                                  {!isAktiv && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs bg-muted text-muted-foreground"
                                    >
                                      Ehemalig
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {m.prozentanteil ? `${m.prozentanteil}%` : ""}
                                </span>
                              </div>

                              {/* Zeitraum-Balken */}
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground font-medium">
                                  {einzug.toLocaleDateString("de-DE")}
                                </span>
                                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden relative">
                                  <div
                                    className={`h-full transition-all ${
                                      isAktiv
                                        ? "bg-gradient-to-r from-success/70 to-success"
                                        : "bg-gradient-to-r from-muted-foreground/30 to-muted-foreground/50"
                                    }`}
                                    style={{ width: "100%" }}
                                  />
                                </div>
                                <span className="text-muted-foreground font-medium">
                                  {auszug
                                    ? auszug.toLocaleDateString("de-DE")
                                    : "heute"}
                                </span>
                              </div>

                              {/* Details */}
                              <div className="mt-2 flex items-center justify-between">
                                <div className="flex flex-col gap-1">
                                  <span className="text-xs text-muted-foreground">
                                    Miete: {m.kaltmiete.toLocaleString("de-DE")}{" "}
                                    € + {m.nebenkosten.toLocaleString("de-DE")}{" "}
                                    € NK
                                  </span>
                                  <span className="text-xs text-muted-foreground font-medium">
                                    Dauer: {durationText}
                                    {isAktiv ? " (läuft)" : ""}
                                  </span>
                                </div>
                                {!isAktiv && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 text-xs"
                                    onClick={() => {
                                      setEditingHistorieMieterId(m.id);
                                      setHistorieMieter({
                                        name: m.name,
                                        einzugsDatum: m.einzugsDatum,
                                        auszugsDatum: m.mieteBis || "",
                                        kaltmiete: m.kaltmiete,
                                        nebenkosten: m.nebenkosten,
                                        prozentanteil: m.prozentanteil || 0,
                                        isKurzzeitvermietung:
                                          m.isKurzzeitvermietung || false,
                                      });
                                      setIsHistorieMieterOpen(true);
                                    }}
                                  >
                                    Bearbeiten
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                    {alleMieterFuerWohnung.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Keine Mieterhistorie für diese Wohnung vorhanden.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 3: Verteilungsschlüssel */}
            <TabsContent value="verteilung" className="mt-6 space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Verteilungsschlüssel
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Informationen zur Nebenkostenabrechnung für{" "}
                    {editedMieter?.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="wohnflaeche-anteil">Wohnung</Label>
                      <Input
                        id="wohnflaeche-anteil"
                        value={editedMieter?.geschoss || ""}
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prozentanteile">Prozentanteil (%)</Label>
                      <Input
                        id="prozentanteile"
                        type="number"
                        step="0.1"
                        value={editedMieter?.prozentanteil || 0}
                        onChange={(e) =>
                          updateEditedMieter(
                            "prozentanteil",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        placeholder="z.B. 12.5"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Der Prozentanteil wird für die Verteilung der Nebenkosten
                    verwendet. Vergessen Sie nicht, die Änderungen zu speichern.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 3: Zählerstände (Zwischenzähler) */}
            <TabsContent value="zaehler" className="mt-6 space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Zählerstände (Zwischenzähler)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Zähler für {editedMieter?.name} - {editedMieter?.geschoss}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Die Zählerstände werden im Bereich "Zählerstände" verwaltet.
                  </p>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm">
                      Wohnung:{" "}
                      <span className="font-medium">
                        {editedMieter?.geschoss}
                      </span>
                    </p>
                    <p className="text-sm">
                      Mieter:{" "}
                      <span className="font-medium">{editedMieter?.name}</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 4: Zahlungen */}
            <TabsContent value="zahlungen" className="mt-6 space-y-6">
              {/* Miete & Nebenkosten */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Miete & Nebenkosten
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Monatliche Zahlungen für {editedMieter?.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="kaltmiete-zahlung">Kaltmiete (€)</Label>
                      <Input
                        id="kaltmiete-zahlung"
                        type="number"
                        value={editedMieter?.kaltmiete || 0}
                        onChange={(e) =>
                          updateEditedMieter(
                            "kaltmiete",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nebenkosten-zahlung">
                        Nebenkosten (€)
                      </Label>
                      <Input
                        id="nebenkosten-zahlung"
                        type="number"
                        value={editedMieter?.nebenkosten || 0}
                        onChange={(e) =>
                          updateEditedMieter(
                            "nebenkosten",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Gesamt (€)</Label>
                      <Input
                        value={
                          (editedMieter?.kaltmiete || 0) +
                          (editedMieter?.nebenkosten || 0)
                        }
                        readOnly
                        className="bg-muted font-medium"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="kaution-zahlung">Kaution (€)</Label>
                    <Input
                      id="kaution-zahlung"
                      type="number"
                      value={editedMieter?.kaution || 0}
                      onChange={(e) =>
                        updateEditedMieter(
                          "kaution",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 5: Kommunikation */}
            <TabsContent value="kommunikation" className="mt-6 space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      Mitteilung an den Mieter
                    </CardTitle>
                    <Button
                      variant="outline"
                      className="gap-2 bg-transparent"
                      onClick={handleExportKommunikationPDF}
                    >
                      <FileDown className="h-4 w-4" />
                      Als PDF exportieren
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="betreff">Betreff</Label>
                    <Input
                      id="betreff"
                      value={betreff}
                      onChange={(e) => setBetreff(e.target.value)}
                      placeholder="Betreff der Mitteilung"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nachricht">Nachricht</Label>
                    <Textarea
                      id="nachricht"
                      placeholder="Geben Sie hier eine Mitteilung an den Mieter ein..."
                      rows={10}
                      value={nachricht}
                      onChange={(e) => setNachricht(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      <Dialog open={isNewMieterOpen} onOpenChange={setIsNewMieterOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Neuen Mieter anlegen</DialogTitle>
            <DialogDescription>
              Erfassen Sie die Daten für einen neuen Mieter.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-wohnung">Wohnung</Label>
              <Select
                value={newMieter.wohnungId}
                onValueChange={(value) =>
                  setNewMieter((prev) => ({ ...prev, wohnungId: value }))
                }
              >
                <SelectTrigger id="new-wohnung">
                  <SelectValue placeholder="Wohnung auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {availableWohnungen.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.bezeichnung} ({w.flaeche} m²)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-anrede">Anrede</Label>
                <Select
                  value={newMieter.anrede}
                  onValueChange={(value) =>
                    setNewMieter((prev) => ({ ...prev, anrede: value }))
                  }
                >
                  <SelectTrigger id="new-anrede">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="familie">Familie</SelectItem>
                    <SelectItem value="herr">Herr</SelectItem>
                    <SelectItem value="frau">Frau</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-name">Name</Label>
                <Input
                  id="new-name"
                  value={newMieter.name}
                  onChange={(e) =>
                    setNewMieter((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="z.B. Familie Schmidt"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-einzug">Einzugsdatum</Label>
                <Input
                  id="new-einzug"
                  type="date"
                  value={newMieter.einzugsDatum}
                  onChange={(e) =>
                    setNewMieter((prev) => ({
                      ...prev,
                      einzugsDatum: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-kaltmiete">Kaltmiete (€)</Label>
                <Input
                  id="new-kaltmiete"
                  type="number"
                  value={newMieter.kaltmiete}
                  onChange={(e) =>
                    setNewMieter((prev) => ({
                      ...prev,
                      kaltmiete: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-nebenkosten">Nebenkosten (€)</Label>
                <Input
                  id="new-nebenkosten"
                  type="number"
                  value={newMieter.nebenkosten}
                  onChange={(e) =>
                    setNewMieter((prev) => ({
                      ...prev,
                      nebenkosten: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-kaution">Kaution (€)</Label>
                <Input
                  id="new-kaution"
                  type="number"
                  value={newMieter.kaution}
                  onChange={(e) =>
                    setNewMieter((prev) => ({
                      ...prev,
                      kaution: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>

            {/* Kurzzeitvermietung Rubrik */}
            <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="new-kurzzeitvermietung"
                  checked={newMieter.isKurzzeitvermietung}
                  onCheckedChange={(checked) =>
                    setNewMieter((prev) => ({
                      ...prev,
                      isKurzzeitvermietung: checked === true,
                    }))
                  }
                />
                <Label
                  htmlFor="new-kurzzeitvermietung"
                  className="text-sm font-medium"
                >
                  Kurzzeitvermietung
                </Label>
              </div>
              {newMieter.isKurzzeitvermietung && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-kurzzeit-von">Einzugsdatum: von</Label>
                    <Input
                      id="new-kurzzeit-von"
                      type="date"
                      value={newMieter.einzugsDatum}
                      onChange={(e) =>
                        setNewMieter((prev) => ({
                          ...prev,
                          einzugsDatum: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-kurzzeit-bis">Einzugsdatum: bis</Label>
                    <Input
                      id="new-kurzzeit-bis"
                      type="date"
                      value={newMieter.kurzzeitBis}
                      onChange={(e) =>
                        setNewMieter((prev) => ({
                          ...prev,
                          kurzzeitBis: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Ehemalige Mieter wiederverwenden */}
            {ehemaligeMieter.length > 0 && (
              <div className="border rounded-lg p-4 space-y-4 bg-blue-50/50 dark:bg-blue-950/20">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-blue-500" />
                  <Label className="text-sm font-medium">
                    Ehemaligen Mieter zuordnen
                  </Label>
                </div>
                <Select
                  value={selectedEhemaligerMieter}
                  onValueChange={(value) => {
                    setSelectedEhemaligerMieter(value);
                    const selected = ehemaligeMieter.find(
                      (m) => m.id === value,
                    );
                    if (selected) {
                      setNewMieter((prev) => ({
                        ...prev,
                        name: selected.name,
                        email: selected.email,
                        telefon: selected.telefon,
                      }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ehemaligen Mieter auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ehemaligeMieter.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} (Auszug:{" "}
                        {new Date(m.letztesAuszugsDatum).toLocaleDateString(
                          "de-DE",
                        )}
                        )
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Wählen Sie einen ehemaligen Mieter aus, um dessen Daten zu
                  übernehmen.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewMieterOpen(false)}>
              Abbrechen
            </Button>
            <Button
              className="bg-success hover:bg-success/90 text-success-foreground"
              onClick={handleCreateMieter}
              disabled={isSavingMieter}
            >
              {isSavingMieter ? "Wird angelegt..." : "Mieter anlegen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog zum Hinzufügen/Bearbeiten von Historie-Mietern */}
      <Dialog
        open={isHistorieMieterOpen}
        onOpenChange={setIsHistorieMieterOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingHistorieMieterId
                ? "Historie-Eintrag bearbeiten"
                : "Vorherigen Mieter hinzufügen"}
            </DialogTitle>
            <DialogDescription>
              Erfassen Sie die Daten eines vorherigen Mieters für die Historie.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="historie-name">Name des Mieters *</Label>
              <Input
                id="historie-name"
                value={historieMieter.name}
                onChange={(e) =>
                  setHistorieMieter((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="z.B. Max Mustermann"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="historie-einzug">Einzugsdatum *</Label>
                <Input
                  id="historie-einzug"
                  type="date"
                  value={historieMieter.einzugsDatum}
                  onChange={(e) =>
                    setHistorieMieter((prev) => ({
                      ...prev,
                      einzugsDatum: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="historie-auszug">Auszugsdatum</Label>
                <Input
                  id="historie-auszug"
                  type="date"
                  value={historieMieter.auszugsDatum}
                  onChange={(e) =>
                    setHistorieMieter((prev) => ({
                      ...prev,
                      auszugsDatum: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="historie-kaltmiete">Kaltmiete (€)</Label>
                <Input
                  id="historie-kaltmiete"
                  type="number"
                  value={historieMieter.kaltmiete}
                  onChange={(e) =>
                    setHistorieMieter((prev) => ({
                      ...prev,
                      kaltmiete: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="historie-nebenkosten">Nebenkosten (€)</Label>
                <Input
                  id="historie-nebenkosten"
                  type="number"
                  value={historieMieter.nebenkosten}
                  onChange={(e) =>
                    setHistorieMieter((prev) => ({
                      ...prev,
                      nebenkosten: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="historie-prozent">Prozentanteil (%)</Label>
                <Input
                  id="historie-prozent"
                  type="number"
                  step="0.1"
                  value={historieMieter.prozentanteil}
                  onChange={(e) =>
                    setHistorieMieter((prev) => ({
                      ...prev,
                      prozentanteil: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2 flex items-end pb-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="historie-kurzzeit"
                    checked={historieMieter.isKurzzeitvermietung}
                    onCheckedChange={(checked) =>
                      setHistorieMieter((prev) => ({
                        ...prev,
                        isKurzzeitvermietung: !!checked,
                      }))
                    }
                  />
                  <Label htmlFor="historie-kurzzeit" className="text-sm">
                    Kurzzeitvermietung
                  </Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsHistorieMieterOpen(false);
                setEditingHistorieMieterId(null);
                setHistorieMieter({
                  name: "",
                  einzugsDatum: "",
                  auszugsDatum: "",
                  kaltmiete: 0,
                  nebenkosten: 0,
                  prozentanteil: 0,
                  isKurzzeitvermietung: false,
                });
              }}
            >
              Abbrechen
            </Button>
            <Button
              className="bg-success hover:bg-success/90 text-success-foreground"
              onClick={handleAddHistorieMieter}
            >
              {editingHistorieMieterId ? "Aktualisieren" : "Hinzufügen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
