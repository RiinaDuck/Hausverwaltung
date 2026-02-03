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
import { Save, Plus, Building2, Trash2, Edit } from "lucide-react";
import { useAppData } from "@/context/app-data-context";
import { useAuth } from "@/context/auth-context";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { validateRequired, validatePLZ } from "@/lib/validation";

export function ObjektdatenView() {
  const {
    objekte,
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
                <div className="grid grid-cols-3 gap-4">
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
          <Button
            className="gap-2 bg-success hover:bg-success/90 text-success-foreground button-hover"
            onClick={handleSave}
            size="sm"
          >
            <Save className="h-4 w-4" />
            <span className="hidden sm:inline">Speichern</span>
          </Button>
        </div>
      </div>

      {/* Objektliste */}
      <Card className="hover-glow">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Ihre Objekte ({objekte.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {objekte.map((objekt) => (
              <div
                key={objekt.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md gap-3 ${
                  selectedObjektId === objekt.id
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => setSelectedObjektId(objekt.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {objekt.name}
                      {selectedObjektId === objekt.id && (
                        <Badge variant="secondary" className="text-xs">
                          Ausgewählt
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {objekt.adresse}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{objekt.einheiten} Einheiten</Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditObjekt(objekt);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteObjekt(objekt);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {objekte.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Noch keine Objekte vorhanden.</p>
                <p className="text-sm">
                  Klicken Sie auf "Neues Objekt" um zu starten.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedObjekt && (
        <>
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left Column: Owner */}
            <div className="space-y-6">
              {/* Eigentümer und Bankverbindung */}
              <Card className="hover-glow">
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">
                    Eigentümer und Bankverbindung
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={selectedObjekt.eigentuemer.name}
                      onChange={(e) =>
                        updateObjekt(selectedObjekt.id, {
                          eigentuemer: {
                            ...selectedObjekt.eigentuemer,
                            name: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="adresse">Adresse</Label>
                    <Input
                      id="adresse"
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
                  <div className="space-y-2">
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
                  <div className="space-y-2">
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
                  <div className="space-y-2">
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
                  <div className="space-y-2">
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ustid">USt-IdNr.</Label>
                      <Input id="ustid" placeholder="DE123456789" />
                    </div>
                    <div className="space-y-2">
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

              {/* Kontakt */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Kontakt</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
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
                    <div className="space-y-2">
                      <Label htmlFor="fax">Fax</Label>
                      <Input id="fax" placeholder="030 12345679" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
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
                    <div className="space-y-2">
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
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Property */}
            <div className="space-y-6">
              {/* Objektanschrift */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Objektanschrift</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                  <div className="grid grid-cols-3 gap-4">
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

              {/* Verteilschlüssel-Basis */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">
                    Verteilschlüssel-Basis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="gesamtwohnflaeche">
                      Gesamtwohnfläche (m²)
                    </Label>
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
                    <Label htmlFor="gesamtnutzflaeche">
                      Gesamtnutzfläche (m²)
                    </Label>
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
                </CardContent>
              </Card>

              {/* Immobilien-Daten */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Immobilien-Daten</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
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
                </CardContent>
              </Card>

              {/* Energieausweis */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base">Energieausweis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="energie-art">
                        Art (Bedarf/Verbrauch)
                      </Label>
                      <Select
                        value={
                          selectedObjekt.objektdaten.energieArt || "bedarf"
                        }
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
                          <SelectItem value="verbrauch">
                            Verbrauchsausweis
                          </SelectItem>
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="energietraeger">Energieträger</Label>
                      <Select
                        value={
                          selectedObjekt.objektdaten.energietraeger || "gas"
                        }
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
                          <SelectItem value="waermepumpe">
                            Wärmepumpe
                          </SelectItem>
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
            </div>
          </div>

          {/* Bottom Section */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Notizen zum Objekt */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Notizen zum Objekt</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Fügen Sie hier allgemeine Notizen zum Objekt hinzu..."
                  rows={6}
                  value={selectedObjekt.notizen}
                  onChange={(e) =>
                    updateObjekt(selectedObjekt.id, {
                      notizen: e.target.value,
                    })
                  }
                />
              </CardContent>
            </Card>

            {/* Daten zum Grundstück */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">
                  Daten zum Grundstück
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="grundstueck-groesse">Größe (m²)</Label>
                    <Input
                      id="grundstueck-groesse"
                      value={
                        selectedObjekt.objektdaten.grundstueckGroesse || ""
                      }
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

          {/* Grundbuch */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Grundbuch</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
              <div className="grid lg:grid-cols-2 gap-4">
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
        </>
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
    </div>
  );
}
