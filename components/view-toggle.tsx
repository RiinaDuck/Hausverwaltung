"use client";

import { useState } from "react";
import { LandingPage } from "@/components/landing-page";
import { AppDashboard } from "@/components/app-dashboard";
import { AppDataProvider } from "@/context/app-data-context";

export function ViewToggle() {
  const [view, setView] = useState<"landing" | "app">("landing");

  return (
    <>
      {view === "landing" ? (
        <LandingPage onOpenApp={() => setView("app")} />
      ) : (
        <AppDataProvider>
          <AppDashboard onSwitchToLanding={() => setView("landing")} />
        </AppDataProvider>
      )}
    </>
  );
}
