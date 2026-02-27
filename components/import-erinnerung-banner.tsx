"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { createClient } from "@/lib/supabase/client";
import type { AppView } from "@/components/app-dashboard";

interface ImportErinnerungBannerProps {
  onNavigate: (view: AppView) => void;
}

type BannerFall = "kein-import" | "nochmals-importieren" | "aktuell" | "temporaer-ok" | null;

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

export function ImportErinnerungBanner({ onNavigate }: ImportErinnerungBannerProps) {
  const { isDemo, user } = useAuth();
  const [letzterImport, setLetzterImport] = useState<string | null>(null);
  const [ersterImportDiesenMonat, setErsterImportDiesenMonat] = useState<string | null>(null);
  const [importNachSechstem, setImportNachSechstem] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadImportStatus() {
      if (isDemo || !user?.id) {
        // Im Demo-Modus: zeige "kein Import" Banner als Beispiel
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

        // Letzter Import diesen Monat (neueste created_at)
        const { data: letzterData } = await supabase
          .from("zahlungen")
          .select("created_at")
          .gte("buchungsdatum", monatsAnfang)
          .order("created_at", { ascending: false })
          .limit(1);

        const letzter = letzterData?.[0]?.created_at ?? null;
        setLetzterImport(letzter);

        if (letzter) {
          // Erster Import diesen Monat
          const { data: ersterData } = await supabase
            .from("zahlungen")
            .select("created_at")
            .gte("buchungsdatum", monatsAnfang)
            .order("created_at", { ascending: true })
            .limit(1);

          setErsterImportDiesenMonat(ersterData?.[0]?.created_at ?? null);

          // Gibt es einen Import mit created_at nach dem 6. des Monats?
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

  const bannerInfo = useMemo(() => {
    const now = new Date();
    const heuteTag = now.getDate();
    const aktuellerMonat = now.getMonth();
    const aktuellesJahr = now.getFullYear();
    const monatsname = getMonatsname(aktuellerMonat);

    // FALL 1: Kein Import diesen Monat
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

    // FALL 3: Import nach dem 6. vorhanden → alles erledigt
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

    // FALL 2: Import vorhanden, Tag >= 6, kein zweiter Import nach dem 6.
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

    // FALL 4: Erster Import zwischen Tag 1-5, Tag < 6
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

  return (
    <Card className={info.farbe.card}>
      <CardContent className="pt-4 pb-4 h-full flex items-center">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className={`rounded-full ${info.farbe.iconBg} p-2`}>
              <span className={info.farbe.iconColor}>{info.icon}</span>
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
              onClick={() => onNavigate("mieter")}
            >
              {info.buttonText}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
