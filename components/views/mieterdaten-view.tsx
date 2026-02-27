"use client";

import { useState, useMemo, useEffect, useRef } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Save,
  Plus,
  FileDown,
  Trash2,
  Users,
  Home,
  Calendar,
  MoreHorizontal,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  CreditCard,
  TrendingUp,
  Mail,
  Upload,
  ChevronDown,
  Printer,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  generateMieterKommunikationPDF,
  generatePDF,
  downloadPDF,
  sanitizeFilename,
} from "@/lib/pdf-generator";
import { useAppData } from "@/context/app-data-context";
import type { ZahlungEintrag } from "@/context/app-data-context";
import { useAuth } from "@/context/auth-context";
import { parseCamtXml, matchTransaktionToMieter } from "@/lib/parseCamt";
import { createClient } from "@/lib/supabase/client";

// Zahlungs-Interfaces
interface MahnEintrag {
  id: string;
  mieterId: string;
  datum: string;
  eskalationsstufe: "Erinnerung" | "1. Mahnung" | "2. Mahnung";
  betreff: string;
  gesendetVon: string;
}

// Lokales Interface für die Ansicht (kombiniert Mieter + Wohnungsdaten)
interface MieterDisplay {
  id: string;
  nr: number;
  geschoss: string;
  anrede: string;
  name: string;
  einzug: string;
  auszug: string;
  wohnungId: string;
  email: string;
  telefon: string;
  kaltmiete: number;
  nebenkosten: number;
  kaution: number;
  // Erweiterte Felder
  einzugsDatumRaw: string; // ISO-Format für Date-Input
  mieteBisRaw: string | null;
  isKurzzeitvermietung: boolean;
  kurzzeitBis?: string | null;
  isAktiv: boolean;
  prozentanteil: number;
}

export function MieterdatenView() {
  const {
    mieter,
    wohnungen,
    selectedObjektId,
    objekte,
    ehemaligeMieter,
    addMieter,
    updateMieter,
    deleteMieter,
    archiviereMieter,
    reaktiviereMieter,
    zahlungen,
    setZahlungen,
  } = useAppData();
  const { isDemo, profile, user } = useAuth();

  // Finde das aktuelle Objekt für den Namen
  const currentObjekt = objekte.find((o) => o.id === selectedObjektId);

  // Finde alle Wohnungs-IDs für das ausgewählte Objekt
  const objektWohnungIds = useMemo(() => {
    if (!selectedObjektId) return [];
    return wohnungen
      .filter((w) => w.objektId === selectedObjektId)
      .map((w) => w.id);
  }, [wohnungen, selectedObjektId]);

  // Konvertiere Context-Mieter zu MieterDisplay-Format und filtere nach Objekt
  const mieterData: MieterDisplay[] = useMemo(() => {
    // Zeige nur aktive Mieter in der Hauptliste
    const filtered = mieter.filter(
      (m) => objektWohnungIds.includes(m.wohnungId) && m.isAktiv !== false,
    );

    return filtered.map((m, index) => {
      const wohnung = wohnungen.find((w) => w.id === m.wohnungId);
      return {
        id: m.id,
        nr: index + 1,
        geschoss: wohnung?.bezeichnung || "Unbekannt",
        anrede: m.anrede || 'familie',
        name: m.name,
        einzug: m.einzugsDatum
          ? new Date(m.einzugsDatum).toLocaleDateString("de-DE")
          : "",
        auszug: m.mieteBis
          ? new Date(m.mieteBis).toLocaleDateString("de-DE")
          : "",
        wohnungId: m.wohnungId,
        email: m.email,
        telefon: m.telefon,
        kaltmiete: m.kaltmiete,
        nebenkosten: m.nebenkosten,
        kaution: m.kaution,
        // Erweiterte Felder
        einzugsDatumRaw: m.einzugsDatum,
        mieteBisRaw: m.mieteBis,
        isKurzzeitvermietung: m.isKurzzeitvermietung || false,
        kurzzeitBis: m.kurzzeitBis,
        isAktiv: m.isAktiv !== false,
        prozentanteil: m.prozentanteil || 0,
      };
    });
  }, [mieter, objektWohnungIds, wohnungen]);

  const [selectedMieter, setSelectedMieter] = useState<MieterDisplay | null>(
    null,
  );
  const [editedMieter, setEditedMieter] = useState<MieterDisplay | null>(null);

  // Alle Mieter (inkl. ehemalige) für die Wohnung des aktuell gewählten Mieters - für Historie
  const alleMieterFuerWohnung = useMemo(() => {
    if (!selectedMieter) return [];
    return mieter.filter((m) => m.wohnungId === selectedMieter.wohnungId);
  }, [mieter, selectedMieter]);

  const [betreff, setBetreff] = useState("Mitteilung");
  const [nachricht, setNachricht] = useState(
    "Sehr geehrte Damen und Herren,\n\nbitte beachten Sie, dass die jährliche Nebenkostenabrechnung bis Ende Februar zugestellt wird.\n\nMit freundlichen Grüßen\nIhre Hausverwaltung",
  );
  const [isNewMieterOpen, setIsNewMieterOpen] = useState(false);
  const [isSavingMieter, setIsSavingMieter] = useState(false);
  const [isEhemaligeMieterOpen, setIsEhemaligeMieterOpen] = useState(false);
  const [isHistorieMieterOpen, setIsHistorieMieterOpen] = useState(false);
  const [editingHistorieMieterId, setEditingHistorieMieterId] = useState<
    string | null
  >(null);
  const [newMieter, setNewMieter] = useState<{
    name: string;
    anrede: string;
    wohnungId: string;
    email: string;
    telefon: string;
    einzugsDatum: string;
    kaltmiete: number;
    nebenkosten: number;
    kaution: number;
    isKurzzeitvermietung: boolean;
    kurzzeitBis: string;
    prozentanteil: number;
  }>({
    name: "",
    anrede: "familie",
    wohnungId: "",
    email: "",
    telefon: "",
    einzugsDatum: new Date().toISOString().split("T")[0],
    kaltmiete: 0,
    nebenkosten: 0,
    kaution: 0,
    isKurzzeitvermietung: false,
    kurzzeitBis: "",
    prozentanteil: 0,
  });
  const [historieMieter, setHistorieMieter] = useState<{
    name: string;
    einzugsDatum: string;
    auszugsDatum: string;
    kaltmiete: number;
    nebenkosten: number;
    prozentanteil: number;
    isKurzzeitvermietung: boolean;
  }>({
    name: "",
    einzugsDatum: "",
    auszugsDatum: "",
    kaltmiete: 0,
    nebenkosten: 0,
    prozentanteil: 0,
    isKurzzeitvermietung: false,
  });
  const [selectedEhemaligerMieter, setSelectedEhemaligerMieter] =
    useState<string>("");

  // Zahlungs-State (aus Context)
  const [mahnHistorie, setMahnHistorie] = useState<MahnEintrag[]>([]);
  const [mahnEskalation, setMahnEskalation] = useState<"Erinnerung" | "1. Mahnung" | "2. Mahnung">("Erinnerung");
  const [mahnTextCustom, setMahnTextCustom] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [camtImportResult, setCamtImportResult] = useState<{
    dateiname: string;
    anzahl: number;
    zugeordnet: number;
    zeitpunkt: string;
  } | null>(null);
  const [pendingImport, setPendingImport] = useState<{
    dateiname: string;
    neueZahlungen: ZahlungEintrag[];
    zugeordnet: number;
    nichtZugeordnet: number;
    duplikate: number;
  } | null>(null);

  const camtFileInputRef = useRef<HTMLInputElement>(null);

  const { toast } = useToast();

  // Aktualisiere selectedMieter wenn sich mieterData ändert
  useEffect(() => {
    if (mieterData.length > 0) {
      if (
        !selectedMieter ||
        !mieterData.find((m) => m.id === selectedMieter.id)
      ) {
        setSelectedMieter(mieterData[0]);
      } else {
        // Aktualisiere selectedMieter mit neuen Daten aus mieterData
        const updatedMieter = mieterData.find(
          (m) => m.id === selectedMieter.id,
        );
        if (updatedMieter) {
          setSelectedMieter(updatedMieter);
        }
      }
    } else {
      setSelectedMieter(null);
    }
  }, [mieterData, selectedObjektId]);

  // Aktualisiere editedMieter wenn selectedMieter sich ändert
  useEffect(() => {
    if (selectedMieter) {
      setEditedMieter({ ...selectedMieter });
      // Aktualisiere auch die Nachricht
      setNachricht(
        `Sehr geehrte/r ${selectedMieter.name},\n\nbitte beachten Sie, dass die jährliche Nebenkostenabrechnung bis Ende Februar zugestellt wird.\n\nMit freundlichen Grüßen\nIhre Hausverwaltung`,
      );
    } else {
      setEditedMieter(null);
    }
  }, [selectedMieter]);

  // Zahlungen beim Start aus Supabase laden (nur wenn NICHT Demo-Modus)
  useEffect(() => {
    if (!selectedObjektId || isDemo) return;
    const loadZahlungen = async () => {
      try {
        const supabase = createClient();
        if (!supabase) return;
        const { data, error } = await supabase
          .from("zahlungen")
          .select("*")
          .order("buchungsdatum", { ascending: false });
        if (error) {
          console.warn("Zahlungen konnten nicht geladen werden:", error.message);
          return;
        }
      if (!data || data.length === 0) return;
      const loaded: ZahlungEintrag[] = data.map((row: any) => ({
        id: row.id,
        mieterId: row.mieter_id ?? "unbekannt",
        monat: row.monat ?? "",
        faelligkeitsdatum: row.faelligkeitsdatum ?? "",
        sollBetrag: row.soll_betrag ?? 0,
        istBetrag: row.betrag ?? 0,
        buchungsdatum: row.buchungsdatum ?? "",
        wertstellungsdatum: row.wertstellungsdatum ?? "",
        verwendungszweck: row.verwendungszweck ?? "",
        ibanAbsender: row.auftraggeber_iban ?? "",
        auftraggeber: row.auftraggeber_name ?? "",
        referenz: row.zahlungsreferenz ?? "",
        status: (row.status as ZahlungEintrag["status"]) ?? "ausstehend",
      }));
      setZahlungen((prev) => {
        const merged = [...prev];
        for (const lz of loaded) {
          const idx = merged.findIndex((z) => z.id === lz.id);
          if (idx >= 0) merged[idx] = lz;
          else merged.push(lz);
        }
        return merged;
      });
      } catch (err) {
        console.warn("Fehler beim Laden der Zahlungen:", err);
      }
    };
    loadZahlungen();
  }, [selectedObjektId, isDemo]);

  // Hilfsfunktion zum Aktualisieren der bearbeiteten Mieter-Daten
  const updateEditedMieter = (
    field: keyof MieterDisplay,
    value: string | number | boolean | null,
  ) => {
    if (!editedMieter) return;
    setEditedMieter((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  // Verfügbare Wohnungen für das ausgewählte Objekt (für Dropdown)
  const availableWohnungen = useMemo(() => {
    if (!selectedObjektId) return [];
    return wohnungen.filter((w) => w.objektId === selectedObjektId);
  }, [wohnungen, selectedObjektId]);

  const handleSave = async () => {
    if (!selectedMieter || !editedMieter) return;

    // Update in Context
    await updateMieter(selectedMieter.id, {
      anrede: editedMieter.anrede,
      name: editedMieter.name,
      email: editedMieter.email,
      telefon: editedMieter.telefon,
      kaltmiete: editedMieter.kaltmiete,
      nebenkosten: editedMieter.nebenkosten,
      kaution: editedMieter.kaution,
      einzugsDatum: editedMieter.einzugsDatumRaw,
      mieteBis: editedMieter.mieteBisRaw,
      isKurzzeitvermietung: editedMieter.isKurzzeitvermietung,
      kurzzeitBis: editedMieter.kurzzeitBis,
      prozentanteil: editedMieter.prozentanteil,
    });

    // selectedMieter wird automatisch durch useEffect aktualisiert

    toast({
      title: "Gespeichert",
      description: `Mieterdaten für "${editedMieter.name}" wurden gespeichert.`,
    });
  };

  const handleAddHistorieMieter = () => {
    if (
      !selectedMieter ||
      !historieMieter.name ||
      !historieMieter.einzugsDatum
    ) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie mindestens Name und Einzugsdatum aus.",
        variant: "destructive",
      });
      return;
    }

    // Füge neuen ehemaligen Mieter hinzu
    addMieter({
      wohnungId: selectedMieter.wohnungId,
      name: historieMieter.name,
      email: "",
      telefon: "",
      einzugsDatum: historieMieter.einzugsDatum,
      kaltmiete: historieMieter.kaltmiete,
      nebenkosten: historieMieter.nebenkosten,
      kaution: 0,
      mieteBis: historieMieter.auszugsDatum || null,
      isAktiv: false,
      isKurzzeitvermietung: historieMieter.isKurzzeitvermietung,
      kurzzeitBis: null,
      prozentanteil: historieMieter.prozentanteil,
    });

    setIsHistorieMieterOpen(false);
    setHistorieMieter({
      name: "",
      einzugsDatum: "",
      auszugsDatum: "",
      kaltmiete: 0,
      nebenkosten: 0,
      prozentanteil: 0,
      isKurzzeitvermietung: false,
    });

    toast({
      title: "Historie-Eintrag hinzugefügt",
      description: `${historieMieter.name} wurde zur Historie hinzugefügt.`,
    });
  };

  const handleExportAllDataPDF = () => {
    if (!selectedMieter || !editedMieter) return;

    const content: any[] = [];

    // Stammdaten
    content.push(
      { type: "heading", text: "Stammdaten" },
      {
        type: "table",
        data: {
          headers: ["Feld", "Wert"],
          rows: [
            ["Name", editedMieter.name],
            ["Wohnung", editedMieter.geschoss],
            ["E-Mail", editedMieter.email || "-"],
            ["Telefon", editedMieter.telefon || "-"],
            [
              "Einzugsdatum",
              new Date(editedMieter.einzugsDatumRaw).toLocaleDateString(
                "de-DE",
              ),
            ],
            [
              "Auszugsdatum",
              editedMieter.mieteBisRaw
                ? new Date(editedMieter.mieteBisRaw).toLocaleDateString("de-DE")
                : "Unbefristet",
            ],
            [
              "Kaltmiete",
              `${editedMieter.kaltmiete.toLocaleString("de-DE")} €`,
            ],
            [
              "NK-Vorauszahlung (mtl.)",
              `${editedMieter.nebenkosten.toLocaleString("de-DE")} €`,
            ],
            ["Kaution", `${editedMieter.kaution.toLocaleString("de-DE")} €`],
            [
              "Kurzzeitvermietung",
              editedMieter.isKurzzeitvermietung ? "Ja" : "Nein",
            ],
          ],
        },
      },
      { type: "spacer", height: 10 },
    );

    // Historie
    content.push(
      { type: "heading", text: "Mieterhistorie" },
      {
        type: "table",
        data: {
          headers: ["Name", "Von", "Bis", "Miete", "Status"],
          rows: alleMieterFuerWohnung.map((m) => [
            m.name,
            new Date(m.einzugsDatum).toLocaleDateString("de-DE"),
            m.mieteBis
              ? new Date(m.mieteBis).toLocaleDateString("de-DE")
              : "heute",
            `${m.kaltmiete.toLocaleString("de-DE")} €`,
            m.isAktiv !== false && !m.mieteBis ? "Aktuell" : "Ehemalig",
          ]),
        },
      },
      { type: "spacer", height: 10 },
    );

    // Verteilungsschlüssel
    content.push(
      { type: "heading", text: "Verteilungsschlüssel" },
      {
        type: "table",
        data: {
          headers: ["Feld", "Wert"],
          rows: [
            ["Wohnung", editedMieter.geschoss],
            ["Prozentanteil", `${editedMieter.prozentanteil}%`],
          ],
        },
      },
    );

    const doc = generatePDF({
      title: `Mieterdaten - ${editedMieter.name}`,
      subtitle: `${currentObjekt?.name || ""} - ${editedMieter.geschoss}`,
      content,
      profile: profile,
      footer: `Hausverwaltung Boss - ${currentObjekt?.objektdaten.strasse || ""}, ${currentObjekt?.objektdaten.plz || ""} ${currentObjekt?.objektdaten.ort || ""}`,
    });

    downloadPDF(
      doc,
      sanitizeFilename(
        `Mieterdaten_${editedMieter.name}_${new Date().toISOString().split("T")[0]}`,
      ),
    );

    toast({
      title: "PDF erstellt",
      description: `Mieterdaten für ${editedMieter.name} wurden als PDF exportiert.`,
    });
  };

  const handleExportKommunikationPDF = () => {
    if (!selectedMieter) return;
    const doc = generateMieterKommunikationPDF({
      mieterName: selectedMieter.name,
      mieterAdresse: `${currentObjekt?.objektdaten.strasse || ""}\n${
        currentObjekt?.objektdaten.plz || ""
      } ${currentObjekt?.objektdaten.ort || ""}`,
      betreff,
      nachricht,
      absender: "Mit freundlichen Grüßen\nIhre Hausverwaltung Boss",
      profile: profile,
    });
    downloadPDF(
      doc,
      sanitizeFilename(
        `mitteilung_${selectedMieter.name}_${new Date().toISOString().split("T")[0]}`,
      ),
    );
  };

  const handleCreateMieter = async () => {
    if (!newMieter.wohnungId || !newMieter.name) {
      toast({
        title: "Fehler",
        description:
          "Bitte wählen Sie eine Wohnung und geben Sie einen Namen ein.",
        variant: "destructive",
      });
      return;
    }

    // Demo-Modus Einschränkung
    if (isDemo) {
      toast({
        title: "Demo-Modus",
        description:
          "Im Demo-Modus können keine neuen Mieter angelegt werden. Bitte melden Sie sich an, um diese Funktion zu nutzen.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingMieter(true);
    try {
      // Füge neuen Mieter über Context hinzu
      await addMieter({
        wohnungId: newMieter.wohnungId,
        anrede: newMieter.anrede,
        name: newMieter.name,
        email: newMieter.email,
        telefon: newMieter.telefon,
        einzugsDatum: newMieter.einzugsDatum,
        mieteBis: null,
        kaltmiete: newMieter.kaltmiete,
        nebenkosten: newMieter.nebenkosten,
        kaution: newMieter.kaution,
        isKurzzeitvermietung: newMieter.isKurzzeitvermietung,
        kurzzeitBis: newMieter.isKurzzeitvermietung
          ? newMieter.kurzzeitBis
          : null,
        isAktiv: true,
        prozentanteil: newMieter.prozentanteil,
      });

      const createdName = newMieter.name;
      setIsNewMieterOpen(false);
      setNewMieter({
        name: "",
        anrede: "familie",
        wohnungId: "",
        email: "",
        telefon: "",
        einzugsDatum: new Date().toISOString().split("T")[0],
        kaltmiete: 0,
        nebenkosten: 0,
        kaution: 0,
        isKurzzeitvermietung: false,
        kurzzeitBis: "",
        prozentanteil: 0,
      });

      toast({
        title: "Mieter angelegt",
        description: `${createdName} wurde erfolgreich angelegt.`,
      });
    } catch (error) {
      console.error("Error creating mieter:", error);
      toast({
        title: "Fehler",
        description:
          "Mieter konnte nicht angelegt werden. Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    } finally {
      setIsSavingMieter(false);
    }
  };

  const handleDeleteMieter = () => {
    if (!selectedMieter || mieterData.length <= 1) return;

    // Lösche über Context
    deleteMieter(selectedMieter.id);

    toast({
      title: "Mieter gelöscht",
      description: `${selectedMieter.name} wurde erfolgreich gelöscht.`,
    });
  };

  // Zahlungs-Hilfsfunktionen
  const getCurrentMonthKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  const getZahlungForMieter = (mieterId: string): ZahlungEintrag => {
    const monat = getCurrentMonthKey();
    const existing = zahlungen.find((z) => z.mieterId === mieterId && z.monat === monat);
    if (existing) return existing;
    const m = mieterData.find((x) => x.id === mieterId);
    const heute = new Date();
    const faellig = `${heute.getFullYear()}-${String(heute.getMonth() + 1).padStart(2, "0")}-01`;
    const diffDays = Math.floor((heute.getTime() - new Date(faellig).getTime()) / 86400000);
    return {
      id: `auto-${mieterId}-${monat}`,
      mieterId,
      monat,
      faelligkeitsdatum: faellig,
      sollBetrag: (m?.kaltmiete || 0) + (m?.nebenkosten || 0),
      istBetrag: 0,
      buchungsdatum: "",
      wertstellungsdatum: "",
      verwendungszweck: "",
      ibanAbsender: "",
      auftraggeber: "",
      referenz: "",
      status: diffDays > 3 ? "ueberfaellig" : "ausstehend",
    };
  };

  const updateZahlung = (z: ZahlungEintrag) => {
    setZahlungen((prev) => {
      const idx = prev.findIndex((x) => x.id === z.id);
      if (idx >= 0) return prev.map((x) => (x.id === z.id ? z : x));
      return [...prev, z];
    });
  };

  const getMahnText = (eskalation: string) => {
    if (!editedMieter) return "";
    const z = getZahlungForMieter(editedMieter.id);
    const diff = z.sollBetrag - z.istBetrag;
    const faelligDate = new Date(z.faelligkeitsdatum);
    const zahlungsFrist = new Date(faelligDate);
    zahlungsFrist.setDate(zahlungsFrist.getDate() + 7);
    const monatName = faelligDate.toLocaleDateString("de-DE", { month: "long", year: "numeric" });
    const fristStr = zahlungsFrist.toLocaleDateString("de-DE");
    const anredeText = editedMieter.anrede === "herr"
      ? `Sehr geehrter Herr ${editedMieter.name}`
      : editedMieter.anrede === "frau"
      ? `Sehr geehrte Frau ${editedMieter.name}`
      : `Sehr geehrte Familie ${editedMieter.name}`;
    const anrede = anredeText;
    const prefix = eskalation === "Erinnerung"
      ? "möchten wir Sie freundlich daran erinnern, dass"
      : eskalation === "1. Mahnung"
      ? "stellen wir Ihnen hiermit die erste Mahnung aus. Die"
      : "stellen wir Ihnen hiermit die zweite und letzte Mahnung aus. Die";
    return `${anrede},\n\nwir ${prefix} die Mietzahlung für ${monatName} in Höhe von ${z.sollBetrag.toLocaleString("de-DE")} € auf unserem Konto bisher nicht eingegangen ist.\n\nFälligkeitsdatum: ${faelligDate.toLocaleDateString("de-DE")}\nAusstehender Betrag: ${diff.toLocaleString("de-DE")} €\n\nWir bitten Sie, den ausstehenden Betrag bis zum ${fristStr} zu überweisen.\n\nBei Rückfragen stehen wir Ihnen gerne zur Verfügung.\n\nMit freundlichen Grüßen,\n${profile.name}\n${currentObjekt?.adresse || ""}\n${currentObjekt?.objektdaten?.strasse || ""}`;
  };

  // CAMT-Import Handler
  const handleCamtFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Input zurücksetzen (damit dieselbe Datei nochmal geladen werden kann)
    e.target.value = "";

    setIsImporting(true);
    try {
      const xmlString = await file.text();
      const transaktionen = parseCamtXml(xmlString);

      const mieterMatchList = mieterData.map((m) => ({ id: m.id, name: m.name }));
      const monat = getCurrentMonthKey();

      let zugeordnet = 0;
      let nichtZugeordnet = 0;

      const neueZahlungen: ZahlungEintrag[] = transaktionen.map((t) => {
        const match = matchTransaktionToMieter(t, mieterMatchList);
        if (match) zugeordnet++;
        else nichtZugeordnet++;

        const mieterId = match?.mieterId ?? "unbekannt";
        const m = mieterData.find((x) => x.id === mieterId);
        const soll = m ? m.kaltmiete + m.nebenkosten : 0;

        return {
          id: t.endToEndId && t.endToEndId !== "NOTPROVIDED"
            ? t.endToEndId
            : `camt-${t.buchungsdatum}-${t.betrag}-${(t.auftraggeberName || "").replace(/\s/g, "").slice(0, 20)}`,
          mieterId,
          monat,
          faelligkeitsdatum: `${monat}-01`,
          sollBetrag: soll,
          istBetrag: t.betrag,
          buchungsdatum: t.buchungsdatum,
          wertstellungsdatum: t.wertstellungsdatum,
          verwendungszweck: t.verwendungszweck,
          ibanAbsender: t.auftraggeberIban,
          auftraggeber: t.auftraggeberName,
          referenz: t.endToEndId,
          status: t.betrag >= soll ? "bezahlt" : soll > 0 ? "ueberfaellig" : "offen",
        } as ZahlungEintrag;
      });

      // Prüfe auf Duplikate (per ID oder per Buchungsdatum+Betrag+Auftraggeber)
      const duplikate = neueZahlungen.filter((nz) =>
        zahlungen.some((z) =>
          z.id === nz.id ||
          (z.buchungsdatum === nz.buchungsdatum && z.istBetrag === nz.istBetrag && z.auftraggeber === nz.auftraggeber && z.buchungsdatum !== "")
        )
      ).length;

      if (duplikate > 0) {
        // Duplikate gefunden – User muss bestätigen
        setPendingImport({ dateiname: file.name, neueZahlungen, zugeordnet, nichtZugeordnet, duplikate });
        setIsImporting(false);
        return;
      }

      // Keine Duplikate – direkt importieren
      await executeImport(file.name, neueZahlungen, zugeordnet, nichtZugeordnet);
    } catch (err) {
      toast({
        title: "Import fehlgeschlagen",
        description: err instanceof Error ? err.message : "Unbekannter Fehler beim Parsen der CAMT-Datei.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Import bestätigen (nach Duplikat-Warnung)
  const confirmPendingImport = async () => {
    if (!pendingImport) return;
    setIsImporting(true);
    setPendingImport(null);
    await executeImport(pendingImport.dateiname, pendingImport.neueZahlungen, pendingImport.zugeordnet, pendingImport.nichtZugeordnet);
    setIsImporting(false);
  };

  // Import ausführen (State + Supabase)
  const executeImport = async (dateiname: string, neueZahlungen: ZahlungEintrag[], zugeordnet: number, nichtZugeordnet: number) => {
      // Bestehende Zahlungen durch importierte ersetzen (Upsert per ID)
      setZahlungen((prev) => {
        const updated = [...prev];
        for (const nz of neueZahlungen) {
          const idx = updated.findIndex((z) => z.id === nz.id);
          if (idx >= 0) updated[idx] = nz;
          else updated.push(nz);
        }
        return updated;
      });

      // Supabase persistieren (nur wenn NICHT Demo-Modus und User eingeloggt)
      if (!isDemo && user?.id) {
        try {
          const supabase = createClient();
          if (supabase) {
            const supabaseRows = neueZahlungen.map((z) => ({
              id: z.id,
              user_id: user.id,
              mieter_id: z.mieterId !== "unbekannt" ? z.mieterId : null,
              monat: z.monat,
              soll_betrag: z.sollBetrag,
              betrag: z.istBetrag,
              buchungsdatum: z.buchungsdatum || null,
              wertstellungsdatum: z.wertstellungsdatum || null,
              verwendungszweck: z.verwendungszweck || null,
              auftraggeber_name: z.auftraggeber || null,
              auftraggeber_iban: z.ibanAbsender || null,
              zahlungsreferenz: z.referenz || null,
              status: z.status,
              zugeordnet_via: null,
            }));

            const { error: supabaseError } = await supabase
              .from("zahlungen")
              .upsert(supabaseRows, { onConflict: "id" });

            if (supabaseError) {
              console.warn("Supabase upsert fehlgeschlagen (Daten lokal gespeichert):",
                supabaseError.message || supabaseError.code || "Unbekannt");
            }
          }
        } catch (err) {
          console.warn("Supabase Persistierung fehlgeschlagen, Daten nur lokal:", err);
        }
      }

      setCamtImportResult({
        dateiname,
        anzahl: neueZahlungen.length,
        zugeordnet,
        zeitpunkt: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
      });

      toast({
        title: `CAMT-Import erfolgreich`,
        description: `${neueZahlungen.length} Transaktionen importiert – ${zugeordnet} zugeordnet, ${nichtZugeordnet} nicht zugeordnet.`,
      });
  };

  // Wenn kein Objekt ausgewählt
  if (!selectedObjektId) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <Card className="p-8 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Kein Objekt ausgewählt</h2>
          <p className="text-muted-foreground">
            Bitte wählen Sie oben ein Objekt aus, um die Mieter anzuzeigen.
          </p>
        </Card>
      </div>
    );
  }

  // Wenn keine Mieter vorhanden
  if (mieterData.length === 0) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <Card className="p-8 text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Keine Mieter</h2>
          <p className="text-muted-foreground mb-4">
            Für &quot;{currentObjekt?.name}&quot; sind noch keine Mieter
            angelegt.
          </p>
          {availableWohnungen.length > 0 ? (
            <Button
              className="gap-2 bg-success hover:bg-success/90 text-success-foreground"
              onClick={() => setIsNewMieterOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Ersten Mieter anlegen
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              Bitte legen Sie zuerst Wohnungen an.
            </p>
          )}
        </Card>

        <Dialog open={isNewMieterOpen} onOpenChange={setIsNewMieterOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Neuen Mieter anlegen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-wohnung">Wohnung</Label>
                <Select
                  value={newMieter.wohnungId}
                  onValueChange={(value) =>
                    setNewMieter((prev) => ({ ...prev, wohnungId: value }))
                  }
                >
                  <SelectTrigger id="new-wohnung">
                    <SelectValue placeholder="Wohnung auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableWohnungen.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.bezeichnung} ({w.flaeche} m²)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-anrede">Anrede</Label>
                  <Select
                    value={newMieter.anrede}
                    onValueChange={(value) =>
                      setNewMieter((prev) => ({ ...prev, anrede: value }))
                    }
                  >
                    <SelectTrigger id="new-anrede">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="familie">Familie</SelectItem>
                      <SelectItem value="herr">Herr</SelectItem>
                      <SelectItem value="frau">Frau</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-name">Name</Label>
                  <Input
                    id="new-name"
                    value={newMieter.name}
                    onChange={(e) =>
                      setNewMieter((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="z.B. Familie Schmidt"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-einzug">Einzugsdatum</Label>
                  <Input
                    id="new-einzug"
                    type="date"
                    value={newMieter.einzugsDatum}
                    onChange={(e) =>
                      setNewMieter((prev) => ({
                        ...prev,
                        einzugsDatum: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-kaltmiete">Kaltmiete (€)</Label>
                  <Input
                    id="new-kaltmiete"
                    type="number"
                    value={newMieter.kaltmiete}
                    onChange={(e) =>
                      setNewMieter((prev) => ({
                        ...prev,
                        kaltmiete: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="new-nebenkosten">NK-Vorauszahlung mtl. (€)</Label>
                  <Input
                    id="new-nebenkosten"
                    type="number"
                    value={newMieter.nebenkosten}
                    onChange={(e) =>
                      setNewMieter((prev) => ({
                        ...prev,
                        nebenkosten: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-kaution">Kaution (€)</Label>
                  <Input
                    id="new-kaution"
                    type="number"
                    value={newMieter.kaution}
                    onChange={(e) =>
                      setNewMieter((prev) => ({
                        ...prev,
                        kaution: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsNewMieterOpen(false)}
              >
                Abbrechen
              </Button>
              <Button
                className="bg-success hover:bg-success/90 text-success-foreground"
                onClick={handleCreateMieter}
                disabled={isSavingMieter}
              >
                {isSavingMieter ? "Wird angelegt..." : "Mieter anlegen"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-6 h-auto md:h-[calc(100vh-8rem)]">
      {/* Left: Tenants List */}
      <Card className="w-full md:w-80 shrink-0 flex flex-col max-h-[300px] md:max-h-full">
        <CardHeader className="pb-3 space-y-3">
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <CardTitle className="text-base">
                {currentObjekt?.name || "Mieter"}
              </CardTitle>
              <CardDescription className="text-xs">
                {mieterData.length} {mieterData.length === 1 ? "Mieter" : "Mieter"}
              </CardDescription>
            </div>
            <Button
              size="sm"
              className="w-full gap-1 h-8 bg-success hover:bg-success/90 text-success-foreground"
              onClick={() => setIsNewMieterOpen(true)}
            >
              <Plus className="h-3 w-3" />
              Mieter anlegen
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto p-2">
          <div className="space-y-0.5">
            {mieterData.map((m) => {
              const isSelected = selectedMieter?.id === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMieter(m)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors ${
                    isSelected
                      ? "bg-muted border-border"
                      : "border-transparent hover:bg-accent hover:border-border text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-sm font-medium truncate">{m.name}</p>
                        {(() => {
                          const z = getZahlungForMieter(m.id);
                          if (z.status === "ueberfaellig") return (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md border shrink-0 bg-destructive/10 text-destructive border-destructive/20">Fällig</span>
                          );
                          if (z.status === "ausstehend") return (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md border shrink-0 bg-amber-500/10 text-amber-600 border-amber-500/20">Offen</span>
                          );
                          return (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md border shrink-0 bg-success/10 text-success border-success/20">Bezahlt</span>
                          );
                        })()}
                      </div>
                      <p className="text-xs truncate text-muted-foreground">{m.geschoss}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Right: Tenant Details with Tabs */}
      {selectedMieter && (
        <div className="flex-1 overflow-auto space-y-4">
          <div className="flex items-center justify-end gap-2 pb-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExportAllDataPDF}>
                  <FileDown className="h-4 w-4 mr-2" />
                  In PDF Exportieren
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleDeleteMieter}
                  disabled={mieterData.length <= 1}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Löschen
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              size="sm"
              className="gap-2 bg-success hover:bg-success/90 text-success-foreground"
              onClick={handleSave}
            >
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">Speichern</span>
            </Button>
          </div>

          <Tabs defaultValue="stammdaten" className="w-full">
            <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 max-w-4xl h-auto">
              <TabsTrigger
                value="stammdaten"
                className="text-xs sm:text-sm py-2"
              >
                Stammdaten
              </TabsTrigger>
              <TabsTrigger value="historie" className="text-xs sm:text-sm py-2">
                <Calendar className="h-3 w-3 mr-1 hidden sm:inline" />
                Historie
              </TabsTrigger>
              <TabsTrigger
                value="verteilung"
                className="text-xs sm:text-sm py-2"
              >
                Schlüssel
              </TabsTrigger>
              <TabsTrigger value="zaehler" className="text-xs sm:text-sm py-2">
                Zähler
              </TabsTrigger>
              <TabsTrigger
                value="zahlungen"
                className="text-xs sm:text-sm py-2"
              >
                <span className="flex items-center gap-1.5">
                  Zahlungen
                  {(() => {
                    if (!editedMieter) return null;
                    const z = getZahlungForMieter(editedMieter.id);
                    if (z.status === "ueberfaellig") return (
                      <span className="w-2 h-2 rounded-full bg-destructive shrink-0" />
                    );
                    if (z.status === "ausstehend") return (
                      <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                    );
                    return null;
                  })()}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="kommunikation"
                className="text-xs sm:text-sm py-2"
              >
                Kontakt
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Stammdaten */}
            <TabsContent
              value="stammdaten"
              className="mt-4 sm:mt-6 space-y-4"
            >
              {/* Sektion: Stammdaten */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Stammdaten
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="anrede">Anrede</Label>
                      <Select
                        value={editedMieter?.anrede || 'familie'}
                        onValueChange={(value) =>
                          updateEditedMieter("anrede", value)
                        }
                      >
                        <SelectTrigger id="anrede">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="herr">Herr</SelectItem>
                          <SelectItem value="frau">Frau</SelectItem>
                          <SelectItem value="familie">Familie</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={editedMieter?.name || ""}
                        onChange={(e) =>
                          updateEditedMieter("name", e.target.value)
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="email">E-Mail</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editedMieter?.email || ""}
                        onChange={(e) =>
                          updateEditedMieter("email", e.target.value)
                        }
                        placeholder="mieter@email.de"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="telefon">Telefon</Label>
                      <Input
                        id="telefon"
                        value={editedMieter?.telefon || ""}
                        onChange={(e) =>
                          updateEditedMieter("telefon", e.target.value)
                        }
                        placeholder="030 12345678"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sektion: Mietverhältnis */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Mietverhältnis
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="geschoss">Wohnung</Label>
                      <Input
                        id="geschoss"
                        value={editedMieter?.geschoss || ""}
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="einzug">Einzugsdatum</Label>
                      <Input
                        id="einzug"
                        type="date"
                        value={editedMieter?.einzugsDatumRaw || ""}
                        onChange={(e) =>
                          updateEditedMieter("einzugsDatumRaw", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="auszug">Auszugsdatum</Label>
                      <Input
                        id="auszug"
                        type="date"
                        value={editedMieter?.mieteBisRaw || ""}
                        onChange={(e) =>
                          updateEditedMieter(
                            "mieteBisRaw",
                            e.target.value || null,
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 pt-1">
                    <Checkbox
                      id="kurzzeitvermietung"
                      checked={editedMieter?.isKurzzeitvermietung || false}
                      onCheckedChange={(checked) =>
                        setEditedMieter((prev) =>
                          prev
                            ? {
                                ...prev,
                                isKurzzeitvermietung: checked === true,
                              }
                            : null,
                        )
                      }
                    />
                    <Label
                      htmlFor="kurzzeitvermietung"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Kurzzeitvermietung
                    </Label>
                  </div>
                  {editedMieter?.isKurzzeitvermietung && (
                    <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
                      <h4 className="text-sm font-medium">
                        Kurzzeitvermietung Zeitraum
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label htmlFor="kurzzeit-von">Von (Einzug)</Label>
                          <Input
                            id="kurzzeit-von"
                            type="date"
                            value={editedMieter?.einzugsDatumRaw || ""}
                            onChange={(e) =>
                              updateEditedMieter(
                                "einzugsDatumRaw",
                                e.target.value,
                              )
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="kurzzeit-bis">Bis (Auszug)</Label>
                          <Input
                            id="kurzzeit-bis"
                            type="date"
                            value={editedMieter?.kurzzeitBis || ""}
                            onChange={(e) =>
                              updateEditedMieter("kurzzeitBis", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Sektion: Mietkosten */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Mietkosten
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="kaltmiete">Kaltmiete (€)</Label>
                      <Input
                        id="kaltmiete"
                        type="number"
                        value={editedMieter?.kaltmiete || 0}
                        onChange={(e) =>
                          updateEditedMieter(
                            "kaltmiete",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="nebenkosten">NK-Vorauszahlung mtl. (€)</Label>
                      <Input
                        id="nebenkosten"
                        type="number"
                        value={editedMieter?.nebenkosten || 0}
                        onChange={(e) =>
                          updateEditedMieter(
                            "nebenkosten",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="kaution">Kaution (€)</Label>
                      <Input
                        id="kaution"
                        type="number"
                        value={editedMieter?.kaution || 0}
                        onChange={(e) =>
                          updateEditedMieter(
                            "kaution",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Gesamt mtl. (€)</Label>
                      <Input
                        value={(editedMieter?.kaltmiete || 0) + (editedMieter?.nebenkosten || 0)}
                        readOnly
                        className="bg-muted font-medium"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 2: Mieterhistorie / Timeline */}
            <TabsContent value="historie" className="mt-6 space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Mietzeiträume für {editedMieter?.geschoss}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Übersicht aller Mieter dieser Wohnung inkl. Zeiträume
                      </CardDescription>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={() => setIsHistorieMieterOpen(true)}
                    >
                      <Plus className="h-3 w-3" />
                      Vorherigen Mieter hinzufügen
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Timeline Visualisierung */}
                  <div className="space-y-3">
                    {alleMieterFuerWohnung
                      .sort(
                        (a, b) =>
                          new Date(a.einzugsDatum).getTime() -
                          new Date(b.einzugsDatum).getTime(),
                      ) // Chronologisch: älteste zuerst
                      .map((m, index, array) => {
                        const isCurrentMieter = m.id === editedMieter?.id;
                        const einzug = new Date(m.einzugsDatum);
                        const auszug = m.mieteBis ? new Date(m.mieteBis) : null;
                        const isAktiv = m.isAktiv !== false && !m.mieteBis;

                        // Berechne Mietdauer
                        const endDate = auszug || new Date();
                        const durationMs = endDate.getTime() - einzug.getTime();
                        const durationMonths = Math.floor(
                          durationMs / (1000 * 60 * 60 * 24 * 30.44),
                        );
                        const durationYears = Math.floor(durationMonths / 12);
                        const remainingMonths = durationMonths % 12;

                        let durationText = "";
                        if (durationYears > 0) {
                          durationText = `${durationYears} Jahr${durationYears !== 1 ? "e" : ""}`;
                          if (remainingMonths > 0) {
                            durationText += `, ${remainingMonths} Monat${remainingMonths !== 1 ? "e" : ""}`;
                          }
                        } else {
                          durationText = `${durationMonths} Monat${durationMonths !== 1 ? "e" : ""}`;
                        }

                        return (
                          <div
                            key={m.id}
                            className={`relative pl-8 pb-4 ${
                              index !== array.length - 1
                                ? "border-l-2 border-muted-foreground/20"
                                : ""
                            }`}
                          >
                            {/* Timeline Punkt */}
                            <div
                              className={`absolute left-[-5px] top-0 w-3 h-3 rounded-full border-2 border-background ${
                                isAktiv
                                  ? "bg-success ring-2 ring-success/20"
                                  : "bg-muted-foreground/50"
                              }`}
                            />

                            <div
                              className={`p-3 rounded-lg border ${
                                isCurrentMieter
                                  ? "border-primary bg-primary/5"
                                  : "border-muted"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{m.name}</span>
                                  {isAktiv && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs bg-success/10 text-success border-success/20"
                                    >
                                      Aktuell
                                    </Badge>
                                  )}
                                  {m.isKurzzeitvermietung && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs bg-amber-500/10 text-amber-500 border-amber-500/20"
                                    >
                                      Kurzzeit
                                    </Badge>
                                  )}
                                  {!isAktiv && (
                                    <Badge
                                      variant="outline"
                                      className="text-xs bg-muted text-muted-foreground"
                                    >
                                      Ehemalig
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {m.prozentanteil ? `${m.prozentanteil}%` : ""}
                                </span>
                              </div>

                              {/* Zeitraum-Balken */}
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground font-medium">
                                  {einzug.toLocaleDateString("de-DE")}
                                </span>
                                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden relative">
                                  <div
                                    className={`h-full transition-all ${
                                      isAktiv
                                        ? "bg-gradient-to-r from-success/70 to-success"
                                        : "bg-gradient-to-r from-muted-foreground/30 to-muted-foreground/50"
                                    }`}
                                    style={{ width: "100%" }}
                                  />
                                </div>
                                <span className="text-muted-foreground font-medium">
                                  {auszug
                                    ? auszug.toLocaleDateString("de-DE")
                                    : "heute"}
                                </span>
                              </div>

                              {/* Details */}
                              <div className="mt-2 flex items-center justify-between">
                                <div className="flex flex-col gap-1">
                                  <span className="text-xs text-muted-foreground">
                                    Miete: {m.kaltmiete.toLocaleString("de-DE")}{" "}
                                    € + {m.nebenkosten.toLocaleString("de-DE")}{" "}
                                    € NK
                                  </span>
                                  <span className="text-xs text-muted-foreground font-medium">
                                    Dauer: {durationText}
                                    {isAktiv ? " (läuft)" : ""}
                                  </span>
                                </div>
                                {!isAktiv && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 text-xs"
                                    onClick={() => {
                                      setEditingHistorieMieterId(m.id);
                                      setHistorieMieter({
                                        name: m.name,
                                        einzugsDatum: m.einzugsDatum,
                                        auszugsDatum: m.mieteBis || "",
                                        kaltmiete: m.kaltmiete,
                                        nebenkosten: m.nebenkosten,
                                        prozentanteil: m.prozentanteil || 0,
                                        isKurzzeitvermietung:
                                          m.isKurzzeitvermietung || false,
                                      });
                                      setIsHistorieMieterOpen(true);
                                    }}
                                  >
                                    Bearbeiten
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                    {alleMieterFuerWohnung.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Keine Mieterhistorie für diese Wohnung vorhanden.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 3: Verteilungsschlüssel */}
            <TabsContent value="verteilung" className="mt-6 space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Verteilungsschlüssel
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Informationen zur Nebenkostenabrechnung für{" "}
                    {editedMieter?.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="wohnflaeche-anteil">Wohnung</Label>
                      <Input
                        id="wohnflaeche-anteil"
                        value={editedMieter?.geschoss || ""}
                        readOnly
                        className="bg-muted"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prozentanteile">Prozentanteil (%)</Label>
                      <Input
                        id="prozentanteile"
                        type="number"
                        step="0.1"
                        value={editedMieter?.prozentanteil || 0}
                        onChange={(e) =>
                          updateEditedMieter(
                            "prozentanteil",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        placeholder="z.B. 12.5"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Der Prozentanteil wird für die Verteilung der Nebenkosten
                    verwendet. Vergessen Sie nicht, die Änderungen zu speichern.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 3: Zählerstände (Zwischenzähler) */}
            <TabsContent value="zaehler" className="mt-6 space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Zählerstände (Zwischenzähler)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Zähler für {editedMieter?.name} - {editedMieter?.geschoss}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Die Zählerstände werden im Bereich "Zählerstände" verwaltet.
                  </p>
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm">
                      Wohnung:{" "}
                      <span className="font-medium">
                        {editedMieter?.geschoss}
                      </span>
                    </p>
                    <p className="text-sm">
                      Mieter:{" "}
                      <span className="font-medium">{editedMieter?.name}</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 4: Zahlungen */}
            <TabsContent value="zahlungen" className="mt-4 space-y-4">
              {(() => {
                const monat = getCurrentMonthKey();
                const allZahlungen = mieterData.map((m) => getZahlungForMieter(m.id));
                const gesamteinnahmen = allZahlungen.reduce((s, z) => s + z.istBetrag, 0);
                const offeneBetrage = allZahlungen.reduce((s, z) => s + Math.max(0, z.sollBetrag - z.istBetrag), 0);
                const inVerzug = allZahlungen.filter((z) => z.status === "ueberfaellig").length;
                const vorige7Tage = new Date(); vorige7Tage.setDate(vorige7Tage.getDate() - 7);
                const dieseWoche = allZahlungen
                  .filter((z) => z.buchungsdatum && new Date(z.buchungsdatum) >= vorige7Tage)
                  .reduce((s, z) => s + z.istBetrag, 0);

                const cz = editedMieter ? getZahlungForMieter(editedMieter.id) : null;
                const verzugstage = cz ? Math.max(0, Math.floor((Date.now() - new Date(cz.faelligkeitsdatum).getTime()) / 86400000)) : 0;
                const isUeberfaellig = cz?.status === "ueberfaellig";
                const currentMahnText = mahnTextCustom || getMahnText(mahnEskalation);
                const mieterMahnHistorie = editedMieter ? mahnHistorie.filter((m) => m.mieterId === editedMieter.id) : [];

                return (
                  <>
                    {/* Hidden File Input für CAMT-Import */}
                    <input
                      ref={camtFileInputRef}
                      type="file"
                      accept=".xml,application/xml,text/xml"
                      className="hidden"
                      onChange={handleCamtFileSelected}
                    />

                    {/* CAMT Import Banner */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-dashed border-border">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Upload className="h-4 w-4" />
                        <span>Kontoauszug importieren (CAMT.053 / MT940)</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        disabled={isImporting}
                        onClick={() => camtFileInputRef.current?.click()}
                      >
                        <Upload className="h-3.5 w-3.5" />
                        {isImporting ? "Importiere…" : "Datei importieren"}
                      </Button>
                    </div>

                    {/* Duplikat-Warnung */}
                    {pendingImport && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400">
                        <div className="flex items-center gap-2 text-sm">
                          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                          <span>
                            <strong>{pendingImport.dateiname}</strong> enthält {pendingImport.duplikate} bereits vorhandene Buchungen. Überschreiben?
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 gap-1"
                            onClick={confirmPendingImport}
                          >
                            Überschreiben
                          </Button>
                          <button
                            className="text-amber-700 dark:text-amber-400 hover:text-amber-500 transition-colors"
                            onClick={() => setPendingImport(null)}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Import Erfolgs-Meldung */}
                    {camtImportResult && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-success/10 border border-success/30 text-success">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>
                            <strong>{camtImportResult.dateiname}</strong> – {camtImportResult.anzahl} Buchungen importiert, {camtImportResult.zugeordnet} zugeordnet ({camtImportResult.zeitpunkt})
                          </span>
                        </div>
                        <button
                          className="text-success hover:text-success/70 transition-colors"
                          onClick={() => setCamtImportResult(null)}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}


                    {/* Zahlungsstatus aktuellerMieter */}
                    {cz && editedMieter && (
                      <Card className={isUeberfaellig ? "border-destructive bg-destructive/5" : ""}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-base">
                                Zahlungen – {editedMieter.name}
                              </CardTitle>
                              <CardDescription className="text-xs">{editedMieter.geschoss} – {currentObjekt?.name}</CardDescription>
                            </div>
                            <div>
                              {cz.status === "bezahlt" && <Badge className="bg-success/10 text-success border-success/30 text-xs"><CheckCircle2 className="h-3 w-3 mr-1" />Bezahlt</Badge>}
                              {cz.status === "ausstehend" && <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs"><Clock className="h-3 w-3 mr-1" />Ausstehend</Badge>}
                              {cz.status === "ueberfaellig" && <Badge variant="destructive" className="text-xs"><AlertTriangle className="h-3 w-3 mr-1" />Überfällig seit {verzugstage} Tagen</Badge>}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">Soll-Betrag (€)</Label>
                              <Input value={cz.sollBetrag} readOnly className="bg-muted font-medium" />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">Ist-Betrag (€)</Label>
                              <Input
                                type="number"
                                value={cz.istBetrag}
                                className={isUeberfaellig ? "border-destructive" : ""}
                                onChange={(e) => {
                                  const ist = parseFloat(e.target.value) || 0;
                                  const diff = cz.sollBetrag - ist;
                                  const newStatus: ZahlungEintrag["status"] = ist >= cz.sollBetrag ? "bezahlt" : verzugstage > 3 ? "ueberfaellig" : "ausstehend";
                                  updateZahlung({ ...cz, istBetrag: ist, status: newStatus, buchungsdatum: ist > 0 && !cz.buchungsdatum ? new Date().toISOString().split("T")[0] : cz.buchungsdatum });
                                }}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">Differenz (€)</Label>
                              <Input
                                value={cz.sollBetrag - cz.istBetrag}
                                readOnly
                                className={`font-medium ${cz.sollBetrag - cz.istBetrag > 0 ? "bg-destructive/10 text-destructive" : "bg-success/10 text-success"}`}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">Fälligkeitsdatum</Label>
                              <Input
                                type="date"
                                value={cz.faelligkeitsdatum}
                                onChange={(e) => updateZahlung({ ...cz, faelligkeitsdatum: e.target.value })}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">Buchungsdatum</Label>
                              <Input
                                type="date"
                                value={cz.buchungsdatum}
                                onChange={(e) => updateZahlung({ ...cz, buchungsdatum: e.target.value })}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">Wertstellung</Label>
                              <Input
                                type="date"
                                value={cz.wertstellungsdatum}
                                onChange={(e) => updateZahlung({ ...cz, wertstellungsdatum: e.target.value })}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">Verzugstage</Label>
                              <Input value={cz.status === "bezahlt" ? 0 : verzugstage} readOnly className="bg-muted" />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">IBAN Auftraggeber</Label>
                              <Input
                                value={cz.ibanAbsender}
                                placeholder="DE12 3456 7890 ..."
                                onChange={(e) => updateZahlung({ ...cz, ibanAbsender: e.target.value })}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">Name Auftraggeber</Label>
                              <Input
                                value={cz.auftraggeber}
                                placeholder={editedMieter.name}
                                onChange={(e) => updateZahlung({ ...cz, auftraggeber: e.target.value })}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs text-muted-foreground">Verwendungszweck</Label>
                              <Input
                                value={cz.verwendungszweck}
                                placeholder="Miete Febr. 2026"
                                onChange={(e) => updateZahlung({ ...cz, verwendungszweck: e.target.value })}
                              />
                            </div>
                          </div>
                          {cz.status !== "bezahlt" && (
                            <Button
                              size="sm"
                              className="bg-success hover:bg-success/90 text-success-foreground gap-1.5"
                              onClick={() => {
                                updateZahlung({ ...cz, istBetrag: cz.sollBetrag, status: "bezahlt", buchungsdatum: new Date().toISOString().split("T")[0] });
                                toast({ title: "Zahlung bestätigt", description: `${editedMieter.name}: ${cz.sollBetrag.toLocaleString("de-DE")} € als bezahlt markiert.` });
                              }}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Als bezahlt markieren
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Mahnbereich - nur bei überfällig */}
                    {isUeberfaellig && editedMieter && (
                      <Card className="border-destructive/40">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-4 w-4" />
                            Mahnwesen
                          </CardTitle>
                          <CardDescription className="text-xs">
                            Eskalationsstufe wählen und Mahnschreiben versenden
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex gap-2">
                            {(["Erinnerung", "1. Mahnung", "2. Mahnung"] as const).map((stufe) => (
                              <Button
                                key={stufe}
                                size="sm"
                                variant={mahnEskalation === stufe ? "default" : "outline"}
                                className={mahnEskalation === stufe ? "bg-destructive hover:bg-destructive/90" : ""}
                                onClick={() => { setMahnEskalation(stufe); setMahnTextCustom(""); }}
                              >
                                {stufe}
                              </Button>
                            ))}
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Betreff</Label>
                            <Input
                              readOnly
                              value={`Zahlungserinnerung – ${editedMieter.name} – ${editedMieter.geschoss}`}
                              className="bg-muted text-sm"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">E-Mail Text (bearbeitbar)</Label>
                            <textarea
                              className="w-full min-h-[220px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-y focus:outline-none focus:ring-1 focus:ring-ring"
                              value={currentMahnText}
                              onChange={(e) => setMahnTextCustom(e.target.value)}
                            />
                          </div>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            {editedMieter.email ? (
                              <Button
                                className="bg-success hover:bg-success/90 text-success-foreground gap-2"
                                onClick={() => {
                                  const entry: MahnEintrag = {
                                    id: `mahn-${Date.now()}`,
                                    mieterId: editedMieter.id,
                                    datum: new Date().toLocaleDateString("de-DE"),
                                    eskalationsstufe: mahnEskalation,
                                    betreff: `Zahlungserinnerung – ${editedMieter.name} – ${editedMieter.geschoss}`,
                                    gesendetVon: profile.name,
                                  };
                                  setMahnHistorie((prev) => [entry, ...prev]);
                                  toast({ title: `${mahnEskalation} gesendet`, description: `Mahnschreiben für ${editedMieter.name} wurde protokolliert.` });
                                }}
                              >
                                <Mail className="h-4 w-4" />
                                E-Mail senden
                              </Button>
                            ) : (
                              <Button
                                className="bg-success hover:bg-success/90 text-success-foreground gap-2"
                                onClick={() => {
                                  const entry: MahnEintrag = {
                                    id: `mahn-${Date.now()}`,
                                    mieterId: editedMieter.id,
                                    datum: new Date().toLocaleDateString("de-DE"),
                                    eskalationsstufe: mahnEskalation,
                                    betreff: `Zahlungserinnerung – ${editedMieter.name} – ${editedMieter.geschoss}`,
                                    gesendetVon: profile.name,
                                  };
                                  setMahnHistorie((prev) => [entry, ...prev]);
                                  handleExportKommunikationPDF();
                                }}
                              >
                                <Printer className="h-4 w-4" />
                                Anschreiben drucken
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              className="gap-2"
                              onClick={() => {
                                toast({ title: "Entwurf gespeichert", description: "Das Mahnschreiben wurde als Entwurf gespeichert." });
                              }}
                            >
                              Als Entwurf speichern
                            </Button>
                            <p className="text-xs text-muted-foreground">
                              {editedMieter.email
                                ? "Diese E-Mail wird in der Mahnhistorie protokolliert."
                                : "Kein E-Mail hinterlegt – Anschreiben wird als PDF gedruckt und protokolliert."}
                            </p>
                          </div>

                          {/* Mahnhistorie */}
                          {mieterMahnHistorie.length > 0 && (
                            <div className="space-y-2 pt-2 border-t">
                              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Mahnhistorie</p>
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b">
                                      <th className="text-left py-1.5 pr-4 font-medium text-xs text-muted-foreground">Datum</th>
                                      <th className="text-left py-1.5 pr-4 font-medium text-xs text-muted-foreground">Eskalationsstufe</th>
                                      <th className="text-left py-1.5 pr-4 font-medium text-xs text-muted-foreground">Gesendet von</th>
                                      <th className="text-left py-1.5 font-medium text-xs text-muted-foreground">Betreff</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {mieterMahnHistorie.map((h) => (
                                      <tr key={h.id} className="border-b border-muted">
                                        <td className="py-1.5 pr-4 text-xs">{h.datum}</td>
                                        <td className="py-1.5 pr-4">
                                          <Badge variant="outline" className="text-xs text-destructive border-destructive/30">{h.eskalationsstufe}</Badge>
                                        </td>
                                        <td className="py-1.5 pr-4 text-xs">{h.gesendetVon}</td>
                                        <td className="py-1.5 text-xs text-muted-foreground">{h.betreff}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </>
                );
              })()}
            </TabsContent>

            {/* Tab 5: Kommunikation */}
            <TabsContent value="kommunikation" className="mt-6 space-y-6">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      Mitteilung an den Mieter
                    </CardTitle>
                    <Button
                      variant="outline"
                      className="gap-2 bg-transparent"
                      onClick={handleExportKommunikationPDF}
                    >
                      <FileDown className="h-4 w-4" />
                      Als PDF exportieren
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="betreff">Betreff</Label>
                    <Input
                      id="betreff"
                      value={betreff}
                      onChange={(e) => setBetreff(e.target.value)}
                      placeholder="Betreff der Mitteilung"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nachricht">Nachricht</Label>
                    <Textarea
                      id="nachricht"
                      placeholder="Geben Sie hier eine Mitteilung an den Mieter ein..."
                      rows={10}
                      value={nachricht}
                      onChange={(e) => setNachricht(e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      <Dialog open={isNewMieterOpen} onOpenChange={setIsNewMieterOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Neuen Mieter anlegen</DialogTitle>
            <DialogDescription>
              Erfassen Sie die Daten für einen neuen Mieter.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-wohnung">Wohnung</Label>
              <Select
                value={newMieter.wohnungId}
                onValueChange={(value) =>
                  setNewMieter((prev) => ({ ...prev, wohnungId: value }))
                }
              >
                <SelectTrigger id="new-wohnung">
                  <SelectValue placeholder="Wohnung auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {availableWohnungen.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.bezeichnung} ({w.flaeche} m²)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-anrede">Anrede</Label>
                <Select
                  value={newMieter.anrede}
                  onValueChange={(value) =>
                    setNewMieter((prev) => ({ ...prev, anrede: value }))
                  }
                >
                  <SelectTrigger id="new-anrede">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="familie">Familie</SelectItem>
                    <SelectItem value="herr">Herr</SelectItem>
                    <SelectItem value="frau">Frau</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-name">Name</Label>
                <Input
                  id="new-name"
                  value={newMieter.name}
                  onChange={(e) =>
                    setNewMieter((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="z.B. Familie Schmidt"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-einzug">Einzugsdatum</Label>
                <Input
                  id="new-einzug"
                  type="date"
                  value={newMieter.einzugsDatum}
                  onChange={(e) =>
                    setNewMieter((prev) => ({
                      ...prev,
                      einzugsDatum: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-kaltmiete">Kaltmiete (€)</Label>
                <Input
                  id="new-kaltmiete"
                  type="number"
                  value={newMieter.kaltmiete}
                  onChange={(e) =>
                    setNewMieter((prev) => ({
                      ...prev,
                      kaltmiete: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-nebenkosten">NK-Vorauszahlung mtl. (€)</Label>
                <Input
                  id="new-nebenkosten"
                  type="number"
                  value={newMieter.nebenkosten}
                  onChange={(e) =>
                    setNewMieter((prev) => ({
                      ...prev,
                      nebenkosten: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-kaution">Kaution (€)</Label>
                <Input
                  id="new-kaution"
                  type="number"
                  value={newMieter.kaution}
                  onChange={(e) =>
                    setNewMieter((prev) => ({
                      ...prev,
                      kaution: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>

            {/* Kurzzeitvermietung Rubrik */}
            <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="new-kurzzeitvermietung"
                  checked={newMieter.isKurzzeitvermietung}
                  onCheckedChange={(checked) =>
                    setNewMieter((prev) => ({
                      ...prev,
                      isKurzzeitvermietung: checked === true,
                    }))
                  }
                />
                <Label
                  htmlFor="new-kurzzeitvermietung"
                  className="text-sm font-medium"
                >
                  Kurzzeitvermietung
                </Label>
              </div>
              {newMieter.isKurzzeitvermietung && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-kurzzeit-von">Einzugsdatum: von</Label>
                    <Input
                      id="new-kurzzeit-von"
                      type="date"
                      value={newMieter.einzugsDatum}
                      onChange={(e) =>
                        setNewMieter((prev) => ({
                          ...prev,
                          einzugsDatum: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-kurzzeit-bis">Einzugsdatum: bis</Label>
                    <Input
                      id="new-kurzzeit-bis"
                      type="date"
                      value={newMieter.kurzzeitBis}
                      onChange={(e) =>
                        setNewMieter((prev) => ({
                          ...prev,
                          kurzzeitBis: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Ehemalige Mieter wiederverwenden */}
            {ehemaligeMieter.length > 0 && (
              <div className="border rounded-lg p-4 space-y-4 bg-blue-50/50 dark:bg-blue-950/20">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-blue-500" />
                  <Label className="text-sm font-medium">
                    Ehemaligen Mieter zuordnen
                  </Label>
                </div>
                <Select
                  value={selectedEhemaligerMieter}
                  onValueChange={(value) => {
                    setSelectedEhemaligerMieter(value);
                    const selected = ehemaligeMieter.find(
                      (m) => m.id === value,
                    );
                    if (selected) {
                      setNewMieter((prev) => ({
                        ...prev,
                        name: selected.name,
                        email: selected.email,
                        telefon: selected.telefon,
                      }));
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Ehemaligen Mieter auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {ehemaligeMieter.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name} (Auszug:{" "}
                        {new Date(m.letztesAuszugsDatum).toLocaleDateString(
                          "de-DE",
                        )}
                        )
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Wählen Sie einen ehemaligen Mieter aus, um dessen Daten zu
                  übernehmen.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewMieterOpen(false)}>
              Abbrechen
            </Button>
            <Button
              className="bg-success hover:bg-success/90 text-success-foreground"
              onClick={handleCreateMieter}
              disabled={isSavingMieter}
            >
              {isSavingMieter ? "Wird angelegt..." : "Mieter anlegen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog zum Hinzufügen/Bearbeiten von Historie-Mietern */}
      <Dialog
        open={isHistorieMieterOpen}
        onOpenChange={setIsHistorieMieterOpen}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingHistorieMieterId
                ? "Historie-Eintrag bearbeiten"
                : "Vorherigen Mieter hinzufügen"}
            </DialogTitle>
            <DialogDescription>
              Erfassen Sie die Daten eines vorherigen Mieters für die Historie.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="historie-name">Name des Mieters *</Label>
              <Input
                id="historie-name"
                value={historieMieter.name}
                onChange={(e) =>
                  setHistorieMieter((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="z.B. Max Mustermann"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="historie-einzug">Einzugsdatum *</Label>
                <Input
                  id="historie-einzug"
                  type="date"
                  value={historieMieter.einzugsDatum}
                  onChange={(e) =>
                    setHistorieMieter((prev) => ({
                      ...prev,
                      einzugsDatum: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="historie-auszug">Auszugsdatum</Label>
                <Input
                  id="historie-auszug"
                  type="date"
                  value={historieMieter.auszugsDatum}
                  onChange={(e) =>
                    setHistorieMieter((prev) => ({
                      ...prev,
                      auszugsDatum: e.target.value,
                    }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="historie-kaltmiete">Kaltmiete (€)</Label>
                <Input
                  id="historie-kaltmiete"
                  type="number"
                  value={historieMieter.kaltmiete}
                  onChange={(e) =>
                    setHistorieMieter((prev) => ({
                      ...prev,
                      kaltmiete: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="historie-nebenkosten">NK-Vorauszahlung mtl. (€)</Label>
                <Input
                  id="historie-nebenkosten"
                  type="number"
                  value={historieMieter.nebenkosten}
                  onChange={(e) =>
                    setHistorieMieter((prev) => ({
                      ...prev,
                      nebenkosten: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="historie-prozent">Prozentanteil (%)</Label>
                <Input
                  id="historie-prozent"
                  type="number"
                  step="0.1"
                  value={historieMieter.prozentanteil}
                  onChange={(e) =>
                    setHistorieMieter((prev) => ({
                      ...prev,
                      prozentanteil: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2 flex items-end pb-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="historie-kurzzeit"
                    checked={historieMieter.isKurzzeitvermietung}
                    onCheckedChange={(checked) =>
                      setHistorieMieter((prev) => ({
                        ...prev,
                        isKurzzeitvermietung: !!checked,
                      }))
                    }
                  />
                  <Label htmlFor="historie-kurzzeit" className="text-sm">
                    Kurzzeitvermietung
                  </Label>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsHistorieMieterOpen(false);
                setEditingHistorieMieterId(null);
                setHistorieMieter({
                  name: "",
                  einzugsDatum: "",
                  auszugsDatum: "",
                  kaltmiete: 0,
                  nebenkosten: 0,
                  prozentanteil: 0,
                  isKurzzeitvermietung: false,
                });
              }}
            >
              Abbrechen
            </Button>
            <Button
              className="bg-success hover:bg-success/90 text-success-foreground"
              onClick={handleAddHistorieMieter}
            >
              {editingHistorieMieterId ? "Aktualisieren" : "Hinzufügen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
