"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Helper function to format dates from ISO (YYYY-MM-DD) to German format (DD.MM.YYYY)
const formatDateGerman = (dateString?: string | null) => {
  if (!dateString) return "-";
  const [year, month, day] = dateString.split("-");
  if (year && month && day) {
    return `${day}.${month}.${year}`;
  }
  return dateString;
};
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useAppData, type Zaehler, type Rauchmelder } from "@/context/app-data-context";



export function ZaehlerView() {
  const {
    wohnungen, selectedObjektId,
    zaehler: zaehlerData, rauchmelder: rauchmelderData,
    addZaehler, updateZaehler, deleteZaehler,
    addRauchmelder, updateRauchmelder, deleteRauchmelder,
  } = useAppData();
  const [showRauchmelder, setShowRauchmelder] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [modalType, setModalType] = useState<"zaehler" | "rauchmelder">(
    "zaehler"
  );
  const [editingZaehler, setEditingZaehler] = useState<Partial<Zaehler>>({});
  const [editingRauchmelder, setEditingRauchmelder] = useState<
    Partial<Rauchmelder>
  >({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    type: "zaehler" | "rauchmelder";
    id: string;
  } | null>(null);

  const openCreateModal = (type: "zaehler" | "rauchmelder") => {
    setModalType(type);
    setModalMode("create");
    if (type === "zaehler") {
      setEditingZaehler({
        wohnungNr: "",
        geschoss: "",
        montageort: "",
        geraeteart: "Kaltwasser",
        geraetnummer: "",
        geeichtBis: "",
        hersteller: "",
        typ: "",
      });
    } else {
      setEditingRauchmelder({
        wohnungNr: "",
        geschoss: "",
        montageort: "",
        geraeteart: "Rauchmelder",
        geraetnummer: "",
        lebensdauerBis: "",
        hersteller: "",
        typ: "",
      });
    }
    setModalOpen(true);
  };

  const openEditModal = (
    type: "zaehler" | "rauchmelder",
    item: Zaehler | Rauchmelder
  ) => {
    setModalType(type);
    setModalMode("edit");
    if (type === "zaehler") {
      setEditingZaehler(item as Zaehler);
    } else {
      setEditingRauchmelder(item as Rauchmelder);
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (modalType === "zaehler") {
      const payload = {
        wohnungId: editingZaehler.wohnungNr || "",
        wohnungNr: editingZaehler.wohnungNr || "",
        geschoss: editingZaehler.geschoss || "",
        montageort: editingZaehler.montageort || "",
        geraeteart: editingZaehler.geraeteart || "Kaltwasser",
        geraetnummer: editingZaehler.geraetnummer || "",
        geeichtBis: editingZaehler.geeichtBis || "",
        hersteller: editingZaehler.hersteller,
        typ: editingZaehler.typ,
      };
      if (modalMode === "create") {
        await addZaehler(payload);
      } else if (editingZaehler.id) {
        await updateZaehler(editingZaehler.id, payload);
      }
    } else {
      const payload = {
        wohnungId: editingRauchmelder.wohnungNr || "",
        wohnungNr: editingRauchmelder.wohnungNr || "",
        geschoss: editingRauchmelder.geschoss || "",
        montageort: editingRauchmelder.montageort || "",
        geraeteart: editingRauchmelder.geraeteart || "Rauchmelder",
        geraetnummer: editingRauchmelder.geraetnummer || "",
        lebensdauerBis: editingRauchmelder.lebensdauerBis || "",
        hersteller: editingRauchmelder.hersteller,
        typ: editingRauchmelder.typ,
      };
      if (modalMode === "create") {
        await addRauchmelder(payload);
      } else if (editingRauchmelder.id) {
        await updateRauchmelder(editingRauchmelder.id, payload);
      }
    }
    setModalOpen(false);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === "zaehler") {
      await deleteZaehler(itemToDelete.id);
    } else {
      await deleteRauchmelder(itemToDelete.id);
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const confirmDelete = (type: "zaehler" | "rauchmelder", id: string) => {
    setItemToDelete({ type, id });
    setDeleteDialogOpen(true);
  };

  // Wohnung options from current object
  const wohnungOptions = wohnungen
    .filter((w) => !selectedObjektId || w.objektId === selectedObjektId)
    .map((w) => ({
      value: w.id,
      label: `${w.bezeichnung} - ${w.etage} (${w.flaeche} m²)`,
    }));

  const wohnungLabel = (id: string) =>
    wohnungOptions.find((o) => o.value === id)?.label.split(" - ")[0] ?? id;

  const geschossFromWohnung = (wohnungNr: string) => {
    const option = wohnungOptions.find((o) => o.value === wohnungNr);
    if (option) {
      return option.label.split(" - ")[1] || "";
    }
    return "";
  };

  // Filter zaehler and rauchmelder by selected object
  const filteredZaehler = zaehlerData.filter((z) => {
    if (!selectedObjektId) return true;
    const wohnung = wohnungen.find((w) => w.id === z.wohnungId);
    return wohnung?.objektId === selectedObjektId;
  });

  const filteredRauchmelder = rauchmelderData.filter((r) => {
    if (!selectedObjektId) return true;
    const wohnung = wohnungen.find((w) => w.id === r.wohnungId);
    return wohnung?.objektId === selectedObjektId;
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm sm:text-base text-muted-foreground">
          Verwalten Sie alle Zähler und Rauchmelder Ihrer Objekte.
        </p>
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs sm:text-sm ${
                !showRauchmelder ? "font-medium" : "text-muted-foreground"
              }`}
            >
              Wasser/Wärme
            </span>
            <Switch
              checked={showRauchmelder}
              onCheckedChange={setShowRauchmelder}
            />
            <span
              className={`text-xs sm:text-sm ${
                showRauchmelder ? "font-medium" : "text-muted-foreground"
              }`}
            >
              Rauchmelder
            </span>
          </div>
        </div>
      </div>

      {!showRauchmelder ? (
        /* Wasser/Wärme Zähler Table */
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base sm:text-lg">
              Zähler
            </CardTitle>
            <Button
              size="sm"
              className="gap-2 w-fit"
              onClick={() => openCreateModal("zaehler")}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Neuen Zähler hinzufügen</span>
              <span className="sm:hidden">Neu</span>
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table className="min-w-[700px] table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead style={{ width: "15%" }}>Wohnung</TableHead>
                  <TableHead style={{ width: "20%" }}>Montageort</TableHead>
                  <TableHead style={{ width: "20%" }}>Geräteart</TableHead>
                  <TableHead className="hidden md:table-cell" style={{ width: "20%" }}>
                    Gerätenummer
                  </TableHead>
                  <TableHead style={{ width: "15%" }}>Gültig bis</TableHead>
                  <TableHead style={{ width: "10%" }} className="w-[80px]">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredZaehler.map((zaehler) => {
                  const wohnung = wohnungen.find((w) => w.id === zaehler.wohnungId);
                  return (
                  <TableRow key={zaehler.id}>
                    <TableCell className="text-sm">{wohnung?.bezeichnung || wohnungLabel(zaehler.wohnungId)}</TableCell>
                    <TableCell>{zaehler.montageort}</TableCell>
                    <TableCell>{zaehler.geraeteart}</TableCell>
                    <TableCell className="hidden md:table-cell font-mono text-sm">
                      {zaehler.geraetnummer}
                    </TableCell>
                    <TableCell>{formatDateGerman(zaehler.geeichtBis)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditModal("zaehler", zaehler)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => confirmDelete("zaehler", zaehler.id)}
                        >
                          <Trash2 className="h-3 w-3" />
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
      ) : (
        /* Rauchmelder Table */
        <Card>
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base sm:text-lg">Rauchmelder</CardTitle>
            <Button
              size="sm"
              className="gap-2 w-fit"
              onClick={() => openCreateModal("rauchmelder")}
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">
                Neuen Rauchmelder hinzufügen
              </span>
              <span className="sm:hidden">Neu</span>
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table className="min-w-[700px] table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead style={{ width: "15%" }}>Wohnung</TableHead>
                  <TableHead style={{ width: "20%" }}>Montageort</TableHead>
                  <TableHead style={{ width: "20%" }}>Geräteart</TableHead>
                  <TableHead className="hidden md:table-cell" style={{ width: "20%" }}>
                    Gerätenummer
                  </TableHead>
                  <TableHead style={{ width: "15%" }}>Gültig bis</TableHead>
                  <TableHead style={{ width: "10%" }} className="w-[80px]">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRauchmelder.map((rm) => {
                  const wohnung = wohnungen.find((w) => w.id === rm.wohnungId);
                  return (
                  <TableRow key={rm.id}>
                    <TableCell className="text-sm">{wohnung?.bezeichnung || wohnungLabel(rm.wohnungId)}</TableCell>
                    <TableCell>{rm.montageort}</TableCell>
                    <TableCell>{rm.geraeteart}</TableCell>
                    <TableCell className="hidden md:table-cell font-mono text-sm">
                      {rm.geraetnummer}
                    </TableCell>
                    <TableCell>{formatDateGerman(rm.lebensdauerBis)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditModal("rauchmelder", rm)}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => confirmDelete("rauchmelder", rm.id)}
                        >
                          <Trash2 className="h-3 w-3" />
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
      )}

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {modalMode === "create"
                ? modalType === "zaehler"
                  ? "Neuen Zähler anlegen"
                  : "Neuen Rauchmelder anlegen"
                : modalType === "zaehler"
                ? "Zähler bearbeiten"
                : "Rauchmelder bearbeiten"}
            </DialogTitle>
            <DialogDescription>
              {modalType === "zaehler"
                ? "Erfassen Sie die Daten für einen Wasser- oder Wärmezähler."
                : "Erfassen Sie die Daten für einen Rauchmelder."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <div className="space-y-2">
              <Label htmlFor="modal-wohnung">Wohnung</Label>
              <Select
                value={
                  modalType === "zaehler"
                    ? editingZaehler.wohnungNr
                    : editingRauchmelder.wohnungNr
                }
                onValueChange={(value) => {
                  const geschoss = geschossFromWohnung(value);
                  if (modalType === "zaehler") {
                    setEditingZaehler((prev) => ({
                      ...prev,
                      wohnungNr: value,
                      geschoss,
                    }));
                  } else {
                    setEditingRauchmelder((prev) => ({
                      ...prev,
                      wohnungNr: value,
                      geschoss,
                    }));
                  }
                }}
              >
                <SelectTrigger id="modal-wohnung">
                  <SelectValue placeholder="Wohnung auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {wohnungOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="modal-montageort">Montageort</Label>
                <Input
                  id="modal-montageort"
                  placeholder="z.B. Küche, Bad, Flur"
                  value={
                    modalType === "zaehler"
                      ? editingZaehler.montageort
                      : editingRauchmelder.montageort
                  }
                  onChange={(e) => {
                    if (modalType === "zaehler") {
                      setEditingZaehler((prev) => ({
                        ...prev,
                        montageort: e.target.value,
                      }));
                    } else {
                      setEditingRauchmelder((prev) => ({
                        ...prev,
                        montageort: e.target.value,
                      }));
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modal-nummer">Gerätenummer</Label>
                <Input
                  id="modal-nummer"
                  placeholder="z.B. KW-2024-001"
                  value={
                    modalType === "zaehler"
                      ? editingZaehler.geraetnummer
                      : editingRauchmelder.geraetnummer
                  }
                  onChange={(e) => {
                    if (modalType === "zaehler") {
                      setEditingZaehler((prev) => ({
                        ...prev,
                        geraetnummer: e.target.value,
                      }));
                    } else {
                      setEditingRauchmelder((prev) => ({
                        ...prev,
                        geraetnummer: e.target.value,
                      }));
                    }
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="modal-art">Geräteart</Label>
              <Select
                value={
                  modalType === "zaehler"
                    ? editingZaehler.geraeteart
                    : editingRauchmelder.geraeteart
                }
                onValueChange={(value) => {
                  if (modalType === "zaehler") {
                    setEditingZaehler((prev) => ({
                      ...prev,
                      geraeteart: value,
                    }));
                  } else {
                    setEditingRauchmelder((prev) => ({
                      ...prev,
                      geraeteart: value,
                    }));
                  }
                }}
              >
                <SelectTrigger id="modal-art">
                  <SelectValue placeholder="Art auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {modalType === "zaehler" ? (
                    <>
                      <SelectItem value="Kaltwasser">Kaltwasser</SelectItem>
                      <SelectItem value="Warmwasser">Warmwasser</SelectItem>
                      <SelectItem value="Wärmemenge">Wärmemenge</SelectItem>
                      <SelectItem value="Akku">Akku</SelectItem>
                    </>
                  ) : (
                    <SelectItem value="Rauchmelder">Rauchmelder</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="modal-hersteller">Hersteller</Label>
                <Input
                  id="modal-hersteller"
                  placeholder="z.B. Techem, Ista"
                  value={
                    modalType === "zaehler"
                      ? editingZaehler.hersteller
                      : editingRauchmelder.hersteller
                  }
                  onChange={(e) => {
                    if (modalType === "zaehler") {
                      setEditingZaehler((prev) => ({
                        ...prev,
                        hersteller: e.target.value,
                      }));
                    } else {
                      setEditingRauchmelder((prev) => ({
                        ...prev,
                        hersteller: e.target.value,
                      }));
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="modal-typ">Typenbezeichnung</Label>
                <Input
                  id="modal-typ"
                  placeholder="z.B. Q water 5.5"
                  value={
                    modalType === "zaehler"
                      ? editingZaehler.typ
                      : editingRauchmelder.typ
                  }
                  onChange={(e) => {
                    if (modalType === "zaehler") {
                      setEditingZaehler((prev) => ({
                        ...prev,
                        typ: e.target.value,
                      }));
                    } else {
                      setEditingRauchmelder((prev) => ({
                        ...prev,
                        typ: e.target.value,
                      }));
                    }
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="modal-ablauf">
                {modalType === "zaehler"
                  ? "Geeicht bis"
                  : "Lebensdauer (bis Jahr)"}
              </Label>
              <Input
                id="modal-ablauf"
                placeholder="z.B. 12/2030"
                value={
                  modalType === "zaehler"
                    ? editingZaehler.geeichtBis
                    : editingRauchmelder.lebensdauerBis
                }
                onChange={(e) => {
                  if (modalType === "zaehler") {
                    setEditingZaehler((prev) => ({
                      ...prev,
                      geeichtBis: e.target.value,
                    }));
                  } else {
                    setEditingRauchmelder((prev) => ({
                      ...prev,
                      lebensdauerBis: e.target.value,
                    }));
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Abbrechen
            </Button>
            <Button
              className="bg-success hover:bg-success/90 text-success-foreground"
              onClick={handleSave}
            >
              {modalMode === "create" ? "Anlegen" : "Speichern"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sind Sie sicher?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Der Eintrag
              wird dauerhaft gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
