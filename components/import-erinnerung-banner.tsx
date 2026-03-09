"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, CheckCircle2, AlertTriangle, X, Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useAppData } from "@/context/app-data-context";
import type { ZahlungEintrag } from "@/context/app-data-context";
import { createClient } from "@/lib/supabase/client";
import { parseCamtXml, matchTransaktionToMieter } from "@/lib/parseCamt";
import type { AppView } from "@/components/app-dashboard";

interface ImportErinnerungBannerProps {
  onNavigate: (view: AppView) => void;
  statusContainer?: HTMLElement | null;
}

type BannerFall = "kein-import" | "nochmals-importieren" | "aktuell" | "temporaer-ok" | null;

type ImportResult =
  | { type: "success"; dateiname: string; anzahl: number; zugeordnet: number }
  | { type: "warning"; dateiname: string; message: string }
  | { type: "error"; message: string };

function formatDatum(dateStr: string): string {
  const d = new Date(dateStr);
  return (
    d.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }) + " Uhr"
  );
}

function getMonatsname(monat: number): string {
  const namen = [
    "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember",
  ];
  return namen[monat];
}

export function ImportErinnerungBanner({ onNavigate, statusContainer }: ImportErinnerungBannerProps) {
  const { isDemo, user } = useAuth();
  const { mieter, wohnungen, selectedObjektId, zahlungen, setZahlungen } = useAppData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [letzterImport, setLetzterImport] = useState<string | null>(null);
  const [ersterImportDiesenMonat, setErsterImportDiesenMonat] = useState<string | null>(null);
  const [importNachSechstem, setImportNachSechstem] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [warningResult, setWarningResult] = useState<Extract<ImportResult, { type: "warning" }> | null>(null);
  const [successResult, setSuccessResult] = useState<Extract<ImportResult, { type: "success" }> | null>(null);
  const [errorResult, setErrorResult] = useState<Extract<ImportResult, { type: "error" }> | null>(null);
  const [pendingImport, setPendingImport] = useState<{
    dateiname: string;
    neueZahlungen: ZahlungEintrag[];
    zugeordnet: number;
  } | null>(null);
  const successRef = useRef<HTMLDivElement>(null);

  const dismissSuccess = useCallback(() => {
    const el = successRef.current;
    if (el) {
      el.classList.add("fade-out");
      setTimeout(() => {
        setSuccessResult(null);
        setWarningResult(null);
      }, 1000);
    } else {
      setSuccessResult(null);
      setWarningResult(null);
    }
  }, []);

  useEffect(() => {
    if (!successResult) return;
    const timer = setTimeout(dismissSuccess, 2000);
    return () => clearTimeout(timer);
  }, [successResult, dismissSuccess]);

  // Mieter für das aktuelle Objekt
  const objektWohnungIds = useMemo(() => {
    if (!selectedObjektId) return [];
    return wohnungen.filter((w) => w.objektId === selectedObjektId).map((w) => w.id);
  }, [wohnungen, selectedObjektId]);

  const aktiveMieter = useMemo(() => {
    return mieter.filter(
      (m) => objektWohnungIds.includes(m.wohnungId) && m.isAktiv !== false
    );
  }, [mieter, objektWohnungIds]);

  useEffect(() => {
    async function loadImportStatus() {
      if (isDemo || !user?.id) {
        setLetzterImport(null);
        setErsterImportDiesenMonat(null);
        setImportNachSechstem(null);
        setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        if (!supabase) {
          setLoading(false);
          return;
        }

        const now = new Date();
        const jahr = now.getFullYear();
        const monat = String(now.getMonth() + 1).padStart(2, "0");
        const monatsAnfang = `${jahr}-${monat}-01`;
        const sechsterTag = `${jahr}-${monat}-06`;

        const { data: letzterData } = await supabase
          .from("zahlungen")
          .select("created_at")
          .gte("buchungsdatum", monatsAnfang)
          .order("created_at", { ascending: false })
          .limit(1);

        const letzter = letzterData?.[0]?.created_at ?? null;
        setLetzterImport(letzter);

        if (letzter) {
          const { data: ersterData } = await supabase
            .from("zahlungen")
            .select("created_at")
            .gte("buchungsdatum", monatsAnfang)
            .order("created_at", { ascending: true })
            .limit(1);

          setErsterImportDiesenMonat(ersterData?.[0]?.created_at ?? null);

          const { data: nachSechstemData } = await supabase
            .from("zahlungen")
            .select("created_at")
            .gte("buchungsdatum", monatsAnfang)
            .gte("created_at", `${sechsterTag}T00:00:00`)
            .order("created_at", { ascending: false })
            .limit(1);

          setImportNachSechstem(nachSechstemData?.[0]?.created_at ?? null);
        } else {
          setErsterImportDiesenMonat(null);
          setImportNachSechstem(null);
        }
      } catch (err) {
        console.warn("ImportErinnerung: Fehler beim Laden", err);
      } finally {
        setLoading(false);
      }
    }

    loadImportStatus();
  }, [isDemo, user?.id]);

  // ── Import-Logik ──────────────────────────────────────────────────────
  const getCurrentMonthKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setIsImporting(true);
    setWarningResult(null);
    setSuccessResult(null);
    setErrorResult(null);

    try {
      const xmlString = await file.text();
      const transaktionen = parseCamtXml(xmlString);

      const mieterMatchList = aktiveMieter.map((m) => ({ id: m.id, name: m.name }));
      const monat = getCurrentMonthKey();

      let zugeordnet = 0;
      let nichtZugeordnet = 0;
      const bezahlteMieterIds = new Set<string>();

      const neueZahlungen: ZahlungEintrag[] = transaktionen.map((t) => {
        const match = matchTransaktionToMieter(t, mieterMatchList);
        if (match) {
          zugeordnet++;
          if (t.cdtDbtInd === "CRDT") {
            bezahlteMieterIds.add(match.mieterId);
          }
        } else {
          nichtZugeordnet++;
        }

        const mieterId = match?.mieterId ?? "unbekannt";
        const m = aktiveMieter.find((x) => x.id === mieterId);
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

      // Mieter ohne eingehende Zahlung als überfällig markieren
      for (const m of aktiveMieter) {
        if (!bezahlteMieterIds.has(m.id)) {
          const soll = m.kaltmiete + m.nebenkosten;
          if (soll > 0) {
            neueZahlungen.push({
              id: `camt-nichtbezahlt-${m.id}-${monat}`,
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

      // Duplikat-Prüfung
      const duplikate = neueZahlungen.filter((nz) =>
        zahlungen.some((z) =>
          z.id === nz.id ||
          (z.buchungsdatum === nz.buchungsdatum && z.istBetrag === nz.istBetrag && z.auftraggeber === nz.auftraggeber && z.buchungsdatum !== "")
        )
      ).length;

      if (duplikate > 0) {
        setPendingImport({ dateiname: file.name, neueZahlungen, zugeordnet });
        setWarningResult({
          type: "warning",
          dateiname: file.name,
          message: `${file.name} enthält ${duplikate} bereits vorhandene Buchungen.`,
        });
        setIsImporting(false);
        return;
      }

      // Import ausführen
      await executeImport(file.name, neueZahlungen, zugeordnet);
    } catch (err) {
      setErrorResult({
        type: "error",
        message: err instanceof Error ? err.message : "Unbekannter Fehler beim Parsen der CAMT-Datei.",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const executeImport = async (dateiname: string, neueZahlungen: ZahlungEintrag[], zugeordnet: number) => {
    setZahlungen((prev) => {
      const updated = [...prev];
      for (const nz of neueZahlungen) {
        const idx = updated.findIndex((z) => z.id === nz.id);
        if (idx >= 0) updated[idx] = nz;
        else updated.push(nz);
      }
      return updated;
    });

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
            console.warn("Supabase upsert fehlgeschlagen:", supabaseError.message);
          }
        }
      } catch (err) {
        console.warn("Supabase Persistierung fehlgeschlagen:", err);
      }
    }

    setSuccessResult({
      type: "success",
      dateiname,
      anzahl: neueZahlungen.length,
      zugeordnet,
    });
  };

  const handleOverwrite = async () => {
    if (!pendingImport) return;
    setIsImporting(true);
    try {
      await executeImport(pendingImport.dateiname, pendingImport.neueZahlungen, pendingImport.zugeordnet);
    } finally {
      setPendingImport(null);
      setIsImporting(false);
    }
  };

  // ── Banner-Info berechnen ─────────────────────────────────────────────
  const bannerInfo = useMemo(() => {
    const now = new Date();
    const heuteTag = now.getDate();
    const aktuellerMonat = now.getMonth();
    const aktuellesJahr = now.getFullYear();
    const monatsname = getMonatsname(aktuellerMonat);

    if (!letzterImport) {
      return {
        fall: "kein-import" as BannerFall,
        farbe: {
          card: "border-blue-200 bg-blue-50",
          iconBg: "bg-blue-100",
          iconColor: "text-blue-600",
          button: "border-blue-300 text-blue-700 hover:bg-blue-100",
        },
        icon: <Download className="h-5 w-5" />,
        titel: "Kontoauszug importieren",
        text: `Bitte importieren Sie den Kontoauszug für ${monatsname} ${aktuellesJahr} um Zahlungseingänge zu prüfen.`,
        buttonText: "Jetzt importieren",
      };
    }

    if (importNachSechstem) {
      return {
        fall: "aktuell" as BannerFall,
        farbe: {
          card: "border-green-200 bg-green-50",
          iconBg: "bg-green-100",
          iconColor: "text-green-600",
          button: "",
        },
        icon: <CheckCircle2 className="h-5 w-5" />,
        titel: "Bankdaten aktuell",
        text: `Letzter Import: ${formatDatum(importNachSechstem)}`,
        buttonText: null,
      };
    }

    if (heuteTag >= 6) {
      return {
        fall: "nochmals-importieren" as BannerFall,
        farbe: {
          card: "border-orange-200 bg-orange-50",
          iconBg: "bg-orange-100",
          iconColor: "text-orange-600",
          button: "border-orange-300 text-orange-700 hover:bg-orange-100",
        },
        icon: <RefreshCw className="h-5 w-5" />,
        titel: "Zahlungsfrist abgelaufen – nochmals importieren",
        text: "Der 3. Werktag ist überschritten. Importieren Sie den aktuellen Kontoauszug um Verzug zu erkennen.",
        buttonText: "Nochmals importieren",
      };
    }

    return {
      fall: "temporaer-ok" as BannerFall,
      farbe: {
        card: "border-green-200 bg-green-50",
        iconBg: "bg-green-100",
        iconColor: "text-green-600",
        button: "",
      },
      icon: <CheckCircle2 className="h-5 w-5" />,
      titel: "Import erfolgreich",
      text: `Letzter Import: ${formatDatum(letzterImport)}. Ab dem 6. erneut importieren um Verzug zu erkennen.`,
      buttonText: null,
    };
  }, [letzterImport, importNachSechstem]);

  if (loading) return null;

  const info = bannerInfo;
  if (!info) return null;

  // ── Status-Karten (Portal oder inline) ─────────────────────────────
  const statusCards = (
    <>
      {/* Gelbe Warnung – bei Duplikaten */}
      {warningResult && (
        <div className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 animate-in fade-in duration-300">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-700 flex-1 min-w-0">{warningResult.message}</p>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-100 shrink-0"
            disabled={isImporting}
            onClick={handleOverwrite}
          >
            {isImporting ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Importiere…
              </>
            ) : (
              "Überschreiben"
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-amber-600 hover:bg-amber-100 shrink-0"
            onClick={() => { setWarningResult(null); setPendingImport(null); }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Grüne Erfolgsmeldung – nach Import */}
      {successResult && (
        <div ref={successRef} className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2 opacity-100 animate-in fade-in" style={{ transition: "opacity 1s ease" }}>
          <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
          <p className="text-xs text-green-700 flex-1 min-w-0">
            {successResult.dateiname} – {successResult.anzahl} Buchungen importiert, {successResult.zugeordnet} zugeordnet
          </p>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-green-600 hover:bg-green-100 shrink-0"
            onClick={dismissSuccess}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Fehlermeldung */}
      {errorResult && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 animate-in fade-in duration-300">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-xs text-muted-foreground flex-1 min-w-0">{errorResult.message}</p>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0"
            onClick={() => setErrorResult(null)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </>
  );

  // ── Standard-Banner ───────────────────────────────────────────────────
  return (
    <>
      {/* Blaue Hauptkarte – immer sichtbar */}
      <Card className={info.farbe.card}>
        <CardContent className="pt-4 pb-4 h-full flex flex-col justify-center">
          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xml,application/xml,text/xml"
            className="hidden"
            onChange={handleFileSelected}
          />
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className={`rounded-full ${info.farbe.iconBg} p-2`}>
                <span className={info.farbe.iconColor}>
                  {info.icon}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium">{info.titel}</p>
                <p className="text-xs text-muted-foreground">{info.text}</p>
              </div>
            </div>
            {info.buttonText && (
              <Button
                variant="outline"
                size="sm"
                className={info.farbe.button}
                disabled={isImporting}
                onClick={() => fileInputRef.current?.click()}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Importiere…
                  </>
                ) : (
                  info.buttonText
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status-Karten: per Portal in externen Container oder inline */}
      {statusContainer
        ? createPortal(statusCards, statusContainer)
        : statusCards}
    </>
  );
}
