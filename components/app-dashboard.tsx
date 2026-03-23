"use client";

import { useState, useEffect, useCallback } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { DashboardView } from "@/components/views/dashboard-view";
import { ObjektdatenView } from "@/components/views/objektdaten-view";
import { WohnungsdatenView } from "@/components/views/wohnungsdaten-view";
import { MieterdatenView } from "@/components/views/mieterdaten-view";
import { NebenkostenView } from "@/components/views/nebenkosten-view";
import { NebenkostenAbrechnungView } from "@/components/views/nebenkosten-abrechnung-view";
import { ZaehlerView } from "@/components/views/zaehler-view";
import { HausmanagerView } from "@/components/views/hausmanager-view";
import { RechnungenView } from "@/components/views/rechnungen-view";
import { EinnahmenAusgabenView } from "@/components/views/einnahmen-ausgaben-view";
import { StatistikenView } from "@/components/views/statistiken-view";
import { ArchivView } from "@/components/views/archiv-view";
import { useIsMobile } from "@/hooks/use-mobile";
import { OnboardingModal } from "@/components/onboarding-modal";

export type AppView =
  | "dashboard"
  | "objekte"
  | "wohnungen"
  | "mieter"
  | "einnahmen-ausgaben"
  | "nebenkosten"
  | "nebenkosten-abrechnung"
  | "rechnungen"
  | "zaehler"
  | "hausmanager"
  | "statistiken"
  | "archiv";

const validViews: AppView[] = [
  "dashboard", "objekte", "wohnungen", "mieter", "einnahmen-ausgaben",
  "nebenkosten", "nebenkosten-abrechnung", "rechnungen", "zaehler",
  "hausmanager", "statistiken", "archiv",
];

interface AppDashboardProps {
  onSwitchToLanding?: () => void;
}

export function AppDashboard({ onSwitchToLanding }: AppDashboardProps) {
  const [currentView, setCurrentView] = useState<AppView>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [navMieterId, setNavMieterId] = useState<string | undefined>();
  const isMobile = useIsMobile();

  // Sync browser history with view navigation
  useEffect(() => {
    // Set initial history state on mount
    window.history.replaceState({ view: "dashboard" }, "", window.location.pathname);
  }, []);

  // Listen for browser back/forward button
  useEffect(() => {
    const onPopState = (e: PopStateEvent) => {
      const view = e.state?.view;
      if (view && validViews.includes(view)) {
        setNavMieterId(e.state?.mieterId);
        setCurrentView(view);
      }
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const handleNavigate = useCallback((view: AppView, options?: { mieterId?: string }) => {
    setNavMieterId(options?.mieterId);
    setCurrentView(view);
    window.history.pushState({ view, mieterId: options?.mieterId }, "", window.location.pathname);
  }, []);

  const renderView = () => {
    switch (currentView) {
      case "dashboard":
        return <DashboardView onNavigate={handleNavigate} />;
      case "objekte":
        return <ObjektdatenView onNavigate={handleNavigate} />;
      case "wohnungen":
        return <WohnungsdatenView onNavigate={handleNavigate} />;
      case "mieter":
        return <MieterdatenView initialMieterId={navMieterId} />;
      case "einnahmen-ausgaben":
        return <EinnahmenAusgabenView />;
      case "nebenkosten":
        return <NebenkostenView />;
      case "nebenkosten-abrechnung":
        return <NebenkostenAbrechnungView />;
      case "rechnungen":
        return <RechnungenView />;
      case "zaehler":
        return <ZaehlerView />;
      case "hausmanager":
        return <HausmanagerView />;
      case "statistiken":
        return <StatistikenView />;
      case "archiv":
        return <ArchivView />;
      default:
        return <DashboardView onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      <OnboardingModal />
      <AppSidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        onSwitchToLanding={onSwitchToLanding}
        isOpen={isMobile ? sidebarOpen : true}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-h-screen w-full">
        <AppHeader
          currentView={currentView}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 p-4 md:p-6 overflow-auto">{renderView()}</main>
      </div>
    </div>
  );
}
