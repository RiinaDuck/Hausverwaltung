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
import { Save, Plus, FileDown, Trash2, Users, Home } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  generateMieterKommunikationPDF,
  downloadPDF,
} from "@/lib/pdf-generator";
import { useAppData } from "@/context/app-data-context";

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
}

export function MieterdatenView() {
  const {
    mieter,
    wohnungen,
    selectedObjektId,
    objekte,
    addMieter,
    updateMieter,
    deleteMieter,
  } = useAppData();

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
    const filtered = mieter.filter((m) =>
      objektWohnungIds.includes(m.wohnungId)
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
      };
    });
  }, [mieter, objektWohnungIds, wohnungen]);

  const [selectedMieter, setSelectedMieter] = useState<MieterDisplay | null>(
    null
  );
  const [editedMieter, setEditedMieter] = useState<MieterDisplay | null>(null);
  const [betreff, setBetreff] = useState("Mitteilung");
  const [nachricht, setNachricht] = useState(
    "Sehr geehrte Damen und Herren,\n\nbitte beachten Sie, dass die jährliche Nebenkostenabrechnung bis Ende Februar zugestellt wird.\n\nMit freundlichen Grüßen\nIhre Hausverwaltung"
  );
  const [isNewMieterOpen, setIsNewMieterOpen] = useState(false);
  const [newMieter, setNewMieter] = useState<{
    name: string;
    wohnungId: string;
    email: string;
    telefon: string;
    einzugsDatum: string;
    kaltmiete: number;
    nebenkosten: number;
    kaution: number;
  }>({
    name: "",
    wohnungId: "",
    email: "",
    telefon: "",
    einzugsDatum: new Date().toISOString().split("T")[0],
    kaltmiete: 0,
    nebenkosten: 0,
    kaution: 0,
  });
  const { toast } = useToast();

  // Aktualisiere selectedMieter wenn sich mieterData ändert
  useEffect(() => {
    if (mieterData.length > 0) {
      if (
        !selectedMieter ||
        !mieterData.find((m) => m.id === selectedMieter.id)
      ) {
        setSelectedMieter(mieterData[0]);
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
        `Sehr geehrte/r ${selectedMieter.name},\n\nbitte beachten Sie, dass die jährliche Nebenkostenabrechnung bis Ende Februar zugestellt wird.\n\nMit freundlichen Grüßen\nIhre Hausverwaltung`
      );
    } else {
      setEditedMieter(null);
    }
  }, [selectedMieter]);

  // Hilfsfunktion zum Aktualisieren der bearbeiteten Mieter-Daten
  const updateEditedMieter = (
    field: keyof MieterDisplay,
    value: string | number
  ) => {
    if (!editedMieter) return;
    setEditedMieter((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  // Verfügbare Wohnungen für das ausgewählte Objekt (für Dropdown)
  const availableWohnungen = useMemo(() => {
    if (!selectedObjektId) return [];
    return wohnungen.filter((w) => w.objektId === selectedObjektId);
  }, [wohnungen, selectedObjektId]);

  const handleSave = () => {
    if (!selectedMieter || !editedMieter) return;

    // Update in Context
    updateMieter(selectedMieter.id, {
      name: editedMieter.name,
      email: editedMieter.email,
      telefon: editedMieter.telefon,
      kaltmiete: editedMieter.kaltmiete,
      nebenkosten: editedMieter.nebenkosten,
      kaution: editedMieter.kaution,
    });

    toast({
      title: "Gespeichert",
      description: `Mieterdaten für "${editedMieter.name}" wurden gespeichert.`,
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
    });
    downloadPDF(
      doc,
      `mitteilung_${selectedMieter.name.replace(/\s+/g, "_")}_${
        new Date().toISOString().split("T")[0]
      }`
    );
  };

  const handleCreateMieter = () => {
    if (!newMieter.wohnungId || !newMieter.name) {
      toast({
        title: "Fehler",
        description:
          "Bitte wählen Sie eine Wohnung und geben Sie einen Namen ein.",
        variant: "destructive",
      });
      return;
    }

    // Füge neuen Mieter über Context hinzu
    addMieter({
      wohnungId: newMieter.wohnungId,
      name: newMieter.name,
      email: newMieter.email,
      telefon: newMieter.telefon,
      einzugsDatum: newMieter.einzugsDatum,
      mieteBis: null,
      kaltmiete: newMieter.kaltmiete,
      nebenkosten: newMieter.nebenkosten,
      kaution: newMieter.kaution,
    });

    setIsNewMieterOpen(false);
    setNewMieter({
      name: "",
      wohnungId: "",
      email: "",
      telefon: "",
      einzugsDatum: new Date().toISOString().split("T")[0],
      kaltmiete: 0,
      nebenkosten: 0,
      kaution: 0,
    });

    toast({
      title: "Mieter angelegt",
      description: `${newMieter.name} wurde erfolgreich angelegt.`,
    });
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
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 max-w-3xl h-auto">
              <TabsTrigger
                value="stammdaten"
                className="text-xs sm:text-sm py-2"
              >
                Stammdaten
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
                        type="text"
                        value={editedMieter?.einzug || ""}
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                  </div>
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
                            parseFloat(e.target.value) || 0
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
                            parseFloat(e.target.value) || 0
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
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 2: Verteilungsschlüssel */}
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
                      <Label htmlFor="wohnflaeche-anteil">
                        Wohnfläche (m²)
                      </Label>
                      <Input
                        id="wohnflaeche-anteil"
                        value={editedMieter?.geschoss || ""}
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prozentanteile">Prozentanteil</Label>
                      <Input
                        id="prozentanteile"
                        value="Wird berechnet"
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Die Verteilungsschlüssel werden automatisch bei der
                    Nebenkostenabrechnung berechnet.
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
                            parseFloat(e.target.value) || 0
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
                            parseFloat(e.target.value) || 0
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
                          parseFloat(e.target.value) || 0
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
                <Select defaultValue="familie">
                  <SelectTrigger id="new-anrede">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="herr">Herr</SelectItem>
                    <SelectItem value="frau">Frau</SelectItem>
                    <SelectItem value="familie">Familie</SelectItem>
                    <SelectItem value="firma">Firma</SelectItem>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewMieterOpen(false)}>
              Abbrechen
            </Button>
            <Button
              className="bg-success hover:bg-success/90 text-success-foreground"
              onClick={handleCreateMieter}
            >
              Mieter anlegen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
