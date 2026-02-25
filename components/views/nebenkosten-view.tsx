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
import { Save, Plus, Trash2, FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  generateNebenkostenPDF,
  downloadPDF,
  sanitizeFilename,
} from "@/lib/pdf-generator";
import { useAppData } from "@/context/app-data-context";
import { useAuth } from "@/context/auth-context";

interface Kostenart {
  id: string;
  name: string;
  kosten: string;
  schluessel: string;
}

// Vordefinierte Kostenarten
const KOSTENARTEN_OPTIONEN = [
  "Allgemeinstrom/Beleuchtung",
  "Aufzug",
  "Elementarschadenversicherung",
  "Feuerlöscher/Brandmelder",
  "Fußwegreinigung",
  "Gartenpflege",
  "Gebäudereinigung",
  "Gebäudeversicherung",
  "Gemeinschaftsantenne/Kabel-TV",
  "Gewässerschadenhaftpflicht",
  "Glasbruchversicherung",
  "Grundsteuer",
  "Haftpflichtversicherung",
  "Hausreinigung",
  "Hauswart/Hausmeister",
  "Müllbeseitigung",
  "Niederschlagswasser",
  "Schmutzwasser",
  "Schornsteinreinigung/Abgasüberprüfung",
  "Straßenreinigung",
  "Tank Wartung/Reinigung",
  "Wartung Heizung",
  "Wasser: Grundpreis",
  "Wasser: Verbrauchskosten",
  "Wasserkosten",
];

const initialKostenarten: Kostenart[] = [
  {
    id: "1",
    name: "Allgemeinstrom/Beleuchtung",
    kosten: "420.00",
    schluessel: "wohnflaeche",
  },
  {
    id: "2",
    name: "Feuerlöscherwartung",
    kosten: "85.00",
    schluessel: "einheiten",
  },
  {
    id: "3",
    name: "Garten-/Grundstückspflege",
    kosten: "680.00",
    schluessel: "wohnflaeche",
  },
  {
    id: "4",
    name: "Gebäudeversicherung",
    kosten: "1250.00",
    schluessel: "wohnflaeche",
  },
  { id: "5", name: "Grundsteuer", kosten: "890.00", schluessel: "mea" },
  {
    id: "6",
    name: "Haftpflichtversicherung",
    kosten: "320.00",
    schluessel: "wohnflaeche",
  },
  { id: "7", name: "Kabelgebühren", kosten: "540.00", schluessel: "einheiten" },
  { id: "8", name: "Müllabfuhr", kosten: "780.00", schluessel: "personen" },
  {
    id: "9",
    name: "Niederschlagswasser",
    kosten: "165.00",
    schluessel: "wohnflaeche",
  },
  {
    id: "10",
    name: "Schmutzwasser",
    kosten: "420.00",
    schluessel: "verbrauch",
  },
  { id: "11", name: "Wasser", kosten: "890.00", schluessel: "verbrauch" },
  { id: "12", name: "", kosten: "", schluessel: "wohnflaeche" },
  { id: "13", name: "", kosten: "", schluessel: "wohnflaeche" },
];

const verteilerschluesselOptions = [
  { value: "wohnflaeche", label: "Wohnfläche (m²)" },
  { value: "nutzflaeche", label: "Nutzfläche (m²)" },
  { value: "einheiten", label: "Anzahl Einheiten" },
  { value: "personen", label: "Personenanzahl" },
  { value: "verbrauch", label: "nach Verbrauch" },
  { value: "mea", label: "MEA/Punkte" },
  { value: "direkt", label: "Direkt" },
];

export function NebenkostenView({ mode = "erfassen" }: { mode?: "erfassen" | "abrechnung" }) {
  const { objekte, wohnungen, mieter, selectedObjektId } = useAppData();
  const { profile, isDemo } = useAuth();
  const [kostenarten, setKostenarten] =
    useState<Kostenart[]>(initialKostenarten);
  const [selectedMieterId, setSelectedMieterId] = useState<string | null>(null);
  const [title, setTitle] = useState("Nebenkostenabrechnung");
  const [dateVon, setDateVon] = useState("2024-01-01");
  const [dateBis, setDateBis] = useState("2024-12-31");
  const [introText, setIntroText] = useState(
    "Sehr geehrte Mieter,\n\nnachfolgend erhalten Sie die Abrechnung der Betriebskosten für den oben genannten Abrechnungszeitraum.",
  );
  const [outroText, setOutroText] = useState(
    "Ein sich zu Ihren Gunsten ergebender Betrag wird mit der nächsten Mietzahlung verrechnet bzw. an Sie überwiesen.\n\nEin Nachzahlungsbetrag ist innerhalb von 14 Tagen nach Erhalt dieser Abrechnung fällig.\n\nMit freundlichen Grüßen\nIhre Hausverwaltung",
  );
  const { toast } = useToast();

  // Aktuelles Objekt
  const currentObjekt = useMemo(
    () => objekte.find((o) => o.id === selectedObjektId),
    [objekte, selectedObjektId],
  );

  // Mieter des aktuellen Objekts
  const availableMieter = useMemo(() => {
    if (!selectedObjektId) return [];
    const objektWohnungen = wohnungen.filter(
      (w) => w.objektId === selectedObjektId,
    );
    const wohnungIds = objektWohnungen.map((w) => w.id);
    return mieter.filter((m) => wohnungIds.includes(m.wohnungId));
  }, [selectedObjektId, wohnungen, mieter]);

  // Ausgewählter Mieter
  const selectedMieter = useMemo(
    () => availableMieter.find((m) => m.id === selectedMieterId),
    [availableMieter, selectedMieterId],
  );

  // Wohnung des ausgewählten Mieters
  const selectedWohnung = useMemo(
    () => wohnungen.find((w) => w.id === selectedMieter?.wohnungId),
    [wohnungen, selectedMieter],
  );

  const handleSave = () => {
    toast({
      title: "Gespeichert",
      description: "Nebenkostenabrechnung wurde gespeichert.",
    });
  };

  const calculateTotal = () => {
    return kostenarten
      .reduce((sum, k) => sum + (Number.parseFloat(k.kosten) || 0), 0)
      .toFixed(2);
  };

  const calculateDays = () => {
    const von = new Date(dateVon);
    const bis = new Date(dateBis);
    const diff =
      Math.ceil((bis.getTime() - von.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  };

  const updateKostenart = (
    id: string,
    field: keyof Kostenart,
    value: string,
  ) => {
    setKostenarten((prev) =>
      prev.map((k) => (k.id === id ? { ...k, [field]: value } : k)),
    );
  };

  const addKostenart = () => {
    if (isDemo) {
      toast({
        title: "Demo-Modus",
        description:
          "Im Demo-Modus können keine neuen Buchungen angelegt werden. Bitte melden Sie sich an, um diese Funktion zu nutzen.",
        variant: "destructive",
      });
      return;
    }

    const newId = (
      Math.max(...kostenarten.map((k) => Number.parseInt(k.id))) + 1
    ).toString();
    setKostenarten((prev) => [
      ...prev,
      { id: newId, name: "", kosten: "", schluessel: "wohnflaeche" },
    ]);
  };

  const removeKostenart = (id: string) => {
    setKostenarten((prev) => prev.filter((k) => k.id !== id));
  };

  const handleExportPDF = () => {
    if (!selectedMieter) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie einen Mieter aus.",
        variant: "destructive",
      });
      return;
    }

    try {
      const doc = generateNebenkostenPDF({
        title,
        dateVon,
        dateBis,
        introText,
        kostenarten: kostenarten.map((k) => ({
          name: k.name,
          kosten: k.kosten,
          schluessel: k.schluessel,
        })),
        total: calculateTotal(),
        outroText,
        mieterName: selectedMieter.name,
        objektAdresse: currentObjekt?.adresse || "",
        profile: profile,
      });
      downloadPDF(
        doc,
        sanitizeFilename(
          `nebenkostenabrechnung_${selectedMieter.name}_${dateVon}_${dateBis}`,
        ),
      );
      toast({
        title: "PDF erstellt",
        description: "Die Nebenkostenabrechnung wurde erfolgreich exportiert.",
      });
    } catch (error) {
      console.error("PDF Export Fehler:", error);
      toast({
        title: "Fehler beim Export",
        description: "Die Nebenkostenabrechnung konnte nicht erstellt werden.",
        variant: "destructive",
      });
    }
  };

  // ---- Kosten erfassen ----
  if (mode === "erfassen") {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm sm:text-base text-muted-foreground">
            Erfassen Sie die Betriebskosten für das aktuelle Objekt.
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="gap-2 bg-success hover:bg-success/90 text-success-foreground"
              onClick={() =>
                toast({ title: "Gespeichert", description: "Betriebskosten wurden gespeichert." })
              }
            >
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">Speichern</span>
            </Button>
          </div>
        </div>

        {/* Abrechnungszeitraum */}
        <Card>
          <CardContent className="pt-4 sm:pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="erfassen-von">Zeitraum von</Label>
                <Input
                  id="erfassen-von"
                  type="date"
                  value={dateVon}
                  onChange={(e) => setDateVon(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="erfassen-bis">Zeitraum bis</Label>
                <Input
                  id="erfassen-bis"
                  type="date"
                  value={dateBis}
                  onChange={(e) => setDateBis(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Kostentabelle */}
        <Card>
          <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <CardTitle className="text-base">Betriebskosten</CardTitle>
            <Button
              size="sm"
              variant="outline"
              className="gap-1 bg-transparent w-fit"
              onClick={addKostenart}
            >
              <Plus className="h-3 w-3" />
              Kostenposition hinzufügen
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Kostenart</TableHead>
                  <TableHead className="w-[120px]">Betrag (€)</TableHead>
                  <TableHead className="w-[180px]">Verteilerschlüssel</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kostenarten.map((kostenart) => (
                  <TableRow key={kostenart.id}>
                    <TableCell>
                      <Select
                        value={kostenart.name || "custom"}
                        onValueChange={(value) => {
                          if (value === "custom") {
                            updateKostenart(kostenart.id, "name", "");
                          } else {
                            updateKostenart(kostenart.id, "name", value);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Kostenart wählen" />
                        </SelectTrigger>
                        <SelectContent>
                          {KOSTENARTEN_OPTIONEN.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                          <SelectItem value="custom">Eigene eingeben...</SelectItem>
                        </SelectContent>
                      </Select>
                      {(!kostenart.name || !KOSTENARTEN_OPTIONEN.includes(kostenart.name)) && (
                        <Input
                          value={kostenart.name}
                          onChange={(e) =>
                            updateKostenart(kostenart.id, "name", e.target.value)
                          }
                          placeholder="Eigene Kostenart eingeben"
                          className="mt-2"
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Input
                        value={kostenart.kosten}
                        onChange={(e) =>
                          updateKostenart(kostenart.id, "kosten", e.target.value)
                        }
                        placeholder="0.00"
                        className="text-right"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={kostenart.schluessel}
                        onValueChange={(value) =>
                          updateKostenart(kostenart.id, "schluessel", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {verteilerschluesselOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => removeKostenart(kostenart.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-bold">Gesamtkosten</TableCell>
                  <TableCell className="font-bold text-right">
                    {calculateTotal()} €
                  </TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm sm:text-base text-muted-foreground">
          Erstellen Sie die Nebenkostenabrechnung für das aktuelle Objekt.
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 bg-transparent"
            onClick={handleExportPDF}
          >
            <FileDown className="h-4 w-4" />
            <span className="hidden sm:inline">Als PDF exportieren</span>
            <span className="sm:hidden">PDF</span>
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

      {/* Header */}
      <Card>
        <CardContent className="pt-4 sm:pt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mieter-select">Mieter</Label>
              <Select
                value={selectedMieterId || ""}
                onValueChange={(value) => setSelectedMieterId(value)}
              >
                <SelectTrigger id="mieter-select">
                  <SelectValue placeholder="Mieter auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {availableMieter.map((m) => {
                    const wohnung = wohnungen.find((w) => w.id === m.wohnungId);
                    return (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} - {wohnung?.bezeichnung}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
              <div className="sm:col-span-2 md:col-span-2 space-y-2">
                <Label htmlFor="title">Titel</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-lg font-medium"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-von">Von</Label>
                <Input
                  id="date-von"
                  type="date"
                  value={dateVon}
                  onChange={(e) => setDateVon(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-bis">Bis</Label>
                <Input
                  id="date-bis"
                  type="date"
                  value={dateBis}
                  onChange={(e) => setDateBis(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="mt-4 text-sm text-muted-foreground">
            Abrechnungszeitraum:{" "}
            <span className="font-medium text-foreground">
              {calculateDays()} Tage
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Intro Text */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Einleitungstext</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={3}
            value={introText}
            onChange={(e) => setIntroText(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card>
        <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <CardTitle className="text-base">Kostenaufstellung</CardTitle>
          <Button
            size="sm"
            variant="outline"
            className="gap-1 bg-transparent w-fit"
            onClick={addKostenart}
          >
            <Plus className="h-3 w-3" />
            Zeile hinzufügen
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table className="min-w-[600px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px] sm:w-[300px]">
                  Kostenart
                </TableHead>
                <TableHead className="w-[100px] sm:w-[150px]">
                  Kosten (€)
                </TableHead>
                <TableHead className="w-[150px] sm:w-[200px]">
                  Verteilerschlüssel
                </TableHead>
                <TableHead className="w-[60px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {kostenarten.map((kostenart) => (
                <TableRow key={kostenart.id}>
                  <TableCell>
                    <Select
                      value={kostenart.name || "custom"}
                      onValueChange={(value) => {
                        if (value === "custom") {
                          updateKostenart(kostenart.id, "name", "");
                        } else {
                          updateKostenart(kostenart.id, "name", value);
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Kostenart wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {KOSTENARTEN_OPTIONEN.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">
                          Eigene eingeben...
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    {(!kostenart.name ||
                      !KOSTENARTEN_OPTIONEN.includes(kostenart.name)) && (
                      <Input
                        value={kostenart.name}
                        onChange={(e) =>
                          updateKostenart(kostenart.id, "name", e.target.value)
                        }
                        placeholder="Eigene Kostenart eingeben"
                        className="mt-2"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Input
                      value={kostenart.kosten}
                      onChange={(e) =>
                        updateKostenart(kostenart.id, "kosten", e.target.value)
                      }
                      placeholder="0.00"
                      className="text-right"
                    />
                  </TableCell>
                  <TableCell>
                    <Select
                      value={kostenart.schluessel}
                      onValueChange={(value) =>
                        updateKostenart(kostenart.id, "schluessel", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {verteilerschluesselOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => removeKostenart(kostenart.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="font-bold">Summe Kosten</TableCell>
                <TableCell className="font-bold text-right">
                  {calculateTotal()} €
                </TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      {/* Outro Text */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Schlusstext</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={4}
            value={outroText}
            onChange={(e) => setOutroText(e.target.value)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
