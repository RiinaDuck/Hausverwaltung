"use client";

import { useState } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Save, Plus, Building2, Trash2, Edit, MoreHorizontal, Archive, Loader2 } from "lucide-react";
import { useAppData } from "@/context/app-data-context";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { validateRequired, validatePLZ } from "@/lib/validation";
import { createClient } from "@/lib/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ObjektdatenViewProps {
  onNavigate?: (view: "wohnungen") => void;
}

export function ObjektdatenView({ onNavigate }: ObjektdatenViewProps) {
  const {
    objekte,
    wohnungen,
    addObjekt,
    updateObjekt,
    deleteObjekt,
    selectedObjektId,
    setSelectedObjektId,
  } = useAppData();
  const { isDemo } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [objektName, setObjektName] = useState("");
  const [objektStrasse, setObjektStrasse] = useState("");
  const [objektPlz, setObjektPlz] = useState("");
  const [objektOrt, setObjektOrt] = useState("");
  const [editingObjektId, setEditingObjektId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [objektToDelete, setObjektToDelete] = useState<
    (typeof objekte)[0] | null
  >(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);
  const [objektToArchive, setObjektToArchive] = useState<
    (typeof objekte)[0] | null
  >(null);
  const [archiveProcessing, setArchiveProcessing] = useState(false);
  const { toast } = useToast();

  const selectedObjekt =
    objekte.find((o) => o.id === selectedObjektId) || objekte[0];

  const handleSave = () => {
    toast({
      title: "Gespeichert",
      description: `Objektdaten für "${
        selectedObjekt?.name || "Objekt"
      }" wurden gespeichert.`,
    });
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    const nameValidation = validateRequired(objektName, "Objektname");
    if (!nameValidation.valid) errors.name = nameValidation.error!;

    const strasseValidation = validateRequired(objektStrasse, "Straße");
    if (!strasseValidation.valid) errors.strasse = strasseValidation.error!;

    const plzValidation = validatePLZ(objektPlz);
    if (!plzValidation.valid) errors.plz = plzValidation.error!;

    const ortValidation = validateRequired(objektOrt, "Ort");
    if (!ortValidation.valid) errors.ort = ortValidation.error!;

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNeuesObjekt = () => {
    if (!validateForm()) {
      toast({
        title: "Validierungsfehler",
        description: "Bitte überprüfen Sie Ihre Eingaben.",
        variant: "destructive",
      });
      return;
    }

    // Demo-Modus Einschränkung
    if (isDemo && !editingObjektId) {
      toast({
        title: "Demo-Modus",
        description:
          "Im Demo-Modus können keine neuen Objekte angelegt werden. Bitte melden Sie sich an, um diese Funktion zu nutzen.",
        variant: "destructive",
      });
      return;
    }

    if (editingObjektId) {
      // Bearbeitung
      updateObjekt(editingObjektId, {
        name: objektName,
        adresse: `${objektStrasse}, ${objektPlz} ${objektOrt}`,
        objektdaten: {
          ...selectedObjekt?.objektdaten,
          strasse: objektStrasse,
          plz: objektPlz,
          ort: objektOrt,
        } as any,
      });
      toast({
        title: "Gespeichert",
        description: `Objekt "${objektName}" wurde aktualisiert.`,
      });
    } else {
      // Neues Objekt
      addObjekt({
        name: objektName,
        adresse: `${objektStrasse}, ${objektPlz} ${objektOrt}`,
        typ: "Miete",
        einheiten: 0,
        status: "aktiv",
        eigentuemer: {
          name: "",
          adresse: "",
          telefon: "",
          email: "",
          mobil: "",
        },
        bankverbindung: {
          kontoinhaber: "",
          bank: "",
          iban: "",
          bic: "",
        },
        objektdaten: {
          strasse: objektStrasse,
          plz: objektPlz,
          ort: objektOrt,
          baujahr: "",
          sanierungsjahr: "",
          gesamtwohnflaeche: "",
          gesamtnutzflaeche: "",
          anzahlEinheiten: "0",
          garagen: "",
        },
        notizen: "",
      });
      toast({
        title: "Erstellt",
        description: `Objekt "${objektName}" wurde angelegt.`,
      });
    }

    resetDialog();
  };

  const resetDialog = () => {
    setIsDialogOpen(false);
    setObjektName("");
    setObjektStrasse("");
    setObjektPlz("");
    setObjektOrt("");
    setEditingObjektId(null);
    setValidationErrors({});
  };

  const handleEditObjekt = (objekt: (typeof objekte)[0]) => {
    setEditingObjektId(objekt.id);
    setObjektName(objekt.name);
    // Versuche Adresse zu parsen
    const adressParts = objekt.adresse.split(", ");
    if (adressParts.length >= 2) {
      setObjektStrasse(adressParts[0]);
      const plzOrt = adressParts[1].split(" ");
      setObjektPlz(plzOrt[0] || "");
      setObjektOrt(plzOrt.slice(1).join(" ") || "");
    }
    setIsDialogOpen(true);
  };

  const handleDeleteObjekt = (objekt: (typeof objekte)[0]) => {
    setObjektToDelete(objekt);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (objektToDelete) {
      deleteObjekt(objektToDelete.id);
      toast({
        title: "Gelöscht",
        description: `Objekt "${objektToDelete.name}" wurde gelöscht.`,
      });
      setObjektToDelete(null);
    }
    setDeleteConfirmOpen(false);
  };

  const handleArchiveObjekt = (objekt: (typeof objekte)[0]) => {
    setObjektToArchive(objekt);
    setArchiveConfirmOpen(true);
  };

  const confirmArchive = async () => {
    if (!objektToArchive) return;

    setArchiveProcessing(true);
    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Supabase client not available");

      // Update objekt: set archived_at=now(), archive_reason="Archiviert"
      const now = new Date().toISOString();
      const { error } = await supabase
        .from("objekte")
        .update({
          archived_at: now,
          archive_reason: "Archiviert",
        })
        .eq("id", objektToArchive.id);

      if (error) throw error;

      toast({
        title: "Archiviert",
        description: `Objekt "${objektToArchive.name}" wurde archiviert.`,
      });

      setObjektToArchive(null);
      setArchiveConfirmOpen(false);
      
      // Deselect the archived objekt
      if (selectedObjektId === objektToArchive.id) {
        setSelectedObjektId(objekte.find((o) => o.id !== objektToArchive.id)?.id ?? null);
      }
    } catch (error: any) {
      console.error("Error archiving objekt:", error);
      toast({
        title: "Fehler beim Archivieren",
        description: error?.message ?? "Das Objekt konnte nicht archiviert werden.",
        variant: "destructive",
      });
    } finally {
      setArchiveProcessing(false);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm md:text-base text-muted-foreground">
          Bearbeiten Sie die Stammdaten des ausgewählten Objekts.
        </p>
        <div className="flex items-center gap-2">
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              if (!open) resetDialog();
              else setIsDialogOpen(true);
            }}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="gap-2 button-hover"
                size="sm"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Neues</span> Objekt
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingObjektId
                    ? "Objekt bearbeiten"
                    : "Neues Objekt anlegen"}
                </DialogTitle>
                <DialogDescription>
                  {editingObjektId
                    ? "Bearbeiten Sie die Daten des Objekts."
                    : "Geben Sie die Grunddaten für das neue Objekt ein."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="neues-objekt-name">Objektname</Label>
                  <Input
                    id="neues-objekt-name"
                    placeholder="z.B. Mehrfamilienhaus Mitte"
                    value={objektName}
                    onChange={(e) => setObjektName(e.target.value)}
                    className={
                      validationErrors.name ? "border-destructive" : ""
                    }
                  />
                  {validationErrors.name && (
                    <p className="text-sm text-destructive">
                      {validationErrors.name}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="neues-objekt-strasse">Straße</Label>
                  <Input
                    id="neues-objekt-strasse"
                    placeholder="z.B. Hauptstraße 15"
                    value={objektStrasse}
                    onChange={(e) => setObjektStrasse(e.target.value)}
                    className={
                      validationErrors.strasse ? "border-destructive" : ""
                    }
                  />
                  {validationErrors.strasse && (
                    <p className="text-sm text-destructive">
                      {validationErrors.strasse}
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="neues-objekt-plz">PLZ</Label>
                    <Input
                      id="neues-objekt-plz"
                      placeholder="10115"
                      value={objektPlz}
                      onChange={(e) => setObjektPlz(e.target.value)}
                      maxLength={5}
                      className={
                        validationErrors.plz ? "border-destructive" : ""
                      }
                    />
                    {validationErrors.plz && (
                      <p className="text-sm text-destructive">
                        {validationErrors.plz}
                      </p>
                    )}
                  </div>
                  <div className="col-span-2 space-y-2">
                    <Label htmlFor="neues-objekt-ort">Ort</Label>
                    <Input
                      id="neues-objekt-ort"
                      placeholder="Berlin"
                      value={objektOrt}
                      onChange={(e) => setObjektOrt(e.target.value)}
                      className={
                        validationErrors.ort ? "border-destructive" : ""
                      }
                    />
                    {validationErrors.ort && (
                      <p className="text-sm text-destructive">
                        {validationErrors.ort}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={resetDialog}>
                  Abbrechen
                </Button>
                <Button
                  onClick={handleNeuesObjekt}
                  className="bg-success hover:bg-success/90 text-success-foreground"
                >
                  {editingObjektId ? "Speichern" : "Objekt anlegen"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>


      {selectedObjekt && (
        <Tabs defaultValue="stammdaten" className="space-y-4">
          <div className="flex flex-col gap-3">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 h-auto">
              <TabsTrigger value="stammdaten" className="text-xs sm:text-sm py-2">Stammdaten</TabsTrigger>
              <TabsTrigger value="eigentuemer" className="text-xs sm:text-sm py-2">Eigentümer</TabsTrigger>
              <TabsTrigger value="steuern" className="text-xs sm:text-sm py-2">Steuern &amp; Abgaben</TabsTrigger>
              <TabsTrigger value="liegenschaft" className="text-xs sm:text-sm py-2">Liegenschaft</TabsTrigger>
              <TabsTrigger value="energieausweis" className="text-xs sm:text-sm py-2">Energieausweis</TabsTrigger>
            </TabsList>
            <div className="flex items-center justify-end gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      handleEditObjekt(selectedObjekt);
                    }}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Bearbeiten
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleArchiveObjekt(selectedObjekt)}
                    className="text-amber-600 focus:text-amber-600"
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    Archivieren
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleDeleteObjekt(selectedObjekt)}
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

          {/* TAB 1: Stammdaten */}
          <TabsContent value="stammdaten" className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <Card className="flex-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Objektanschrift</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="obj-name">Objektname</Label>
                    <Input
                      id="obj-name"
                      value={selectedObjekt.name}
                      onChange={(e) =>
                        updateObjekt(selectedObjekt.id, { name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="obj-strasse">Straße</Label>
                    <Input
                      id="obj-strasse"
                      value={selectedObjekt.objektdaten.strasse}
                      onChange={(e) =>
                        updateObjekt(selectedObjekt.id, {
                          objektdaten: {
                            ...selectedObjekt.objektdaten,
                            strasse: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="obj-plz">PLZ</Label>
                      <Input
                        id="obj-plz"
                        value={selectedObjekt.objektdaten.plz}
                        onChange={(e) =>
                          updateObjekt(selectedObjekt.id, {
                            objektdaten: {
                              ...selectedObjekt.objektdaten,
                              plz: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <Label htmlFor="obj-ort">Ort</Label>
                      <Input
                        id="obj-ort"
                        value={selectedObjekt.objektdaten.ort}
                        onChange={(e) =>
                          updateObjekt(selectedObjekt.id, {
                            objektdaten: {
                              ...selectedObjekt.objektdaten,
                              ort: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="flex-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Immobilien-Daten</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="baujahr">Baujahr</Label>
                      <Input
                        id="baujahr"
                        value={selectedObjekt.objektdaten.baujahr}
                        onChange={(e) =>
                          updateObjekt(selectedObjekt.id, {
                            objektdaten: {
                              ...selectedObjekt.objektdaten,
                              baujahr: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sanierungsjahr">Sanierungsjahr</Label>
                      <Input
                        id="sanierungsjahr"
                        value={selectedObjekt.objektdaten.sanierungsjahr}
                        onChange={(e) =>
                          updateObjekt(selectedObjekt.id, {
                            objektdaten: {
                              ...selectedObjekt.objektdaten,
                              sanierungsjahr: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="garagen">Garagen/Stellplätze</Label>
                      <Input
                        id="garagen"
                        value={selectedObjekt.objektdaten.garagen}
                        onChange={(e) =>
                          updateObjekt(selectedObjekt.id, {
                            objektdaten: {
                              ...selectedObjekt.objektdaten,
                              garagen: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="anzahl-mieteinheiten">Anzahl Mieteinheiten</Label>
                      <Input
                        id="anzahl-mieteinheiten"
                        value={wohnungen.filter((w) => w.objektId === selectedObjekt.id).length}
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Notizen zum Objekt</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Fügen Sie hier allgemeine Notizen zum Objekt hinzu..."
                  rows={4}
                  value={selectedObjekt.notizen}
                  onChange={(e) =>
                    updateObjekt(selectedObjekt.id, {
                      notizen: e.target.value,
                    })
                  }
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: Eigentümer */}
          <TabsContent value="eigentuemer" className="space-y-3">

            <div className="flex flex-col md:flex-row gap-3">
              <Card className="flex-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Eigentümer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="eig-anrede">Anrede</Label>
                      <Select
                        value={selectedObjekt.eigentuemer.anrede || ""}
                        onValueChange={(val) =>
                          updateObjekt(selectedObjekt.id, {
                            eigentuemer: {
                              ...selectedObjekt.eigentuemer,
                              anrede: val,
                            },
                          })
                        }
                      >
                        <SelectTrigger id="eig-anrede">
                          <SelectValue placeholder="Bitte wählen" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Herr">Herr</SelectItem>
                          <SelectItem value="Frau">Frau</SelectItem>
                          <SelectItem value="Familie">Familie</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="eig-vorname">Vorname</Label>
                      <Input
                        id="eig-vorname"
                        value={selectedObjekt.eigentuemer.vorname || ""}
                        onChange={(e) => {
                          const vorname = e.target.value;
                          const nachname = selectedObjekt.eigentuemer.nachname || "";
                          updateObjekt(selectedObjekt.id, {
                            eigentuemer: {
                              ...selectedObjekt.eigentuemer,
                              vorname,
                              name: `${vorname} ${nachname}`.trim(),
                            },
                          });
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="eig-nachname">Nachname</Label>
                      <Input
                        id="eig-nachname"
                        value={selectedObjekt.eigentuemer.nachname || ""}
                        onChange={(e) => {
                          const nachname = e.target.value;
                          const vorname = selectedObjekt.eigentuemer.vorname || "";
                          updateObjekt(selectedObjekt.id, {
                            eigentuemer: {
                              ...selectedObjekt.eigentuemer,
                              nachname,
                              name: `${vorname} ${nachname}`.trim(),
                            },
                          });
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="eig-adresse">Adresse</Label>
                    <Input
                      id="eig-adresse"
                      value={selectedObjekt.eigentuemer.adresse}
                      onChange={(e) =>
                        updateObjekt(selectedObjekt.id, {
                          eigentuemer: {
                            ...selectedObjekt.eigentuemer,
                            adresse: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="eig-plz">PLZ</Label>
                      <Input
                        id="eig-plz"
                        value={selectedObjekt.eigentuemer.plz || ""}
                        onChange={(e) =>
                          updateObjekt(selectedObjekt.id, {
                            eigentuemer: {
                              ...selectedObjekt.eigentuemer,
                              plz: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <Label htmlFor="eig-ort">Ort</Label>
                      <Input
                        id="eig-ort"
                        value={selectedObjekt.eigentuemer.ort || ""}
                        onChange={(e) =>
                          updateObjekt(selectedObjekt.id, {
                            eigentuemer: {
                              ...selectedObjekt.eigentuemer,
                              ort: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="telefon">Telefon</Label>
                      <Input
                        id="telefon"
                        value={selectedObjekt.eigentuemer.telefon}
                        onChange={(e) =>
                          updateObjekt(selectedObjekt.id, {
                            eigentuemer: {
                              ...selectedObjekt.eigentuemer,
                              telefon: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="mobil">Mobil</Label>
                      <Input
                        id="mobil"
                        value={selectedObjekt.eigentuemer.mobil}
                        onChange={(e) =>
                          updateObjekt(selectedObjekt.id, {
                            eigentuemer: {
                              ...selectedObjekt.eigentuemer,
                              mobil: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="fax">Fax</Label>
                      <Input
                        id="fax"
                        value={selectedObjekt.eigentuemer.fax || ""}
                        onChange={(e) =>
                          updateObjekt(selectedObjekt.id, {
                            eigentuemer: {
                              ...selectedObjekt.eigentuemer,
                              fax: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="email">E-Mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={selectedObjekt.eigentuemer.email}
                        onChange={(e) =>
                          updateObjekt(selectedObjekt.id, {
                            eigentuemer: {
                              ...selectedObjekt.eigentuemer,
                              email: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Right column: Bankverbindung + Steuer stacked */}
              <div className="flex flex-col gap-3 flex-1">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Bankverbindung</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="kontoinhaber">Kontoinhaber</Label>
                        <Input
                          id="kontoinhaber"
                          value={selectedObjekt.bankverbindung.kontoinhaber}
                          onChange={(e) =>
                            updateObjekt(selectedObjekt.id, {
                              bankverbindung: {
                                ...selectedObjekt.bankverbindung,
                                kontoinhaber: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="bank">Bank</Label>
                        <Input
                          id="bank"
                          value={selectedObjekt.bankverbindung.bank}
                          onChange={(e) =>
                            updateObjekt(selectedObjekt.id, {
                              bankverbindung: {
                                ...selectedObjekt.bankverbindung,
                                bank: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="iban">IBAN</Label>
                        <Input
                          id="iban"
                          value={selectedObjekt.bankverbindung.iban}
                          onChange={(e) =>
                            updateObjekt(selectedObjekt.id, {
                              bankverbindung: {
                                ...selectedObjekt.bankverbindung,
                                iban: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="bic">BIC</Label>
                        <Input
                          id="bic"
                          value={selectedObjekt.bankverbindung.bic}
                          onChange={(e) =>
                            updateObjekt(selectedObjekt.id, {
                              bankverbindung: {
                                ...selectedObjekt.bankverbindung,
                                bic: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Steuer</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="ustid">USt-IdNr.</Label>
                        <Input
                          id="ustid"
                          placeholder="DE123456789"
                          value={selectedObjekt.objektdaten.ustIdNr || ""}
                          onChange={(e) =>
                            updateObjekt(selectedObjekt.id, {
                              objektdaten: {
                                ...selectedObjekt.objektdaten,
                                ustIdNr: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="finanzamt">Finanzamt</Label>
                        <Input
                          id="finanzamt"
                          value={selectedObjekt.objektdaten.finanzamt || ""}
                          onChange={(e) =>
                            updateObjekt(selectedObjekt.id, {
                              objektdaten: {
                                ...selectedObjekt.objektdaten,
                                finanzamt: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

          </TabsContent>

          {/* TAB 3: Steuern & Abgaben */}
          <TabsContent value="steuern" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Finanzamt</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="fa-name">Finanzamt Name</Label>
                    <Input
                      id="fa-name"
                      value={selectedObjekt.steuern?.finanzamtName || ""}
                      onChange={(e) =>
                        updateObjekt(selectedObjekt.id, {
                          steuern: {
                            ...selectedObjekt.steuern,
                            finanzamtName: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fa-steuernummer">Steuernummer</Label>
                    <Input
                      id="fa-steuernummer"
                      value={selectedObjekt.steuern?.finanzamtSteuernummer || ""}
                      onChange={(e) =>
                        updateObjekt(selectedObjekt.id, {
                          steuern: {
                            ...selectedObjekt.steuern,
                            finanzamtSteuernummer: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="fa-ansprechpartner">Ansprechpartner</Label>
                    <Input
                      id="fa-ansprechpartner"
                      value={selectedObjekt.steuern?.finanzamtAnsprechpartner || ""}
                      onChange={(e) =>
                        updateObjekt(selectedObjekt.id, {
                          steuern: {
                            ...selectedObjekt.steuern,
                            finanzamtAnsprechpartner: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fa-telefon">Telefon</Label>
                    <Input
                      id="fa-telefon"
                      value={selectedObjekt.steuern?.finanzamtTelefon || ""}
                      onChange={(e) =>
                        updateObjekt(selectedObjekt.id, {
                          steuern: {
                            ...selectedObjekt.steuern,
                            finanzamtTelefon: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fa-email">E-Mail</Label>
                    <Input
                      id="fa-email"
                      type="email"
                      value={selectedObjekt.steuern?.finanzamtEmail || ""}
                      onChange={(e) =>
                        updateObjekt(selectedObjekt.id, {
                          steuern: {
                            ...selectedObjekt.steuern,
                            finanzamtEmail: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="flex flex-col md:flex-row gap-4">
              <Card className="flex-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Steuerberater</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="stb-name">Name</Label>
                      <Input
                        id="stb-name"
                        value={selectedObjekt.steuern?.steuerberaterName || ""}
                        onChange={(e) =>
                          updateObjekt(selectedObjekt.id, {
                            steuern: {
                              ...selectedObjekt.steuern,
                              steuerberaterName: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stb-telefon">Telefon</Label>
                      <Input
                        id="stb-telefon"
                        value={selectedObjekt.steuern?.steuerberaterTelefon || ""}
                        onChange={(e) =>
                          updateObjekt(selectedObjekt.id, {
                            steuern: {
                              ...selectedObjekt.steuern,
                              steuerberaterTelefon: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="stb-email">E-Mail</Label>
                      <Input
                        id="stb-email"
                        type="email"
                        value={selectedObjekt.steuern?.steuerberaterEmail || ""}
                        onChange={(e) =>
                          updateObjekt(selectedObjekt.id, {
                            steuern: {
                              ...selectedObjekt.steuern,
                              steuerberaterEmail: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stb-briefanrede">Briefanrede</Label>
                      <Input
                        id="stb-briefanrede"
                        value={selectedObjekt.steuern?.steuerberaterBriefanrede || ""}
                        onChange={(e) =>
                          updateObjekt(selectedObjekt.id, {
                            steuern: {
                              ...selectedObjekt.steuern,
                              steuerberaterBriefanrede: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="flex-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Grundbesitz</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="grundsteuernr">Grundsteuernummer</Label>
                      <Input
                        id="grundsteuernr"
                        value={selectedObjekt.steuern?.grundsteuernummer || ""}
                        onChange={(e) =>
                          updateObjekt(selectedObjekt.id, {
                            steuern: {
                              ...selectedObjekt.steuern,
                              grundsteuernummer: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="grundsteuerwert">Grundsteuerwert (€)</Label>
                      <Input
                        id="grundsteuerwert"
                        value={selectedObjekt.steuern?.grundsteuerwert || ""}
                        onChange={(e) =>
                          updateObjekt(selectedObjekt.id, {
                            steuern: {
                              ...selectedObjekt.steuern,
                              grundsteuerwert: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="einheitswert">Einheitswert (€)</Label>
                      <Input
                        id="einheitswert"
                        value={selectedObjekt.steuern?.einheitswert || ""}
                        onChange={(e) =>
                          updateObjekt(selectedObjekt.id, {
                            steuern: {
                              ...selectedObjekt.steuern,
                              einheitswert: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="steuer-aktenzeichen">Aktenzeichen</Label>
                      <Input
                        id="steuer-aktenzeichen"
                        value={selectedObjekt.steuern?.aktenzeichen || ""}
                        onChange={(e) =>
                          updateObjekt(selectedObjekt.id, {
                            steuern: {
                              ...selectedObjekt.steuern,
                              aktenzeichen: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 4: Liegenschaft */}
          <TabsContent value="liegenschaft" className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
            <Card className="flex-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Verteilungsschlüssel-Basis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="gesamtwohnflaeche">Gesamtwohnfläche (m²)</Label>
                    <Input
                      id="gesamtwohnflaeche"
                      value={selectedObjekt.objektdaten.gesamtwohnflaeche}
                      onChange={(e) =>
                        updateObjekt(selectedObjekt.id, {
                          objektdaten: {
                            ...selectedObjekt.objektdaten,
                            gesamtwohnflaeche: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gesamtwohnflaeche2">Gesamtwohnfläche 2 (m²)</Label>
                    <Input
                      id="gesamtwohnflaeche2"
                      value={selectedObjekt.objektdaten.gesamtwohnflaeche2 || ""}
                      onChange={(e) =>
                        updateObjekt(selectedObjekt.id, {
                          objektdaten: {
                            ...selectedObjekt.objektdaten,
                            gesamtwohnflaeche2: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="gesamtnutzflaeche">Gesamtnutzfläche (m²)</Label>
                    <Input
                      id="gesamtnutzflaeche"
                      value={selectedObjekt.objektdaten.gesamtnutzflaeche}
                      onChange={(e) =>
                        updateObjekt(selectedObjekt.id, {
                          objektdaten: {
                            ...selectedObjekt.objektdaten,
                            gesamtnutzflaeche: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="anzahl-einheiten">Anzahl Einheiten</Label>
                    <Input
                      id="anzahl-einheiten"
                      value={selectedObjekt.objektdaten.anzahlEinheiten}
                      onChange={(e) =>
                        updateObjekt(selectedObjekt.id, {
                          objektdaten: {
                            ...selectedObjekt.objektdaten,
                            anzahlEinheiten: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="flex-1">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Daten zum Grundstück</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="flur">Flur</Label>
                    <Input
                      id="flur"
                      value={selectedObjekt.objektdaten.flur || ""}
                      onChange={(e) =>
                        updateObjekt(selectedObjekt.id, {
                          objektdaten: {
                            ...selectedObjekt.objektdaten,
                            flur: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="flurstueck">Flurstück</Label>
                    <Input
                      id="flurstueck"
                      value={selectedObjekt.objektdaten.flurstueck || ""}
                      onChange={(e) =>
                        updateObjekt(selectedObjekt.id, {
                          objektdaten: {
                            ...selectedObjekt.objektdaten,
                            flurstueck: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="grundstueck-groesse">Größe (m²)</Label>
                    <Input
                      id="grundstueck-groesse"
                      value={selectedObjekt.objektdaten.grundstueckGroesse || ""}
                      onChange={(e) =>
                        updateObjekt(selectedObjekt.id, {
                          objektdaten: {
                            ...selectedObjekt.objektdaten,
                            grundstueckGroesse: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gemarkung">Gemarkung</Label>
                    <Input
                      id="gemarkung"
                      value={selectedObjekt.objektdaten.gemarkung || ""}
                      onChange={(e) =>
                        updateObjekt(selectedObjekt.id, {
                          objektdaten: {
                            ...selectedObjekt.objektdaten,
                            gemarkung: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Grundbuch</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="grundbuchbezeichnung">Grundbuchbezeichnung</Label>
                  <Input
                    id="grundbuchbezeichnung"
                    value={selectedObjekt.objektdaten.grundbuchbezeichnung || ""}
                    onChange={(e) =>
                      updateObjekt(selectedObjekt.id, {
                        objektdaten: {
                          ...selectedObjekt.objektdaten,
                          grundbuchbezeichnung: e.target.value,
                        },
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="amtsgericht">Amtsgericht</Label>
                    <Input
                      id="amtsgericht"
                      value={selectedObjekt.objektdaten.amtsgericht || ""}
                      onChange={(e) =>
                        updateObjekt(selectedObjekt.id, {
                          objektdaten: {
                            ...selectedObjekt.objektdaten,
                            amtsgericht: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="blatt">Blatt</Label>
                    <Input
                      id="blatt"
                      value={selectedObjekt.objektdaten.blatt || ""}
                      onChange={(e) =>
                        updateObjekt(selectedObjekt.id, {
                          objektdaten: {
                            ...selectedObjekt.objektdaten,
                            blatt: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid lg:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="lasten-abt2">Lasten Abteilung II</Label>
                    <Textarea
                      id="lasten-abt2"
                      placeholder="z.B. Wegerechte, Wohnrechte..."
                      rows={4}
                      value={selectedObjekt.objektdaten.lastenAbt2 || ""}
                      onChange={(e) =>
                        updateObjekt(selectedObjekt.id, {
                          objektdaten: {
                            ...selectedObjekt.objektdaten,
                            lastenAbt2: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lasten-abt3">Lasten Abteilung III</Label>
                    <Textarea
                      id="lasten-abt3"
                      rows={4}
                      value={selectedObjekt.objektdaten.lastenAbt3 || ""}
                      onChange={(e) =>
                        updateObjekt(selectedObjekt.id, {
                          objektdaten: {
                            ...selectedObjekt.objektdaten,
                            lastenAbt3: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 4: Energieausweis */}
          <TabsContent value="energieausweis" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Energieausweis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="energie-art">Art (Bedarf/Verbrauch)</Label>
                    <Select
                      value={selectedObjekt.objektdaten.energieArt || "bedarf"}
                      onValueChange={(value) =>
                        updateObjekt(selectedObjekt.id, {
                          objektdaten: {
                            ...selectedObjekt.objektdaten,
                            energieArt: value,
                          },
                        })
                      }
                    >
                      <SelectTrigger id="energie-art">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bedarf">Bedarfsausweis</SelectItem>
                        <SelectItem value="verbrauch">Verbrauchsausweis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="energie-wert">Wert (kWh/m²)</Label>
                    <Input
                      id="energie-wert"
                      value={selectedObjekt.objektdaten.energieWert || ""}
                      onChange={(e) =>
                        updateObjekt(selectedObjekt.id, {
                          objektdaten: {
                            ...selectedObjekt.objektdaten,
                            energieWert: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="energietraeger">Energieträger</Label>
                    <Select
                      value={selectedObjekt.objektdaten.energietraeger || "gas"}
                      onValueChange={(value) =>
                        updateObjekt(selectedObjekt.id, {
                          objektdaten: {
                            ...selectedObjekt.objektdaten,
                            energietraeger: value,
                          },
                        })
                      }
                    >
                      <SelectTrigger id="energietraeger">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gas">Gas</SelectItem>
                        <SelectItem value="oel">Öl</SelectItem>
                        <SelectItem value="fernwaerme">Fernwärme</SelectItem>
                        <SelectItem value="strom">Strom</SelectItem>
                        <SelectItem value="waermepumpe">Wärmepumpe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="energie-baujahr">Baujahr Heizung</Label>
                    <Input
                      id="energie-baujahr"
                      value={selectedObjekt.objektdaten.energieBaujahr || ""}
                      onChange={(e) =>
                        updateObjekt(selectedObjekt.id, {
                          objektdaten: {
                            ...selectedObjekt.objektdaten,
                            energieBaujahr: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="energie-klasse">Klasse (A-H)</Label>
                  <Select
                    value={selectedObjekt.objektdaten.energieKlasse || "d"}
                    onValueChange={(value) =>
                      updateObjekt(selectedObjekt.id, {
                        objektdaten: {
                          ...selectedObjekt.objektdaten,
                          energieKlasse: value,
                        },
                      })
                    }
                  >
                    <SelectTrigger id="energie-klasse">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="a+">A+</SelectItem>
                      <SelectItem value="a">A</SelectItem>
                      <SelectItem value="b">B</SelectItem>
                      <SelectItem value="c">C</SelectItem>
                      <SelectItem value="d">D</SelectItem>
                      <SelectItem value="e">E</SelectItem>
                      <SelectItem value="f">F</SelectItem>
                      <SelectItem value="g">G</SelectItem>
                      <SelectItem value="h">H</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={confirmDelete}
        title="Objekt löschen?"
        description={
          objektToDelete
            ? `Möchten Sie das Objekt "${objektToDelete.name}" wirklich löschen? Alle zugehörigen Wohnungen und Mieter werden ebenfalls gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.`
            : ""
        }
        confirmText="Löschen"
        cancelText="Abbrechen"
        variant="destructive"
      />

      {/* Archive Confirmation Dialog */}
      <Dialog open={archiveConfirmOpen} onOpenChange={setArchiveConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Objekt archivieren?</DialogTitle>
            <DialogDescription>
              Möchten Sie das Objekt <span className="font-medium">"{objektToArchive?.name}"</span> wirklich archivieren?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Das Objekt wird archiviert und ist nicht mehr in der aktiven Liste sichtbar. Sie können es jederzeit in der Archiv-Section wiederherstellen.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setArchiveConfirmOpen(false);
                setObjektToArchive(null);
              }}
              disabled={archiveProcessing}
            >
              Abbrechen
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700"
              onClick={confirmArchive}
              disabled={archiveProcessing}
            >
              {archiveProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wird archiviert...
                </>
              ) : (
                <>
                  <Archive className="mr-2 h-4 w-4" />
                  Ja, archivieren
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
