"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Save, Plus, Trash2, FileDown, Eye, Pencil } from "lucide-react";
import { generateRechnungPDF, downloadPDF } from "@/lib/pdf-generator";

interface RechnungsPosition {
  id: string;
  beschreibung: string;
  menge: number;
  einzelpreis: number;
}

interface Rechnung {
  id: string;
  nummer: string;
  datum: string;
  empfaengerName: string;
  empfaengerAdresse: string;
  positionen: RechnungsPosition[];
  bemerkung: string;
  status: "offen" | "bezahlt" | "storniert";
}

const initialRechnungen: Rechnung[] = [
  {
    id: "1",
    nummer: "2024-001",
    datum: "2024-01-15",
    empfaengerName: "Familie Müller",
    empfaengerAdresse: "Berliner Straße 42\n10115 Berlin",
    positionen: [
      {
        id: "1",
        beschreibung: "Nebenkostennachzahlung 2023",
        menge: 1,
        einzelpreis: 245.5,
      },
      {
        id: "2",
        beschreibung: "Verwaltungsgebühr",
        menge: 1,
        einzelpreis: 25.0,
      },
    ],
    bemerkung: "Bitte innerhalb von 14 Tagen überweisen.",
    status: "bezahlt",
  },
  {
    id: "2",
    nummer: "2024-002",
    datum: "2024-02-20",
    empfaengerName: "Herr Schmidt",
    empfaengerAdresse: "Berliner Straße 42\n10115 Berlin",
    positionen: [
      { id: "1", beschreibung: "Schlüsselersatz", menge: 2, einzelpreis: 35.0 },
      {
        id: "2",
        beschreibung: "Verwaltungsgebühr",
        menge: 1,
        einzelpreis: 15.0,
      },
    ],
    bemerkung: "",
    status: "offen",
  },
  {
    id: "3",
    nummer: "2024-003",
    datum: "2024-03-10",
    empfaengerName: "Frau Weber",
    empfaengerAdresse: "Berliner Straße 42\n10115 Berlin",
    positionen: [
      {
        id: "1",
        beschreibung: "Reparaturkosten Wasserhahn",
        menge: 1,
        einzelpreis: 89.0,
      },
    ],
    bemerkung: "Reparatur erfolgte am 05.03.2024",
    status: "offen",
  },
];

export function RechnungenView() {
  const [rechnungen, setRechnungen] = useState<Rechnung[]>(initialRechnungen);
  const [selectedRechnung, setSelectedRechnung] = useState<Rechnung | null>(
    null
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingRechnung, setEditingRechnung] = useState<Rechnung | null>(null);
  const [newRechnung, setNewRechnung] = useState<Partial<Rechnung>>({
    nummer: `2024-${String(initialRechnungen.length + 1).padStart(3, "0")}`,
    datum: new Date().toISOString().split("T")[0],
    empfaengerName: "",
    empfaengerAdresse: "",
    positionen: [{ id: "1", beschreibung: "", menge: 1, einzelpreis: 0 }],
    bemerkung: "",
    status: "offen",
  });

  const calculatePositionTotal = (pos: RechnungsPosition) =>
    pos.menge * pos.einzelpreis;
  const calculateNetto = (positionen: RechnungsPosition[]) =>
    positionen.reduce((sum, p) => sum + calculatePositionTotal(p), 0);
  const calculateMwst = (netto: number) => netto * 0.19;
  const calculateBrutto = (netto: number) => netto * 1.19;

  const handleExportPDF = (rechnung: Rechnung) => {
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
    });
    downloadPDF(doc, `rechnung_${rechnung.nummer}`);
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
    value: string | number
  ) => {
    setNewRechnung((prev) => ({
      ...prev,
      positionen: prev.positionen?.map((p) =>
        p.id === id ? { ...p, [field]: value } : p
      ),
    }));
  };

  const removePosition = (id: string) => {
    setNewRechnung((prev) => ({
      ...prev,
      positionen: prev.positionen?.filter((p) => p.id !== id),
    }));
  };

  const handleCreateRechnung = () => {
    const rechnung: Rechnung = {
      id: String(rechnungen.length + 1),
      nummer: newRechnung.nummer || "",
      datum: newRechnung.datum || "",
      empfaengerName: newRechnung.empfaengerName || "",
      empfaengerAdresse: newRechnung.empfaengerAdresse || "",
      positionen: newRechnung.positionen || [],
      bemerkung: newRechnung.bemerkung || "",
      status: "offen",
    };
    setRechnungen((prev) => [...prev, rechnung]);
    setIsCreateOpen(false);
    // Reset form
    setNewRechnung({
      nummer: `2024-${String(rechnungen.length + 2).padStart(3, "0")}`,
      datum: new Date().toISOString().split("T")[0],
      empfaengerName: "",
      empfaengerAdresse: "",
      positionen: [{ id: "1", beschreibung: "", menge: 1, einzelpreis: 0 }],
      bemerkung: "",
      status: "offen",
    });
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

  const handleSaveEditRechnung = () => {
    if (!editingRechnung) return;
    setRechnungen((prev) =>
      prev.map((r) =>
        r.id === editingRechnung.id
          ? {
              ...r,
              nummer: newRechnung.nummer || "",
              datum: newRechnung.datum || "",
              empfaengerName: newRechnung.empfaengerName || "",
              empfaengerAdresse: newRechnung.empfaengerAdresse || "",
              positionen: newRechnung.positionen || [],
              bemerkung: newRechnung.bemerkung || "",
            }
          : r
      )
    );
    setIsEditOpen(false);
    setEditingRechnung(null);
    setNewRechnung({
      nummer: `2024-${String(rechnungen.length + 1).padStart(3, "0")}`,
      datum: new Date().toISOString().split("T")[0],
      empfaengerName: "",
      empfaengerAdresse: "",
      positionen: [{ id: "1", beschreibung: "", menge: 1, einzelpreis: 0 }],
      bemerkung: "",
      status: "offen",
    });
  };

  const handleDeleteRechnung = (id: string) => {
    if (confirm("Möchten Sie diese Rechnung wirklich löschen?")) {
      setRechnungen((prev) => prev.filter((r) => r.id !== id));
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
                            Number(e.target.value)
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
                            Number(e.target.value)
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
                          Number(e.target.value)
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
                                      rechnung.datum
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
