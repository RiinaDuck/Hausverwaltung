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
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Pencil, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppData, type Expense, type Verteilerschluessel } from "@/context/app-data-context";
import { VERTEILERSCHLUESSEL_LABELS, formatEuro } from "@/lib/nebenkosten-berechnung";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const KOSTENARTEN_OPTIONEN = [
  "Allgemeinstrom / Beleuchtung",
  "Aufzug",
  "Elementarschadenversicherung",
  "Feuerlöscher / Brandmelder",
  "Fußwegreinigung",
  "Gartenpflege",
  "Gebäudereinigung",
  "Gebäudeversicherung",
  "Gemeinschaftsantenne / Kabel-TV",
  "Glasbruchversicherung",
  "Grundsteuer",
  "Haftpflichtversicherung",
  "Hausreinigung",
  "Hauswart / Hausmeister",
  "Müllabfuhr",
  "Niederschlagswasser",
  "Schmutzwasser",
  "Schornsteinreinigung",
  "Straßenreinigung",
  "Wartung Heizung",
  "Wasser (Grundpreis)",
  "Wasser (Verbrauch)",
];

const SCHLUESSEL_OPTIONS: { value: Verteilerschluessel; label: string }[] =
  Object.entries(VERTEILERSCHLUESSEL_LABELS).map(([value, label]) => ({
    value: value as Verteilerschluessel,
    label,
  }));

const EMPTY_FORM = {
  kostenart: "",
  kostenartCustom: "",
  betrag: "",
  zeitraumVon: new Date().getFullYear() + "-01-01",
  zeitraumBis: new Date().getFullYear() + "-12-31",
  verteilerschluessel: "wohnflaeche" as Verteilerschluessel,
  notiz: "",
};

export function NebenkostenView() {
  const { objekte, expenses, selectedObjektId, addExpense, updateExpense, deleteExpense } =
    useAppData();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [filterVon, setFilterVon] = useState("");
  const [filterBis, setFilterBis] = useState("");

  const currentObjekt = useMemo(
    () => objekte.find((o) => o.id === selectedObjektId),
    [objekte, selectedObjektId],
  );

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((e) => e.objektId === selectedObjektId)
      .filter((e) => {
        if (filterVon && e.zeitraumBis < filterVon) return false;
        if (filterBis && e.zeitraumVon > filterBis) return false;
        return true;
      })
      .sort((a, b) => b.zeitraumVon.localeCompare(a.zeitraumVon));
  }, [expenses, selectedObjektId, filterVon, filterBis]);

  const gesamtbetrag = useMemo(
    () => filteredExpenses.reduce((s, e) => s + e.betrag, 0),
    [filteredExpenses],
  );

  function openAdd() {
    setForm({ ...EMPTY_FORM });
    setEditingId(null);
    setDialogOpen(true);
  }

  function openEdit(expense: Expense) {
    const isCustom = !KOSTENARTEN_OPTIONEN.includes(expense.kostenart);
    setForm({
      kostenart: isCustom ? "custom" : expense.kostenart,
      kostenartCustom: isCustom ? expense.kostenart : "",
      betrag: expense.betrag.toString(),
      zeitraumVon: expense.zeitraumVon,
      zeitraumBis: expense.zeitraumBis,
      verteilerschluessel: expense.verteilerschluessel,
      notiz: expense.notiz ?? "",
    });
    setEditingId(expense.id);
    setDialogOpen(true);
  }

  async function handleSave() {
    const kostenart =
      form.kostenart === "custom" ? form.kostenartCustom.trim() : form.kostenart;
    if (!kostenart) {
      toast({ title: "Pflichtfeld", description: "Bitte Kostenart angeben.", variant: "destructive" });
      return;
    }
    const betrag = parseFloat(form.betrag.replace(",", "."));
    if (isNaN(betrag) || betrag < 0) {
      toast({ title: "Ungültiger Betrag", description: "Bitte einen gültigen Betrag eingeben.", variant: "destructive" });
      return;
    }
    if (!selectedObjektId) return;

    setSaving(true);
    try {
      const payload = {
        objektId: selectedObjektId,
        kostenart,
        betrag,
        zeitraumVon: form.zeitraumVon,
        zeitraumBis: form.zeitraumBis,
        verteilerschluessel: form.verteilerschluessel,
        notiz: form.notiz || null,
        rechnungId: null,
      };
      if (editingId) {
        await updateExpense(editingId, payload);
        toast({ title: "Aktualisiert", description: `${kostenart} wurde gespeichert.` });
      } else {
        await addExpense(payload);
        toast({ title: "Hinzugefügt", description: `${kostenart} wurde erfasst.` });
      }
      setDialogOpen(false);
    } catch {
      toast({ title: "Fehler", description: "Speichern fehlgeschlagen.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteExpense(id);
      toast({ title: "Gelöscht", description: "Kostenposition wurde entfernt." });
    } catch {
      toast({ title: "Fehler", description: "Löschen fehlgeschlagen.", variant: "destructive" });
    }
    setDeleteId(null);
  }

  if (!selectedObjektId) {
    return (
      <div className="flex flex-col items-center justify-center h-60 gap-3 text-muted-foreground">
        <Building2 className="h-10 w-10 opacity-30" />
        <p>Bitte zuerst ein Objekt auswaehlen.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Betriebskosten fuer{" "}
            <span className="font-medium text-foreground">
              {currentObjekt?.name}
            </span>{" "}
            erfassen &mdash; werden automatisch auf die Einheiten verteilt.
          </p>
        </div>
        <Button
          size="sm"
          className="gap-2"
          onClick={openAdd}
        >
          <Plus className="h-4 w-4" />
          Kostenposition erfassen
        </Button>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="space-y-1 flex-1">
              <Label className="text-xs">Zeitraum von</Label>
              <Input type="date" value={filterVon} onChange={(e) => setFilterVon(e.target.value)} />
            </div>
            <div className="space-y-1 flex-1">
              <Label className="text-xs">Zeitraum bis</Label>
              <Input type="date" value={filterBis} onChange={(e) => setFilterBis(e.target.value)} />
            </div>
            {(filterVon || filterBis) && (
              <Button variant="ghost" size="sm" onClick={() => { setFilterVon(""); setFilterBis(""); }}>
                Filter zuruecksetzen
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabelle */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Betriebskosten ({filteredExpenses.length} Positionen)
            </CardTitle>
            <span className="text-sm font-semibold text-foreground">
              Gesamt: {formatEuro(gesamtbetrag)}
            </span>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {filteredExpenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
              <p className="text-sm">Noch keine Kostenpositionen erfasst.</p>
              <Button variant="outline" size="sm" onClick={openAdd} className="gap-1 mt-1">
                <Plus className="h-3 w-3" /> Erste Position erfassen
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kostenart</TableHead>
                  <TableHead>Zeitraum</TableHead>
                  <TableHead>Verteilerschluessel</TableHead>
                  <TableHead className="text-right">Betrag</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((exp) => (
                  <TableRow key={exp.id}>
                    <TableCell>
                      <div className="font-medium text-sm">{exp.kostenart}</div>
                      {exp.notiz && (
                        <div className="text-xs text-muted-foreground mt-0.5 max-w-xs truncate">
                          {exp.notiz}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm whitespace-nowrap">
                      {exp.zeitraumVon} &ndash; {exp.zeitraumBis}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs font-normal">
                        {VERTEILERSCHLUESSEL_LABELS[exp.verteilerschluessel]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatEuro(exp.betrag)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7"
                          onClick={() => openEdit(exp)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                          onClick={() => setDeleteId(exp.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Erfassen/Bearbeiten Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Kostenposition bearbeiten" : "Kostenposition erfassen"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Kostenart *</Label>
              <Select
                value={form.kostenart}
                onValueChange={(v) => setForm((f) => ({ ...f, kostenart: v, kostenartCustom: "" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kostenart waehlen" />
                </SelectTrigger>
                <SelectContent>
                  {KOSTENARTEN_OPTIONEN.map((opt) => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                  <SelectItem value="custom">Eigene eingeben&hellip;</SelectItem>
                </SelectContent>
              </Select>
              {form.kostenart === "custom" && (
                <Input
                  placeholder="Eigene Kostenart"
                  value={form.kostenartCustom}
                  onChange={(e) => setForm((f) => ({ ...f, kostenartCustom: e.target.value }))}
                />
              )}
            </div>

            <div className="space-y-2">
              <Label>Gesamtbetrag (EUR) *</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={form.betrag}
                onChange={(e) => setForm((f) => ({ ...f, betrag: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Zeitraum von *</Label>
                <Input
                  type="date"
                  value={form.zeitraumVon}
                  onChange={(e) => setForm((f) => ({ ...f, zeitraumVon: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Zeitraum bis *</Label>
                <Input
                  type="date"
                  value={form.zeitraumBis}
                  onChange={(e) => setForm((f) => ({ ...f, zeitraumBis: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Verteilerschluessel *</Label>
              <Select
                value={form.verteilerschluessel}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, verteilerschluessel: v as Verteilerschluessel }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SCHLUESSEL_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Bestimmt, wie der Betrag auf die Einheiten verteilt wird.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Notiz / Belegverweis (optional)</Label>
              <Textarea
                rows={2}
                placeholder="z.B. Rechnung Nr. 2025-042 vom 15.01.2025"
                value={form.notiz}
                onChange={(e) => setForm((f) => ({ ...f, notiz: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Abbrechen
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Speichern..." : "Speichern"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => { if (!open) setDeleteId(null); }}
        title="Kostenposition loeschen?"
        description="Diese Aktion kann nicht rueckgaengig gemacht werden."
        onConfirm={() => deleteId && handleDelete(deleteId)}
      />
    </div>
  );
}
