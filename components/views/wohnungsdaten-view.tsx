"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Plus,
  Save,
  Trash2,
  Search,
  Home,
  Ruler,
  DoorOpen,
  Percent,
  Star,
  Bath,
  Flame,
  Layers,
  TreePine,
  Car,
  CheckCircle2,
  Tv,
  Heart,
  Copy,
  MoreHorizontal,
  Users,
  ArrowRight,
  Archive,
  ArrowUpDown,
  UtensilsCrossed,
  Building,
  Wifi,
  ClipboardList,
  Upload,
  X,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Check,
  Download,
  Edit,
  AlertCircle,
  Wrench,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
} from "@/components/ui/hover-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useAppData } from "@/context/app-data-context";
import { useAuth } from "@/context/auth-context";
import type { AppView } from "@/components/app-dashboard";

// Helper function to format dates from ISO (YYYY-MM-DD) to German format (DD.MM.YYYY)
const formatDateGerman = (dateString?: string | null) => {
  if (!dateString) return "-";
  const [year, month, day] = dateString.split("-");
  if (year && month && day) {
    return `${day}.${month}.${year}`;
  }
  return dateString;
};

interface Unit {
  id: string;
  lage: string;
  wohnflaeche: number;
  nutzflaeche: number;
  raeume: number;
  punkte: number;
  prozent: number;
  status?: "vermietet" | "frei" | "renovierung";
  miete?: number;
}

const initialUnits: Unit[] = [
  {
    id: "1",
    lage: "EG links",
    wohnflaeche: 65.5,
    nutzflaeche: 70.2,
    raeume: 3,
    punkte: 45,
    prozent: 12.5,
    status: "vermietet",
    miete: 850,
  },
  {
    id: "2",
    lage: "EG rechts",
    wohnflaeche: 72.3,
    nutzflaeche: 78.1,
    raeume: 3,
    punkte: 48,
    prozent: 13.8,
    status: "vermietet",
    miete: 920,
  },
  {
    id: "3",
    lage: "1.OG links",
    wohnflaeche: 65.5,
    nutzflaeche: 70.2,
    raeume: 3,
    punkte: 45,
    prozent: 12.5,
    status: "frei",
  },
  {
    id: "4",
    lage: "1.OG rechts",
    wohnflaeche: 72.3,
    nutzflaeche: 78.1,
    raeume: 3,
    punkte: 48,
    prozent: 13.8,
    status: "vermietet",
    miete: 920,
  },
  {
    id: "5",
    lage: "2.OG links",
    wohnflaeche: 65.5,
    nutzflaeche: 70.2,
    raeume: 3,
    punkte: 45,
    prozent: 12.5,
    status: "vermietet",
    miete: 850,
  },
  {
    id: "6",
    lage: "2.OG rechts",
    wohnflaeche: 72.3,
    nutzflaeche: 78.1,
    raeume: 3,
    punkte: 48,
    prozent: 13.8,
    status: "renovierung",
  },
  {
    id: "7",
    lage: "DG links",
    wohnflaeche: 58.2,
    nutzflaeche: 62.5,
    raeume: 2,
    punkte: 38,
    prozent: 11.1,
    status: "vermietet",
    miete: 780,
  },
  {
    id: "8",
    lage: "DG rechts",
    wohnflaeche: 58.2,
    nutzflaeche: 62.5,
    raeume: 2,
    punkte: 38,
    prozent: 11.1,
    status: "vermietet",
    miete: 780,
  },
];

interface AusstattungCategory {
  title: string;
  icon: React.ElementType;
  items: { id: string; label: string }[];
}

const ausstattungCategories: AusstattungCategory[] = [
  {
    title: "Aufzug",
    icon: ArrowUpDown,
    items: [
      { id: "personenaufzug", label: "Personenaufzug" },
    ],
  },
  {
    title: "Küche",
    icon: UtensilsCrossed,
    items: [
      { id: "einbaukueche", label: "Einbauküche" },
      { id: "offene-kueche", label: "Offene Küche" },
      { id: "speisekammer", label: "Speisekammer" },
    ],
  },
  {
    title: "Sanitär",
    icon: Bath,
    items: [
      { id: "bad-dusche", label: "Bad mit Dusche" },
      { id: "bad-fenster", label: "Bad mit Fenster" },
      { id: "bad-wanne", label: "Bad mit Wanne" },
      { id: "bad-wc-getrennt", label: "Bad / WC getrennt" },
    ],
  },
  {
    title: "Heizungsart",
    icon: Flame,
    items: [
      { id: "etagenheizung", label: "Etagenheizung" },
      { id: "fussbodenheizung", label: "Fußbodenheizung" },
      { id: "ofenheizung", label: "Ofenheizung" },
      { id: "zentralheizung", label: "Zentralheizung" },
      { id: "fernheizung", label: "Fernheizung" },
    ],
  },
  {
    title: "Böden",
    icon: Layers,
    items: [
      { id: "fertigparkett", label: "Fertigparkett" },
      { id: "fliesen", label: "Fliesenboden" },
      { id: "holzdielen", label: "Holzdielen" },
      { id: "laminat", label: "Laminat" },
      { id: "linoleum", label: "Linoleum" },
      { id: "parkett", label: "Parkettboden" },
      { id: "teppich", label: "Teppichboden" },
    ],
  },
  {
    title: "Wohnungslage",
    icon: Building,
    items: [
      { id: "dachgeschoss", label: "Dachgeschoss" },
      { id: "erdgeschoss", label: "Erdgeschoss" },
      { id: "souterrain", label: "Souterrain" },
    ],
  },
  {
    title: "Balkon / Terrasse",
    icon: TreePine,
    items: [
      { id: "balkon", label: "Balkon" },
      { id: "dachterrasse", label: "Dachterrasse" },
      { id: "loggia", label: "Loggia" },
      { id: "terrasse", label: "Terrasse" },
      { id: "wintergarten", label: "Wintergarten" },
    ],
  },
  {
    title: "Garage / Stellplatz",
    icon: Car,
    items: [
      { id: "duplex", label: "Duplex" },
      { id: "garage", label: "Garage" },
      { id: "stellplatz", label: "Stellplatz" },
      { id: "tiefgarage", label: "Tiefgarage" },
    ],
  },
  {
    title: "Zustand",
    icon: CheckCircle2,
    items: [
      { id: "altbau", label: "Altbau (bis 1945)" },
      { id: "erstbezug", label: "Erstbezug" },
      { id: "gehoben", label: "Gehoben" },
      { id: "gepflegt", label: "Gepflegt" },
      { id: "luxus", label: "Luxus" },
      { id: "neubau", label: "Neubau" },
      { id: "renoviert", label: "Renoviert" },
      { id: "renovierungsbeduerftig", label: "Renovierungsbedürftig" },
      { id: "saniert", label: "Saniert" },
      { id: "standard", label: "Standard" },
    ],
  },
  {
    title: "TV",
    icon: Tv,
    items: [
      { id: "kabel", label: "Kabelanschluss" },
      { id: "sat", label: "Sat" },
    ],
  },
  {
    title: "Sonstiges / Wohnen",
    icon: Heart,
    items: [
      { id: "gartenanteil", label: "Gartenanteil" },
      { id: "haustiere", label: "Haustiere erlaubt" },
      { id: "kelleranteil", label: "Kelleranteil" },
      { id: "rollstuhlgerecht", label: "Rollstuhlgerecht" },
      { id: "seniorengerecht", label: "Seniorengerechtes Wohnen" },
      { id: "wg-geeignet", label: "WG geeignet" },
      { id: "wohnberechtigungsschein", label: "Wohnberechtigungsschein" },
    ],
  },
  {
    title: "Kommunikation",
    icon: Wifi,
    items: [
      { id: "dsl", label: "DSL" },
      { id: "glasfaser", label: "Glasfaser" },
    ],
  },
  {
    title: "Serviceleistungen",
    icon: ClipboardList,
    items: [
      { id: "betreutes-wohnen", label: "Betreutes Wohnen" },
    ],
  },
  {
    title: "Derzeitige Nutzung",
    icon: Home,
    items: [
      { id: "nutzung-frei", label: "Frei" },
      { id: "nutzung-frei-werdend", label: "Frei werdend" },
      { id: "nutzung-vermietet", label: "Vermietet" },
    ],
  },
];

const statusConfig = {
  vermietet: {
    label: "Vermietet",
    color: "bg-success/10 text-success border-success/20",
  },
  frei: {
    label: "Frei",
    color: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  renovierung: {
    label: "Renovierung",
    color: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
};

export function WohnungsdatenView({ onNavigate }: { onNavigate?: (view: AppView, options?: { mieterId?: string }) => void }) {
  const {
    wohnungen,
    selectedObjektId,
    objekte,
    mieter,
    zaehler,
    rauchmelder,
    addWohnung,
    updateWohnung,
    deleteWohnung,
    addZaehler,
    updateZaehler,
    deleteZaehler,
    addRauchmelder,
    updateRauchmelder,
    deleteRauchmelder,
  } = useAppData();
  const { isDemo, profile, user } = useAuth();

  // Finde das aktuelle Objekt für den Namen
  const currentObjekt = objekte.find((o) => o.id === selectedObjektId);

  // Konvertiere Context-Wohnungen zu Unit-Format und filtere nach Objekt
  const units: Unit[] = useMemo(() => {
    const filtered = selectedObjektId
      ? wohnungen.filter((w) => w.objektId === selectedObjektId)
      : wohnungen;

    return filtered.map((w) => ({
      id: w.id,
      lage: w.bezeichnung,
      wohnflaeche: w.flaeche,
      nutzflaeche: Math.round(w.flaeche * 1.1), // Nutzfläche ca. 10% größer
      raeume: w.zimmer,
      punkte: Math.round(w.flaeche * 0.7),
      prozent: 12.5,
      status:
        w.status === "vermietet"
          ? "vermietet"
          : w.status === "leer"
            ? "frei"
            : w.status === "eigennutzung"
              ? "renovierung"
              : ("vermietet" as const),
      miete: w.miete,
    }));
  }, [wohnungen, selectedObjektId]);

  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [editedUnit, setEditedUnit] = useState<Unit | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({
    "bad-dusche": true,
    "bad-fenster": true,
    zentralheizung: true,
    laminat: true,
    balkon: true,
    gepflegt: true,
    kelleranteil: true,
    kabel: true,
  });
  const { toast } = useToast();
  // --- Fotos state ---
  type FotoItem = {
    id: string;
    file_path: string;
    file_name: string;
    uploaded_at: string;
    signedUrl: string;
  };
  const [fotos, setFotos] = useState<FotoItem[]>([]);
  const [fotosLoading, setFotosLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFotoIds, setSelectedFotoIds] = useState<Set<string>>(new Set());
  const dragIndexRef = useRef<number | null>(null);
  const dragHappenedRef = useRef(false);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const loadFotos = useCallback(async (wohnungId: string) => {
    if (wohnungId.startsWith("demo-")) { setFotos([]); return; }
    const supabase = createClient();
    if (!supabase) return;
    setFotosLoading(true);
    try {
      const { data: rows, error } = await supabase
        .from("wohnung_fotos")
        .select("*")
        .eq("wohnung_id", wohnungId)
        .order("uploaded_at", { ascending: false });
      if (error) throw error;
      if (!rows?.length) { setFotos([]); return; }
      const withUrls = await Promise.all(
        rows.map(async (row: any) => {
          const { data: signed } = await supabase.storage
            .from("wohnung-fotos")
            .createSignedUrl(row.file_path, 3600);
          return { ...row, signedUrl: signed?.signedUrl ?? "" };
        })
      );
      setFotos(withUrls);
    } catch (e) {
      console.error("loadFotos:", e);
    } finally {
      setFotosLoading(false);
    }
  }, []);

  const handleFotoUpload = useCallback(async (files: FileList | null) => {
    if (!files || !selectedUnit) return;
    const supabase = createClient();
    if (!supabase) return;
    const { user } = (await supabase.auth.getUser()).data;
    const uploadedBy = user?.email ?? "unknown";
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        toast({ title: "Datei zu groß", description: `${file.name} überschreitet 10 MB.`, variant: "destructive" });
        continue;
      }
      const allowed = ["image/jpeg", "image/png", "image/webp"];
      if (!allowed.includes(file.type)) {
        toast({ title: "Ungültiges Format", description: `${file.name}: nur JPG, PNG, WEBP erlaubt.`, variant: "destructive" });
        continue;
      }
      const path = `${selectedUnit.id}/${Date.now()}_${file.name}`;
      setUploadProgress((p) => ({ ...p, [file.name]: 0 }));
      const { error: upErr } = await supabase.storage
        .from("wohnung-fotos")
        .upload(path, file, { upsert: false });
      if (upErr) {
        toast({ title: "Fehler beim Upload", description: file.name, variant: "destructive" });
        setUploadProgress((p) => { const n = { ...p }; delete n[file.name]; return n; });
        continue;
      }
      await supabase.from("wohnung_fotos").insert({
        wohnung_id: selectedUnit.id,
        file_path: path,
        file_name: file.name,
        uploaded_by: uploadedBy,
      });
      setUploadProgress((p) => { const n = { ...p }; delete n[file.name]; return n; });
    }
    await loadFotos(selectedUnit.id);
  }, [selectedUnit, loadFotos, toast]);

  const handleFotoDelete = useCallback(async (foto: FotoItem) => {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.storage.from("wohnung-fotos").remove([foto.file_path]);
    await supabase.from("wohnung_fotos").delete().eq("id", foto.id);
    setFotos((prev) => prev.filter((f) => f.id !== foto.id));
    if (lightboxIndex !== null && lightboxIndex >= fotos.length - 1) {
      setLightboxIndex(null);
    }
  }, [fotos, lightboxIndex]);

  const handleBulkDelete = useCallback(async () => {
    if (!selectedFotoIds.size) return;
    const supabase = createClient();
    if (!supabase) return;
    const toDelete = fotos.filter((f) => selectedFotoIds.has(f.id));
    await supabase.storage.from("wohnung-fotos").remove(toDelete.map((f) => f.file_path));
    await supabase.from("wohnung_fotos").delete().in("id", toDelete.map((f) => f.id));
    setFotos((prev) => prev.filter((f) => !selectedFotoIds.has(f.id)));
    setSelectedFotoIds(new Set());
    if (lightboxIndex !== null) setLightboxIndex(null);
  }, [fotos, selectedFotoIds, lightboxIndex]);

  const handleBulkDownload = useCallback(async () => {
    const selected = fotos.filter((f) => selectedFotoIds.has(f.id));
    for (const foto of selected) {
      try {
        const resp = await fetch(foto.signedUrl);
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = foto.file_name;
        a.click();
        URL.revokeObjectURL(url);
      } catch {
        toast({ title: "Fehler beim Download", description: foto.file_name, variant: "destructive" });
      }
    }
  }, [fotos, selectedFotoIds, toast]);

  // Load fotos when selected unit changes
  useEffect(() => {
    if (selectedUnit) loadFotos(selectedUnit.id);
    else setFotos([]);
    setSelectedFotoIds(new Set());
  }, [selectedUnit?.id]);
  // --- end Fotos state ---

  const [isNewUnitOpen, setIsNewUnitOpen] = useState(false);
  const initialNewUnit: {
    lage: string;
    wohnflaeche: number;
    nutzflaeche: number;
    raeume: number;
    miete: number;
    punkte: number;
    prozent: number;
    status: "frei" | "vermietet";
  } = {
    lage: "",
    wohnflaeche: 0,
    nutzflaeche: 0,
    raeume: 2,
    miete: 0,
    punkte: 0,
    prozent: 0,
    status: "frei",
  };
  const [newUnit, setNewUnit] = useState(initialNewUnit);

  // Archive dialog state
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const [archiveDialogData, setArchiveDialogData] = useState<{
    newStatus: "frei" | "vermietet" | "renovierung";
    activeMieter: { id: string; name: string } | null;
  } | null>(null);
  const [archiveProcessing, setArchiveProcessing] = useState(false);

  // Zähler form state
  const [zaehlerFormOpen, setZaehlerFormOpen] = useState(false);
  const [zaehlerEditingId, setZaehlerEditingId] = useState<string | null>(null);
  const [zaehlerForm, setZaehlerForm] = useState({
    geraeteart: "Kaltwasser" as const,
    montageort: "",
    geraetnummer: "",
    einbaudatum: "",
    geeichtBis: "",
    aktuellerStand: 0,
    standDatum: "",
  });

  // Rauchmelder form state
  const [rauchmelderFormOpen, setRauchmelderFormOpen] = useState(false);
  const [rauchmelderEditingId, setRauchmelderEditingId] = useState<string | null>(null);
  const [rauchmelderForm, setRauchmelderForm] = useState({
    montageort: "",
    modell: "",
    geraetnummer: "",
    einbaudatum: "",
    lebensdauerBis: "",
    letztewartung: "",
    naechsteWartung: "",
    batteriGeWechselt: "",
    status: "OK" as const,
  });

  const [zaehlerPartnerDialogOpen, setZaehlerPartnerDialogOpen] = useState(false);
  const [rauchmelderPartnerDialogOpen, setRauchmelderPartnerDialogOpen] = useState(false);

  // Aktualisiere selectedUnit wenn sich units ändert
  useEffect(() => {
    if (units.length > 0) {
      if (!selectedUnit || !units.find((u) => u.id === selectedUnit.id)) {
        setSelectedUnit(units[0]);
      } else {
        // Aktualisiere selectedUnit mit neuen Daten aus units
        const updatedUnit = units.find((u) => u.id === selectedUnit.id);
        if (updatedUnit) {
          setSelectedUnit(updatedUnit);
        }
      }
    } else {
      setSelectedUnit(null);
    }
  }, [units, selectedObjektId]);

  // Aktualisiere editedUnit wenn selectedUnit sich ändert
  useEffect(() => {
    if (selectedUnit) {
      setEditedUnit({ ...selectedUnit });
    } else {
      setEditedUnit(null);
    }
  }, [selectedUnit]);

  // Filter + load Zähler und Rauchmelder für selectedUnit
  const unitZaehler = selectedUnit
    ? zaehler.filter((z) => z.wohnungId === selectedUnit.id)
    : [];

  const unitRauchmelder = selectedUnit
    ? rauchmelder.filter((r) => r.wohnungId === selectedUnit.id)
    : [];

  const filteredUnits = units.filter((unit) =>
    unit.lage.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Ad card conditions
  const hasExpiredOrMissingCalibration = unitZaehler.some((z) => {
    if (!z.geeichtBis) return true;
    return new Date(z.geeichtBis) < new Date();
  });

  const hasMaintenanceDueRauchmelder = unitRauchmelder.some(
    (r) => r.status === "Wartung fällig" || r.status === "Defekt"
  );

  // Hilfsfunktion zum Aktualisieren der bearbeiteten Unit
  const updateEditedUnit = (
    field: keyof Unit,
    value: string | number | "vermietet" | "frei" | "renovierung",
  ) => {
    if (!editedUnit) return;
    setEditedUnit((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!selectedUnit || !editedUnit) return;

    setIsSaving(true);
    try {
      // Status-Mapping: DB akzeptiert nur 'vermietet' | 'leer' | 'eigennutzung'
      const dbStatus: "vermietet" | "leer" | "eigennutzung" =
        editedUnit.status === "vermietet"
          ? "vermietet"
          : editedUnit.status === "frei"
            ? "leer"
            : "eigennutzung"; // renovierung → eigennutzung

      await updateWohnung(selectedUnit.id, {
        bezeichnung: editedUnit.lage,
        flaeche: editedUnit.wohnflaeche,
        zimmer: editedUnit.raeume,
        miete: editedUnit.miete ?? 0,
        status: dbStatus,
      });

      toast({
        title: "Gespeichert",
        description: `Wohnungsdaten für "${editedUnit.lage}" wurden gespeichert.`,
      });
    } catch (error: any) {
      console.error("Fehler beim Speichern:", error);
      toast({
        title: "Fehler beim Speichern",
        description: error?.message ?? "Die Daten konnten nicht gespeichert werden.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleItem = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateUnit = () => {
    if (!selectedObjektId) {
      toast({
        title: "Fehler",
        description: "Bitte wählen Sie zuerst ein Objekt aus.",
        variant: "destructive",
      });
      return;
    }

    // Demo-Modus Einschränkung
    if (isDemo) {
      toast({
        title: "Demo-Modus",
        description:
          "Im Demo-Modus können keine neuen Wohnungen angelegt werden. Bitte melden Sie sich an, um diese Funktion zu nutzen.",
        variant: "destructive",
      });
      return;
    }

    addWohnung({
      objektId: selectedObjektId,
      bezeichnung: newUnit.lage || "Neue Einheit",
      etage: newUnit.lage?.split(" ")[0] || "EG",
      flaeche: newUnit.wohnflaeche || 0,
      zimmer: newUnit.raeume || 2,
      miete: newUnit.miete || 0,
      nebenkosten: 150,
      status: newUnit.status === "frei" ? "leer" : "vermietet",
    });

    setIsNewUnitOpen(false);
    setNewUnit(initialNewUnit);
    toast({
      title: "Einheit erstellt",
      description: `Wohneinheit "${
        newUnit.lage || "Neue Einheit"
      }" wurde erfolgreich angelegt.`,
    });
  };

  const handleDeleteUnit = () => {
    if (!selectedUnit) return;
    deleteWohnung(selectedUnit.id);
    toast({
      title: "Einheit gelöscht",
      description: `Wohneinheit "${selectedUnit.lage}" wurde entfernt.`,
      variant: "destructive",
    });
  };

  const handleDuplicateUnit = () => {
    if (!selectedUnit || !selectedObjektId) return;

    addWohnung({
      objektId: selectedObjektId,
      bezeichnung: `${selectedUnit.lage} (Kopie)`,
      etage: selectedUnit.lage.split(" ")[0] || "EG",
      flaeche: selectedUnit.wohnflaeche,
      zimmer: selectedUnit.raeume,
      miete: selectedUnit.miete || 0,
      nebenkosten: 150,
      status: selectedUnit.status === "frei" ? "leer" : "vermietet",
    });
    toast({
      title: "Einheit dupliziert",
      description: `Wohneinheit "${selectedUnit.lage}" wurde kopiert.`,
    });
  };

  // Handle status change with archive confirmation
  const handleStatusChange = (newStatus: "vermietet" | "frei" | "renovierung") => {
    if (!selectedUnit || !editedUnit) {
      updateEditedUnit("status", newStatus);
      return;
    }

    // Check if changing FROM "vermietet" TO "frei" or "renovierung"
    if (editedUnit.status === "vermietet" && ["frei", "renovierung"].includes(newStatus)) {
      // Find active mieter for this unit
      const activeMieter = mieter.find(
        (m) => m.wohnungId === selectedUnit.id && m.isAktiv !== false
      );

      if (activeMieter) {
        // Show confirmation dialog
        setArchiveDialogData({
          newStatus: newStatus,
          activeMieter: { id: activeMieter.id, name: activeMieter.name },
        });
        setArchiveDialogOpen(true);
        return;
      }
    }

    // No confirmation needed, just update status
    updateEditedUnit("status", newStatus);
  };

  const handleArchiveMieter = async () => {
    if (!archiveDialogData || !selectedUnit || !editedUnit) return;

    setArchiveProcessing(true);
    try {
      const supabase = createClient();
      if (!supabase) throw new Error("Supabase client not available");

      // Update mieter: set isAktiv=false, archived_at=now(), archive_reason="Auszug"
      const now = new Date().toISOString();
      const { error: mieterError } = await supabase
        .from("mieter")
        .update({
          isAktiv: false,
          archived_at: now,
          archive_reason: "Auszug",
        })
        .eq("id", archiveDialogData.activeMieter?.id);

      if (mieterError) throw mieterError;

      // Update unit status
      updateEditedUnit("status", archiveDialogData.newStatus);

      toast({
        title: "Mieter archiviert",
        description: `${archiveDialogData.activeMieter?.name} wurde archiviert und die Wohnung auf "${
          archiveDialogData.newStatus === "frei" ? "Frei" : "Renovierung"
        }" gesetzt.`,
      });

      setArchiveDialogOpen(false);
      setArchiveDialogData(null);
    } catch (error: any) {
      console.error("Error archiving mieter:", error);
      toast({
        title: "Fehler beim Archivieren",
        description: error?.message ?? "Der Mieter konnte nicht archiviert werden.",
        variant: "destructive",
      });
    } finally {
      setArchiveProcessing(false);
    }
  };

  const handleSkipArchive = () => {
    if (!archiveDialogData || !editedUnit) return;
    // Just update status without archiving mieter
    updateEditedUnit("status", archiveDialogData.newStatus);
    setArchiveDialogOpen(false);
    setArchiveDialogData(null);
  };

  // Zähler handlers
  const handleZaehlerSave = async () => {
    if (!selectedUnit) return;

    try {
      const zaehlerData: Partial<any> = {
        wohnungId: selectedUnit.id,
        wohnungNr: selectedUnit.lage,
        geschoss: selectedUnit.lage,
        geraeteart: zaehlerForm.geraeteart,
        montageort: zaehlerForm.montageort,
        geraetnummer: zaehlerForm.geraetnummer,
        einbaudatum: zaehlerForm.einbaudatum,
        geeichtBis: zaehlerForm.geeichtBis,
        aktuellerStand: zaehlerForm.aktuellerStand || 0,
        standDatum: zaehlerForm.standDatum,
      };

      if (zaehlerEditingId) {
        await updateZaehler(zaehlerEditingId, zaehlerData);
        toast({ title: "Zähler aktualisiert" });
      } else {
        await addZaehler({
          id: "",
          ...zaehlerData,
        } as any);
        toast({ title: "Zähler hinzugefügt" });
      }

      setZaehlerFormOpen(false);
      setZaehlerEditingId(null);
      setZaehlerForm({
        geraeteart: "Kaltwasser",
        montageort: "",
        geraetnummer: "",
        einbaudatum: "",
        geeichtBis: "",
        aktuellerStand: 0,
        standDatum: "",
      });
    } catch (error: any) {
      console.error("Error saving zaehler:", error);
      toast({
        title: "Fehler beim Speichern",
        description: error?.message ?? "Die Daten konnten nicht gespeichert werden.",
        variant: "destructive",
      });
    }
  };

  const handleZaehlerDelete = async (id: string) => {
    try {
      await deleteZaehler(id);
      toast({ title: "Zähler gelöscht" });
    } catch (error: any) {
      console.error("Error deleting zaehler:", error);
      toast({
        title: "Fehler beim Löschen",
        description: error?.message ?? "Die Daten konnten nicht gelöscht werden.",
        variant: "destructive",
      });
    }
  };

  // Rauchmelder handlers
  const handleRauchmelderSave = async () => {
    if (!selectedUnit) return;

    try {
      const naechsteWartung = rauchmelderForm.einbaudatum
        ? new Date(new Date(rauchmelderForm.einbaudatum).getTime() + 365 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0]
        : null;

      const rauchmelderData: Partial<any> = {
        wohnungId: selectedUnit.id,
        wohnungNr: selectedUnit.lage,
        geschoss: selectedUnit.lage,
        geraeteart: "Rauchmelder",
        montageort: rauchmelderForm.montageort,
        modell: rauchmelderForm.modell,
        geraetnummer: rauchmelderForm.geraetnummer,
        lebensdauerBis: rauchmelderForm.lebensdauerBis,
        einbaudatum: rauchmelderForm.einbaudatum,
        letztewartung: rauchmelderForm.letztewartung,
        naechsteWartung: naechsteWartung,
        batteriGeWechselt: rauchmelderForm.batteriGeWechselt,
        status: rauchmelderForm.status,
      };

      if (rauchmelderEditingId) {
        await updateRauchmelder(rauchmelderEditingId, rauchmelderData);
        toast({ title: "Rauchmelder aktualisiert" });
      } else {
        await addRauchmelder({
          id: "",
          ...rauchmelderData,
        } as any);
        toast({ title: "Rauchmelder hinzugefügt" });
      }

      setRauchmelderFormOpen(false);
      setRauchmelderEditingId(null);
      setRauchmelderForm({
        montageort: "",
        modell: "",
        geraetnummer: "",
        einbaudatum: "",
        lebensdauerBis: "",
        letztewartung: "",
        naechsteWartung: "",
        batteriGeWechselt: "",
        status: "OK",
      });
    } catch (error: any) {
      console.error("Error saving rauchmelder:", error);
      toast({
        title: "Fehler beim Speichern",
        description: error?.message ?? "Die Daten konnten nicht gespeichert werden.",
        variant: "destructive",
      });
    }
  };

  const handleRauchmelderDelete = async (id: string) => {
    try {
      await deleteRauchmelder(id);
      toast({ title: "Rauchmelder gelöscht" });
    } catch (error: any) {
      console.error("Error deleting rauchmelder:", error);
      toast({
        title: "Fehler beim Löschen",
        description: error?.message ?? "Die Daten konnten nicht gelöscht werden.",
        variant: "destructive",
      });
    }
  };

  const checkedCount = Object.values(checkedItems).filter(Boolean).length;

  // Wenn kein Objekt ausgewählt oder keine Wohnungen vorhanden
  if (!selectedObjektId) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <Card className="p-8 text-center">
          <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Kein Objekt ausgewählt</h2>
          <p className="text-muted-foreground">
            Bitte wählen Sie oben ein Objekt aus, um die Wohnungen anzuzeigen.
          </p>
        </Card>
      </div>
    );
  }

 if (units.length === 0) {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
      <Card className="p-8 text-center">
        <Home className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold mb-2">Keine Wohnungen</h2>
        <p className="text-muted-foreground mb-4">
          Für &quot;{currentObjekt?.name}&quot; sind noch keine Wohnungen
          angelegt.
        </p>
        <Button
          className="gap-2 bg-success hover:bg-success/90 text-success-foreground"
          onClick={() => setIsNewUnitOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Erste Wohnung anlegen
        </Button>
      </Card>
      <Dialog
        open={isNewUnitOpen}
        onOpenChange={(open) => {
          setIsNewUnitOpen(open);
          if (!open) setNewUnit(initialNewUnit);
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Neue Einheit anlegen</DialogTitle>
            <DialogDescription>
              Erfassen Sie die Daten für eine neue Wohneinheit.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-lage-empty">Geschosslage</Label>
              <Input
                id="new-lage-empty"
                value={newUnit.lage}
                onChange={(e) =>
                  setNewUnit((prev) => ({ ...prev, lage: e.target.value }))
                }
                placeholder="z.B. EG links"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="new-wohnflaeche-empty">Wohnfläche (m²)</Label>
                <Input
                  id="new-wohnflaeche-empty"
                  type="number"
                  step="0.1"
                  value={newUnit.wohnflaeche}
                  onChange={(e) =>
                    setNewUnit((prev) => ({
                      ...prev,
                      wohnflaeche: Number.parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-nutzflaeche-empty">Nutzfläche (m²)</Label>
                <Input
                  id="new-nutzflaeche-empty"
                  type="number"
                  step="0.1"
                  value={newUnit.nutzflaeche}
                  onChange={(e) =>
                    setNewUnit((prev) => ({
                      ...prev,
                      nutzflaeche: Number.parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="new-raeume-empty">Räume</Label>
                <Input
                  id="new-raeume-empty"
                  type="number"
                  value={newUnit.raeume}
                  onChange={(e) =>
                    setNewUnit((prev) => ({
                      ...prev,
                      raeume: Number.parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-miete-empty">Kaltmiete (€)</Label>
                <Input
                  id="new-miete-empty"
                  type="number"
                  value={newUnit.miete}
                  onChange={(e) =>
                    setNewUnit((prev) => ({
                      ...prev,
                      miete: Number.parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-status-empty">Status</Label>
                <Select
                  value={newUnit.status}
                  onValueChange={(value) =>
                    setNewUnit((prev) => ({
                      ...prev,
                      status: value as "frei" | "vermietet",
                    }))
                  }
                >
                  <SelectTrigger id="new-status-empty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="frei">Frei</SelectItem>
                    <SelectItem value="vermietet">Vermietet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewUnitOpen(false)}>
              Abbrechen
            </Button>
            <Button
              className="bg-success hover:bg-success/90 text-success-foreground"
              onClick={handleCreateUnit}
            >
              Einheit anlegen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

  return (
    <div className="flex flex-col md:flex-row gap-3 md:gap-3 h-auto md:h-[calc(100vh-8rem)]">
      {/* Left: Units List */}
      <Card className="w-full md:w-80 shrink-0 flex flex-col overflow-hidden md:max-h-full">
        <CardHeader className="pb-3 space-y-3">
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <CardTitle className="text-base">
                {currentObjekt?.name || "Einheiten"}
              </CardTitle>
              <CardDescription className="text-xs">
                {units.length} {units.length === 1 ? "Wohnung" : "Wohnungen"}
              </CardDescription>
            </div>
            <Button
              size="sm"
              className="w-full gap-1.5 h-8 bg-success hover:bg-success/90 text-success-foreground"
              onClick={() => setIsNewUnitOpen(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              Wohnung anlegen
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full">
            <div className="p-2 space-y-1">
              {filteredUnits.map((unit) => (
                <div
                  key={unit.id}
                  className={cn(
                    "p-3 rounded-lg cursor-pointer transition-all hover:bg-accent group",
                    selectedUnit?.id === unit.id &&
                      "bg-accent ring-1 ring-border",
                  )}
                  onClick={() => setSelectedUnit(unit)}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{unit.lage}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Ruler className="h-3 w-3" />
                          {unit.wohnflaeche} m²
                        </span>
                        <span className="flex items-center gap-1">
                          <DoorOpen className="h-3 w-3" />
                          {unit.raeume} Zi.
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {unit.status && (
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            statusConfig[unit.status].color,
                          )}
                        >
                          {statusConfig[unit.status].label}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Right: Unit Details */}
      {selectedUnit && (
        <div className="flex-1 flex flex-col min-h-0">
          <Tabs defaultValue="daten" className="flex flex-col flex-1 min-h-0">
            <div className="shrink-0 pb-4 pr-2">
              <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5 h-auto">
                <TabsTrigger value="daten" className="text-xs sm:text-sm py-2">Flächendaten</TabsTrigger>
                <TabsTrigger value="ausstattung" className="text-xs sm:text-sm py-2">Ausstattung</TabsTrigger>
                <TabsTrigger value="zaehler" className="text-xs sm:text-sm py-2">Zähler</TabsTrigger>
                <TabsTrigger value="schluessel" className="text-xs sm:text-sm py-2">Schlüssel</TabsTrigger>
                <TabsTrigger value="fotos" className="text-xs sm:text-sm py-2">Fotos</TabsTrigger>
              </TabsList>
              <div className="flex items-center justify-end gap-3 mt-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-9 w-9">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleDuplicateUnit}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplizieren
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled>
                      <Archive className="h-4 w-4 mr-2" />
                      Archivieren
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleDeleteUnit}
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
                  disabled={isSaving}
                >
                  <Save className="h-4 w-4" />
                  {isSaving ? "Wird gespeichert..." : "Speichern"}
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-auto pr-2">

            <TabsContent value="daten" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Flächendaten bearbeiten
                  </CardTitle>
                  <CardDescription>
                    Passen Sie die Grunddaten der Wohneinheit an.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="lage">Geschosslage</Label>
                      <Input
                        id="lage"
                        value={editedUnit?.lage || ""}
                        onChange={(e) =>
                          updateEditedUnit("lage", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="wohnflaeche">Wohnfläche (m²)</Label>
                      <Input
                        id="wohnflaeche"
                        type="number"
                        step="0.1"
                        value={editedUnit?.wohnflaeche || 0}
                        onChange={(e) =>
                          updateEditedUnit(
                            "wohnflaeche",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nutzflaeche">Nutzfläche (m²)</Label>
                      <Input
                        id="nutzflaeche"
                        type="number"
                        step="0.1"
                        value={editedUnit?.nutzflaeche || 0}
                        onChange={(e) =>
                          updateEditedUnit(
                            "nutzflaeche",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="raeume">Räume</Label>
                      <Input
                        id="raeume"
                        type="number"
                        value={editedUnit?.raeume || 0}
                        onChange={(e) =>
                          updateEditedUnit(
                            "raeume",
                            parseInt(e.target.value) || 0,
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="punkte">Punkte</Label>
                      <Input
                        id="punkte"
                        type="number"
                        value={editedUnit?.punkte || 0}
                        onChange={(e) =>
                          updateEditedUnit(
                            "punkte",
                            parseInt(e.target.value) || 0,
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prozent">Prozentanteile</Label>
                      <Input
                        id="prozent"
                        type="number"
                        step="0.1"
                        value={editedUnit?.prozent || 0}
                        onChange={(e) =>
                          updateEditedUnit(
                            "prozent",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={editedUnit?.status || "frei"}
                        onValueChange={(value) =>
                          handleStatusChange(
                            value as "vermietet" | "frei" | "renovierung",
                          )
                        }
                      >
                        <SelectTrigger id="status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="frei">Frei</SelectItem>
                          <SelectItem value="vermietet">Vermietet</SelectItem>
                          <SelectItem value="renovierung">
                            Renovierung
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="miete">Kaltmiete (€)</Label>
                      <Input
                        id="miete"
                        type="number"
                        step="0.01"
                        value={editedUnit?.miete || 0}
                        onChange={(e) =>
                          updateEditedUnit(
                            "miete",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Mieter-Link */}
              {selectedUnit && (() => {
                const unitMieter = mieter.filter(
                  (m) => m.wohnungId === selectedUnit.id && m.isAktiv !== false
                );
                if (unitMieter.length === 0) return (
                  <Card className="border-dashed">
                    <CardContent className="py-4 flex items-center gap-3 text-muted-foreground">
                      <Users className="h-5 w-5" />
                      <span className="text-sm">Kein Mieter zugeordnet</span>
                    </CardContent>
                  </Card>
                );
                return unitMieter.map((m) => (
                  <Card
                    key={m.id}
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => onNavigate?.("mieter", { mieterId: m.id })}
                  >
                    <CardContent className="py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{m.name}</p>
                          <p className="text-xs text-muted-foreground">Mieter</p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </CardContent>
                  </Card>
                ));
              })()}

            </TabsContent>

            <TabsContent value="ausstattung">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Ausstattung & Merkmale
                  </CardTitle>
                  <CardDescription>
                    Wählen Sie die Ausstattungsmerkmale der Wohnung aus.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {ausstattungCategories.map((category) => (
                      <Card
                        key={category.title}
                        className="bg-muted/20 border-dashed overflow-hidden"
                      >
                        <CardHeader className="pb-2 pt-3 px-4">
                          <div className="flex items-center gap-2 min-w-0">
                            <category.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                            <CardTitle className="text-sm font-medium truncate">
                              {category.title}
                            </CardTitle>
                          </div>
                        </CardHeader>
                        <CardContent className="px-4 pb-3">
                          <div className="space-y-2">
                            {category.items.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-start gap-2"
                              >
                                <Checkbox
                                  id={item.id}
                                  checked={checkedItems[item.id] || false}
                                  onCheckedChange={() => toggleItem(item.id)}
                                  className="h-4 w-4 mt-0.5 shrink-0"
                                />
                                <label
                                  htmlFor={item.id}
                                  className="text-sm leading-tight cursor-pointer hover:text-foreground transition-colors break-words min-w-0"
                                >
                                  {item.label}
                                </label>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            {/* Tab: Zähler */}
            <TabsContent value="zaehler" className="space-y-4">
              <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Zähler</CardTitle>
                    <CardDescription>
                      Wasser-, Wärme- und sonstige Zähler für diese Wohneinheit.
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      setZaehlerEditingId(null);
                      setZaehlerForm({
                        geraeteart: "Kaltwasser",
                        montageort: "",
                        geraetnummer: "",
                        einbaudatum: "",
                        geeichtBis: "",
                        aktuellerStand: 0,
                        standDatum: "",
                      });
                      setZaehlerFormOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Zähler hinzufügen
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {zaehlerFormOpen && (
                    <div className="border rounded-lg p-4 bg-muted/30 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Zählerart</Label>
                          <Select
                            value={zaehlerForm.geraeteart}
                            onValueChange={(value) =>
                              setZaehlerForm((prev) => ({ ...prev, geraeteart: value as any }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Kaltwasser">Kaltwasser</SelectItem>
                              <SelectItem value="Warmwasser">Warmwasser</SelectItem>
                              <SelectItem value="Wärme/Heizung">Wärme/Heizung</SelectItem>
                              <SelectItem value="Gas">Gas</SelectItem>
                              <SelectItem value="Strom">Strom</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Geschosslage</Label>
                          <Input
                            disabled
                            value={selectedUnit?.lage || ""}
                            className="bg-muted"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Montageort</Label>
                          <Input
                            placeholder="z.B. Küche"
                            value={zaehlerForm.montageort}
                            onChange={(e) =>
                              setZaehlerForm((prev) => ({ ...prev, montageort: e.target.value }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Gerätenummer</Label>
                          <Input
                            placeholder="z.B. 123456"
                            value={zaehlerForm.geraetnummer}
                            onChange={(e) =>
                              setZaehlerForm((prev) => ({ ...prev, geraetnummer: e.target.value }))
                            }
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Einbaudatum</Label>
                          <Input
                            type="date"
                            value={zaehlerForm.einbaudatum}
                            onChange={(e) =>
                              setZaehlerForm((prev) => ({ ...prev, einbaudatum: e.target.value }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Geeicht bis</Label>
                          <Input
                            type="date"
                            value={zaehlerForm.geeichtBis}
                            onChange={(e) =>
                              setZaehlerForm((prev) => ({ ...prev, geeichtBis: e.target.value }))
                            }
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Aktueller Stand</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={zaehlerForm.aktuellerStand}
                            onChange={(e) =>
                              setZaehlerForm((prev) => ({ ...prev, aktuellerStand: parseFloat(e.target.value) || 0 }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Datum der Ablesung</Label>
                          <Input
                            type="date"
                            value={zaehlerForm.standDatum}
                            onChange={(e) =>
                              setZaehlerForm((prev) => ({ ...prev, standDatum: e.target.value }))
                            }
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          onClick={() => setZaehlerFormOpen(false)}
                        >
                          Abbrechen
                        </Button>
                        <Button
                          className="bg-success hover:bg-success/90"
                          onClick={handleZaehlerSave}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Speichern
                        </Button>
                      </div>
                    </div>
                  )}

                  {(() => {
                    const unitZaehler = zaehler.filter((z) => z.wohnungId === selectedUnit?.id);
                    if (unitZaehler.length === 0) return (
                      <p className="text-sm text-muted-foreground py-4">Keine Zähler für diese Wohnung vorhanden.</p>
                    );
                    return (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Montageort</TableHead>
                            <TableHead>Geräteart</TableHead>
                            <TableHead className="hidden md:table-cell">Gerätenummer</TableHead>
                            <TableHead>Geeicht bis</TableHead>
                            <TableHead className="w-[80px]">Aktionen</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {unitZaehler.map((z) => (
                            <TableRow key={z.id}>
                              <TableCell>{z.montageort}</TableCell>
                              <TableCell className="text-sm">{z.geraeteart}</TableCell>
                              <TableCell className="hidden md:table-cell font-mono text-xs">{z.geraetnummer}</TableCell>
                              <TableCell>{formatDateGerman(z.geeichtBis)}</TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => {
                                      setZaehlerForm({
                                        geraeteart: (z.geraeteart as any) || "Kaltwasser",
                                        montageort: z.montageort || "",
                                        geraetnummer: z.geraetnummer || "",
                                        einbaudatum: z.einbaudatum || "",
                                        geeichtBis: z.geeichtBis || "",
                                        aktuellerStand: z.aktuellerStand || 0,
                                        standDatum: z.standDatum || "",
                                      });
                                      setZaehlerEditingId(z.id);
                                      setZaehlerFormOpen(true);
                                    }}
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                    onClick={() => handleZaehlerDelete(z.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Ad Card: Eichfrist abgelaufen */}
              {hasExpiredOrMissingCalibration && (
                <Card className="border-yellow-200 bg-yellow-50 relative">
                  <div className="absolute top-3 right-3 text-xs text-muted-foreground font-medium"></div>
                  <CardContent className="pt-6 pb-4">
                    <div className="flex gap-4">
                      <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-yellow-900 mb-1">Eichfrist abgelaufen oder unbekannt</h4>
                        <p className="text-sm text-yellow-800 mb-4">Ihre Wasserzähler müssen regelmäßig geeicht werden. Kontaktieren Sie einen Messdienstleister.</p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-yellow-600 text-yellow-700 hover:bg-yellow-100"
                          onClick={() => setZaehlerPartnerDialogOpen(true)}
                        >
                          Jetzt anfragen →
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <Card>
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Rauchmelder</CardTitle>
                    <CardDescription>
                      Rauchmelder in dieser Wohneinheit.
                    </CardDescription>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      setRauchmelderEditingId(null);
                      setRauchmelderForm({
                        montageort: "",
                        modell: "",
                        geraetnummer: "",
                        einbaudatum: "",
                        lebensdauerBis: "",
                        letztewartung: "",
                        naechsteWartung: "",
                        batteriGeWechselt: "",
                        status: "OK",
                      });
                      setRauchmelderFormOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Rauchmelder hinzufügen
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {rauchmelderFormOpen && (
                    <div className="border rounded-lg p-4 bg-muted/30 space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Montageort</Label>
                          <Input
                            placeholder="z.B. Schlafzimmer"
                            value={rauchmelderForm.montageort}
                            onChange={(e) =>
                              setRauchmelderForm((prev) => ({ ...prev, montageort: e.target.value }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Modell/Geräteart</Label>
                          <Input
                            placeholder="z.B. Ei Electronics XC-71"
                            value={rauchmelderForm.modell}
                            onChange={(e) =>
                              setRauchmelderForm((prev) => ({ ...prev, modell: e.target.value }))
                            }
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Einbaudatum</Label>
                          <Input
                            type="date"
                            value={rauchmelderForm.einbaudatum}
                            onChange={(e) => {
                              const newDate = e.target.value;
                              setRauchmelderForm((prev) => ({ 
                                ...prev, 
                                einbaudatum: newDate,
                                // Auto-calculate Lebensdauer bis (10 Jahre)
                                lebensdauerBis: newDate ? new Date(new Date(newDate).getTime() + 10 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] : ""
                              }))
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Lebensdauer bis</Label>
                          <Input
                            type="date"
                            disabled
                            value={rauchmelderForm.lebensdauerBis}
                            className="bg-muted"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Letzte Wartung</Label>
                          <Input
                            type="date"
                            value={rauchmelderForm.letztewartung}
                            onChange={(e) =>
                              setRauchmelderForm((prev) => ({ ...prev, letztewartung: e.target.value }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Letzte Batteriewechsel</Label>
                          <Input
                            type="date"
                            value={rauchmelderForm.batteriGeWechselt}
                            onChange={(e) =>
                              setRauchmelderForm((prev) => ({ ...prev, batteriGeWechselt: e.target.value }))
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <Select
                          value={rauchmelderForm.status}
                          onValueChange={(value) =>
                            setRauchmelderForm((prev) => ({ ...prev, status: value as any }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="OK">OK</SelectItem>
                            <SelectItem value="Wartung fällig">Wartung fällig</SelectItem>
                            <SelectItem value="Defekt">Defekt</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          onClick={() => setRauchmelderFormOpen(false)}
                        >
                          Abbrechen
                        </Button>
                        <Button
                          className="bg-success hover:bg-success/90"
                          onClick={handleRauchmelderSave}
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Speichern
                        </Button>
                      </div>
                    </div>
                  )}

                  {(() => {
                    const unitRauchmelder = rauchmelder.filter((r) => r.wohnungId === selectedUnit?.id);
                    if (unitRauchmelder.length === 0) return (
                      <p className="text-sm text-muted-foreground py-4">Keine Rauchmelder für diese Wohnung vorhanden.</p>
                    );
                    return (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Montageort</TableHead>
                            <TableHead>Geräteart</TableHead>
                            <TableHead className="hidden md:table-cell">Gerätenummer</TableHead>
                            <TableHead>Nächste Wartung</TableHead>
                            <TableHead className="w-[80px]">Aktionen</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {unitRauchmelder.map((r) => (
                            <TableRow key={r.id}>
                              <TableCell>{r.montageort}</TableCell>
                              <TableCell className="text-sm">{r.geraeteart}</TableCell>
                              <TableCell className="hidden md:table-cell font-mono text-xs">{r.geraetnummer}</TableCell>
                              <TableCell>{formatDateGerman(r.naechsteWartung) !== "-" ? formatDateGerman(r.naechsteWartung) : formatDateGerman(r.lebensdauerBis)}</TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => {
                                      setRauchmelderForm({
                                        montageort: r.montageort || "",
                                        modell: r.modell || "",
                                        geraetnummer: r.geraetnummer || "",
                                        einbaudatum: r.einbaudatum || "",
                                        letztewartung: r.letztewartung || "",
                                        naechsteWartung: r.naechsteWartung || "",
                                        batteriGeWechselt: r.batteriGeWechselt || "",
                                        lebensdauerBis: r.lebensdauerBis || "",
                                        status: (r.status as any) || "OK",
                                      });
                                      setRauchmelderEditingId(r.id);
                                      setRauchmelderFormOpen(true);
                                    }}
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                    onClick={() => handleRauchmelderDelete(r.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Ad Card: Wartung fällig für Rauchmelder */}
              {hasMaintenanceDueRauchmelder && (
                <Card className={`relative ${rauchmelder.filter((r) => r.wohnungId === selectedUnit?.id).some((r) => r.status === "Defekt") ? "border-red-200 bg-red-50" : "border-yellow-200 bg-yellow-50"}`}>
                  <div className="absolute top-3 right-3 text-xs text-muted-foreground font-medium">Anzeige</div>
                  <CardContent className="pt-6 pb-4">
                    <div className="flex gap-4">
                      <Wrench className={`h-5 w-5 shrink-0 mt-0.5 ${rauchmelder.filter((r) => r.wohnungId === selectedUnit?.id).some((r) => r.status === "Defekt") ? "text-red-600" : "text-yellow-600"}`} />
                      <div className="flex-1">
                        <h4 className={`font-medium mb-1 ${rauchmelder.filter((r) => r.wohnungId === selectedUnit?.id).some((r) => r.status === "Defekt") ? "text-red-900" : "text-yellow-900"}`}>
                          {rauchmelder.filter((r) => r.wohnungId === selectedUnit?.id).some((r) => r.status === "Defekt") ? "Rauchmelder defekt" : "Wartung fällig"}
                        </h4>
                        <p className={`text-sm mb-4 ${rauchmelder.filter((r) => r.wohnungId === selectedUnit?.id).some((r) => r.status === "Defekt") ? "text-red-800" : "text-yellow-800"}`}>
                          {rauchmelder.filter((r) => r.wohnungId === selectedUnit?.id).some((r) => r.status === "Defekt")
                            ? "Ihre Rauchmelder benötigen sofortige Reparatur. Kontaktieren Sie einen Wartungsservice."
                            : "Ihre Rauchmelder sind wartungsfällig. Beauftragen Sie einen Wartungsservice."}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          className={`${rauchmelder.filter((r) => r.wohnungId === selectedUnit?.id).some((r) => r.status === "Defekt") ? "border-red-600 text-red-700 hover:bg-red-100" : "border-yellow-600 text-yellow-700 hover:bg-yellow-100"}`}
                          onClick={() => setRauchmelderPartnerDialogOpen(true)}
                        >
                          {rauchmelder.filter((r) => r.wohnungId === selectedUnit?.id).some((r) => r.status === "Defekt") ? "Reparatur buchen →" : "Wartung buchen →"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Tab: Schlüssel (Verteilungsschlüssel) */}
            <TabsContent value="schluessel" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Verteilungsschlüssel</CardTitle>
                  <CardDescription>
                    Informationen zur Nebenkostenverteilung für diese Wohneinheit.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {(() => {
                    const unitMieter = mieter.filter(
                      (m) => m.wohnungId === selectedUnit?.id && m.isAktiv !== false
                    );
                    if (unitMieter.length === 0) return (
                      <p className="text-sm text-muted-foreground py-4">Kein Mieter zugeordnet – kein Verteilungsschlüssel verfügbar.</p>
                    );
                    return unitMieter.map((m) => (
                      <div key={m.id} className="p-4 bg-muted/50 rounded-lg space-y-2">
                        <p className="text-sm font-medium">{m.name}</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-muted-foreground">Wohnung</p>
                            <p className="text-sm">{selectedUnit?.lage}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Prozentanteil</p>
                            <p className="text-sm font-medium">{m.prozentanteil ?? 0} %</p>
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                  <p className="text-sm text-muted-foreground">
                    Der Prozentanteil wird für die Verteilung der Nebenkosten verwendet.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 5: Fotos */}
            <TabsContent value="fotos" className="space-y-4">
              {/* Upload area */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Fotos hochladen</CardTitle>
                  <CardDescription>JPG, PNG, WEBP – max. 10 MB pro Datei</CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleFotoUpload(e.dataTransfer.files);
                    }}
                  >
                    <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">Dateien hierher ziehen oder klicken</p>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WEBP bis 10 MB</p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFotoUpload(e.target.files)}
                    />
                  </div>
                  {Object.keys(uploadProgress).length > 0 && (
                    <div className="mt-3 space-y-2">
                      {Object.keys(uploadProgress).map((name) => (
                        <div key={name} className="flex items-center gap-2 text-sm">
                          <Loader2 className="h-3 w-3 animate-spin shrink-0" />
                          <span className="truncate flex-1">{name}</span>
                          <span className="text-muted-foreground text-xs">Wird hochgeladen…</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Photo grid */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      Fotos {fotos.length > 0 && `(${fotos.length})`}
                    </CardTitle>
                    {selectedFotoIds.size > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{selectedFotoIds.size} ausgewählt</span>
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={handleBulkDownload}>
                          <Download className="h-3 w-3" />
                          Runterladen
                        </Button>
                        <Button size="sm" variant="destructive" className="h-7 text-xs gap-1.5" onClick={handleBulkDelete}>
                          <Trash2 className="h-3 w-3" />
                          Löschen
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setSelectedFotoIds(new Set())}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {fotosLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : fotos.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">Noch keine Fotos vorhanden</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {fotos.map((foto, idx) => {
                        const isSelected = selectedFotoIds.has(foto.id);
                        return (
                          <div
                            key={foto.id}
                            draggable
                            onDragStart={() => { dragIndexRef.current = idx; dragHappenedRef.current = true; }}
                            onDragEnd={() => { setTimeout(() => { dragHappenedRef.current = false; }, 50); }}
                            onDragOver={(e) => { e.preventDefault(); setDragOverIndex(idx); }}
                            onDragLeave={() => setDragOverIndex(null)}
                            onDrop={(e) => {
                              e.preventDefault();
                              setDragOverIndex(null);
                              const from = dragIndexRef.current;
                              if (from === null || from === idx) return;
                              setFotos((prev) => {
                                const next = [...prev];
                                const [item] = next.splice(from, 1);
                                next.splice(idx, 0, item);
                                return next;
                              });
                              dragIndexRef.current = null;
                            }}
                            className={cn(
                              "group relative aspect-square rounded-lg overflow-hidden border bg-muted cursor-pointer transition-all select-none",
                              isSelected ? "border-primary ring-2 ring-primary" : "border-border",
                              dragOverIndex === idx && dragIndexRef.current !== idx ? "scale-95 opacity-60" : ""
                            )}
                            onClick={() => {
                              if (dragHappenedRef.current) return;
                              if (selectedFotoIds.size > 0) {
                                setSelectedFotoIds((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(foto.id)) next.delete(foto.id);
                                  else next.add(foto.id);
                                  return next;
                                });
                              } else {
                                setLightboxIndex(idx);
                              }
                            }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={foto.signedUrl}
                              alt={foto.file_name}
                              className="w-full h-full object-cover"
                            />
                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 pointer-events-none">
                              <p className="text-white text-xs font-medium truncate">{foto.file_name}</p>
                              <p className="text-white/70 text-xs">
                                {new Date(foto.uploaded_at).toLocaleDateString("de-DE")}
                              </p>
                            </div>
                            {/* Checkbox */}
                            <button
                              className={cn(
                                "absolute top-1 left-1 rounded-full w-5 h-5 flex items-center justify-center transition-all z-10 border",
                                isSelected
                                  ? "bg-primary border-primary text-primary-foreground opacity-100"
                                  : "bg-black/40 border-white/60 text-white opacity-0 group-hover:opacity-100"
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedFotoIds((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(foto.id)) next.delete(foto.id);
                                  else next.add(foto.id);
                                  return next;
                                });
                              }}
                              aria-label={isSelected ? "Abwählen" : "Auswählen"}
                            >
                              {isSelected && <Check className="h-3 w-3" />}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Lightbox */}
              {lightboxIndex !== null && fotos[lightboxIndex] && (
                <div
                  className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
                  onClick={() => setLightboxIndex(null)}
                >
                  <button
                    className="absolute top-4 right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2"
                    onClick={() => setLightboxIndex(null)}
                  >
                    <X className="h-5 w-5" />
                  </button>
                  {lightboxIndex > 0 && (
                    <button
                      className="absolute left-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2"
                      onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex - 1); }}
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                  )}
                  {lightboxIndex < fotos.length - 1 && (
                    <button
                      className="absolute right-4 text-white bg-white/10 hover:bg-white/20 rounded-full p-2"
                      onClick={(e) => { e.stopPropagation(); setLightboxIndex(lightboxIndex + 1); }}
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  )}
                  <div className="max-w-4xl max-h-[90vh] px-16" onClick={(e) => e.stopPropagation()}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={fotos[lightboxIndex].signedUrl}
                      alt={fotos[lightboxIndex].file_name}
                      className="max-w-full max-h-[80vh] object-contain rounded-lg"
                    />
                    <p className="text-white/70 text-sm text-center mt-2">
                      {fotos[lightboxIndex].file_name} · {new Date(fotos[lightboxIndex].uploaded_at).toLocaleDateString("de-DE")}
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>

            </div>
          </Tabs>
        </div>
      )}

      {/* New Unit Dialog */}
      <Dialog
        open={isNewUnitOpen}
        onOpenChange={(open) => {
          setIsNewUnitOpen(open);
          if (!open) setNewUnit(initialNewUnit);
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Neue Einheit anlegen</DialogTitle>
            <DialogDescription>
              Erfassen Sie die Daten für eine neue Wohneinheit.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-lage">Geschosslage</Label>
              <Input
                id="new-lage"
                value={newUnit.lage}
                onChange={(e) =>
                  setNewUnit((prev) => ({ ...prev, lage: e.target.value }))
                }
                placeholder="z.B. EG links"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="new-wohnflaeche">Wohnfläche (m²)</Label>
                <Input
                  id="new-wohnflaeche"
                  type="number"
                  step="0.1"
                  value={newUnit.wohnflaeche}
                  onChange={(e) =>
                    setNewUnit((prev) => ({
                      ...prev,
                      wohnflaeche: Number.parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-nutzflaeche">Nutzfläche (m²)</Label>
                <Input
                  id="new-nutzflaeche"
                  type="number"
                  step="0.1"
                  value={newUnit.nutzflaeche}
                  onChange={(e) =>
                    setNewUnit((prev) => ({
                      ...prev,
                      nutzflaeche: Number.parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="new-raeume">Räume</Label>
                <Input
                  id="new-raeume"
                  type="number"
                  value={newUnit.raeume}
                  onChange={(e) =>
                    setNewUnit((prev) => ({
                      ...prev,
                      raeume: Number.parseInt(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-miete">Kaltmiete (€)</Label>
                <Input
                  id="new-miete"
                  type="number"
                  value={newUnit.miete}
                  onChange={(e) =>
                    setNewUnit((prev) => ({
                      ...prev,
                      miete: Number.parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-status">Status</Label>
                <Select
                  value={newUnit.status}
                  onValueChange={(value) =>
                    setNewUnit((prev) => ({
                      ...prev,
                      status: value as "frei" | "vermietet",
                    }))
                  }
                >
                  <SelectTrigger id="new-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="frei">Frei</SelectItem>
                    <SelectItem value="vermietet">Vermietet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewUnitOpen(false)}>
              Abbrechen
            </Button>
            <Button
              className="bg-success hover:bg-success/90 text-success-foreground"
              onClick={handleCreateUnit}
            >
              Einheit anlegen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive Confirmation Dialog */}
      <Dialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mieter archivieren?</DialogTitle>
            <DialogDescription>
              Diese Wohnung ist aktuell von{" "}
              <span className="font-semibold">{archiveDialogData?.activeMieter?.name}</span>{" "}
              bewohnt. Was soll mit dem Mietverhältnis passieren?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              • <span className="font-medium">Ja, archivieren:</span> Der Mieter wird archiviert und die
              Wohnung auf &quot;{archiveDialogData?.newStatus === "frei" ? "Frei" : "Renovierung"}&quot; gesetzt.
            </p>
            <p>
              • <span className="font-medium">Nein, nur Status ändern:</span> Die Wohnung wird auf &quot;
              {archiveDialogData?.newStatus === "frei" ? "Frei" : "Renovierung"}&quot; gesetzt, der Mieter bleibt aktiv.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setArchiveDialogOpen(false);
                setArchiveDialogData(null);
              }}
              disabled={archiveProcessing}
            >
              Abbrechen
            </Button>
            <Button
              variant="outline"
              onClick={handleSkipArchive}
              disabled={archiveProcessing}
            >
              Nein, nur Status ändern
            </Button>
            <Button
              className="bg-destructive hover:bg-destructive/90"
              onClick={handleArchiveMieter}
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

      {/* Zähler Partner Dialog */}
      <Dialog open={zaehlerPartnerDialogOpen} onOpenChange={setZaehlerPartnerDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Messdienstleister</DialogTitle>
            <DialogDescription>Professionelle Hilfe bei Zählereichung</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {[
              {
                initials: "TC",
                name: "Techem",
                desc: "Messdienstleistungen & Heizkostenabrechnung",
                rating: 5,
                tags: ["Bundesweit", "Schnell"],
              },
              {
                initials: "IS",
                name: "Ista",
                desc: "Energiedienstleistungen & Messungen",
                rating: 4,
                tags: ["Zuverlässig", "Modern"],
              },
              {
                initials: "BR",
                name: "Brunata",
                desc: "Wärmezähler & Messgeräte",
                rating: 4,
                tags: ["Spezialist", "Kompetent"],
              },
              {
                initials: "MI",
                name: "Minol",
                desc: "Erfassungsgeräte & Messdienstleistungen",
                rating: 4,
                tags: ["Flexibel", "Günstig"],
              },
            ].map((partner) => (
              <Card key={partner.name} className="relative">
                <span className="absolute top-2 right-3 text-[10px] text-muted-foreground">Anzeige</span>
                <CardContent className="pt-4 pb-4">
                  <div className="flex gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-primary">{partner.initials}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{partner.name}</h3>
                      <p className="text-xs text-muted-foreground mb-2">{partner.desc}</p>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span
                              key={i}
                              className={`text-xs ${i < partner.rating ? "text-yellow-500" : "text-gray-300"}`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">{partner.rating}.0</span>
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {partner.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs h-5">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs flex-shrink-0"
                    >
                      Jetzt anfragen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">* Bezahlte Partneranzeigen. Wir erhalten eine Provision bei Vermittlung.</p>
        </DialogContent>
      </Dialog>

      {/* Rauchmelder Partner Dialog */}
      <Dialog open={rauchmelderPartnerDialogOpen} onOpenChange={setRauchmelderPartnerDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Wartungspartner</DialogTitle>
            <DialogDescription>Professionelle Wartung & Reparatur von Rauchmeldern</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {[
              {
                initials: "TC",
                name: "Techem",
                desc: "Messdienstleistungen & Heizkostenabrechnung",
                rating: 5,
                tags: ["Bundesweit", "Schnell"],
              },
              {
                initials: "IS",
                name: "Ista",
                desc: "Energiedienstleistungen & Messungen",
                rating: 4,
                tags: ["Zuverlässig", "Modern"],
              },
              {
                initials: "BR",
                name: "Brunata",
                desc: "Wärmezähler & Messgeräte",
                rating: 4,
                tags: ["Spezialist", "Kompetent"],
              },
              {
                initials: "MI",
                name: "Minol",
                desc: "Erfassungsgeräte & Messdienstleistungen",
                rating: 4,
                tags: ["Flexibel", "Günstig"],
              },
            ].map((partner) => (
              <Card key={partner.name} className="relative">
                <span className="absolute top-2 right-3 text-[10px] text-muted-foreground">Anzeige</span>
                <CardContent className="pt-4 pb-4">
                  <div className="flex gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-primary">{partner.initials}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{partner.name}</h3>
                      <p className="text-xs text-muted-foreground mb-2">{partner.desc}</p>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span
                              key={i}
                              className={`text-xs ${i < partner.rating ? "text-yellow-500" : "text-gray-300"}`}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">{partner.rating}.0</span>
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {partner.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs h-5">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs flex-shrink-0"
                    >
                      Jetzt anfragen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">* Bezahlte Partneranzeigen. Wir erhalten eine Provision bei Vermittlung.</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
