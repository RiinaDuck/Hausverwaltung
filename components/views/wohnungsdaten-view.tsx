"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Plus,
  Save,
  Trash2,
  Search,
  Home,
  Ruler,
  DoorOpen,
  Percent,
  Star,
  Bath,
  Flame,
  Layers,
  TreePine,
  Car,
  CheckCircle2,
  Tv,
  Heart,
  Copy,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useAppData } from "@/context/app-data-context";
import { useAuth } from "@/context/auth-context";

interface Unit {
  id: string;
  lage: string;
  wohnflaeche: number;
  nutzflaeche: number;
  raeume: number;
  punkte: number;
  prozent: number;
  status?: "vermietet" | "frei" | "renovierung";
  miete?: number;
}

const initialUnits: Unit[] = [
  {
    id: "1",
    lage: "EG links",
    wohnflaeche: 65.5,
    nutzflaeche: 70.2,
    raeume: 3,
    punkte: 45,
    prozent: 12.5,
    status: "vermietet",
    miete: 850,
  },
  {
    id: "2",
    lage: "EG rechts",
    wohnflaeche: 72.3,
    nutzflaeche: 78.1,
    raeume: 3,
    punkte: 48,
    prozent: 13.8,
    status: "vermietet",
    miete: 920,
  },
  {
    id: "3",
    lage: "1.OG links",
    wohnflaeche: 65.5,
    nutzflaeche: 70.2,
    raeume: 3,
    punkte: 45,
    prozent: 12.5,
    status: "frei",
  },
  {
    id: "4",
    lage: "1.OG rechts",
    wohnflaeche: 72.3,
    nutzflaeche: 78.1,
    raeume: 3,
    punkte: 48,
    prozent: 13.8,
    status: "vermietet",
    miete: 920,
  },
  {
    id: "5",
    lage: "2.OG links",
    wohnflaeche: 65.5,
    nutzflaeche: 70.2,
    raeume: 3,
    punkte: 45,
    prozent: 12.5,
    status: "vermietet",
    miete: 850,
  },
  {
    id: "6",
    lage: "2.OG rechts",
    wohnflaeche: 72.3,
    nutzflaeche: 78.1,
    raeume: 3,
    punkte: 48,
    prozent: 13.8,
    status: "renovierung",
  },
  {
    id: "7",
    lage: "DG links",
    wohnflaeche: 58.2,
    nutzflaeche: 62.5,
    raeume: 2,
    punkte: 38,
    prozent: 11.1,
    status: "vermietet",
    miete: 780,
  },
  {
    id: "8",
    lage: "DG rechts",
    wohnflaeche: 58.2,
    nutzflaeche: 62.5,
    raeume: 2,
    punkte: 38,
    prozent: 11.1,
    status: "vermietet",
    miete: 780,
  },
];

interface AusstattungCategory {
  title: string;
  icon: React.ElementType;
  items: { id: string; label: string }[];
}

const ausstattungCategories: AusstattungCategory[] = [
  {
    title: "Bad",
    icon: Bath,
    items: [
      { id: "bad-dusche", label: "Dusche" },
      { id: "bad-wanne", label: "Badewanne" },
      { id: "bad-fenster", label: "Fenster" },
      { id: "bad-gaeste-wc", label: "Gäste-WC" },
    ],
  },
  {
    title: "Heizung",
    icon: Flame,
    items: [
      { id: "etagenheizung", label: "Etagenheizung" },
      { id: "fussbodenheizung", label: "Fußbodenheizung" },
      { id: "ofenheizung", label: "Ofenheizung" },
      { id: "zentralheizung", label: "Zentralheizung" },
    ],
  },
  {
    title: "Boden",
    icon: Layers,
    items: [
      { id: "dielen", label: "Dielen" },
      { id: "fliesen", label: "Fliesen" },
      { id: "laminat", label: "Laminat" },
      { id: "parkett", label: "Parkett" },
      { id: "teppich", label: "Teppich" },
    ],
  },
  {
    title: "Außen",
    icon: TreePine,
    items: [
      { id: "balkon", label: "Balkon" },
      { id: "dachterrasse", label: "Dachterrasse" },
      { id: "loggia", label: "Loggia" },
      { id: "terrasse", label: "Terrasse" },
      { id: "wintergarten", label: "Wintergarten" },
      { id: "gartenanteil", label: "Gartenanteil" },
    ],
  },
  {
    title: "Parken",
    icon: Car,
    items: [
      { id: "duplex", label: "Duplex" },
      { id: "garage", label: "Garage" },
      { id: "stellplatz", label: "Stellplatz" },
      { id: "tiefgarage", label: "Tiefgarage" },
    ],
  },
  {
    title: "Zustand",
    icon: CheckCircle2,
    items: [
      { id: "altbau", label: "Altbau" },
      { id: "erstbezug", label: "Erstbezug" },
      { id: "gehoben", label: "Gehoben" },
      { id: "gepflegt", label: "Gepflegt" },
      { id: "luxus", label: "Luxus" },
      { id: "neubau", label: "Neubau" },
      { id: "renoviert", label: "Renoviert" },
      { id: "saniert", label: "Saniert" },
    ],
  },
  {
    title: "Medien",
    icon: Tv,
    items: [
      { id: "kabel", label: "Kabel-TV" },
      { id: "sat", label: "Sat-TV" },
      { id: "dsl", label: "DSL" },
      { id: "glasfaser", label: "Glasfaser" },
    ],
  },
  {
    title: "Sonstiges",
    icon: Heart,
    items: [
      { id: "haustiere", label: "Haustiere erlaubt" },
      { id: "kelleranteil", label: "Kelleranteil" },
      { id: "rollstuhlgerecht", label: "Rollstuhlgerecht" },
      { id: "seniorengerecht", label: "Seniorengerecht" },
      { id: "wg-geeignet", label: "WG geeignet" },
      { id: "betreutes-wohnen", label: "Betreutes Wohnen" },
    ],
  },
];

const statusConfig = {
  vermietet: {
    label: "Vermietet",
    color: "bg-success/10 text-success border-success/20",
  },
  frei: {
    label: "Frei",
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  renovierung: {
    label: "Renovierung",
    color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
};

export function WohnungsdatenView() {
  const {
    wohnungen,
    selectedObjektId,
    objekte,
    addWohnung,
    updateWohnung,
    deleteWohnung,
  } = useAppData();
  const { isDemo } = useAuth();

  // Finde das aktuelle Objekt für den Namen
  const currentObjekt = objekte.find((o) => o.id === selectedObjektId);

  // Konvertiere Context-Wohnungen zu Unit-Format und filtere nach Objekt
  const units: Unit[] = useMemo(() => {
    const filtered = selectedObjektId
      ? wohnungen.filter((w) => w.objektId === selectedObjektId)
      : wohnungen;

    return filtered.map((w) => ({
      id: w.id,
      lage: w.bezeichnung,
      wohnflaeche: w.flaeche,
      nutzflaeche: w.flaeche * 1.1, // Nutzfläche ca. 10% größer
      raeume: w.zimmer,
      punkte: Math.round(w.flaeche * 0.7),
      prozent: 12.5,
      status:
        w.status === "vermietet"
          ? "vermietet"
          : w.status === "leer"
            ? "frei"
            : ("vermietet" as const),
      miete: w.miete,
    }));
  }, [wohnungen, selectedObjektId]);

  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [editedUnit, setEditedUnit] = useState<Unit | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({
    "bad-dusche": true,
    "bad-fenster": true,
    zentralheizung: true,
    laminat: true,
    balkon: true,
    gepflegt: true,
    kelleranteil: true,
    kabel: true,
  });
  const [isNewUnitOpen, setIsNewUnitOpen] = useState(false);
  const initialNewUnit = {
    lage: "",
    wohnflaeche: 0,
    nutzflaeche: 0,
    raeume: 2,
    miete: 0,
    punkte: 0,
    prozent: 0,
    status: "frei" as const,
  };
  const [newUnit, setNewUnit] = useState(initialNewUnit);
  const { toast } = useToast();

  // Aktualisiere selectedUnit wenn sich units ändert
  useEffect(() => {
    if (units.length > 0) {
      if (!selectedUnit || !units.find((u) => u.id === selectedUnit.id)) {
        setSelectedUnit(units[0]);
      } else {
        // Aktualisiere selectedUnit mit neuen Daten aus units
        const updatedUnit = units.find((u) => u.id === selectedUnit.id);
        if (updatedUnit) {
          setSelectedUnit(updatedUnit);
        }
      }
    } else {
      setSelectedUnit(null);
    }
  }, [units, selectedObjektId]);

  // Aktualisiere editedUnit wenn selectedUnit sich ändert
  useEffect(() => {
    if (selectedUnit) {
      setEditedUnit({ ...selectedUnit });
    } else {
      setEditedUnit(null);
    }
  }, [selectedUnit]);

  const filteredUnits = units.filter((unit) =>
    unit.lage.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Hilfsfunktion zum Aktualisieren der bearbeiteten Unit
  const updateEditedUnit = (
    field: keyof Unit,
    value: string | number | "vermietet" | "frei" | "renovierung",
  ) => {
    if (!editedUnit) return;
    setEditedUnit((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleSave = async () => {
    if (!selectedUnit || !editedUnit) return;

    // Update in Context (konvertiere zurück zu Wohnung Format)
    await updateWohnung(selectedUnit.id, {
      bezeichnung: editedUnit.lage,
      flaeche: editedUnit.wohnflaeche,
      zimmer: editedUnit.raeume,
      miete: editedUnit.miete,
      status:
        editedUnit.status === "vermietet"
          ? "vermietet"
          : editedUnit.status === "frei"
            ? "leer"
            : "vermietet",
    });

    // selectedUnit wird automatisch durch useEffect aktualisiert

    toast({
      title: "Gespeichert",
      description: `Wohnungsdaten für "${editedUnit.lage}" wurden gespeichert.`,
    });
  };

  const toggleItem = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateUnit = () => {
    if (!selectedObjektId) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie zuerst ein Objekt aus.",
        variant: "destructive",
      });
      return;
    }

    // Demo-Modus Einschränkung
    if (isDemo) {
      toast({
        title: "Demo-Modus",
        description:
          "Im Demo-Modus können keine neuen Wohnungen angelegt werden. Bitte melden Sie sich an, um diese Funktion zu nutzen.",
        variant: "destructive",
      });
      return;
    }

    addWohnung({
      objektId: selectedObjektId,
      bezeichnung: newUnit.lage || "Neue Einheit",
      etage: newUnit.lage?.split(" ")[0] || "EG",
      flaeche: newUnit.wohnflaeche || 0,
      zimmer: newUnit.raeume || 2,
      miete: newUnit.miete || 0,
      nebenkosten: 150,
      status: newUnit.status === "frei" ? "leer" : "vermietet",
    });

    setIsNewUnitOpen(false);
    setNewUnit(initialNewUnit);
    toast({
      title: "Einheit erstellt",
      description: `Wohneinheit "${
        newUnit.lage || "Neue Einheit"
      }" wurde erfolgreich angelegt.`,
    });
  };

  const handleDeleteUnit = () => {
    if (!selectedUnit || units.length <= 1) return;
    deleteWohnung(selectedUnit.id);
    toast({
      title: "Einheit gelöscht",
      description: `Wohneinheit "${selectedUnit.lage}" wurde entfernt.`,
      variant: "destructive",
    });
  };

  const handleDuplicateUnit = () => {
    if (!selectedUnit || !selectedObjektId) return;

    addWohnung({
      objektId: selectedObjektId,
      bezeichnung: `${selectedUnit.lage} (Kopie)`,
      etage: selectedUnit.lage.split(" ")[0] || "EG",
      flaeche: selectedUnit.wohnflaeche,
      zimmer: selectedUnit.raeume,
      miete: selectedUnit.miete || 0,
      nebenkosten: 150,
      status: selectedUnit.status === "frei" ? "leer" : "vermietet",
    });
    toast({
      title: "Einheit dupliziert",
      description: `Wohneinheit "${selectedUnit.lage}" wurde kopiert.`,
    });
  };

  const checkedCount = Object.values(checkedItems).filter(Boolean).length;

  // Wenn kein Objekt ausgewählt oder keine Wohnungen vorhanden
  if (!selectedObjektId) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <Card className="p-8 text-center">
          <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Kein Objekt ausgewählt</h2>
          <p className="text-muted-foreground">
            Bitte wählen Sie oben ein Objekt aus, um die Wohnungen anzuzeigen.
          </p>
        </Card>
      </div>
    );
  }

  if (units.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <Card className="p-8 text-center">
          <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Keine Wohnungen</h2>
          <p className="text-muted-foreground mb-4">
            Für &quot;{currentObjekt?.name}&quot; sind noch keine Wohnungen
            angelegt.
          </p>
          <Button
            className="gap-2 bg-success hover:bg-success/90 text-success-foreground"
            onClick={() => setIsNewUnitOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Erste Wohnung anlegen
          </Button>
        </Card>

        {/* New Unit Dialog */}
        <Dialog
          open={isNewUnitOpen}
          onOpenChange={(open) => {
            setIsNewUnitOpen(open);
            if (!open) setNewUnit(initialNewUnit);
          }}
        >
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Neue Einheit anlegen</DialogTitle>
              <DialogDescription>
                Erfassen Sie die Daten für eine neue Wohneinheit.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-lage-empty">Geschosslage</Label>
                <Input
                  id="new-lage-empty"
                  value={newUnit.lage}
                  onChange={(e) =>
                    setNewUnit((prev) => ({ ...prev, lage: e.target.value }))
                  }
                  placeholder="z.B. EG links"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-wohnflaeche-empty">Wohnfläche (m²)</Label>
                  <Input
                    id="new-wohnflaeche-empty"
                    type="number"
                    step="0.1"
                    value={newUnit.wohnflaeche}
                    onChange={(e) =>
                      setNewUnit((prev) => ({
                        ...prev,
                        wohnflaeche: Number.parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-nutzflaeche-empty">Nutzfläche (m²)</Label>
                  <Input
                    id="new-nutzflaeche-empty"
                    type="number"
                    step="0.1"
                    value={newUnit.nutzflaeche}
                    onChange={(e) =>
                      setNewUnit((prev) => ({
                        ...prev,
                        nutzflaeche: Number.parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-raeume-empty">Räume</Label>
                  <Input
                    id="new-raeume-empty"
                    type="number"
                    value={newUnit.raeume}
                    onChange={(e) =>
                      setNewUnit((prev) => ({
                        ...prev,
                        raeume: Number.parseInt(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-miete-empty">Kaltmiete (€)</Label>
                  <Input
                    id="new-miete-empty"
                    type="number"
                    value={newUnit.miete}
                    onChange={(e) =>
                      setNewUnit((prev) => ({
                        ...prev,
                        miete: Number.parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-status-empty">Status</Label>
                  <Select
                    value={newUnit.status}
                    onValueChange={(value) =>
                      setNewUnit((prev) => ({
                        ...prev,
                        status: value as "frei" | "vermietet",
                      }))
                    }
                  >
                    <SelectTrigger id="new-status-empty">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="frei">Frei</SelectItem>
                      <SelectItem value="vermietet">Vermietet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNewUnitOpen(false)}>
                Abbrechen
              </Button>
              <Button
                className="bg-success hover:bg-success/90 text-success-foreground"
                onClick={handleCreateUnit}
              >
                Einheit anlegen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-6 h-auto md:h-[calc(100vh-8rem)]">
      {/* Left: Units List */}
      <Card className="w-full md:w-80 shrink-0 flex flex-col overflow-hidden md:max-h-full">
        <CardHeader className="pb-3 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">
                {currentObjekt?.name || "Einheiten"}
              </CardTitle>
              <CardDescription className="text-xs">
                {units.length} Wohnungen
              </CardDescription>
            </div>
            <Button
              size="sm"
              className="gap-1.5 h-8 bg-success hover:bg-success/90 text-success-foreground"
              onClick={() => setIsNewUnitOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Neu
            </Button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-1">
              {filteredUnits.map((unit) => (
                <div
                  key={unit.id}
                  className={cn(
                    "p-3 rounded-lg cursor-pointer transition-all hover:bg-accent group",
                    selectedUnit?.id === unit.id &&
                      "bg-accent ring-1 ring-border",
                  )}
                  onClick={() => setSelectedUnit(unit)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{unit.lage}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Ruler className="h-3 w-3" />
                          {unit.wohnflaeche} m²
                        </span>
                        <span className="flex items-center gap-1">
                          <DoorOpen className="h-3 w-3" />
                          {unit.raeume} Zi.
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {unit.status && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            statusConfig[unit.status].color,
                          )}
                        >
                          {statusConfig[unit.status].label}
                        </Badge>
                      )}
                      {unit.miete && (
                        <span className="text-xs font-medium text-success">
                          {unit.miete.toLocaleString("de-DE")} €
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Right: Unit Details */}
      {selectedUnit && (
        <div className="flex-1 overflow-auto space-y-4 md:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                <Home className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold truncate">
                  {selectedUnit.lage}
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  {selectedUnit.status && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        statusConfig[selectedUnit.status].color,
                      )}
                    >
                      {statusConfig[selectedUnit.status].label}
                    </Badge>
                  )}
                  <span className="text-sm text-muted-foreground">
                    {selectedUnit.wohnflaeche} m² • {selectedUnit.raeume} Zimmer
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 self-end sm:self-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDuplicateUnit}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplizieren
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleDeleteUnit}
                    disabled={units.length <= 1}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Löschen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                className="gap-2 bg-success hover:bg-success/90 text-success-foreground"
                onClick={handleSave}
              >
                <Save className="h-4 w-4" />
                Speichern
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
            {[
              { label: "Geschosslage", value: selectedUnit.lage, icon: Home },
              {
                label: "Wohnfläche",
                value: `${selectedUnit.wohnflaeche} m²`,
                icon: Ruler,
              },
              {
                label: "Nutzfläche",
                value: `${selectedUnit.nutzflaeche} m²`,
                icon: Ruler,
              },
              {
                label: "Räume",
                value: selectedUnit.raeume.toString(),
                icon: DoorOpen,
              },
              {
                label: "Punkte",
                value: selectedUnit.punkte.toString(),
                icon: Star,
              },
              {
                label: "Anteil",
                value: `${selectedUnit.prozent}%`,
                icon: Percent,
              },
            ].map((stat) => (
              <Card key={stat.label} className="bg-muted/30">
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <stat.icon className="h-3.5 w-3.5" />
                    <span className="text-xs">{stat.label}</span>
                  </div>
                  <p className="font-semibold text-sm md:text-base truncate">
                    {stat.value}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Tabs defaultValue="daten" className="space-y-4">
            <TabsList>
              <TabsTrigger value="daten">Flächendaten</TabsTrigger>
              <TabsTrigger value="ausstattung" className="gap-2">
                Ausstattung
                {checkedCount > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                    {checkedCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="daten" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Flächendaten bearbeiten
                  </CardTitle>
                  <CardDescription>
                    Passen Sie die Grunddaten der Wohneinheit an.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="lage">Geschosslage</Label>
                      <Input
                        id="lage"
                        value={editedUnit?.lage || ""}
                        onChange={(e) =>
                          updateEditedUnit("lage", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="wohnflaeche">Wohnfläche (m²)</Label>
                      <Input
                        id="wohnflaeche"
                        type="number"
                        step="0.1"
                        value={editedUnit?.wohnflaeche || 0}
                        onChange={(e) =>
                          updateEditedUnit(
                            "wohnflaeche",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nutzflaeche">Nutzfläche (m²)</Label>
                      <Input
                        id="nutzflaeche"
                        type="number"
                        step="0.1"
                        value={editedUnit?.nutzflaeche || 0}
                        onChange={(e) =>
                          updateEditedUnit(
                            "nutzflaeche",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="raeume">Räume</Label>
                      <Input
                        id="raeume"
                        type="number"
                        value={editedUnit?.raeume || 0}
                        onChange={(e) =>
                          updateEditedUnit(
                            "raeume",
                            parseInt(e.target.value) || 0,
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="punkte">Punkte</Label>
                      <Input
                        id="punkte"
                        type="number"
                        value={editedUnit?.punkte || 0}
                        onChange={(e) =>
                          updateEditedUnit(
                            "punkte",
                            parseInt(e.target.value) || 0,
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prozent">Prozentanteile</Label>
                      <Input
                        id="prozent"
                        type="number"
                        step="0.1"
                        value={editedUnit?.prozent || 0}
                        onChange={(e) =>
                          updateEditedUnit(
                            "prozent",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={editedUnit?.status || "frei"}
                        onValueChange={(value) =>
                          updateEditedUnit(
                            "status",
                            value as "vermietet" | "frei" | "renovierung",
                          )
                        }
                      >
                        <SelectTrigger id="status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="frei">Frei</SelectItem>
                          <SelectItem value="vermietet">Vermietet</SelectItem>
                          <SelectItem value="renovierung">
                            Renovierung
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="miete">Kaltmiete (€)</Label>
                      <Input
                        id="miete"
                        type="number"
                        step="0.01"
                        value={editedUnit?.miete || 0}
                        onChange={(e) =>
                          updateEditedUnit(
                            "miete",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ausstattung">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Ausstattung & Merkmale
                  </CardTitle>
                  <CardDescription>
                    Wählen Sie die Ausstattungsmerkmale der Wohnung aus.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {ausstattungCategories.map((category) => (
                      <Card
                        key={category.title}
                        className="bg-muted/20 border-dashed"
                      >
                        <CardHeader className="pb-2 pt-3 px-4">
                          <div className="flex items-center gap-2">
                            <category.icon className="h-4 w-4 text-muted-foreground" />
                            <CardTitle className="text-sm font-medium">
                              {category.title}
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="px-4 pb-3">
                          <div className="space-y-2">
                            {category.items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  id={item.id}
                                  checked={checkedItems[item.id] || false}
                                  onCheckedChange={() => toggleItem(item.id)}
                                  className="h-4 w-4"
                                />
                                <label
                                  htmlFor={item.id}
                                  className="text-sm leading-none cursor-pointer hover:text-foreground transition-colors"
                                >
                                  {item.label}
                                </label>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* New Unit Dialog */}
      <Dialog
        open={isNewUnitOpen}
        onOpenChange={(open) => {
          setIsNewUnitOpen(open);
          if (!open) setNewUnit(initialNewUnit);
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Neue Einheit anlegen</DialogTitle>
            <DialogDescription>
              Erfassen Sie die Daten für eine neue Wohneinheit.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-lage">Geschosslage</Label>
              <Input
                id="new-lage"
                value={newUnit.lage}
                onChange={(e) =>
                  setNewUnit((prev) => ({ ...prev, lage: e.target.value }))
                }
                placeholder="z.B. 3.OG links"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-wohnflaeche">Wohnfläche (m²)</Label>
                <Input
                  id="new-wohnflaeche"
                  type="number"
                  step="0.1"
                  value={newUnit.wohnflaeche}
                  onChange={(e) =>
                    setNewUnit((prev) => ({
                      ...prev,
                      wohnflaeche: Number.parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-nutzflaeche">Nutzfläche (m²)</Label>
                <Input
                  id="new-nutzflaeche"
                  type="number"
                  step="0.1"
                  value={newUnit.nutzflaeche}
                  onChange={(e) =>
                    setNewUnit((prev) => ({
                      ...prev,
                      nutzflaeche: Number.parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-raeume">Räume</Label>
                <Input
                  id="new-raeume"
                  type="number"
                  value={newUnit.raeume}
                  onChange={(e) =>
                    setNewUnit((prev) => ({
                      ...prev,
                      raeume: Number.parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-punkte">Punkte</Label>
                <Input
                  id="new-punkte"
                  type="number"
                  value={newUnit.punkte}
                  onChange={(e) =>
                    setNewUnit((prev) => ({
                      ...prev,
                      punkte: Number.parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-prozent">Prozentanteile</Label>
                <Input
                  id="new-prozent"
                  type="number"
                  step="0.1"
                  value={newUnit.prozent}
                  onChange={(e) =>
                    setNewUnit((prev) => ({
                      ...prev,
                      prozent: Number.parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewUnitOpen(false)}>
              Abbrechen
            </Button>
            <Button
              className="bg-success hover:bg-success/90 text-success-foreground"
              onClick={handleCreateUnit}
            >
              Einheit anlegen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
