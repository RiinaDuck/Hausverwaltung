"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

interface Zaehler {
  id: string;
  wohnungNr: string;
  geschoss: string;
  montageort: string;
  geraeteart: string;
  geraetnummer: string;
  geeichtBis: string;
  hersteller?: string;
  typ?: string;
}

interface Rauchmelder {
  id: string;
  wohnungNr: string;
  geschoss: string;
  montageort: string;
  geraeteart: string;
  geraetnummer: string;
  lebensdauerBis: string;
  hersteller?: string;
  typ?: string;
}

const initialZaehlerData: Zaehler[] = [
  {
    id: "1",
    wohnungNr: "1",
    geschoss: "EG links",
    montageort: "Küche",
    geraeteart: "Kaltwasser",
    geraetnummer: "KW-2024-001",
    geeichtBis: "12/2030",
    hersteller: "Techem",
    typ: "Q water 5.5",
  },
  {
    id: "2",
    wohnungNr: "1",
    geschoss: "EG links",
    montageort: "Bad",
    geraeteart: "Warmwasser",
    geraetnummer: "WW-2024-001",
    geeichtBis: "12/2030",
    hersteller: "Techem",
    typ: "Q water 5.5",
  },
  {
    id: "3",
    wohnungNr: "2",
    geschoss: "EG rechts",
    montageort: "Küche",
    geraeteart: "Kaltwasser",
    geraetnummer: "KW-2024-002",
    geeichtBis: "12/2030",
    hersteller: "Ista",
    typ: "domaqua m",
  },
  {
    id: "4",
    wohnungNr: "2",
    geschoss: "EG rechts",
    montageort: "Flur",
    geraeteart: "Wärmemenge",
    geraetnummer: "WM-2024-002",
    geeichtBis: "06/2029",
    hersteller: "Techem",
    typ: "compact V",
  },
  {
    id: "5",
    wohnungNr: "3",
    geschoss: "1.OG links",
    montageort: "Bad",
    geraeteart: "Akku",
    geraetnummer: "AK-2024-003",
    geeichtBis: "12/2028",
    hersteller: "Minol",
    typ: "MUK",
  },
];

const initialRauchmelderData: Rauchmelder[] = [
  {
    id: "1",
    wohnungNr: "1",
    geschoss: "EG links",
    montageort: "Schlafzimmer",
    geraeteart: "Rauchmelder",
    geraetnummer: "RM-001-A",
    lebensdauerBis: "03/2034",
    hersteller: "Hekatron",
    typ: "Genius Plus X",
  },
  {
    id: "2",
    wohnungNr: "1",
    geschoss: "EG links",
    montageort: "Flur",
    geraeteart: "Rauchmelder",
    geraetnummer: "RM-001-B",
    lebensdauerBis: "03/2034",
    hersteller: "Hekatron",
    typ: "Genius Plus X",
  },
  {
    id: "3",
    wohnungNr: "2",
    geschoss: "EG rechts",
    montageort: "Schlafzimmer",
    geraeteart: "Rauchmelder",
    geraetnummer: "RM-002-A",
    lebensdauerBis: "06/2033",
    hersteller: "Ei Electronics",
    typ: "Ei650",
  },
  {
    id: "4",
    wohnungNr: "2",
    geschoss: "EG rechts",
    montageort: "Kinderzimmer",
    geraeteart: "Rauchmelder",
    geraetnummer: "RM-002-B",
    lebensdauerBis: "06/2033",
    hersteller: "Ei Electronics",
    typ: "Ei650",
  },
];

export function ZaehlerView() {
  const [showRauchmelder, setShowRauchmelder] = useState(false);
  const [zaehlerData, setZaehlerData] = useState<Zaehler[]>(initialZaehlerData);
  const [rauchmelderData, setRauchmelderData] = useState<Rauchmelder[]>(
    initialRauchmelderData
  );

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

  const handleSave = () => {
    if (modalType === "zaehler") {
      if (modalMode === "create") {
        const newId = String(
          Math.max(...zaehlerData.map((z) => Number.parseInt(z.id))) + 1
        );
        const newZaehler: Zaehler = {
          id: newId,
          wohnungNr: editingZaehler.wohnungNr || "",
          geschoss: editingZaehler.geschoss || "",
          montageort: editingZaehler.montageort || "",
          geraeteart: editingZaehler.geraeteart || "Kaltwasser",
          geraetnummer: editingZaehler.geraetnummer || "",
          geeichtBis: editingZaehler.geeichtBis || "",
          hersteller: editingZaehler.hersteller,
          typ: editingZaehler.typ,
        };
        setZaehlerData((prev) => [...prev, newZaehler]);
      } else {
        setZaehlerData((prev) =>
          prev.map((z) =>
            z.id === editingZaehler.id ? { ...z, ...editingZaehler } : z
          )
        );
      }
    } else {
      if (modalMode === "create") {
        const newId = String(
          Math.max(...rauchmelderData.map((r) => Number.parseInt(r.id))) + 1
        );
        const newRauchmelder: Rauchmelder = {
          id: newId,
          wohnungNr: editingRauchmelder.wohnungNr || "",
          geschoss: editingRauchmelder.geschoss || "",
          montageort: editingRauchmelder.montageort || "",
          geraeteart: editingRauchmelder.geraeteart || "Rauchmelder",
          geraetnummer: editingRauchmelder.geraetnummer || "",
          lebensdauerBis: editingRauchmelder.lebensdauerBis || "",
          hersteller: editingRauchmelder.hersteller,
          typ: editingRauchmelder.typ,
        };
        setRauchmelderData((prev) => [...prev, newRauchmelder]);
      } else {
        setRauchmelderData((prev) =>
          prev.map((r) =>
            r.id === editingRauchmelder.id ? { ...r, ...editingRauchmelder } : r
          )
        );
      }
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === "zaehler") {
      setZaehlerData((prev) => prev.filter((z) => z.id !== itemToDelete.id));
    } else {
      setRauchmelderData((prev) =>
        prev.filter((r) => r.id !== itemToDelete.id)
      );
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  const confirmDelete = (type: "zaehler" | "rauchmelder", id: string) => {
    setItemToDelete({ type, id });
    setDeleteDialogOpen(true);
  };

  // Wohnung options for select
  const wohnungOptions = [
    { value: "1", label: "Wohnung 1 - EG links" },
    { value: "2", label: "Wohnung 2 - EG rechts" },
    { value: "3", label: "Wohnung 3 - 1.OG links" },
    { value: "4", label: "Wohnung 4 - 1.OG rechts" },
    { value: "5", label: "Wohnung 5 - 2.OG links" },
    { value: "6", label: "Wohnung 6 - 2.OG rechts" },
    { value: "7", label: "Wohnung 7 - DG links" },
    { value: "8", label: "Wohnung 8 - DG rechts" },
  ];

  const geschossFromWohnung = (wohnungNr: string) => {
    const option = wohnungOptions.find((o) => o.value === wohnungNr);
    if (option) {
      return option.label.split(" - ")[1] || "";
    }
    return "";
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm sm:text-base text-muted-foreground">
          Verwalten Sie alle Zähler und Rauchmelder Ihrer Objekte.
        </p>
        <div className="flex items-center gap-2 sm:gap-4">
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
              Wasser- & Wärmezähler
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
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Whg</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Geschoss
                  </TableHead>
                  <TableHead>Montageort</TableHead>
                  <TableHead>Geräteart</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Gerätenummer
                  </TableHead>
                  <TableHead>Geeicht bis</TableHead>
                  <TableHead className="w-[80px]">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {zaehlerData.map((zaehler) => (
                  <TableRow key={zaehler.id}>
                    <TableCell>{zaehler.wohnungNr}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {zaehler.geschoss}
                    </TableCell>
                    <TableCell>{zaehler.montageort}</TableCell>
                    <TableCell>{zaehler.geraeteart}</TableCell>
                    <TableCell className="hidden md:table-cell font-mono text-sm">
                      {zaehler.geraetnummer}
                    </TableCell>
                    <TableCell>{zaehler.geeichtBis}</TableCell>
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
                ))}
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
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Whg</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    Geschoss
                  </TableHead>
                  <TableHead>Montageort</TableHead>
                  <TableHead>Geräteart</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Gerätenummer
                  </TableHead>
                  <TableHead>Lebensdauer</TableHead>
                  <TableHead className="w-[80px]">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rauchmelderData.map((rm) => (
                  <TableRow key={rm.id}>
                    <TableCell>{rm.wohnungNr}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {rm.geschoss}
                    </TableCell>
                    <TableCell>{rm.montageort}</TableCell>
                    <TableCell>{rm.geraeteart}</TableCell>
                    <TableCell className="hidden md:table-cell font-mono text-sm">
                      {rm.geraetnummer}
                    </TableCell>
                    <TableCell>{rm.lebensdauerBis}</TableCell>
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
                ))}
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
          <div className="grid gap-4 py-4">
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
            <div className="grid grid-cols-2 gap-4">
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
            <div className="grid grid-cols-2 gap-4">
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
