"use client";

import { useState, useMemo } from "react";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Trash2,
  Building2,
  Receipt,
  CalendarRange,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppData } from "@/context/app-data-context";
import { useAuth } from "@/context/auth-context";
import type { Verteilerschluessel, Expense } from "@/context/app-data-context";

// ============================================================
// Konfiguration
// ============================================================

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
  "Wasserkosten",
];

export const VERTEILERSCHLUESSEL_OPTIONEN: {
  value: Verteilerschluessel;
  label: string;
  beschreibung: string;
}[] = [
  {
    value: "wohnflaeche",
    label: "Wohnfläche (m²)",
    beschreibung: "Proportional zur Wohnfläche der Einheit",
  },
  {
    value: "nutzflaeche",
    label: "Nutzfläche (m²)",
    beschreibung: "Proportional zur Nutzfläche (Wohnfläche + 10 %)",
  },
  {
    value: "einheiten",
    label: "Anzahl Einheiten",
    beschreibung: "Gleichmäßig auf alle Wohneinheiten",
  },
  {
    value: "personen",
    label: "Personenanzahl",
    beschreibung: "Gleichmäßig auf alle belegten Einheiten (V1)",
  },
  {
    value: "verbrauch",
    label: "Verbrauch (Zähler)",
    beschreibung: "Nach Zählerablesungen; im Abrechnungsgenerator verfeinern",
  },
  {
    value: "mea",
    label: "MEA / Miteigentumsanteile",
    beschreibung: "Nach Prozentanteilen aus den Mieterdaten",
  },
  {
    value: "direkt",
    label: "Direktzuordnung",
    beschreibung: "Betrag wird direkt einer einzelnen Einheit zugewiesen",
  },
];

// ============================================================
// Blank-Form
// ============================================================

const BLANK_FORM: Omit<Expense, "id" | "userId" | "createdAt" | "updatedAt"> = {
  objektId: "",
  kostenart: "",
  betrag: 0,
  zeitraumVon: `${new Date().getFullYear()}-01-01`,
  zeitraumBis: `${new Date().getFullYear()}-12-31`,
  verteilerschluessel: "wohnflaeche",
  notiz: "",
};

// ============================================================
// Component
// ============================================================

export function KostenErfassenView() {
  const {
    objekte,
    selectedObjektId,
    expenses,
    addExpense,
    deleteExpense,
  } = useAppData();
  const { isDemo } = useAuth();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [customKostenart, setCustomKostenart] = useState("");
  const [form, setForm] = useState<Omit<Expense, "id" | "userId" | "createdAt" | "updatedAt">>({
    ...BLANK_FORM,
    objektId: selectedObjektId ?? "",
  });

  // Expenses für das aktuell gewählte Objekt
  const currentExpenses = useMemo(() => {
    if (!selectedObjektId) return [];
    return expenses
      .filter((e) => e.objektId === selectedObjektId)
      .sort(
        (a, b) =>
          new Date(b.zeitraumVon).getTime() - new Date(a.zeitraumVon).getTime(),
      );
  }, [expenses, selectedObjektId]);

  const totalBetrag = useMemo(
    () => currentExpenses.reduce((s, e) => s + e.betrag, 0),
    [currentExpenses],
  );

  const currentObjekt = useMemo(
    () => objekte.find((o) => o.id === selectedObjektId),
    [objekte, selectedObjektId],
  );

  // ---- Handlers ------------------------------------------------

  const openDialog = () => {
    setForm({ ...BLANK_FORM, objektId: selectedObjektId ?? "" });
    setCustomKostenart("");
    setIsDialogOpen(true);
  };

  const handleFieldChange = (
    field: keyof Omit<Expense, "id">,
    value: string | number | Verteilerschluessel,
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resolvedKostenart =
    form.kostenart === "__custom__" ? customKostenart : form.kostenart;

  const handleSave = async () => {
    if (!form.objektId) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie ein Objekt aus.",
        variant: "destructive",
      });
      return;
    }
    if (!resolvedKostenart) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie eine Kostenart an.",
        variant: "destructive",
      });
      return;
    }
    if (form.betrag <= 0) {
      toast({
        title: "Fehler",
        description: "Der Betrag muss größer als 0 sein.",
        variant: "destructive",
      });
      return;
    }
    if (isDemo) {
      toast({
        title: "Demo-Modus",
        description:
          "Im Demo-Modus können keine Kosten gespeichert werden. Bitte melden Sie sich an.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await addExpense({ ...form, kostenart: resolvedKostenart });
      setIsDialogOpen(false);
      toast({ title: "Kosten gespeichert", description: `${resolvedKostenart} wurde erfolgreich erfasst.` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
      toast({
        title: "Fehler",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (expense: Expense) => {
    try {
      await deleteExpense(expense.id);
      toast({ title: "Gelöscht", description: `${expense.kostenart} wurde entfernt.` });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unbekannter Fehler";
      toast({
        title: "Fehler",
        description: msg,
        variant: "destructive",
      });
    }
  };

  const schluesselLabel = (v: Verteilerschluessel) =>
    VERTEILERSCHLUESSEL_OPTIONEN.find((o) => o.value === v)?.label ?? v;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const formatEuro = (n: number) =>
    n.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // ---- Render --------------------------------------------------

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Title row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Erfassen Sie objektbezogene Betriebskosten. Die Verteilung auf die
            Einheiten erfolgt automatisch beim Erstellen der Abrechnung.
          </p>
        </div>
        <Button
          size="sm"
          className="gap-2 bg-success hover:bg-success/90 text-success-foreground shrink-0"
          onClick={openDialog}
          disabled={!selectedObjektId}
        >
          <Plus className="h-4 w-4" />
          Kosten erfassen
        </Button>
      </div>

      {currentObjekt && (
        <div className="flex gap-4 text-sm text-muted-foreground px-1">
          <span>
            <strong className="text-foreground">{currentExpenses.length}</strong>{" "}
            Kostenpositionen
          </span>
          <span>
            Gesamt:{" "}
            <strong className="text-foreground">{formatEuro(totalBetrag)} €</strong>
          </span>
        </div>
      )}

      {/* Tabelle */}
      {!selectedObjektId ? (
        <Card className="p-8 text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-1">Kein Objekt ausgewählt</h2>
          <p className="text-muted-foreground">
            Wählen Sie oben in der Kopfzeile ein Objekt aus, um die Kosten anzuzeigen.
          </p>
        </Card>
      ) : currentExpenses.length === 0 ? (
        <Card className="p-8 text-center">
          <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-1">Noch keine Kosten erfasst</h2>
          <p className="text-muted-foreground mb-4">
            Für dieses Objekt wurden noch keine Betriebskosten eingetragen.
          </p>
          <Button
            className="gap-2 bg-success hover:bg-success/90 text-success-foreground"
            onClick={openDialog}
          >
            <Plus className="h-4 w-4" />
            Erste Kosten erfassen
          </Button>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Kostenübersicht</CardTitle>
            <CardDescription>
              Alle erfassten Betriebskosten für{" "}
              <span className="font-medium text-foreground">
                {currentObjekt?.name}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Kostenart</TableHead>
                  <TableHead className="w-[130px] text-right">Betrag (€)</TableHead>
                  <TableHead className="w-[180px]">Zeitraum</TableHead>
                  <TableHead className="w-[170px]">Verteilerschlüssel</TableHead>
                  <TableHead>Notiz</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">
                      {expense.kostenart}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatEuro(expense.betrag)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <CalendarRange className="h-3.5 w-3.5 shrink-0" />
                        {formatDate(expense.zeitraumVon)} –{" "}
                        {formatDate(expense.zeitraumBis)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {schluesselLabel(expense.verteilerschluessel)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[180px] truncate">
                      {expense.notiz ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(expense)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ---- Dialog: Neue Kosten erfassen ---- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle>Kosten erfassen</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Objekt */}
            <div className="space-y-2">
              <Label>Objekt</Label>
              <Select
                value={form.objektId}
                onValueChange={(v) => handleFieldChange("objektId", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Objekt auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {objekte.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name} – {o.adresse}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Kostenart */}
            <div className="space-y-2">
              <Label>Kostenart</Label>
              <Select
                value={form.kostenart || "__custom__"}
                onValueChange={(v) => {
                  handleFieldChange("kostenart", v === "__custom__" ? "__custom__" : v);
                  if (v !== "__custom__") setCustomKostenart("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kostenart wählen" />
                </SelectTrigger>
                <SelectContent>
                  {KOSTENARTEN_OPTIONEN.map((k) => (
                    <SelectItem key={k} value={k}>
                      {k}
                    </SelectItem>
                  ))}
                  <SelectItem value="__custom__">Eigene eingeben…</SelectItem>
                </SelectContent>
              </Select>
              {(form.kostenart === "__custom__" ||
                (!KOSTENARTEN_OPTIONEN.includes(form.kostenart) && form.kostenart !== "")) && (
                <Input
                  value={customKostenart}
                  onChange={(e) => setCustomKostenart(e.target.value)}
                  placeholder="Eigene Kostenart"
                />
              )}
            </div>

            {/* Betrag */}
            <div className="space-y-2">
              <Label>Gesamtbetrag (€)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={form.betrag || ""}
                onChange={(e) =>
                  handleFieldChange("betrag", parseFloat(e.target.value) || 0)
                }
                placeholder="z.B. 1250.00"
              />
            </div>

            {/* Zeitraum */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Zeitraum von</Label>
                <Input
                  type="date"
                  value={form.zeitraumVon}
                  onChange={(e) =>
                    handleFieldChange("zeitraumVon", e.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Zeitraum bis</Label>
                <Input
                  type="date"
                  value={form.zeitraumBis}
                  onChange={(e) =>
                    handleFieldChange("zeitraumBis", e.target.value)
                  }
                />
              </div>
            </div>

            {/* Verteilerschlüssel */}
            <div className="space-y-2">
              <Label>Verteilerschlüssel</Label>
              <Select
                value={form.verteilerschluessel}
                onValueChange={(v) =>
                  handleFieldChange(
                    "verteilerschluessel",
                    v as Verteilerschluessel,
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VERTEILERSCHLUESSEL_OPTIONEN.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      <div className="flex flex-col">
                        <span>{o.label}</span>
                        <span className="text-xs text-muted-foreground">
                          {o.beschreibung}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notiz */}
            <div className="space-y-2">
              <Label>Notiz (optional)</Label>
              <Textarea
                rows={2}
                value={form.notiz ?? ""}
                onChange={(e) => handleFieldChange("notiz", e.target.value)}
                placeholder="z.B. Rechnungsnummer, Lieferant…"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button
              className="bg-success hover:bg-success/90 text-success-foreground"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Wird gespeichert…" : "Speichern"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
