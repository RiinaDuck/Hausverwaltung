"use client";

import { useState } from "react";
import { LandingPage } from "@/components/landing-page";
import { AppDashboard } from "@/components/app-dashboard";
import { AppDataProvider } from "@/context/app-data-context";
import { AuthProvider, useAuth } from "@/context/auth-context";

function ViewToggleContent() {
  const [view, setView] = useState<"landing" | "app">("landing");
  const { isAuthenticated, login, startDemo, logout } = useAuth();

  const handleLogin = async (
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    return await login(email, password);
  };

  const handleStartDemo = () => {
    startDemo();
  };

  const handleSwitchToLanding = () => {
    logout();
    setView("landing");
  };

  // Wenn authentifiziert und view ist app, zeige App
  // Ansonsten zeige Landing
  const showApp = view === "app" && isAuthenticated;

  return (
    <>
      {!showApp ? (
        <LandingPage
          onOpenApp={() => setView("app")}
          onLogin={handleLogin}
          onStartDemo={handleStartDemo}
        />
      ) : (
        <AppDataProvider>
          <AppDashboard onSwitchToLanding={handleSwitchToLanding} />
        </AppDataProvider>
      )}
    </>
  );
}

export function ViewToggle() {
  return (
    <AuthProvider>
      <ViewToggleContent />
    </AuthProvider>
  );
}
