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
  FileText,
  Loader2,
  Pencil,
  Archive,
  FileSignature,
  CalendarClock,
  Building2,
  Scale,
  ExternalLink,
  Star,
  Info,
  Handshake,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { useAuth, getFullName } from "@/context/auth-context";
import { parseDatevCsv, matchDatevToMieter, getMonatFromBelegdatum } from "@/lib/parseDatev";
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

interface MieterEvent {
  id: string;
  user_id: string;
  mieter_id: string;
  event_type: string;
  title: string;
  description?: string | null;
  created_by?: string | null;
  created_at: string;
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

export function MieterdatenView({ initialMieterId }: { initialMieterId?: string } = {}) {
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
  const { isDemo, profile, user, isAdmin } = useAuth();

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
  const [datevImportResult, setDatevImportResult] = useState<{
    dateiname: string;
    anzahl: number;
    zugeordnet: number;
    offen: number;
    zeitpunkt: string;
  } | null>(null);
  const [pendingImport, setPendingImport] = useState<{
    dateiname: string;
    neueZahlungen: ZahlungEintrag[];
    zugeordnet: number;
    nichtZugeordnet: number;
    duplikate: number;
  } | null>(null);

  const datevFileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState("stammdaten");

  // Timeline-State
  const [events, setEvents] = useState<MieterEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventFilter, setEventFilter] = useState<string>("alle");
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState("");
  const [newNoteText, setNewNoteText] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Vertrag-State
  const [vertragDialogOpen, setVertragDialogOpen] = useState(false);
  const [vertragTyp, setVertragTyp] = useState<"unbefristet" | "befristet" | "kurzzeit" | null>(null);
  const [anwaltDialogOpen, setAnwaltDialogOpen] = useState(false);
  const [anwaltAdOpen, setAnwaltAdOpen] = useState(false);
  const [vertragForm, setVertragForm] = useState({
    vermieterName: "",
    vermieterAdresse: "",
    mieterAnrede: "",
    mieterName: "",
    objektAdresse: "",
    etage: "",
    flaeche: "",
    zimmer: "",
    einzugsdatum: "",
    enddatum: "",
    kaltmiete: "",
    nebenkosten: "",
    kaution: "",
    faelligkeit: "1",
    iban: "",
  });

  const { toast } = useToast();

  // Aktualisiere selectedMieter wenn sich mieterData ändert
  useEffect(() => {
    if (mieterData.length > 0) {
      if (initialMieterId) {
        const target = mieterData.find((m) => m.id === initialMieterId);
        if (target) {
          setSelectedMieter(target);
          return;
        }
      }
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

  // Zahlungen beim Start aus Supabase laden (nur wenn NICHT Demo-Modus und NICHT Admin)
  useEffect(() => {
    if (!selectedObjektId || isDemo || isAdmin) return;
    const loadZahlungen = async () => {
      try {
        const supabase = createClient();
        if (!supabase) {
          toast({ title: "Supabase nicht konfiguriert", description: "Zahlungen konnten nicht geladen werden.", variant: "destructive" });
          return;
        }
        const { data, error } = await supabase
          .from("zahlungen")
          .select("*")
          .order("buchungsdatum", { ascending: false });
        if (error) {
          toast({ title: "Laden fehlgeschlagen", description: `Zahlungen: ${error.message}`, variant: "destructive" });
          return;
        }
      if (!data || data.length === 0) return;
      const loaded: ZahlungEintrag[] = data.map((row: any) => ({
        id: row.id,
        mieterId: row.mieter_id ?? "unbekannt",
        monat: row.monat ?? "",
        faelligkeitsdatum: row.monat ? `${row.monat}-01` : "",
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
      setZahlungen(loaded);
      } catch (err) {
        toast({ title: "Laden fehlgeschlagen", description: err instanceof Error ? err.message : "Unbekannter Fehler", variant: "destructive" });
      }
    };
    loadZahlungen();
  }, [selectedObjektId, isDemo, isAdmin]);

  // Events für den aktuellen Mieter laden wenn Historie-Tab geöffnet wird
  useEffect(() => {
    if (activeTab !== "historie" || !selectedMieter?.id) return;
    if (isAdmin || isDemo || !user?.id) {
      setEvents([]);
      return;
    }
    const mieterId = selectedMieter.id;
    setEventsLoading(true);
    (async () => {
      try {
        const supabase = createClient();
        if (!supabase) { setEventsLoading(false); return; }
        const { data } = await supabase
          .from("mieter_events")
          .select("*")
          .eq("mieter_id", mieterId)
          .order("created_at", { ascending: false });
        setEvents((data ?? []) as MieterEvent[]);
      } catch {
        setEvents([]);
      } finally {
        setEventsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, selectedMieter?.id, isAdmin, isDemo, user?.id]);

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

  // Wohnungen ohne aktiven Mieter (für "Neuen Mieter anlegen")
  const freieWohnungen = useMemo(() => {
    const belegteIds = new Set(
      mieter.filter((m) => m.isAktiv !== false).map((m) => m.wohnungId),
    );
    return availableWohnungen.filter((w) => !belegteIds.has(w.id));
  }, [availableWohnungen, mieter]);

  const filteredEvents = useMemo(() => {
    if (eventFilter === "alle") return events;
    if (eventFilter === "zahlungen")
      return events.filter((e) =>
        ["zahlung_eingegangen", "zahlung_manuell", "zahlung_ueberfaellig"].includes(e.event_type),
      );
    if (eventFilter === "mahnungen")
      return events.filter((e) =>
        ["erinnerung", "mahnung_1", "mahnung_2"].includes(e.event_type),
      );
    if (eventFilter === "mitteilungen")
      return events.filter((e) => e.event_type === "mitteilung");
    if (eventFilter === "notizen")
      return events.filter((e) => e.event_type === "notiz");
    return events;
  }, [events, eventFilter]);

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
      anrede: "familie",
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
    insertMieterEvent(
      selectedMieter.id,
      "mitteilung",
      betreff ? `Mitteilung: ${betreff}` : "Mitteilung als PDF exportiert",
      betreff ? undefined : undefined,
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
    } catch (error: any) {
      const msg = error?.message ?? JSON.stringify(error);
      console.error("Error creating mieter:", msg, error?.code, error?.details, error?.hint, error?.stack);
      toast({
        title: "Fehler",
        description: msg || "Mieter konnte nicht angelegt werden. Bitte versuchen Sie es erneut.",
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
    return `${anrede},\n\nwir ${prefix} die Mietzahlung für ${monatName} in Höhe von ${z.sollBetrag.toLocaleString("de-DE")} € auf unserem Konto bisher nicht eingegangen ist.\n\nFälligkeitsdatum: ${faelligDate.toLocaleDateString("de-DE")}\nAusstehender Betrag: ${diff.toLocaleString("de-DE")} €\n\nWir bitten Sie, den ausstehenden Betrag bis zum ${fristStr} zu überweisen.\n\nBei Rückfragen stehen wir Ihnen gerne zur Verfügung.\n\nMit freundlichen Grüßen,\n${getFullName(profile)}\n${currentObjekt?.adresse || ""}\n${currentObjekt?.objektdaten?.strasse || ""}`;
  };

  // E-Mail über SMTP-API-Route senden
  const sendEmail = async (to: string, subject: string, body: string): Promise<boolean> => {
    setIsSendingEmail(true);
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, body }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "E-Mail-Versand fehlgeschlagen", description: data?.error ?? "Unbekannter Fehler", variant: "destructive" });
        return false;
      }
      return true;
    } catch (err: any) {
      toast({ title: "E-Mail-Versand fehlgeschlagen", description: err?.message ?? "Netzwerkfehler", variant: "destructive" });
      return false;
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Konfiguration pro Event-Typ (Icon, Farbe, Label)
  const getEventConfig = (eventType: string) => {
    switch (eventType) {
      case "einzug":
        return { Icon: Home, bgColor: "bg-green-100 dark:bg-green-900", iconColor: "text-green-600", badgeClass: "border-green-300 text-green-700 bg-green-50", label: "Einzug" };
      case "auszug":
        return { Icon: Home, bgColor: "bg-gray-100 dark:bg-gray-800", iconColor: "text-gray-500", badgeClass: "border-gray-300 text-gray-600 bg-gray-50", label: "Auszug" };
      case "zahlung_eingegangen":
      case "zahlung_manuell":
        return { Icon: CheckCircle2, bgColor: "bg-green-100 dark:bg-green-900", iconColor: "text-green-600", badgeClass: "border-green-300 text-green-700 bg-green-50", label: "Zahlung" };
      case "zahlung_ueberfaellig":
        return { Icon: AlertTriangle, bgColor: "bg-red-100 dark:bg-red-900", iconColor: "text-red-600", badgeClass: "border-red-300 text-red-700 bg-red-50", label: "Überfällig" };
      case "erinnerung":
        return { Icon: Clock, bgColor: "bg-amber-100 dark:bg-amber-900", iconColor: "text-amber-600", badgeClass: "border-amber-300 text-amber-700 bg-amber-50", label: "Erinnerung" };
      case "mahnung_1":
        return { Icon: AlertTriangle, bgColor: "bg-orange-100 dark:bg-orange-900", iconColor: "text-orange-600", badgeClass: "border-orange-300 text-orange-700 bg-orange-50", label: "1. Mahnung" };
      case "mahnung_2":
        return { Icon: AlertTriangle, bgColor: "bg-red-100 dark:bg-red-900", iconColor: "text-red-600", badgeClass: "border-red-300 text-red-700 bg-red-50", label: "2. Mahnung" };
      case "mitteilung":
        return { Icon: Mail, bgColor: "bg-blue-100 dark:bg-blue-900", iconColor: "text-blue-600", badgeClass: "border-blue-300 text-blue-700 bg-blue-50", label: "Mitteilung" };
      case "notiz":
      default:
        return { Icon: FileText, bgColor: "bg-gray-100 dark:bg-gray-800", iconColor: "text-gray-500", badgeClass: "border-gray-300 text-gray-600 bg-gray-50", label: "Notiz" };
    }
  };

  // Event in Supabase speichern + optimistisch in lokalen State einfügen
  const insertMieterEvent = async (
    mieterId: string,
    eventType: string,
    title: string,
    description?: string,
  ) => {
    const localEvent: MieterEvent = {
      id: `local-${Date.now()}-${Math.random()}`,
      user_id: user?.id ?? "local",
      mieter_id: mieterId,
      event_type: eventType,
      title,
      description: description ?? null,
      created_by: getFullName(profile),
      created_at: new Date().toISOString(),
    };
    setEvents((prev) => [localEvent, ...prev]);
    if (isDemo || isAdmin || !user?.id) return;
    try {
      const supabase = createClient();
      if (!supabase) return;
      const { data } = await supabase
        .from("mieter_events")
        .insert({
          user_id: user.id,
          mieter_id: mieterId,
          event_type: eventType,
          title,
          description: description ?? null,
          created_by: getFullName(profile),
        })
        .select()
        .single();
      if (data) {
        setEvents((prev) =>
          prev.map((e) => (e.id === localEvent.id ? (data as MieterEvent) : e)),
        );
      }
    } catch {
      // lokales Event bleibt erhalten
    }
  };

  const updateMieterEvent = async (eventId: string, newTitle: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === eventId ? { ...e, title: newTitle } : e)),
    );
    setEditingEventId(null);
    setEditNoteText("");
    if (isDemo || isAdmin || !user?.id) return;
    try {
      const supabase = createClient();
      if (!supabase) return;
      await supabase
        .from("mieter_events")
        .update({ title: newTitle })
        .eq("id", eventId);
    } catch {
      // lokales Update bleibt erhalten
    }
  };

  const deleteMieterEvent = async (eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    if (isDemo || isAdmin || !user?.id) return;
    try {
      const supabase = createClient();
      if (!supabase) return;
      await supabase.from("mieter_events").delete().eq("id", eventId);
    } catch {
      // lokales Löschen bleibt erhalten
    }
  };

  // DATEV-Import: Datei verarbeiten
  const processImportFile = async (file: File) => {
    setIsImporting(true);
    setActiveTab("zahlungen");
    try {
      const { buchungen } = await parseDatevCsv(file);

      const mieterMatchList = mieterData.map((m) => ({ id: m.id, name: m.name }));
      const monat = getCurrentMonthKey();

      let zugeordnet = 0;
      let nichtZugeordnet = 0;
      const bezahlteMieterIds = new Set<string>();

      const neueZahlungen: ZahlungEintrag[] = buchungen
        .filter((b) => b.sollHaben === "H") // Nur Haben-Buchungen (Einnahmen)
        .map((b) => {
          const match = matchDatevToMieter(b, mieterMatchList);
          if (match) {
            zugeordnet++;
            bezahlteMieterIds.add(match.mieterId);
          } else {
            nichtZugeordnet++;
          }

          const mieterId = match?.mieterId ?? "unbekannt";
          const m = mieterData.find((x) => x.id === mieterId);
          const soll = m ? m.kaltmiete + m.nebenkosten : 0;
          const belegMonat = getMonatFromBelegdatum(b.belegdatum) || monat;

          return {
            id: b.belegfeld1
              ? `datev-${b.belegfeld1}`
              : `datev-${b.belegdatum}-${b.umsatz}-${b.buchungstext.replace(/\s/g, "").slice(0, 20)}`,
            mieterId,
            monat: belegMonat,
            faelligkeitsdatum: `${belegMonat}-01`,
            sollBetrag: soll,
            istBetrag: b.umsatz,
            buchungsdatum: b.belegdatum,
            wertstellungsdatum: b.belegdatum,
            verwendungszweck: b.buchungstext,
            ibanAbsender: "",
            auftraggeber: b.buchungstext,
            referenz: b.belegfeld1,
            status: b.umsatz >= soll ? "bezahlt" : soll > 0 ? "ueberfaellig" : "offen",
          } as ZahlungEintrag;
        });

      // Mieter ohne eingehende Zahlung als „offen" markieren
      let offeneAnzahl = 0;
      for (const m of mieterData) {
        if (!bezahlteMieterIds.has(m.id)) {
          const soll = m.kaltmiete + m.nebenkosten;
          if (soll > 0) {
            offeneAnzahl++;
            neueZahlungen.push({
              id: `datev-offen-${m.id}-${monat}`,
              mieterId: m.id,
              monat,
              faelligkeitsdatum: `${monat}-01`,
              sollBetrag: soll,
              istBetrag: 0,
              buchungsdatum: "",
              wertstellungsdatum: "",
              verwendungszweck: "",
              ibanAbsender: "",
              auftraggeber: "",
              referenz: "",
              status: "ueberfaellig",
            } as ZahlungEintrag);
          }
        }
      }

      // Prüfe auf Duplikate (per Buchungsdatum+Betrag+Auftraggeber für Buchungen, per Mieter+Monat für offen-Einträge)
      const duplikate = neueZahlungen.filter((nz) =>
        zahlungen.some((z) =>
          // Buchungen: gleicher Zeitstempel, Betrag und Auftraggeber
          (nz.buchungsdatum !== "" && z.buchungsdatum === nz.buchungsdatum && z.istBetrag === nz.istBetrag && z.auftraggeber === nz.auftraggeber) ||
          // Offen-Einträge: gleicher Mieter und Monat und status
          (nz.buchungsdatum === "" && z.buchungsdatum === "" && z.mieterId === nz.mieterId && z.monat === nz.monat)
        )
      ).length;

      if (duplikate > 0) {
        setPendingImport({ dateiname: file.name, neueZahlungen, zugeordnet, nichtZugeordnet, duplikate });
        setIsImporting(false);
        return;
      }

      // Keine Duplikate – direkt importieren
      await executeImport(file.name, neueZahlungen, zugeordnet, nichtZugeordnet, offeneAnzahl);
    } catch (err) {
      toast({
        title: "Import fehlgeschlagen",
        description: err instanceof Error ? err.message : "Unbekannter Fehler beim Parsen der DATEV-Datei.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  // DATEV-Import Handler (vom File-Input auf der Mieter-Seite)
  const handleDatevFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    await processImportFile(file);
  };

  const confirmPendingImport = async () => {
    if (!pendingImport) return;
    setIsImporting(true);
    setPendingImport(null);
    await executeImport(pendingImport.dateiname, pendingImport.neueZahlungen, pendingImport.zugeordnet, pendingImport.nichtZugeordnet, 0);
    setIsImporting(false);
  };

  // Import ausführen (State + Supabase)
  const executeImport = async (dateiname: string, neueZahlungen: ZahlungEintrag[], zugeordnet: number, nichtZugeordnet: number, offen: number) => {
      // Im Demo-Modus oder Admin-Login (kein echter Supabase-User) nur in-memory speichern
      if (isDemo || isAdmin || !user?.id) {
        setZahlungen((prev) => {
          const updated = [...prev];
          for (const nz of neueZahlungen) {
            const idx = updated.findIndex((z) => z.id === nz.id);
            if (idx >= 0) updated[idx] = nz;
            else updated.push(nz);
          }
          return updated;
        });
        setDatevImportResult({
          dateiname,
          anzahl: neueZahlungen.length,
          zugeordnet,
          offen,
          zeitpunkt: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
        });
        toast({
          title: "Import temporär gespeichert",
          description: "Im Admin-Modus werden Daten nicht dauerhaft gespeichert und gehen beim Seitenrefresh verloren. Bitte registrieren Sie sich für persistenten Datenzugriff.",
          variant: "destructive",
        });
        return;
      }

      // Supabase persistieren – UUID für jede Zeile generieren
      try {
        const supabase = createClient();
        if (!supabase) throw new Error("Supabase nicht konfiguriert");

        const supabaseRows = neueZahlungen.map((z) => ({
          id: crypto.randomUUID(),
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

        const { data: insertedRows, error: supabaseError } = await supabase
          .from("zahlungen")
          .upsert(supabaseRows, { onConflict: "id" })
          .select();

        if (supabaseError) {
          toast({
            title: "Import fehlgeschlagen",
            description: `Speichern in Supabase fehlgeschlagen: ${supabaseError.message}`,
            variant: "destructive",
          });
          return;
        }

        // State mit den tatsächlich gespeicherten Zeilen aus der DB befüllen
        const gespeichert: ZahlungEintrag[] = (insertedRows ?? supabaseRows).map((row: any) => ({
          id: row.id,
          mieterId: row.mieter_id ?? "unbekannt",
          monat: row.monat ?? "",
          faelligkeitsdatum: row.faelligkeitsdatum ?? `${row.monat}-01`,
          sollBetrag: row.soll_betrag ?? 0,
          istBetrag: row.betrag ?? 0,
          buchungsdatum: row.buchungsdatum ?? "",
          wertstellungsdatum: row.wertstellungsdatum ?? "",
          verwendungszweck: row.verwendungszweck ?? "",
          ibanAbsender: row.auftraggeber_iban ?? "",
          auftraggeber: row.auftraggeber_name ?? "",
          referenz: row.zahlungsreferenz ?? "",
          status: row.status ?? "offen",
        }));

        setZahlungen((prev) => {
          const updated = [...prev];
          for (const nz of gespeichert) {
            const idx = updated.findIndex((z) => z.id === nz.id);
            if (idx >= 0) updated[idx] = nz;
            else updated.push(nz);
          }
          return updated;
        });
      } catch (err) {
        toast({
          title: "Import fehlgeschlagen",
          description: err instanceof Error ? err.message : "Verbindungsfehler zu Supabase",
          variant: "destructive",
        });
        return;
      }

      setDatevImportResult({
        dateiname,
        anzahl: neueZahlungen.length,
        zugeordnet,
        offen,
        zeitpunkt: new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }),
      });

      toast({
        title: `DATEV-Import erfolgreich`,
        description: `${zugeordnet} zugeordnet, ${offen} offen`,
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
                    {freieWohnungen.map((w) => (
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
                      <div className="flex items-center gap-1">
                        <p className="text-xs truncate text-muted-foreground">{m.geschoss}</p>
                        {m.isKurzzeitvermietung && (
                          <span className="flex items-center gap-0.5 text-[10px] text-blue-500" title="Kurzzeitvermietung">
                            <Clock className="h-3 w-3" />
                          </span>
                        )}
                      </div>
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
        <div className="flex-1 flex flex-col min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
            <div className="shrink-0 pb-4 pr-2">
              <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 h-auto">
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
              <TabsTrigger
                value="vertrag"
                className="text-xs sm:text-sm py-2"
              >
                Vertrag
              </TabsTrigger>
            </TabsList>
              <div className="flex items-center justify-end gap-3 mt-4">
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
                    <DropdownMenuItem disabled>
                      <Archive className="h-4 w-4 mr-2" />
                      Archivieren
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
            </div>

            <div className="flex-1 min-h-0 pr-2">
            {/* Tab 1: Stammdaten */}
            <TabsContent
              value="stammdaten"
              className="mt-4 sm:mt-6 space-y-4 overflow-auto h-full"
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

            {/* Tab 2: Ereignis-Protokoll / Timeline */}
            <TabsContent value="historie" className="mt-6 flex flex-col h-full min-h-0">
              {/* Header + Filter – fixed */}
              <div className="shrink-0 pb-4 space-y-4">
                <div>
                  <h3 className="text-base font-semibold">Ereignis-Protokoll</h3>
                  <p className="text-sm text-muted-foreground">
                    Zahlungen, Mahnungen und Mitteilungen für{" "}
                    {selectedMieter?.name}
                  </p>
                </div>

                {/* Filter + Notiz-Button */}
                <div className="flex items-center gap-2">
                  <Select value={eventFilter} onValueChange={setEventFilter}>
                    <SelectTrigger className="w-[160px] h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alle">Alle</SelectItem>
                      <SelectItem value="zahlungen">Zahlungen</SelectItem>
                      <SelectItem value="mahnungen">Mahnungen</SelectItem>
                      <SelectItem value="mitteilungen">Mitteilungen</SelectItem>
                      <SelectItem value="notizen">Notizen</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setIsAddNoteOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Notiz hinzufügen
                  </Button>
                </div>
              </div>

              {/* Timeline oder Ladeindikator – scrollbar */}
              <div className="flex-1 overflow-auto min-h-0">
              {eventsLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-muted-foreground">
                  <FileText className="h-10 w-10 mb-3 opacity-25" />
                  <p className="text-sm font-medium">Keine Ereignisse vorhanden</p>
                  {(isAdmin || isDemo) && (
                    <p className="text-xs mt-1 opacity-70">
                      Im Demo-/Admin-Modus werden Ereignisse nicht gespeichert.
                    </p>
                  )}
                </div>
              ) : (
                <div className="relative">
                  {/* Vertikale Linie */}
                  <div className="absolute left-[15px] top-0 bottom-0 w-px bg-border" />
                  <div className="space-y-3 pl-10">
                    {filteredEvents.map((event) => {
                      const cfg = getEventConfig(event.event_type);
                      const EventIcon = cfg.Icon;
                      return (
                        <div key={event.id} className="relative">
                          {/* Icon-Blase */}
                          <div
                            className={`absolute -left-[26px] w-8 h-8 rounded-full flex items-center justify-center border-2 border-background shadow-sm ${cfg.bgColor}`}
                          >
                            <EventIcon
                              className={`h-4 w-4 ${cfg.iconColor}`}
                            />
                          </div>
                          {/* Karte */}
                          <Card className="shadow-none border">
                            <CardContent className="px-4 py-3">
                              <div className="flex items-start gap-3 justify-between">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                    <Badge
                                      variant="outline"
                                      className={`text-[11px] px-1.5 py-0 font-medium ${cfg.badgeClass}`}
                                    >
                                      {cfg.label}
                                    </Badge>
                                    <span className="text-sm font-medium">
                                      {event.title}
                                    </span>
                                  </div>
                                  {event.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {event.description}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-start gap-2 shrink-0">
                                  {event.event_type === "notiz" && (
                                    <div className="flex items-center gap-1 mt-0.5">
                                      <button
                                        type="button"
                                        title="Notiz bearbeiten"
                                        className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                        onClick={() => {
                                          setEditingEventId(event.id);
                                          setEditNoteText(event.title);
                                        }}
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        title="Notiz löschen"
                                        className="p-1 rounded hover:bg-destructive/10 text-red-500 hover:text-red-600 transition-colors"
                                        onClick={() => deleteMieterEvent(event.id)}
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  )}
                                  <div className="text-right text-xs text-muted-foreground">
                                  <p>
                                    {new Date(event.created_at).toLocaleDateString(
                                      "de-DE",
                                      {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                      },
                                    )}
                                  </p>
                                  {event.created_by && (
                                    <p className="mt-0.5">{event.created_by}</p>
                                  )}
                                  </div>
                                </div>
                              </div>
                              {editingEventId === event.id && (
                                <div className="flex gap-2 mt-2">
                                  <Textarea
                                    rows={2}
                                    value={editNoteText}
                                    onChange={(e) => setEditNoteText(e.target.value)}
                                    className="text-sm"
                                  />
                                  <div className="flex flex-col gap-1">
                                    <Button
                                      size="sm"
                                      className="h-7 text-xs"
                                      disabled={!editNoteText.trim()}
                                      onClick={() => updateMieterEvent(event.id, editNoteText.trim())}
                                    >
                                      <Save className="h-3 w-3 mr-1" />
                                      OK
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 text-xs"
                                      onClick={() => {
                                        setEditingEventId(null);
                                        setEditNoteText("");
                                      }}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              </div>
            </TabsContent>

            {/* Tab: Vertrag */}
            <TabsContent value="vertrag" className="mt-6 space-y-6 overflow-auto h-full">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Mietvertrag</CardTitle>
                  <CardDescription className="text-xs">
                    Vertragsdokument für {editedMieter?.name} erstellen
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* 1. Unbefristeter Mietvertrag */}
                    <button
                      type="button"
                      disabled={editedMieter?.isKurzzeitvermietung}
                      className={`group relative flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors ${editedMieter?.isKurzzeitvermietung ? "opacity-40 cursor-not-allowed" : "hover:border-primary/50 hover:bg-muted/50"}`}
                      onClick={() => {
                        const wohnung = wohnungen.find((w) => w.id === editedMieter?.wohnungId);
                        setVertragTyp("unbefristet");
                        setVertragForm({
                          vermieterName: currentObjekt?.eigentuemer?.name || "",
                          vermieterAdresse: currentObjekt?.eigentuemer?.adresse
                            ? `${currentObjekt.eigentuemer.adresse}${currentObjekt.eigentuemer.plz ? `, ${currentObjekt.eigentuemer.plz}` : ""}${currentObjekt.eigentuemer.ort ? ` ${currentObjekt.eigentuemer.ort}` : ""}`
                            : "",
                          mieterAnrede: editedMieter?.anrede || "",
                          mieterName: editedMieter?.name || "",
                          objektAdresse: currentObjekt?.objektdaten
                            ? `${currentObjekt.objektdaten.strasse || ""}, ${currentObjekt.objektdaten.plz || ""} ${currentObjekt.objektdaten.ort || ""}`
                            : currentObjekt?.adresse || "",
                          etage: wohnung?.etage || "",
                          flaeche: wohnung?.flaeche?.toString() || "",
                          zimmer: wohnung?.zimmer?.toString() || "",
                          einzugsdatum: editedMieter?.einzugsDatumRaw || "",
                          enddatum: "",
                          kaltmiete: editedMieter?.kaltmiete?.toString() || "",
                          nebenkosten: editedMieter?.nebenkosten?.toString() || "",
                          kaution: editedMieter?.kaution?.toString() || "",
                          faelligkeit: "1",
                          iban: currentObjekt?.bankverbindung?.iban || "",
                        });
                        setVertragDialogOpen(true);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <FileSignature className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium">Unbefristeter Mietvertrag</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Standardvertrag ohne zeitliche Begrenzung mit gesetzlicher Kündigungsfrist.</p>
                    </button>

                    {/* 2. Befristeter Mietvertrag */}
                    <button
                      type="button"
                      disabled={editedMieter?.isKurzzeitvermietung}
                      className={`group relative flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors ${editedMieter?.isKurzzeitvermietung ? "opacity-40 cursor-not-allowed" : "hover:border-primary/50 hover:bg-muted/50"}`}
                      onClick={() => {
                        const wohnung = wohnungen.find((w) => w.id === editedMieter?.wohnungId);
                        setVertragTyp("befristet");
                        setVertragForm({
                          vermieterName: currentObjekt?.eigentuemer?.name || "",
                          vermieterAdresse: currentObjekt?.eigentuemer?.adresse
                            ? `${currentObjekt.eigentuemer.adresse}${currentObjekt.eigentuemer.plz ? `, ${currentObjekt.eigentuemer.plz}` : ""}${currentObjekt.eigentuemer.ort ? ` ${currentObjekt.eigentuemer.ort}` : ""}`
                            : "",
                          mieterAnrede: editedMieter?.anrede || "",
                          mieterName: editedMieter?.name || "",
                          objektAdresse: currentObjekt?.objektdaten
                            ? `${currentObjekt.objektdaten.strasse || ""}, ${currentObjekt.objektdaten.plz || ""} ${currentObjekt.objektdaten.ort || ""}`
                            : currentObjekt?.adresse || "",
                          etage: wohnung?.etage || "",
                          flaeche: wohnung?.flaeche?.toString() || "",
                          zimmer: wohnung?.zimmer?.toString() || "",
                          einzugsdatum: editedMieter?.einzugsDatumRaw || "",
                          enddatum: editedMieter?.mieteBisRaw || "",
                          kaltmiete: editedMieter?.kaltmiete?.toString() || "",
                          nebenkosten: editedMieter?.nebenkosten?.toString() || "",
                          kaution: editedMieter?.kaution?.toString() || "",
                          faelligkeit: "1",
                          iban: currentObjekt?.bankverbindung?.iban || "",
                        });
                        setVertragDialogOpen(true);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <CalendarClock className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium">Befristeter Mietvertrag</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Zeitlich begrenzter Vertrag mit festem Enddatum und Befristungsgrund.</p>
                    </button>

                    {/* 3. Kurzzeitvermietung */}
                    <button
                      type="button"
                      className="group relative flex flex-col items-start gap-2 rounded-lg border p-4 text-left hover:border-primary/50 hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        const wohnung = wohnungen.find((w) => w.id === editedMieter?.wohnungId);
                        setVertragTyp("kurzzeit");
                        setVertragForm({
                          vermieterName: currentObjekt?.eigentuemer?.name || "",
                          vermieterAdresse: currentObjekt?.eigentuemer?.adresse
                            ? `${currentObjekt.eigentuemer.adresse}${currentObjekt.eigentuemer.plz ? `, ${currentObjekt.eigentuemer.plz}` : ""}${currentObjekt.eigentuemer.ort ? ` ${currentObjekt.eigentuemer.ort}` : ""}`
                            : "",
                          mieterAnrede: editedMieter?.anrede || "",
                          mieterName: editedMieter?.name || "",
                          objektAdresse: currentObjekt?.objektdaten
                            ? `${currentObjekt.objektdaten.strasse || ""}, ${currentObjekt.objektdaten.plz || ""} ${currentObjekt.objektdaten.ort || ""}`
                            : currentObjekt?.adresse || "",
                          etage: wohnung?.etage || "",
                          flaeche: wohnung?.flaeche?.toString() || "",
                          zimmer: wohnung?.zimmer?.toString() || "",
                          einzugsdatum: editedMieter?.einzugsDatumRaw || "",
                          enddatum: editedMieter?.kurzzeitBis || editedMieter?.mieteBisRaw || "",
                          kaltmiete: editedMieter?.kaltmiete?.toString() || "",
                          nebenkosten: editedMieter?.nebenkosten?.toString() || "",
                          kaution: editedMieter?.kaution?.toString() || "",
                          faelligkeit: "1",
                          iban: currentObjekt?.bankverbindung?.iban || "",
                        });
                        setVertragDialogOpen(true);
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium">Kurzzeitvermietung</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Möblierte Vermietung auf Zeit, z.B. für Monteure oder Studierende.</p>
                    </button>

                    {/* 4. Individueller Vertrag */}
                    <button
                      type="button"
                      disabled={editedMieter?.isKurzzeitvermietung}
                      className={`group relative flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors ${editedMieter?.isKurzzeitvermietung ? "opacity-40 cursor-not-allowed" : "hover:border-primary/50 hover:bg-muted/50"}`}
                      onClick={() => setAnwaltDialogOpen(true)}
                    >
                      <div className="flex items-center gap-2">
                        <Scale className="h-5 w-5 text-primary" />
                        <span className="text-sm font-medium">Individueller Vertrag</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Maßgeschneiderter Vertrag über einen Fachanwalt oder eigene Vorlage.</p>
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* Anwalt-Werbung */}
              <Card>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-blue-100 p-2">
                        <Handshake className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Rechtssicherer Vertrag? Professionelle Hilfe nutzen</p>
                        <p className="text-xs text-muted-foreground">Geprüfte Fachanwälte für Mietrecht</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-blue-300 text-blue-700 hover:bg-blue-100"
                      onClick={() => setAnwaltAdOpen(true)}
                    >
                      Jetzt informieren
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 4: Zahlungen */}
            <TabsContent value="zahlungen" className="mt-4 space-y-4 overflow-auto h-full">
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
                    {/* Hidden File Input für DATEV-Import */}
                    <input
                      ref={datevFileInputRef}
                      type="file"
                      accept=".csv,text/csv"
                      className="hidden"
                      onChange={handleDatevFileSelected}
                    />

                    {/* DATEV Import Banner */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-dashed border-border">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Upload className="h-4 w-4" />
                        <span>DATEV-Buchungsstapel importieren (CSV)</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        disabled={isImporting}
                        onClick={() => datevFileInputRef.current?.click()}
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
                    {datevImportResult && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-success/10 border border-success/30 text-success">
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>
                            <strong>{datevImportResult.dateiname}</strong> – {datevImportResult.zugeordnet} zugeordnet, {datevImportResult.offen} offen ({datevImportResult.zeitpunkt})
                          </span>
                        </div>
                        <button
                          className="text-success hover:text-success/70 transition-colors"
                          onClick={() => setDatevImportResult(null)}
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
                                insertMieterEvent(
                                  editedMieter.id,
                                  "zahlung_manuell",
                                  `Zahlung manuell bestätigt – ${cz.sollBetrag.toLocaleString("de-DE")} €`,
                                  `Monat: ${cz.monat}`,
                                );
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
                                disabled={isSendingEmail}
                                onClick={async () => {
                                  const mahnBetreff = `Zahlungserinnerung – ${editedMieter.name} – ${editedMieter.geschoss}`;
                                  const ok = await sendEmail(editedMieter.email!, mahnBetreff, currentMahnText);
                                  if (!ok) return;
                                  const entry: MahnEintrag = {
                                    id: `mahn-${Date.now()}`,
                                    mieterId: editedMieter.id,
                                    datum: new Date().toLocaleDateString("de-DE"),
                                    eskalationsstufe: mahnEskalation,
                                    betreff: mahnBetreff,
                                    gesendetVon: getFullName(profile),
                                  };
                                  setMahnHistorie((prev) => [entry, ...prev]);
                                  const eventType = mahnEskalation === "Erinnerung" ? "erinnerung" : mahnEskalation === "1. Mahnung" ? "mahnung_1" : "mahnung_2";
                                  insertMieterEvent(editedMieter.id, eventType, `${mahnEskalation} per E-Mail gesendet`, `Betreff: ${mahnBetreff}`);
                                  toast({ title: `${mahnEskalation} gesendet`, description: `E-Mail wurde erfolgreich an ${editedMieter.email} versendet.` });
                                }}
                              >
                                {isSendingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
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
                                    gesendetVon: getFullName(profile),
                                  };
                                  setMahnHistorie((prev) => [entry, ...prev]);
                                  const eventType = mahnEskalation === "Erinnerung" ? "erinnerung" : mahnEskalation === "1. Mahnung" ? "mahnung_1" : "mahnung_2";
                                  insertMieterEvent(editedMieter.id, eventType, `${mahnEskalation} als Anschreiben gedruckt`, `Betreff: ${entry.betreff}`);
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
            <TabsContent value="kommunikation" className="mt-6 space-y-6 overflow-auto h-full">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Mitteilung an den Mieter</CardTitle>
                  <CardDescription className="text-xs">
                    Verfassen Sie eine Mitteilung und senden Sie diese per E-Mail oder als PDF.
                  </CardDescription>
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
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-1">
                    {editedMieter?.email ? (
                      <Button
                        className="bg-success hover:bg-success/90 text-success-foreground gap-2"
                        disabled={isSendingEmail}
                        onClick={async () => {
                          if (!selectedMieter) return;
                          const ok = await sendEmail(editedMieter.email!, betreff, nachricht);
                          if (!ok) return;
                          insertMieterEvent(
                            selectedMieter.id,
                            "mitteilung",
                            betreff ? `Mitteilung per E-Mail: ${betreff}` : "Mitteilung per E-Mail gesendet",
                          );
                          toast({ title: "E-Mail gesendet", description: `Mitteilung wurde erfolgreich an ${editedMieter.email} versendet.` });
                        }}
                      >
                        {isSendingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                        E-Mail senden
                      </Button>
                    ) : (
                      <Button
                        className="bg-success hover:bg-success/90 text-success-foreground gap-2"
                        onClick={handleExportKommunikationPDF}
                      >
                        <Printer className="h-4 w-4" />
                        Anschreiben drucken
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="gap-2 bg-transparent"
                      onClick={handleExportKommunikationPDF}
                    >
                      <FileDown className="h-4 w-4" />
                      Als PDF exportieren
                    </Button>
                    <p className="text-xs text-muted-foreground">
                      {editedMieter?.email
                        ? `E-Mail wird an ${editedMieter.email} geöffnet und protokolliert.`
                        : "Kein E-Mail hinterlegt – Mitteilung wird als PDF gedruckt."}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            </div>
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
                  {freieWohnungen.map((w) => (
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

      {/* Dialog: Vertrag prüfen & generieren */}
      <Dialog open={vertragDialogOpen} onOpenChange={setVertragDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>
              {vertragTyp === "unbefristet" && "Unbefristeter Mietvertrag"}
              {vertragTyp === "befristet" && "Befristeter Mietvertrag"}
              {vertragTyp === "kurzzeit" && "Kurzzeitvermietung"}
            </DialogTitle>
            <DialogDescription>
              Prüfen und korrigieren Sie die vorausgefüllten Daten vor der PDF-Erstellung.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 overflow-auto px-6">
            <div className="space-y-6 pb-4">
              {/* Vermieter */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Vermieter</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="v-vermieter-name" className="text-xs">Name</Label>
                    <Input id="v-vermieter-name" value={vertragForm.vermieterName} onChange={(e) => setVertragForm((p) => ({ ...p, vermieterName: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="v-vermieter-adresse" className="text-xs">Adresse</Label>
                    <Input id="v-vermieter-adresse" value={vertragForm.vermieterAdresse} onChange={(e) => setVertragForm((p) => ({ ...p, vermieterAdresse: e.target.value }))} />
                  </div>
                </div>
              </div>
              {/* Mieter */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Mieter</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="v-mieter-anrede" className="text-xs">Anrede</Label>
                    <Select value={vertragForm.mieterAnrede} onValueChange={(val) => setVertragForm((p) => ({ ...p, mieterAnrede: val }))}>
                      <SelectTrigger id="v-mieter-anrede"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="herr">Herr</SelectItem>
                        <SelectItem value="frau">Frau</SelectItem>
                        <SelectItem value="familie">Familie</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="v-mieter-name" className="text-xs">Name</Label>
                    <Input id="v-mieter-name" value={vertragForm.mieterName} onChange={(e) => setVertragForm((p) => ({ ...p, mieterName: e.target.value }))} />
                  </div>
                </div>
              </div>
              {/* Objekt */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Mietobjekt</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="v-objekt-adresse" className="text-xs">Adresse</Label>
                    <Input id="v-objekt-adresse" value={vertragForm.objektAdresse} onChange={(e) => setVertragForm((p) => ({ ...p, objektAdresse: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="v-etage" className="text-xs">Etage / Lage</Label>
                    <Input id="v-etage" value={vertragForm.etage} onChange={(e) => setVertragForm((p) => ({ ...p, etage: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="v-flaeche" className="text-xs">Wohnfläche (m²)</Label>
                    <Input id="v-flaeche" type="number" value={vertragForm.flaeche} onChange={(e) => setVertragForm((p) => ({ ...p, flaeche: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="v-zimmer" className="text-xs">Zimmer</Label>
                    <Input id="v-zimmer" type="number" value={vertragForm.zimmer} onChange={(e) => setVertragForm((p) => ({ ...p, zimmer: e.target.value }))} />
                  </div>
                </div>
              </div>
              {/* Mietverhältnis */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Mietverhältnis</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="v-einzug" className="text-xs">Mietbeginn</Label>
                    <Input id="v-einzug" type="date" value={vertragForm.einzugsdatum} onChange={(e) => setVertragForm((p) => ({ ...p, einzugsdatum: e.target.value }))} />
                  </div>
                  {(vertragTyp === "befristet" || vertragTyp === "kurzzeit") && (
                    <div className="space-y-1.5">
                      <Label htmlFor="v-ende" className="text-xs">Mietende</Label>
                      <Input id="v-ende" type="date" value={vertragForm.enddatum} onChange={(e) => setVertragForm((p) => ({ ...p, enddatum: e.target.value }))} />
                    </div>
                  )}
                  {vertragTyp === "unbefristet" && (
                    <div className="flex items-end pb-2">
                      <p className="text-xs text-muted-foreground">Unbefristet — gesetzliche Kündigungsfristen gelten.</p>
                    </div>
                  )}
                </div>
              </div>
              {/* Finanzen */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Finanzen</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="v-kaltmiete" className="text-xs">Kaltmiete (€)</Label>
                    <Input id="v-kaltmiete" type="number" value={vertragForm.kaltmiete} onChange={(e) => setVertragForm((p) => ({ ...p, kaltmiete: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="v-nebenkosten" className="text-xs">NK-Vorauszahlung (€)</Label>
                    <Input id="v-nebenkosten" type="number" value={vertragForm.nebenkosten} onChange={(e) => setVertragForm((p) => ({ ...p, nebenkosten: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="v-kaution" className="text-xs">Kaution (€)</Label>
                    <Input id="v-kaution" type="number" value={vertragForm.kaution} onChange={(e) => setVertragForm((p) => ({ ...p, kaution: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="v-faelligkeit" className="text-xs">Fälligkeitstag</Label>
                    <Select value={vertragForm.faelligkeit} onValueChange={(val) => setVertragForm((p) => ({ ...p, faelligkeit: val }))}>
                      <SelectTrigger id="v-faelligkeit"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1. des Monats</SelectItem>
                        <SelectItem value="3">3. des Monats</SelectItem>
                        <SelectItem value="15">15. des Monats</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              {/* Bankverbindung */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Bankverbindung</h4>
                <div className="space-y-1.5">
                  <Label htmlFor="v-iban" className="text-xs">IBAN</Label>
                  <Input id="v-iban" value={vertragForm.iban} onChange={(e) => setVertragForm((p) => ({ ...p, iban: e.target.value }))} />
                </div>
              </div>
            </div>
          </ScrollArea>
          <div className="border-t px-6 py-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setVertragDialogOpen(false)}>Abbrechen</Button>
            <Button
              onClick={() => {
                const anredeLabel = vertragForm.mieterAnrede === "herr" ? "Herr" : vertragForm.mieterAnrede === "frau" ? "Frau" : "Familie";
                const vertragLabel = vertragTyp === "unbefristet" ? "Unbefristeter Mietvertrag" : vertragTyp === "befristet" ? "Befristeter Mietvertrag" : "Kurzzeitvermietung";
                const gesamtmiete = (parseFloat(vertragForm.kaltmiete) || 0) + (parseFloat(vertragForm.nebenkosten) || 0);
                const content: { type: "heading" | "paragraph" | "table" | "spacer"; text?: string; data?: { headers: string[]; rows: string[][] }; height?: number }[] = [
                  { type: "heading", text: vertragLabel },
                  { type: "spacer", height: 5 },
                  { type: "heading", text: "§ 1 Vertragsparteien" },
                  { type: "paragraph", text: `Vermieter: ${vertragForm.vermieterName}\n${vertragForm.vermieterAdresse}` },
                  { type: "paragraph", text: `Mieter: ${anredeLabel} ${vertragForm.mieterName}` },
                  { type: "spacer", height: 5 },
                  { type: "heading", text: "§ 2 Mietobjekt" },
                  { type: "paragraph", text: `Adresse: ${vertragForm.objektAdresse}\nEtage/Lage: ${vertragForm.etage}\nWohnfläche: ${vertragForm.flaeche} m²\nZimmer: ${vertragForm.zimmer}` },
                  { type: "spacer", height: 5 },
                  { type: "heading", text: "§ 3 Mietdauer" },
                  { type: "paragraph", text: vertragTyp === "unbefristet"
                    ? `Das Mietverhältnis beginnt am ${vertragForm.einzugsdatum ? new Date(vertragForm.einzugsdatum).toLocaleDateString("de-DE") : "___"} und wird auf unbestimmte Zeit geschlossen. Es gelten die gesetzlichen Kündigungsfristen gemäß § 573c BGB.`
                    : `Das Mietverhältnis beginnt am ${vertragForm.einzugsdatum ? new Date(vertragForm.einzugsdatum).toLocaleDateString("de-DE") : "___"} und endet am ${vertragForm.enddatum ? new Date(vertragForm.enddatum).toLocaleDateString("de-DE") : "___"}.`
                  },
                  { type: "spacer", height: 5 },
                  { type: "heading", text: "§ 4 Miete und Nebenkosten" },
                  { type: "table", data: {
                    headers: ["Position", "Betrag"],
                    rows: [
                      ["Kaltmiete (mtl.)", `${vertragForm.kaltmiete} €`],
                      ["NK-Vorauszahlung (mtl.)", `${vertragForm.nebenkosten} €`],
                      ["Gesamtmiete (mtl.)", `${gesamtmiete.toFixed(2)} €`],
                      ["Kaution", `${vertragForm.kaution} €`],
                    ],
                  }},
                  { type: "paragraph", text: `Die Miete ist jeweils zum ${vertragForm.faelligkeit}. eines jeden Monats im Voraus zu entrichten.` },
                  { type: "spacer", height: 5 },
                  { type: "heading", text: "§ 5 Bankverbindung" },
                  { type: "paragraph", text: `Die Miete ist auf folgendes Konto zu überweisen:\nIBAN: ${vertragForm.iban}\nKontoinhaber: ${vertragForm.vermieterName}` },
                  { type: "spacer", height: 15 },
                  { type: "paragraph", text: "___________________________          ___________________________" },
                  { type: "paragraph", text: "Ort, Datum, Vermieter                       Ort, Datum, Mieter" },
                ];
                const doc = generatePDF({
                  title: vertragLabel,
                  subtitle: `${anredeLabel} ${vertragForm.mieterName} — ${vertragForm.objektAdresse}`,
                  date: new Date().toLocaleDateString("de-DE"),
                  content,
                  profile: profile ? {
                    vorname: profile.vorname || "",
                    nachname: profile.nachname || "",
                    email: profile.email || "",
                    telefon: profile.telefon || "",
                    anschrift: profile.anschrift || "",
                  } : undefined,
                });
                downloadPDF(doc, `${vertragLabel}_${vertragForm.mieterName}`);
                setVertragDialogOpen(false);
                toast({ title: "PDF erstellt", description: `${vertragLabel} wurde als PDF heruntergeladen.` });
              }}
            >
              <FileDown className="h-4 w-4 mr-1" />
              Als PDF generieren
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Individueller Vertrag – nur Import */}
      <Dialog open={anwaltDialogOpen} onOpenChange={setAnwaltDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Individueller Vertrag</DialogTitle>
            <DialogDescription>Eigene Vertragsvorlage importieren</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-xs text-muted-foreground">Laden Sie einen bestehenden Vertrag als PDF oder DOCX hoch.</p>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="file"
                accept=".pdf,.docx"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    toast({ title: "Vorlage importiert", description: `${file.name} wurde hochgeladen.` });
                  }
                  e.target.value = "";
                }}
              />
              <Button variant="outline" size="sm" className="gap-1" asChild>
                <span>
                  <Upload className="h-4 w-4" />
                  Eigene Vorlage importieren
                </span>
              </Button>
            </label>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Anwalt-Werbung (nur Partnerliste, kein Import) */}
      <Dialog open={anwaltAdOpen} onOpenChange={setAnwaltAdOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>Fachanwälte für Mietrecht</DialogTitle>
            <DialogDescription>Professionelle Unterstützung bei Vertragsgestaltung</DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 overflow-auto px-6">
            <div className="space-y-4 pb-4">
              {[
                { initials: "RA", name: "Kanzlei Recht & Wohnen", desc: "Spezialisiert auf Miet- und WEG-Recht. Individuelle Vertragserstellung und Prüfung.", rating: 5, tags: ["Empfohlen", "Mietrecht"] },
                { initials: "MR", name: "Dr. Müller & Partner", desc: "Fachanwälte für Immobilien- und Mietrecht mit über 20 Jahren Erfahrung.", rating: 4, tags: ["Erfahren", "Bundesweit"] },
                { initials: "JK", name: "Jura Consulting GmbH", desc: "Digitale Rechtsberatung für Vermieter. Schnelle Vertragserstellung online.", rating: 4, tags: ["Digital", "Günstig"] },
                { initials: "IH", name: "Immobilien & Haus Recht", desc: "Ganzheitliche Beratung für Vermieter – von Vertrag bis Kündigung.", rating: 5, tags: ["Ganzheitlich", "Top-Bewertung"] },
              ].map((partner) => (
                <Card key={partner.initials} className="relative">
                  <span className="absolute top-2 right-3 text-[10px] text-muted-foreground">Anzeige</span>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex gap-3">
                      <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center text-sm font-semibold text-muted-foreground shrink-0">
                        {partner.initials}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <p className="text-sm font-medium">{partner.name}</p>
                        <p className="text-xs text-muted-foreground">{partner.desc}</p>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`h-3 w-3 ${i < partner.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
                            />
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {partner.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-1 h-7 text-xs gap-1"
                          onClick={() => window.open("#", "_blank")}
                        >
                          <ExternalLink className="h-3 w-3" />
                          Anwalt finden →
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
          <div className="border-t px-6 py-3">
            <p className="text-[10px] text-muted-foreground leading-tight">
              Die aufgeführten Partner sind unverbindliche Empfehlungen. Bitte prüfen Sie Angebote eigenständig.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Notiz hinzufügen */}
      <Dialog open={isAddNoteOpen} onOpenChange={setIsAddNoteOpen}>
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle>Notiz hinzufügen</DialogTitle>
            <DialogDescription>
              Fügen Sie eine manuelle Notiz zum Ereignis-Protokoll hinzu.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="note-text">Notiz</Label>
              <Textarea
                id="note-text"
                rows={4}
                placeholder="Ihre Notiz..."
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsAddNoteOpen(false);
                setNewNoteText("");
              }}
            >
              Abbrechen
            </Button>
            <Button
              disabled={!newNoteText.trim()}
              onClick={() => {
                if (!selectedMieter || !newNoteText.trim()) return;
                insertMieterEvent(
                  selectedMieter.id,
                  "notiz",
                  newNoteText.trim(),
                );
                setIsAddNoteOpen(false);
                setNewNoteText("");
              }}
            >
              Speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
