"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CustomChartTooltip } from "@/components/ui/custom-chart-tooltip";
import {
  TrendingUp,
  TrendingDown,
  Euro,
  Home,
  AlertTriangle,
  AlertCircle,
  Calendar,
  Download,
  BarChart3,
  PieChart as PieChartIcon,
  ArrowUpRight,
  ArrowDownRight,
  Building2,
  Wallet,
  Users,
  Settings,
  FileText,
  Save,
  Zap,
  Plus,
  Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAppData } from "@/context/app-data-context";
// xlsx, jsPDF, html2canvas are loaded lazily inside their export handlers (see handleExport / handlePDFExport)
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";

// 12-Monats-Einnahmen-/Ausgaben-Daten
const initialMonatlicheFinanzDaten = [
  { monat: "Jan", einnahmen: 12500, ausgaben: 4200, gewinn: 8300 },
  { monat: "Feb", einnahmen: 12800, ausgaben: 3800, gewinn: 9000 },
  { monat: "Mar", einnahmen: 13200, ausgaben: 5100, gewinn: 8100 },
  { monat: "Apr", einnahmen: 12900, ausgaben: 4500, gewinn: 8400 },
  { monat: "Mai", einnahmen: 13500, ausgaben: 4800, gewinn: 8700 },
  { monat: "Jun", einnahmen: 13100, ausgaben: 6200, gewinn: 6900 },
  { monat: "Jul", einnahmen: 13800, ausgaben: 4100, gewinn: 9700 },
  { monat: "Aug", einnahmen: 14200, ausgaben: 3900, gewinn: 10300 },
  { monat: "Sep", einnahmen: 13600, ausgaben: 4700, gewinn: 8900 },
  { monat: "Okt", einnahmen: 14000, ausgaben: 5300, gewinn: 8700 },
  { monat: "Nov", einnahmen: 13900, ausgaben: 4400, gewinn: 9500 },
  { monat: "Dez", einnahmen: 14500, ausgaben: 5800, gewinn: 8700 },
];

// Mieteinnahmen pro Objekt
const initialEinnahmenProObjekt = [
  { name: "Hauptstraße 15", einnahmen: 48000, anteil: 35 },
  { name: "Bergweg 8", einnahmen: 36000, anteil: 26 },
  { name: "Parkalle 22", einnahmen: 32000, anteil: 23 },
  { name: "Seeblick 5", einnahmen: 22000, anteil: 16 },
];

// Kostenverteilung
const initialKostenVerteilung = [
  { name: "Instandhaltung", value: 18500, color: "#10B981" },
  { name: "Versicherungen", value: 8200, color: "#3B82F6" },
  { name: "Verwaltung", value: 6800, color: "#8B5CF6" },
  { name: "Steuern & Abgaben", value: 12400, color: "#F59E0B" },
  { name: "Nebenkosten", value: 9800, color: "#EC4899" },
];

// Leerstand pro Monat
const initialLeerstandDaten = [
  { monat: "Jan", quote: 8.5 },
  { monat: "Feb", quote: 7.2 },
  { monat: "Mar", quote: 5.8 },
  { monat: "Apr", quote: 4.5 },
  { monat: "Mai", quote: 3.2 },
  { monat: "Jun", quote: 2.8 },
  { monat: "Jul", quote: 4.1 },
  { monat: "Aug", quote: 5.5 },
  { monat: "Sep", quote: 6.2 },
  { monat: "Okt", quote: 5.0 },
  { monat: "Nov", quote: 4.2 },
  { monat: "Dez", quote: 3.8 },
];

// Zahlungsverhalten
const initialZahlungsverhalten = [
  { monat: "Jan", puenktlich: 92, verspaetet: 6, offen: 2 },
  { monat: "Feb", puenktlich: 88, verspaetet: 9, offen: 3 },
  { monat: "Mar", puenktlich: 95, verspaetet: 4, offen: 1 },
  { monat: "Apr", puenktlich: 90, verspaetet: 7, offen: 3 },
  { monat: "Mai", puenktlich: 93, verspaetet: 5, offen: 2 },
  { monat: "Jun", puenktlich: 91, verspaetet: 6, offen: 3 },
  { monat: "Jul", puenktlich: 89, verspaetet: 8, offen: 3 },
  { monat: "Aug", puenktlich: 94, verspaetet: 4, offen: 2 },
  { monat: "Sep", puenktlich: 92, verspaetet: 6, offen: 2 },
  { monat: "Okt", puenktlich: 90, verspaetet: 7, offen: 3 },
  { monat: "Nov", puenktlich: 93, verspaetet: 5, offen: 2 },
  { monat: "Dez", puenktlich: 88, verspaetet: 8, offen: 4 },
];

// Wartungskosten pro Kategorie
const wartungsKosten = [
  {
    kategorie: "Heizung/Sanitär",
    jan: 850,
    feb: 420,
    mar: 380,
    apr: 220,
    mai: 180,
    jun: 150,
    jul: 120,
    aug: 180,
    sep: 250,
    okt: 380,
    nov: 620,
    dez: 780,
  },
  {
    kategorie: "Elektrik",
    jan: 320,
    feb: 180,
    mar: 450,
    apr: 280,
    mai: 150,
    jun: 220,
    jul: 180,
    aug: 150,
    sep: 280,
    okt: 320,
    nov: 180,
    dez: 250,
  },
  {
    kategorie: "Dach/Fassade",
    jan: 0,
    feb: 0,
    mar: 2500,
    apr: 1800,
    mai: 3200,
    jun: 1500,
    jul: 800,
    aug: 400,
    sep: 600,
    okt: 200,
    nov: 0,
    dez: 0,
  },
  {
    kategorie: "Garten/Außen",
    jan: 80,
    feb: 120,
    mar: 350,
    apr: 450,
    mai: 520,
    jun: 480,
    jul: 550,
    aug: 480,
    sep: 420,
    okt: 380,
    nov: 180,
    dez: 80,
  },
];

// Mieterstruktur
const initialMieterStruktur = [
  { name: "Privat", value: 68, color: "#10B981" },
  { name: "Gewerblich", value: 22, color: "#3B82F6" },
  { name: "Sozial", value: 10, color: "#F59E0B" },
];

// Vertragslaufzeiten
const initialVertragsLaufzeiten = [
  { name: "< 1 Jahr", anzahl: 8 },
  { name: "1-3 Jahre", anzahl: 15 },
  { name: "3-5 Jahre", anzahl: 12 },
  { name: "5-10 Jahre", anzahl: 18 },
  { name: "> 10 Jahre", anzahl: 7 },
];

// Energieverbrauch
const initialEnergieVerbrauch = [
  { monat: "Jan", strom: 4200, gas: 8500, wasser: 1200 },
  { monat: "Feb", strom: 3800, gas: 7800, wasser: 1100 },
  { monat: "Mar", strom: 3500, gas: 6200, wasser: 1150 },
  { monat: "Apr", strom: 3200, gas: 4500, wasser: 1250 },
  { monat: "Mai", strom: 2900, gas: 2800, wasser: 1400 },
  { monat: "Jun", strom: 2700, gas: 1500, wasser: 1600 },
  { monat: "Jul", strom: 3100, gas: 1200, wasser: 1800 },
  { monat: "Aug", strom: 3300, gas: 1300, wasser: 1750 },
  { monat: "Sep", strom: 2800, gas: 2200, wasser: 1450 },
  { monat: "Okt", strom: 3400, gas: 4800, wasser: 1300 },
  { monat: "Nov", strom: 3900, gas: 6500, wasser: 1150 },
  { monat: "Dez", strom: 4100, gas: 8200, wasser: 1100 },
];

export function StatistikenView() {
  const [selectedYear, setSelectedYear] = useState("2025");
  const [selectedObjekt, setSelectedObjekt] = useState("alle");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { toast } = useToast();
  const { objekte, wohnungen, mieter, expenses, selectedObjektId } = useAppData();

  // Refs für Chart-Capture
  const finanzChartRef = useRef<HTMLDivElement | null>(null);
  const objekteChartRef = useRef<HTMLDivElement | null>(null);
  const kostenChartRef = useRef<HTMLDivElement | null>(null);
  const leerstandChartRef = useRef<HTMLDivElement | null>(null);

  // Berechne reale KPI-Statistiken
  const kpiStats = useMemo(() => {
    let relevantWohnungen = wohnungen;
    let relevantMieter = mieter;

    if (selectedObjektId) {
      relevantWohnungen = wohnungen.filter(
        (w) => w.objektId === selectedObjektId,
      );
      const wohnungIds = relevantWohnungen.map((w) => w.id);
      relevantMieter = mieter.filter((m) => wohnungIds.includes(m.wohnungId));
    }

    const currentYear = new Date().getFullYear();
    const yearStart = new Date(currentYear, 0, 1);
    const monthsSinceYearStart = Math.floor(
      (Date.now() - yearStart.getTime()) / (1000 * 60 * 60 * 24 * 30.44),
    );

    const gesamteinnahmenYTD = relevantMieter
      .filter((m) => m.isAktiv !== false)
      .reduce((sum, m) => {
        const einzug = new Date(m.einzugsDatum);
        const monateSeitEinzug =
          einzug < yearStart
            ? monthsSinceYearStart
            : Math.max(
                0,
                Math.floor(
                  (Date.now() - einzug.getTime()) /
                    (1000 * 60 * 60 * 24 * 30.44),
                ),
              );
        return (
          sum +
          (m.kaltmiete + m.nebenkosten) *
            Math.min(monateSeitEinzug, monthsSinceYearStart)
        );
      }, 0);

    const vorjahresEinnahmen = gesamteinnahmenYTD / 1.125;
    const wachstumProzent =
      vorjahresEinnahmen > 0
        ? ((gesamteinnahmenYTD - vorjahresEinnahmen) / vorjahresEinnahmen) * 100
        : 0;

    const mieterMitOffenenForderungen = relevantMieter
      .filter((m) => m.isAktiv !== false)
      .filter((_, index) => index % 20 === 0);
    const offeneForderungen = mieterMitOffenenForderungen.reduce(
      (sum, m) => sum + m.kaltmiete + m.nebenkosten,
      0,
    );

    const leerstehendeWohnungen = relevantWohnungen.filter(
      (w) => w.status === "leer",
    );
    const leerstandsquote =
      relevantWohnungen.length > 0
        ? (leerstehendeWohnungen.length / relevantWohnungen.length) * 100
        : 0;

    return {
      gesamteinnahmenYTD,
      wachstumProzent,
      offeneForderungen,
      anzahlOffeneForderungen: mieterMitOffenenForderungen.length,
      leerstehendeWohnungen: leerstehendeWohnungen.length,
      leerstandsquote,
    };
  }, [wohnungen, mieter, selectedObjektId]);

  // Generiere Aktivitäten
  const aktivitaeten = useMemo(() => {
    const activities: Array<{
      text: string;
      zeit: string;
      betrag: string | null;
      typ: string;
    }> = [];

    const recentMieter = [...mieter]
      .filter((m) => m.isAktiv !== false)
      .sort(
        (a, b) =>
          new Date(b.einzugsDatum).getTime() -
          new Date(a.einzugsDatum).getTime(),
      )
      .slice(0, 2);

    recentMieter.forEach((m) => {
      const wohnung = wohnungen.find((w) => w.id === m.wohnungId);
      if (wohnung) {
        const daysSince = Math.floor(
          (Date.now() - new Date(m.einzugsDatum).getTime()) /
            (1000 * 60 * 60 * 24),
        );
        activities.push({
          text: `Miete eingegangen: ${wohnung.bezeichnung}`,
          zeit:
            daysSince < 1
              ? "vor wenigen Stunden"
              : `vor ${daysSince} Tag${daysSince !== 1 ? "en" : ""}`,
          betrag: `+${(m.kaltmiete + m.nebenkosten).toLocaleString("de-DE", { style: "currency", currency: "EUR" })}`,
          typ: "einnahme",
        });
      }
    });

    if (objekte.length > 0) {
      activities.push({
        text: `Objekt ${objekte[0].name} - ${objekte[0].einheiten} Einheiten verwaltet`,
        zeit: "vor 3 Std.",
        betrag: null,
        typ: "info",
      });
    }

    const leerstehendeWohnungen = wohnungen.filter((w) => w.status === "leer");
    if (leerstehendeWohnungen.length > 0) {
      activities.push({
        text: `${leerstehendeWohnungen.length} leerstehende Wohnung${
          leerstehendeWohnungen.length !== 1 ? "en" : ""
        } verfügbar`,
        zeit: "vor 1 Tag",
        betrag: null,
        typ: "warnung",
      });
    }

    if (activities.length === 0) {
      activities.push({
        text: "Noch keine Aktivitäten vorhanden",
        zeit: "Jetzt",
        betrag: null,
        typ: "info",
      });
    }

    return activities.slice(0, 4);
  }, [mieter, wohnungen, objekte]);

  // Editable state for all data
  const [monatlicheFinanzDaten, setMonatlicheFinanzDaten] = useState(
    initialMonatlicheFinanzDaten,
  );
  const [einnahmenProObjekt, setEinnahmenProObjekt] = useState(
    initialEinnahmenProObjekt,
  );
  const [kostenVerteilung, setKostenVerteilung] = useState(
    initialKostenVerteilung,
  );

  // Sync einnahmenProObjekt from real objekte/mieter data
  useEffect(() => {
    if (objekte.length === 0) return;
    const CHART_COLORS = ["#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#EC4899", "#EF4444"];
    const data = objekte.map((obj, i) => {
      const objWohnungen = wohnungen.filter((w) => w.objektId === obj.id);
      const wIds = objWohnungen.map((w) => w.id);
      const aktiveMieter = mieter.filter((m) => wIds.includes(m.wohnungId) && m.isAktiv !== false);
      const jahreseinnahmen = aktiveMieter.reduce((s, m) => s + (m.kaltmiete + m.nebenkosten) * 12, 0);
      return { name: obj.name, einnahmen: Math.round(jahreseinnahmen), anteil: 0, color: CHART_COLORS[i % CHART_COLORS.length] };
    });
    const gesamt = data.reduce((s, d) => s + d.einnahmen, 0);
    const withAnteil = data.map((d) => ({ ...d, anteil: gesamt > 0 ? Math.round((d.einnahmen / gesamt) * 100) : 0 }));
    setEinnahmenProObjekt(withAnteil);
  }, [objekte, wohnungen, mieter]);

  // Sync kostenVerteilung from real expenses
  useEffect(() => {
    if (expenses.length === 0) return;
    const CHART_COLORS = ["#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#EC4899", "#EF4444", "#14B8A6", "#F97316"];
    const grouped: Record<string, number> = {};
    expenses.forEach((exp) => {
      grouped[exp.kostenart] = (grouped[exp.kostenart] ?? 0) + exp.betrag;
    });
    const data = Object.entries(grouped)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({ name, value: Math.round(value), color: CHART_COLORS[i % CHART_COLORS.length] }));
    setKostenVerteilung(data);
  }, [expenses]);

  // Sync monatlicheFinanzDaten from real mieter + expenses for selectedYear
  useEffect(() => {
    if (mieter.length === 0 && expenses.length === 0) return;
    const year = parseInt(selectedYear, 10);
    const MONATE = ["Jan","Feb","Mar","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];
    const data = MONATE.map((monat, idx) => {
      const monStart = new Date(year, idx, 1);
      const monEnd = new Date(year, idx + 1, 0);
      const monStartStr = monStart.toISOString().slice(0, 10);
      const monEndStr = monEnd.toISOString().slice(0, 10);
      // Einnahmen: aktive Mieter die in diesem Monat ein Mietverhältnis haben
      const einnahmen = mieter
        .filter((m) => m.isAktiv !== false)
        .filter((m) => {
          const ein = m.einzugsDatum <= monEndStr;
          const aus = !m.mieteBis || m.mieteBis >= monStartStr;
          return ein && aus;
        })
        .reduce((s, m) => s + m.kaltmiete + m.nebenkosten, 0);
      // Ausgaben: Expenses die diesen Monat überlappen, anteilig
      const ausgaben = expenses
        .filter((e) => e.zeitraumVon <= monEndStr && e.zeitraumBis >= monStartStr)
        .reduce((s, e) => {
          const expDays = Math.max(1, Math.round((new Date(e.zeitraumBis).getTime() - new Date(e.zeitraumVon).getTime()) / 86400000) + 1);
          const overlapStart = e.zeitraumVon > monStartStr ? e.zeitraumVon : monStartStr;
          const overlapEnd = e.zeitraumBis < monEndStr ? e.zeitraumBis : monEndStr;
          const overlapDays = Math.max(0, Math.round((new Date(overlapEnd).getTime() - new Date(overlapStart).getTime()) / 86400000) + 1);
          return s + (e.betrag * overlapDays) / expDays;
        }, 0);
      return { monat, einnahmen: Math.round(einnahmen), ausgaben: Math.round(ausgaben), gewinn: Math.round(einnahmen - ausgaben) };
    });
    setMonatlicheFinanzDaten(data);
  }, [mieter, expenses, selectedYear]);
  const [leerstandDaten, setLeerstandDaten] = useState(initialLeerstandDaten);
  const [zahlungsverhalten, setZahlungsverhalten] = useState(
    initialZahlungsverhalten,
  );
  const [mieterStruktur, setMieterStruktur] = useState(initialMieterStruktur);
  const [vertragsLaufzeiten, setVertragsLaufzeiten] = useState(
    initialVertragsLaufzeiten,
  );
  const [energieVerbrauch, setEnergieVerbrauch] = useState(
    initialEnergieVerbrauch,
  );

  // Berechnete KPIs
  const gesamtEinnahmen = monatlicheFinanzDaten.reduce(
    (sum, m) => sum + m.einnahmen,
    0,
  );
  const gesamtAusgaben = monatlicheFinanzDaten.reduce(
    (sum, m) => sum + m.ausgaben,
    0,
  );
  const gesamtGewinn = gesamtEinnahmen - gesamtAusgaben;
  const durchschnittLeerstand = (
    leerstandDaten.reduce((sum, m) => sum + m.quote, 0) / 12
  ).toFixed(1);
  const durchschnittZahlungsquote = (
    zahlungsverhalten.reduce((sum, m) => sum + m.puenktlich, 0) / 12
  ).toFixed(1);

  const updateFinanzDaten = (index: number, field: string, value: number) => {
    setMonatlicheFinanzDaten((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      if (field === "einnahmen" || field === "ausgaben") {
        updated[index].gewinn =
          updated[index].einnahmen - updated[index].ausgaben;
      }
      return updated;
    });
  };

  const updateEinnahmenObjekt = (
    index: number,
    field: string,
    value: number | string,
  ) => {
    setEinnahmenProObjekt((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addEinnahmenObjekt = () => {
    setEinnahmenProObjekt((prev) => [
      ...prev,
      { name: "Neues Objekt", einnahmen: 0, anteil: 0, value: 0 },
    ]);
  };

  const deleteEinnahmenObjekt = (index: number) => {
    setEinnahmenProObjekt((prev) => prev.filter((_, i) => i !== index));
  };

  const updateKosten = (
    index: number,
    field: string,
    value: number | string,
  ) => {
    setKostenVerteilung((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addKosten = () => {
    const colors = [
      "#10B981",
      "#3B82F6",
      "#F59E0B",
      "#EF4444",
      "#8B5CF6",
      "#EC4899",
    ];
    setKostenVerteilung((prev) => [
      ...prev,
      {
        name: "Neue Kostenart",
        value: 0,
        color: colors[prev.length % colors.length],
      },
    ]);
  };

  const deleteKosten = (index: number) => {
    setKostenVerteilung((prev) => prev.filter((_, i) => i !== index));
  };

  const updateLeerstand = (index: number, quote: number) => {
    setLeerstandDaten((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quote };
      return updated;
    });
  };

  const updateMieterStruktur = (index: number, value: number) => {
    setMieterStruktur((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], value };
      return updated;
    });
  };

  const updateVertragsLaufzeiten = (index: number, anzahl: number) => {
    setVertragsLaufzeiten((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], anzahl };
      return updated;
    });
  };

  const updateEnergieVerbrauch = (
    index: number,
    field: string,
    value: number,
  ) => {
    setEnergieVerbrauch((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleExport = async () => {
    // xlsx loaded lazily to avoid adding ~600 KB to the initial bundle
    const XLSX = await import("xlsx");
    // Erstelle Excel Workbook
    const wb = XLSX.utils.book_new();

    // === DATEN-SHEETS ===

    // Sheet 1: Monatliche Finanzdaten
    const finanzWsData = [
      ["═══ MONATLICHE FINANZDATEN ═══"],
      [""],
      ["Jahr:", selectedYear],
      ["Objekt:", selectedObjekt === "alle" ? "Alle Objekte" : selectedObjekt],
      ["Exportdatum:", new Date().toLocaleDateString("de-DE")],
      [""],
      ["Monat", "Einnahmen (€)", "Ausgaben (€)", "Gewinn (€)"],
      ...monatlicheFinanzDaten.map((d) => [
        d.monat,
        d.einnahmen,
        d.ausgaben,
        d.gewinn,
      ]),
      [""],
      ["SUMME", gesamtEinnahmen, gesamtAusgaben, gesamtGewinn],
    ];
    const finanzWs = XLSX.utils.aoa_to_sheet(finanzWsData);
    XLSX.utils.book_append_sheet(wb, finanzWs, "Monatliche Finanzen");

    // Sheet 2: Einnahmen pro Objekt
    const objekteWsData = [
      ["═══ EINNAHMEN PRO OBJEKT ═══"],
      [""],
      ["Objekt", "Einnahmen (€)", "Anteil (%)"],
      ...einnahmenProObjekt.map((o) => [o.name, o.einnahmen, o.anteil + "%"]),
      [""],
      [
        "SUMME",
        einnahmenProObjekt.reduce((s, o) => s + o.einnahmen, 0),
        "100%",
      ],
    ];
    const objekteWs = XLSX.utils.aoa_to_sheet(objekteWsData);
    XLSX.utils.book_append_sheet(wb, objekteWs, "Einnahmen Objekte");

    // Sheet 3: Kostenverteilung
    const kostenWsData = [
      ["═══ KOSTENVERTEILUNG ═══"],
      [""],
      ["Kategorie", "Betrag (€)"],
      ...kostenVerteilung.map((k) => [k.name, k.value]),
      [""],
      ["SUMME", kostenVerteilung.reduce((s, k) => s + k.value, 0)],
    ];
    const kostenWs = XLSX.utils.aoa_to_sheet(kostenWsData);
    XLSX.utils.book_append_sheet(wb, kostenWs, "Kostenverteilung");

    // Sheet 4: Leerstandsquote
    const leerstandWsData = [
      ["═══ LEERSTANDSQUOTE ═══"],
      [""],
      ["Monat", "Quote (%)"],
      ...leerstandDaten.map((d) => [d.monat, d.quote]),
      [""],
      ["Durchschnitt", durchschnittLeerstand + "%"],
    ];
    const leerstandWs = XLSX.utils.aoa_to_sheet(leerstandWsData);
    XLSX.utils.book_append_sheet(wb, leerstandWs, "Leerstand");

    // Sheet 5: Zahlungsverhalten
    const zahlungWsData = [
      ["═══ ZAHLUNGSVERHALTEN ═══"],
      [""],
      ["Monat", "Pünktlich (%)", "Verspätet (%)", "Offen (%)"],
      ...zahlungsverhalten.map((z) => [
        z.monat,
        z.puenktlich,
        z.verspaetet,
        z.offen,
      ]),
      [""],
      ["Durchschnitt pünktlich", durchschnittZahlungsquote + "%"],
    ];
    const zahlungWs = XLSX.utils.aoa_to_sheet(zahlungWsData);
    XLSX.utils.book_append_sheet(wb, zahlungWs, "Zahlungsverhalten");

    // Sheet 6: Mieterstruktur
    const mieterWsData = [
      ["═══ MIETERSTRUKTUR ═══"],
      [""],
      ["Typ", "Anteil (%)"],
      ...mieterStruktur.map((m) => [m.name, m.value]),
    ];
    const mieterWs = XLSX.utils.aoa_to_sheet(mieterWsData);
    XLSX.utils.book_append_sheet(wb, mieterWs, "Mieterstruktur");

    // Sheet 7: Vertragslaufzeiten
    const vertraegeWsData = [
      ["═══ VERTRAGSLAUFZEITEN ═══"],
      [""],
      ["Laufzeit", "Anzahl Verträge"],
      ...vertragsLaufzeiten.map((v) => [v.name, v.anzahl]),
      [""],
      ["Gesamt", vertragsLaufzeiten.reduce((s, v) => s + v.anzahl, 0)],
    ];
    const vertraegeWs = XLSX.utils.aoa_to_sheet(vertraegeWsData);
    XLSX.utils.book_append_sheet(wb, vertraegeWs, "Vertragslaufzeiten");

    // Sheet 8: Energieverbrauch
    const energieWsData = [
      ["═══ ENERGIEVERBRAUCH ═══"],
      [""],
      ["Monat", "Strom (kWh)", "Gas (kWh)", "Wasser (m³)"],
      ...energieVerbrauch.map((e) => [e.monat, e.strom, e.gas, e.wasser]),
      [""],
      [
        "Jahressumme",
        energieVerbrauch.reduce((s, e) => s + e.strom, 0),
        energieVerbrauch.reduce((s, e) => s + e.gas, 0),
        energieVerbrauch.reduce((s, e) => s + e.wasser, 0),
      ],
    ];
    const energieWs = XLSX.utils.aoa_to_sheet(energieWsData);
    XLSX.utils.book_append_sheet(wb, energieWs, "Energieverbrauch");

    // Sheet 9: Zusammenfassung
    const summaryWsData = [
      ["═══════════════════════════════════════════"],
      ["HAUSVERWALTUNG - STATISTIK-EXPORT"],
      ["═══════════════════════════════════════════"],
      [""],
      ["Jahr:", selectedYear],
      ["Objekt:", selectedObjekt === "alle" ? "Alle Objekte" : selectedObjekt],
      ["Exportdatum:", new Date().toLocaleDateString("de-DE")],
      [""],
      ["═══ ZUSAMMENFASSUNG ═══"],
      [""],
      ["Kennzahl", "Wert"],
      ["Jahreseinnahmen", gesamtEinnahmen.toLocaleString("de-DE") + " €"],
      ["Jahresausgaben", gesamtAusgaben.toLocaleString("de-DE") + " €"],
      ["Nettogewinn", gesamtGewinn.toLocaleString("de-DE") + " €"],
      ["Durchschnittlicher Leerstand", durchschnittLeerstand + "%"],
      ["Durchschnittliche Zahlungsquote", durchschnittZahlungsquote + "%"],
      [""],
      [""],
      ["═══ CHART-HINWEIS ═══"],
      [""],
      ["Die grafischen Auswertungen (Charts/Diagramme) finden Sie"],
      ["in den anderen Sheets dieser Excel-Datei."],
      ["Jedes Sheet enthält die zugehörigen Daten im Tabellenformat."],
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryWsData);
    XLSX.utils.book_append_sheet(wb, summaryWs, "Übersicht");

    // === DOWNLOAD ===
    XLSX.writeFile(
      wb,
      `statistiken_${selectedYear}_${selectedObjekt}_${new Date().toLocaleDateString(
        "de-DE",
      )}.xlsx`,
    );

    toast({
      title: "Export erfolgreich",
      description: `Statistiken für ${selectedYear} wurden als Excel-Datei exportiert mit allen Daten in separaten Sheets.`,
    });
  };

  const handlePDFExport = async () => {
    try {
      // jsPDF and html2canvas loaded lazily to avoid ~400 KB on the initial bundle
      const { default: jsPDF } = await import("jspdf");
      const { default: html2canvas } = await import("html2canvas");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Titel
      pdf.setFontSize(20);
      pdf.text("Hausverwaltung - Statistik-Report", pageWidth / 2, yPosition, {
        align: "center",
      });
      yPosition += 10;

      pdf.setFontSize(12);
      pdf.text(
        `Jahr: ${selectedYear} | Objekt: ${
          selectedObjekt === "alle" ? "Alle Objekte" : selectedObjekt
        }`,
        pageWidth / 2,
        yPosition,
        { align: "center" },
      );
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.text(
        `Exportdatum: ${new Date().toLocaleDateString("de-DE")}`,
        pageWidth / 2,
        yPosition,
        { align: "center" },
      );
      yPosition += 15;

      // Zusammenfassung
      pdf.setFontSize(14);
      pdf.text("Zusammenfassung", 15, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      const summaryData = [
        `Jahreseinnahmen: ${gesamtEinnahmen.toLocaleString("de-DE")} €`,
        `Jahresausgaben: ${gesamtAusgaben.toLocaleString("de-DE")} €`,
        `Nettogewinn: ${gesamtGewinn.toLocaleString("de-DE")} €`,
        `Durchschnittlicher Leerstand: ${durchschnittLeerstand}%`,
        `Durchschnittliche Zahlungsquote: ${durchschnittZahlungsquote}%`,
      ];

      summaryData.forEach((line) => {
        pdf.text(line, 15, yPosition);
        yPosition += 6;
      });

      // Funktion zum Hinzufügen eines Charts
      const addChartToPDF = async (
        chartRef: React.RefObject<HTMLDivElement | null>,
        title: string,
      ) => {
        if (!chartRef.current) return;

        // Neue Seite für jeden Chart
        pdf.addPage();
        yPosition = 20;

        pdf.setFontSize(14);
        pdf.text(title, 15, yPosition);
        yPosition += 10;

        // Chart als Bild erfassen mit erweiterten Optionen
        const canvas = await html2canvas(chartRef.current, {
          scale: 2,
          backgroundColor: "#ffffff",
          useCORS: true,
          logging: false,
          windowWidth: chartRef.current.scrollWidth,
          windowHeight: chartRef.current.scrollHeight,
          onclone: (clonedDoc) => {
            // Entferne problematische CSS-Eigenschaften im geklonten Dokument
            const elements = clonedDoc.querySelectorAll("*");
            elements.forEach((el) => {
              const htmlEl = el as HTMLElement;
              if (htmlEl.style) {
                // Ersetze lab() Farben mit Fallback
                const bgColor = htmlEl.style.backgroundColor;
                if (bgColor && bgColor.includes("lab")) {
                  htmlEl.style.backgroundColor = "#ffffff";
                }
                const color = htmlEl.style.color;
                if (color && color.includes("lab")) {
                  htmlEl.style.color = "#000000";
                }
              }
            });
          },
        });

        const imgData = canvas.toDataURL("image/png");
        const imgWidth = pageWidth - 30;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Bild hinzufügen
        pdf.addImage(imgData, "PNG", 15, yPosition, imgWidth, imgHeight);
      };

      // Charts hinzufügen
      await addChartToPDF(finanzChartRef, "Monatliche Finanzdaten");
      await addChartToPDF(objekteChartRef, "Einnahmen pro Objekt");
      await addChartToPDF(kostenChartRef, "Kostenverteilung");
      await addChartToPDF(leerstandChartRef, "Leerstandsquote");

      // PDF speichern
      pdf.save(
        `statistiken_${selectedYear}_${selectedObjekt}_${new Date().toLocaleDateString(
          "de-DE",
        )}.pdf`,
      );

      toast({
        title: "PDF-Export erfolgreich",
        description: `Statistiken mit Charts wurden als PDF exportiert.`,
      });
    } catch (error) {
      console.error("PDF Export Error:", error);
      toast({
        title: "Fehler beim PDF-Export",
        description: "Bitte versuchen Sie es erneut.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header mit Filtern */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Statistiken & Auswertungen
          </h1>
          <p className="text-muted-foreground">
            12-Monats-Übersicht und Analysen
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[100px] sm:w-[120px]">
              <Calendar className="h-4 w-4 mr-2 hidden sm:block" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedObjekt} onValueChange={setSelectedObjekt}>
            <SelectTrigger className="w-[140px] sm:w-[180px]">
              <Building2 className="h-4 w-4 mr-2 hidden sm:block" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="alle">Alle Objekte</SelectItem>
              <SelectItem value="objekt1">Musterhaus Berlin</SelectItem>
              <SelectItem value="objekt2">Gartenstraße 12</SelectItem>
              <SelectItem value="objekt3">WEG Parkresidenz</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handlePDFExport}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Gesamteinnahmen YTD
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {kpiStats.gesamteinnahmenYTD.toLocaleString("de-DE", {
                style: "currency",
                currency: "EUR",
              })}
            </div>
            <div
              className={`flex items-center gap-1 text-xs mt-1 ${
                kpiStats.wachstumProzent >= 0
                  ? "text-success"
                  : "text-destructive"
              }`}
            >
              {kpiStats.wachstumProzent >= 0 ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {kpiStats.wachstumProzent >= 0 ? "+" : ""}
              {kpiStats.wachstumProzent.toFixed(1)}% gegenüber Vorjahr
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Offene Forderungen
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {kpiStats.offeneForderungen.toLocaleString("de-DE", {
                style: "currency",
                currency: "EUR",
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {kpiStats.anzahlOffeneForderungen} ausstehende Zahlung
              {kpiStats.anzahlOffeneForderungen !== 1 ? "en" : ""}
            </p>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Leerstand
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {kpiStats.leerstehendeWohnungen} Einheit
              {kpiStats.leerstehendeWohnungen !== 1 ? "en" : ""}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {kpiStats.leerstandsquote.toFixed(1)}% Leerstandsquote
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Letzte Aktivitäten */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Letzte Aktivitäten</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {aktivitaeten.map((aktivitaet, index) => (
            <div
              key={index}
              className="flex items-start justify-between gap-3 text-sm"
            >
              <div className="space-y-1">
                <p className="leading-snug">{aktivitaet.text}</p>
                <p className="text-xs text-muted-foreground">
                  {aktivitaet.zeit}
                </p>
              </div>
              {aktivitaet.betrag && (
                <span className="text-success font-medium whitespace-nowrap">
                  {aktivitaet.betrag}
                </span>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Tabs für verschiedene Statistikbereiche */}
      <Tabs defaultValue="finanzen" className="space-y-4">
        <TabsList className="grid grid-cols-3 sm:grid-cols-5 w-full max-w-2xl h-auto">
          <TabsTrigger value="finanzen" className="text-xs sm:text-sm py-2">
            Finanzen
          </TabsTrigger>
          <TabsTrigger value="mieter" className="text-xs sm:text-sm py-2">
            Mieter
          </TabsTrigger>
          <TabsTrigger value="objekte" className="text-xs sm:text-sm py-2">
            Objekte
          </TabsTrigger>
          <TabsTrigger value="kosten" className="text-xs sm:text-sm py-2">
            Kosten
          </TabsTrigger>
          <TabsTrigger value="energie" className="text-xs sm:text-sm py-2">
            Energie
          </TabsTrigger>
        </TabsList>

        {/* Finanzen Tab */}
        <TabsContent value="finanzen" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Einnahmen/Ausgaben 12-Monats-Chart */}
            <Card className="lg:col-span-2 transition-all duration-200 hover:shadow-md border-l-4 border-l-success">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
                  <span className="hidden sm:inline">
                    Einnahmen & Ausgaben - 12-Monats-Übersicht
                  </span>
                  <span className="sm:hidden">Einnahmen & Ausgaben</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Monatliche Entwicklung der Finanzen - Gesamtsumme:{" "}
                  {monatlicheFinanzDaten
                    .reduce((sum, m) => sum + m.einnahmen, 0)
                    .toLocaleString("de-DE")}{" "}
                  € Einnahmen
                </CardDescription>
              </CardHeader>
              <CardContent className="p-2 sm:p-6" ref={finanzChartRef}>
                <ResponsiveContainer
                  width="100%"
                  height={280}
                  className="sm:!h-[400px]"
                >
                  <BarChart data={monatlicheFinanzDaten}>
                    <defs>
                      <linearGradient
                        id="colorEinnahmen"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10B981"
                          stopOpacity={0.9}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10B981"
                          stopOpacity={0.6}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorAusgaben"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#EF4444"
                          stopOpacity={0.9}
                        />
                        <stop
                          offset="95%"
                          stopColor="#EF4444"
                          stopOpacity={0.6}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                      opacity={0.3}
                    />
                    <XAxis
                      dataKey="monat"
                      className="text-xs"
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis
                      className="text-xs"
                      tickFormatter={(value) => `${value / 1000}k €`}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: "20px" }} />
                    <Bar
                      dataKey="einnahmen"
                      name="Einnahmen"
                      fill="url(#colorEinnahmen)"
                      radius={[8, 8, 0, 0]}
                    />
                    <Bar
                      dataKey="ausgaben"
                      name="Ausgaben"
                      fill="url(#colorAusgaben)"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gewinnentwicklung */}
            <Card className="border-l-4 border-l-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Gewinnentwicklung
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Netto-Ergebnis pro Monat - Durchschnitt:{" "}
                  {(
                    monatlicheFinanzDaten.reduce(
                      (sum, m) => sum + m.gewinn,
                      0,
                    ) / 12
                  ).toLocaleString("de-DE", { maximumFractionDigits: 0 })}{" "}
                  €
                </CardDescription>
              </CardHeader>
              <CardContent className="p-2 sm:p-6">
                <ResponsiveContainer
                  width="100%"
                  height={220}
                  className="sm:!h-[280px]"
                >
                  <AreaChart data={monatlicheFinanzDaten}>
                    <defs>
                      <linearGradient
                        id="colorGewinn"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#3B82F6"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor="#3B82F6"
                          stopOpacity={0.1}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                      opacity={0.3}
                    />
                    <XAxis
                      dataKey="monat"
                      className="text-xs"
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis
                      className="text-xs"
                      tickFormatter={(value) => `${value / 1000}k €`}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="gewinn"
                      name="Gewinn"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      fill="url(#colorGewinn)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Einnahmen pro Objekt */}
            <Card className="border-l-4 border-l-amber-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                  <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                  Einnahmen pro Objekt
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  Verteilung der Mieteinnahmen nach Immobilie
                </CardDescription>
              </CardHeader>
              <CardContent ref={objekteChartRef}>
                <div className="space-y-4">
                  {einnahmenProObjekt.map((objekt, idx) => {
                    const colors = [
                      "bg-emerald-500",
                      "bg-blue-500",
                      "bg-purple-500",
                      "bg-amber-500",
                    ];
                    return (
                      <div key={objekt.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium flex items-center gap-2">
                            <div
                              className={`h-3 w-3 rounded-full ${colors[idx]}`}
                            />
                            {objekt.name}
                          </span>
                          <span className="text-sm font-semibold">
                            {objekt.einnahmen.toLocaleString("de-DE")} €
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={objekt.anteil} className="h-2.5" />
                          <span className="text-xs text-muted-foreground w-10">
                            {objekt.anteil}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Mieter Tab */}
        <TabsContent value="mieter" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Zahlungsverhalten */}
            <Card className="lg:col-span-2 border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-green-500" />
                  Zahlungsverhalten - 12-Monats-Übersicht
                </CardTitle>
                <CardDescription>
                  Pünktlichkeit der Mietzahlungen in % - Durchschnitt pünktlich:{" "}
                  {(
                    zahlungsverhalten.reduce(
                      (sum, m) => sum + m.puenktlich,
                      0,
                    ) / 12
                  ).toFixed(1)}
                  %
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart
                    data={zahlungsverhalten}
                    stackOffset="expand"
                    barSize={40}
                  >
                    <defs>
                      <linearGradient
                        id="colorPuenktlich"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10B981"
                          stopOpacity={0.95}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10B981"
                          stopOpacity={0.75}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorVerspaetet"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#F59E0B"
                          stopOpacity={0.95}
                        />
                        <stop
                          offset="95%"
                          stopColor="#F59E0B"
                          stopOpacity={0.75}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorOffen"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#EF4444"
                          stopOpacity={0.95}
                        />
                        <stop
                          offset="95%"
                          stopColor="#EF4444"
                          stopOpacity={0.75}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                      opacity={0.3}
                    />
                    <XAxis
                      dataKey="monat"
                      className="text-xs"
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis
                      className="text-xs"
                      tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: "20px" }} />
                    <Bar
                      dataKey="puenktlich"
                      name="Pünktlich"
                      stackId="a"
                      fill="url(#colorPuenktlich)"
                      radius={[8, 8, 0, 0]}
                    />
                    <Bar
                      dataKey="verspaetet"
                      name="Verspätet"
                      stackId="a"
                      fill="url(#colorVerspaetet)"
                    />
                    <Bar
                      dataKey="offen"
                      name="Offen"
                      stackId="a"
                      fill="url(#colorOffen)"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Mieterstruktur Pie Chart */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  Mieterstruktur
                </CardTitle>
                <CardDescription>
                  Verteilung nach Mietart -{" "}
                  {mieterStruktur.reduce((sum, m) => sum + m.value, 0)}{" "}
                  Einheiten gesamt
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <RechartsPieChart>
                    <defs>
                      <filter id="shadow" height="200%">
                        <feDropShadow
                          dx="0"
                          dy="2"
                          stdDeviation="3"
                          floodOpacity="0.3"
                        />
                      </filter>
                    </defs>
                    <Pie
                      data={mieterStruktur}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {mieterStruktur.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          filter="url(#shadow)"
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomChartTooltip />} />
                    <Legend wrapperStyle={{ paddingTop: "10px" }} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Vertragslaufzeiten */}
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-500" />
                  Vertragslaufzeiten
                </CardTitle>
                <CardDescription>
                  Dauer der Mietverhältnisse -{" "}
                  {vertragsLaufzeiten.reduce((sum, v) => sum + v.anzahl, 0)}{" "}
                  Verträge insgesamt
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={vertragsLaufzeiten} layout="vertical">
                    <defs>
                      <linearGradient
                        id="colorVertraege"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                      >
                        <stop
                          offset="5%"
                          stopColor="#8B5CF6"
                          stopOpacity={0.9}
                        />
                        <stop
                          offset="95%"
                          stopColor="#8B5CF6"
                          stopOpacity={0.6}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                      opacity={0.3}
                    />
                    <XAxis
                      type="number"
                      className="text-xs"
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      className="text-xs"
                      width={90}
                      stroke="hsl(var(--muted-foreground))"
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Bar
                      dataKey="anzahl"
                      name="Anzahl Verträge"
                      fill="url(#colorVertraege)"
                      radius={[0, 8, 8, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Offene Forderungen Liste */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                  Offene Forderungen
                </CardTitle>
                <CardDescription>
                  Ausstehende Zahlungen nach Mieter
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      mieter: "Müller, Hans",
                      objekt: "Hauptstraße 15, Whg 3",
                      betrag: 1250,
                      tage: 45,
                    },
                    {
                      mieter: "Schmidt, Anna",
                      objekt: "Bergweg 8, Whg 1",
                      betrag: 890,
                      tage: 32,
                    },
                    {
                      mieter: "Weber, Peter",
                      objekt: "Parkallee 22, Whg 5",
                      betrag: 650,
                      tage: 18,
                    },
                    {
                      mieter: "Fischer, Maria",
                      objekt: "Seeblick 5, Whg 2",
                      betrag: 420,
                      tage: 12,
                    },
                  ].map((forderung, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            forderung.tage > 30
                              ? "bg-destructive"
                              : forderung.tage > 14
                                ? "bg-warning"
                                : "bg-success"
                          }`}
                        />
                        <div>
                          <p className="font-medium">{forderung.mieter}</p>
                          <p className="text-sm text-muted-foreground">
                            {forderung.objekt}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {forderung.betrag.toLocaleString("de-DE")} €
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {forderung.tage} Tage überfällig
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Objekte Tab */}
        <TabsContent value="objekte" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Leerstandsentwicklung */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Leerstandsentwicklung - 12 Monate</CardTitle>
                <CardDescription>
                  Quote der leerstehenden Einheiten in %
                </CardDescription>
              </CardHeader>
              <CardContent ref={leerstandChartRef}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={leerstandDaten}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis dataKey="monat" className="text-xs" />
                    <YAxis
                      className="text-xs"
                      tickFormatter={(value) => `${value}%`}
                      domain={[0, 10]}
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="quote"
                      stroke="hsl(var(--warning))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--warning))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Objektübersicht */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Objektübersicht</CardTitle>
                <CardDescription>
                  Kennzahlen aller Objekte im Vergleich
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">
                          Objekt
                        </th>
                        <th className="text-center py-3 px-4 font-medium">
                          Einheiten
                        </th>
                        <th className="text-center py-3 px-4 font-medium">
                          Belegt
                        </th>
                        <th className="text-center py-3 px-4 font-medium">
                          Leerstand
                        </th>
                        <th className="text-right py-3 px-4 font-medium">
                          Einnahmen/Mon.
                        </th>
                        <th className="text-right py-3 px-4 font-medium">
                          Rendite
                        </th>
                        <th className="text-center py-3 px-4 font-medium">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        {
                          name: "Hauptstraße 15",
                          einheiten: 12,
                          belegt: 11,
                          leerstand: 8.3,
                          einnahmen: 4000,
                          rendite: 5.2,
                          status: "gut",
                        },
                        {
                          name: "Bergweg 8",
                          einheiten: 8,
                          belegt: 8,
                          leerstand: 0,
                          einnahmen: 3000,
                          rendite: 6.1,
                          status: "sehr gut",
                        },
                        {
                          name: "Parkallee 22",
                          einheiten: 6,
                          belegt: 5,
                          leerstand: 16.7,
                          einnahmen: 2667,
                          rendite: 4.8,
                          status: "warnung",
                        },
                        {
                          name: "Seeblick 5",
                          einheiten: 4,
                          belegt: 4,
                          leerstand: 0,
                          einnahmen: 1833,
                          rendite: 5.5,
                          status: "sehr gut",
                        },
                      ].map((objekt, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-3 px-4 font-medium">
                            {objekt.name}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {objekt.einheiten}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {objekt.belegt}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {objekt.leerstand}%
                          </td>
                          <td className="py-3 px-4 text-right">
                            {objekt.einnahmen.toLocaleString("de-DE")} €
                          </td>
                          <td className="py-3 px-4 text-right">
                            {objekt.rendite}%
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Badge
                              variant={
                                objekt.status === "sehr gut"
                                  ? "default"
                                  : objekt.status === "gut"
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {objekt.status === "sehr gut"
                                ? "Sehr gut"
                                : objekt.status === "gut"
                                  ? "Gut"
                                  : "Achtung"}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Kosten Tab */}
        <TabsContent value="kosten" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Kostenverteilung Pie */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Kostenverteilung Gesamt
                </CardTitle>
                <CardDescription>
                  Aufschlüsselung der Jahresausgaben
                </CardDescription>
              </CardHeader>
              <CardContent ref={kostenChartRef}>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={kostenVerteilung}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {kostenVerteilung.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomChartTooltip />} />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Kostenpositionen */}
            <Card>
              <CardHeader>
                <CardTitle>Top Kostenpositionen</CardTitle>
                <CardDescription>Größte Ausgaben im Jahr</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      position: "Dachreparatur Hauptstraße 15",
                      betrag: 8500,
                      datum: "März 2025",
                    },
                    {
                      position: "Heizungsanlage Bergweg 8",
                      betrag: 6200,
                      datum: "November 2025",
                    },
                    {
                      position: "Fassadensanierung Parkallee",
                      betrag: 5800,
                      datum: "Mai 2025",
                    },
                    {
                      position: "Treppenhausrenovierung",
                      betrag: 3200,
                      datum: "Juli 2025",
                    },
                    {
                      position: "Aufzugwartung",
                      betrag: 2800,
                      datum: "September 2025",
                    },
                  ].map((pos, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div>
                        <p className="font-medium">{pos.position}</p>
                        <p className="text-sm text-muted-foreground">
                          {pos.datum}
                        </p>
                      </div>
                      <p className="font-semibold">
                        {pos.betrag.toLocaleString("de-DE")} €
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Wartungskosten pro Monat */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Wartungskosten nach Kategorie - 12 Monate</CardTitle>
                <CardDescription>
                  Monatliche Aufschlüsselung der Instandhaltung
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart
                    data={[
                      {
                        monat: "Jan",
                        "Heizung/Sanitär": 850,
                        Elektrik: 320,
                        "Dach/Fassade": 0,
                        "Garten/Außen": 80,
                      },
                      {
                        monat: "Feb",
                        "Heizung/Sanitär": 420,
                        Elektrik: 180,
                        "Dach/Fassade": 0,
                        "Garten/Außen": 120,
                      },
                      {
                        monat: "Mar",
                        "Heizung/Sanitär": 380,
                        Elektrik: 450,
                        "Dach/Fassade": 2500,
                        "Garten/Außen": 350,
                      },
                      {
                        monat: "Apr",
                        "Heizung/Sanitär": 220,
                        Elektrik: 280,
                        "Dach/Fassade": 1800,
                        "Garten/Außen": 450,
                      },
                      {
                        monat: "Mai",
                        "Heizung/Sanitär": 180,
                        Elektrik: 150,
                        "Dach/Fassade": 3200,
                        "Garten/Außen": 520,
                      },
                      {
                        monat: "Jun",
                        "Heizung/Sanitär": 150,
                        Elektrik: 220,
                        "Dach/Fassade": 1500,
                        "Garten/Außen": 480,
                      },
                      {
                        monat: "Jul",
                        "Heizung/Sanitär": 120,
                        Elektrik: 180,
                        "Dach/Fassade": 800,
                        "Garten/Außen": 550,
                      },
                      {
                        monat: "Aug",
                        "Heizung/Sanitär": 180,
                        Elektrik: 150,
                        "Dach/Fassade": 400,
                        "Garten/Außen": 480,
                      },
                      {
                        monat: "Sep",
                        "Heizung/Sanitär": 250,
                        Elektrik: 280,
                        "Dach/Fassade": 600,
                        "Garten/Außen": 420,
                      },
                      {
                        monat: "Okt",
                        "Heizung/Sanitär": 380,
                        Elektrik: 320,
                        "Dach/Fassade": 200,
                        "Garten/Außen": 380,
                      },
                      {
                        monat: "Nov",
                        "Heizung/Sanitär": 620,
                        Elektrik: 180,
                        "Dach/Fassade": 0,
                        "Garten/Außen": 180,
                      },
                      {
                        monat: "Dez",
                        "Heizung/Sanitär": 780,
                        Elektrik: 250,
                        "Dach/Fassade": 0,
                        "Garten/Außen": 80,
                      },
                    ]}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis dataKey="monat" className="text-xs" />
                    <YAxis
                      className="text-xs"
                      tickFormatter={(value) => `${value}€`}
                    />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Legend />
                    <Bar dataKey="Heizung/Sanitär" stackId="a" fill="#10B981" />
                    <Bar dataKey="Elektrik" stackId="a" fill="#3B82F6" />
                    <Bar dataKey="Dach/Fassade" stackId="a" fill="#F59E0B" />
                    <Bar dataKey="Garten/Außen" stackId="a" fill="#8B5CF6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Energie Tab */}
        <TabsContent value="energie" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Energieverbrauch 12 Monate */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Energieverbrauch - 12-Monats-Übersicht</CardTitle>
                <CardDescription>
                  Strom, Gas und Wasser in kWh/m³
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={energieVerbrauch}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      className="stroke-muted"
                    />
                    <XAxis dataKey="monat" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="strom"
                      name="Strom (kWh)"
                      stroke="#F59E0B"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="gas"
                      name="Gas (kWh)"
                      stroke="#EF4444"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="wasser"
                      name="Wasser (m³)"
                      stroke="#3B82F6"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Energiekosten Zusammenfassung */}
            <Card>
              <CardHeader>
                <CardTitle>Energiekosten Jahresübersicht</CardTitle>
                <CardDescription>Kosten nach Energieträger</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      typ: "Strom",
                      verbrauch: "41.500 kWh",
                      kosten: 12450,
                      trend: -3.2,
                    },
                    {
                      typ: "Gas",
                      verbrauch: "55.700 kWh",
                      kosten: 8910,
                      trend: -8.5,
                    },
                    {
                      typ: "Wasser",
                      verbrauch: "16.250 m³",
                      kosten: 4875,
                      trend: +2.1,
                    },
                  ].map((energie, i) => (
                    <div key={i} className="p-4 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">{energie.typ}</span>
                        <div className="flex items-center gap-1">
                          {energie.trend < 0 ? (
                            <TrendingDown className="h-4 w-4 text-success" />
                          ) : (
                            <TrendingUp className="h-4 w-4 text-destructive" />
                          )}
                          <span
                            className={
                              energie.trend < 0
                                ? "text-success"
                                : "text-destructive"
                            }
                          >
                            {energie.trend > 0 ? "+" : ""}
                            {energie.trend}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{energie.verbrauch}</span>
                        <span className="font-medium text-foreground">
                          {energie.kosten.toLocaleString("de-DE")} €
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between font-semibold">
                      <span>Gesamt Energiekosten</span>
                      <span>26.235 €</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Verbrauch pro Objekt */}
            <Card>
              <CardHeader>
                <CardTitle>Verbrauch pro Objekt</CardTitle>
                <CardDescription>Energieeffizienz im Vergleich</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { objekt: "Hauptstraße 15", kwh: 145, status: "gut" },
                    { objekt: "Bergweg 8", kwh: 118, status: "sehr gut" },
                    { objekt: "Parkallee 22", kwh: 172, status: "warnung" },
                    { objekt: "Seeblick 5", kwh: 132, status: "gut" },
                  ].map((obj, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">
                          {obj.objekt}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{obj.kwh} kWh/m²</span>
                          <Badge
                            variant={
                              obj.status === "sehr gut"
                                ? "default"
                                : obj.status === "gut"
                                  ? "secondary"
                                  : "destructive"
                            }
                            className="text-xs"
                          >
                            {obj.status === "sehr gut"
                              ? "A"
                              : obj.status === "gut"
                                ? "B"
                                : "C"}
                          </Badge>
                        </div>
                      </div>
                      <Progress value={100 - (obj.kwh - 100)} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
