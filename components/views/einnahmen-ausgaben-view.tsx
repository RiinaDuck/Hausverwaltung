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
import { Plus, Save, Trash2, FileDown, Eye, Pencil, Filter, X } from "lucide-react";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useAppData, type Buchung, type Objekt, type Wohnung, type Mieter } from "@/context/app-data-context";
import { useIsMobile } from "@/hooks/use-mobile";

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

interface BuchungFilter {
  typ: "alle" | "einnahme" | "ausgabe";
  kategorien: string[];
  objektId: string;
  vonDatum: string;
  bisDatum: string;
  vonBetrag: number | null;
  bisBetrag: number | null;
}

export function EinnahmenAusgabenView() {
  const { profile, isDemo } = useAuth();
  const { toast } = useToast();
  const { buchungen, addBuchung, updateBuchung, deleteBuchung, objekte, wohnungen, mieter } = useAppData();
  const isMobile = useIsMobile();
  const [selectedBuchung, setSelectedBuchung] = useState<Buchung | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingBuchung, setEditingBuchung] = useState<Buchung | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [filter, setFilter] = useState<BuchungFilter>({
    typ: "alle",
    kategorien: [],
    objektId: "",
    vonDatum: "",
    bisDatum: "",
    vonBetrag: null,
    bisBetrag: null,
  });

  const [newBuchung, setNewBuchung] = useState<Partial<Buchung>>({
    typ: "ausgabe",
    datum: new Date().toISOString().split("T")[0],
    kategorie: "",
    betragNetto: 0,
    mwstProzent: 19,
    betragBrutto: 0,
    beschreibung: "",
  });

  const [selectedObjekt, setSelectedObjekt] = useState<string>("");
  const [selectedWohnung, setSelectedWohnung] = useState<string>("");
  const [selectedMieter, setSelectedMieter] = useState<string>("");

  const kategorienForTyp = filter.typ === "einnahme" 
    ? EINNAHMEN_KATEGORIEN 
    : filter.typ === "ausgabe" 
    ? AUSGABEN_KATEGORIEN 
    : [...EINNAHMEN_KATEGORIEN, ...AUSGABEN_KATEGORIEN];

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filter.typ !== "alle") count++;
    if (filter.kategorien.length > 0) count++;
    if (filter.objektId) count++;
    if (filter.vonDatum) count++;
    if (filter.bisDatum) count++;
    if (filter.vonBetrag !== null) count++;
    if (filter.bisBetrag !== null) count++;
    return count;
  }, [filter]);

  const filteredBuchungen = useMemo(() => {
    return buchungen.filter((buchung) => {
      if (filter.typ !== "alle" && buchung.typ !== filter.typ) return false;
      if (filter.kategorien.length > 0 && !filter.kategorien.includes(buchung.kategorie)) return false;
      if (filter.objektId && buchung.objektId !== filter.objektId) return false;
      if (filter.vonDatum && buchung.datum < filter.vonDatum) return false;
      if (filter.bisDatum && buchung.datum > filter.bisDatum) return false;
      if (filter.vonBetrag !== null && buchung.betragBrutto < filter.vonBetrag) return false;
      if (filter.bisBetrag !== null && buchung.betragBrutto > filter.bisBetrag) return false;
      return true;
    });
  }, [buchungen, filter]);

  const summary = useMemo(() => {
    const einnahmen = filteredBuchungen
      .filter((b) => b.typ === "einnahme")
      .reduce((sum, b) => sum + b.betragBrutto, 0);
    const ausgaben = filteredBuchungen
      .filter((b) => b.typ === "ausgabe")
      .reduce((sum, b) => sum + b.betragBrutto, 0);
    const ueberschuss = einnahmen - ausgaben;
    return { einnahmen, ausgaben, ueberschuss, count: filteredBuchungen.length };
  }, [filteredBuchungen]);

  const handleCreateBuchung = async () => {
    if (isDemo) {
      toast({
        title: "Demo-Modus",
        description: "Im Demo-Modus können keine neuen Buchungen angelegt werden.",
        variant: "destructive",
      });
      return;
    }

    if (!newBuchung.kategorie) {
      toast({
        title: "Kategorie erforderlich",
        description: "Bitte wählen Sie eine Kategorie.",
        variant: "destructive",
      });
      return;
    }

    if (newBuchung.betragNetto === undefined || newBuchung.betragNetto <= 0) {
      toast({
        title: "Betrag erforderlich",
        description: "Bitte geben Sie einen gültigen Betrag ein.",
        variant: "destructive",
      });
      return;
    }

    try {
      const mwst = (newBuchung.betragNetto || 0) * ((newBuchung.mwstProzent || 0) / 100);
      const brutto = (newBuchung.betragNetto || 0) + mwst;

      await addBuchung({
        typ: newBuchung.typ as "einnahme" | "ausgabe" || "ausgabe",
        kategorie: newBuchung.kategorie || "",
        datum: newBuchung.datum || new Date().toISOString().split("T")[0],
        betragNetto: newBuchung.betragNetto || 0,
        mwstProzent: newBuchung.mwstProzent || 0,
        betragBrutto: brutto,
        objektId: selectedObjekt || null,
        wohnungId: selectedWohnung || null,
        mieterId: selectedMieter || null,
        beschreibung: newBuchung.beschreibung || "",
        rechnungssteller: newBuchung.rechnungssteller || null,
        rechnungsnummer: newBuchung.rechnungsnummer || null,
      });

      setIsCreateOpen(false);
      resetForm();
      toast({ title: "Buchung erstellt" });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Buchung konnte nicht erstellt werden.",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setNewBuchung({
      typ: "ausgabe",
      datum: new Date().toISOString().split("T")[0],
      kategorie: "",
      betragNetto: 0,
      mwstProzent: 19,
      betragBrutto: 0,
      beschreibung: "",
    });
    setSelectedObjekt("");
    setSelectedWohnung("");
    setSelectedMieter("");
  };

  const handleDeleteBuchung = async (id: string) => {
    if (confirm("Möchten Sie diese Buchung löschen?")) {
      try {
        await deleteBuchung(id);
        toast({ title: "Buchung gelöscht" });
      } catch (error) {
        toast({
          title: "Fehler",
          description: "Buchung konnte nicht gelöscht werden.",
          variant: "destructive",
        });
      }
    }
  };

  const getTypBadge = (typ: "einnahme" | "ausgabe") => {
    return typ === "einnahme"
      ? <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Einnahme</span>
      : <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Ausgabe</span>;
  };

  const FilterSidebar = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">
          Filter {activeFilterCount > 0 && `(${activeFilterCount})`}
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setFilter({
            typ: "alle",
            kategorien: [],
            objektId: "",
            vonDatum: "",
            bisDatum: "",
            vonBetrag: null,
            bisBetrag: null,
          })}
          disabled={activeFilterCount === 0}
        >
          <X className="h-4 w-4 mr-1" />
          Zurücksetzen
        </Button>
      </div>

      <Separator />

      {/* Type Filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Typ</Label>
        <div className="space-y-2">
          {(["alle", "einnahme", "ausgabe"] as const).map((t) => (
            <div key={t} className="flex items-center space-x-2">
              <Checkbox
                id={`typ-${t}`}
                checked={filter.typ === t}
                onCheckedChange={() =>
                  setFilter((prev) => ({
                    ...prev,
                    typ: t,
                  }))
                }
              />
              <label htmlFor={`typ-${t}`} className="text-sm cursor-pointer capitalize">
                {t === "alle" ? "Alle" : t === "einnahme" ? "Einnahmen" : "Ausgaben"}
              </label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Category Filter */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Kategorie</Label>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {kategorienForTyp.map((cat) => (
            <div key={cat} className="flex items-center space-x-2">
              <Checkbox
                id={`cat-${cat}`}
                checked={filter.kategorien.includes(cat)}
                onCheckedChange={(checked) => {
                  setFilter((prev) => ({
                    ...prev,
                    kategorien: checked
                      ? [...prev.kategorien, cat]
                      : prev.kategorien.filter((c) => c !== cat),
                  }));
                }}
              />
              <label htmlFor={`cat-${cat}`} className="text-sm cursor-pointer">
                {cat}
              </label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Objekt Filter */}
      <div className="space-y-2">
        <Label htmlFor="objekt-filter" className="text-sm font-medium">Objekt</Label>
        <Select
          value={filter.objektId}
          onValueChange={(value) => setFilter((prev) => ({ ...prev, objektId: value }))}
        >
          <SelectTrigger id="objekt-filter" className="h-8">
            <SelectValue placeholder="Alle Objekte" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Alle Objekte</SelectItem>
            {objekte.map((obj) => (
              <SelectItem key={obj.id} value={obj.id}>
                {obj.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Date Range */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Zeitraum</Label>
        <div className="space-y-2">
          <Input
            type="date"
            value={filter.vonDatum}
            onChange={(e) => setFilter((prev) => ({ ...prev, vonDatum: e.target.value }))}
            className="h-8 text-sm"
            placeholder="Von"
          />
          <Input
            type="date"
            value={filter.bisDatum}
            onChange={(e) => setFilter((prev) => ({ ...prev, bisDatum: e.target.value }))}
            className="h-8 text-sm"
            placeholder="Bis"
          />
        </div>
      </div>

      <Separator />

      {/* Amount Range */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Betrag (€)</Label>
        <Input
          type="number"
          placeholder="Von"
          value={filter.vonBetrag ?? ""}
          onChange={(e) =>
            setFilter((prev) => ({
              ...prev,
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
            setFilter((prev) => ({
              ...prev,
              bisBetrag: e.target.value ? parseFloat(e.target.value) : null,
            }))
          }
          className="h-8 text-sm"
        />
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
      <div className="flex-1 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm sm:text-base text-muted-foreground">
            Verwalten Sie Ihre Einnahmen und Ausgaben.
          </p>
        </div>

        {/* Summary Bar */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Gesamteinnahmen</p>
                <p className="text-2xl font-bold text-green-600">{summary.einnahmen.toFixed(2)} €</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Gesamtausgaben</p>
                <p className="text-2xl font-bold text-red-600">{summary.ausgaben.toFixed(2)} €</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Überschuss</p>
                <p className={`text-2xl font-bold ${summary.ueberschuss >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {summary.ueberschuss.toFixed(2)} €
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Anzahl</p>
                <p className="text-2xl font-bold">{summary.count}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap gap-2">
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 bg-success hover:bg-success/90 text-success-foreground">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Neue Buchung</span>
                <span className="sm:hidden">Neu</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Neue Buchung erstellen</DialogTitle>
                <DialogDescription>Erstellen Sie eine neue Einnahme oder Ausgabe.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {/* ... Create form content would go here ... */}
                <div className="space-y-2">
                  <Label>Typ</Label>
                  <ToggleGroup
                    type="single"
                    value={newBuchung.typ || "ausgabe"}
                    onValueChange={(value) =>
                      setNewBuchung((prev) => ({
                        ...prev,
                        typ: value as "einnahme" | "ausgabe",
                        kategorie: "",
                      }))
                    }
                  >
                    <ToggleGroupItem value="einnahme">Einnahme</ToggleGroupItem>
                    <ToggleGroupItem value="ausgabe">Ausgabe</ToggleGroupItem>
                  </ToggleGroup>
                </div>

                <div className="space-y-2">
                  <Label>Kategorie</Label>
                  <Select
                    value={newBuchung.kategorie || ""}
                    onValueChange={(value) =>
                      setNewBuchung((prev) => ({ ...prev, kategorie: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kategorie wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {(newBuchung.typ === "einnahme" ? EINNAHMEN_KATEGORIEN : AUSGABEN_KATEGORIEN).map(
                        (cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="datum">Datum</Label>
                    <Input
                      id="datum"
                      type="date"
                      value={newBuchung.datum}
                      onChange={(e) =>
                        setNewBuchung((prev) => ({ ...prev, datum: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="betrag-netto">Betrag netto (€)</Label>
                    <Input
                      id="betrag-netto"
                      type="number"
                      step="0.01"
                      value={newBuchung.betragNetto || ""}
                      onChange={(e) => {
                        const netto = parseFloat(e.target.value) || 0;
                        const mwst = netto * ((newBuchung.mwstProzent || 0) / 100);
                        setNewBuchung((prev) => ({
                          ...prev,
                          betragNetto: netto,
                          betragBrutto: netto + mwst,
                        }));
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mwst">MwSt. (%)</Label>
                    <Select
                      value={(newBuchung.mwstProzent || 0).toString()}
                      onValueChange={(value) => {
                        const mwstProzent = parseInt(value);
                        const netto = newBuchung.betragNetto || 0;
                        const mwst = netto * (mwstProzent / 100);
                        setNewBuchung((prev) => ({
                          ...prev,
                          mwstProzent,
                          betragBrutto: netto + mwst,
                        }));
                      }}
                    >
                      <SelectTrigger id="mwst">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0%</SelectItem>
                        <SelectItem value="7">7%</SelectItem>
                        <SelectItem value="19">19%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="betrag-brutto">Betrag brutto (€)</Label>
                  <Input
                    id="betrag-brutto"
                    type="number"
                    readOnly
                    className="bg-muted"
                    value={(newBuchung.betragBrutto || 0).toFixed(2)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="beschreibung">Beschreibung</Label>
                  <Textarea
                    id="beschreibung"
                    value={newBuchung.beschreibung}
                    onChange={(e) =>
                      setNewBuchung((prev) => ({ ...prev, beschreibung: e.target.value }))
                    }
                    placeholder="Optionale Beschreibung"
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Abbrechen
                  </Button>
                  <Button
                    onClick={handleCreateBuchung}
                    className="bg-success hover:bg-success/90 text-success-foreground"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Speichern
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Buchungen ({summary.count})</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>Typ</TableHead>
                  <TableHead>Kategorie</TableHead>
                  <TableHead>Beschreibung</TableHead>
                  <TableHead className="text-right">Betrag</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBuchungen.map((buchung) => (
                  <TableRow key={buchung.id}>
                    <TableCell className="font-medium">
                      {new Date(buchung.datum).toLocaleDateString("de-DE")}
                    </TableCell>
                    <TableCell>{getTypBadge(buchung.typ)}</TableCell>
                    <TableCell>{buchung.kategorie}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {buchung.beschreibung}
                    </TableCell>
                    <TableCell className={`text-right font-medium ${buchung.typ === "einnahme" ? "text-green-600" : "text-red-600"}`}>
                      {buchung.typ === "einnahme" ? "+" : "-"}{buchung.betragBrutto.toFixed(2)} €
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDeleteBuchung(buchung.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
