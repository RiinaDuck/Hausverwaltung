"use client";

import { useState, useEffect, useRef } from "react";
import { LandingPage } from "@/components/landing-page";
import { AppDashboard } from "@/components/app-dashboard";
import { AppDataProvider } from "@/context/app-data-context";
import { AuthProvider, useAuth } from "@/context/auth-context";

function ViewToggleContent() {
  const [view, setView] = useState<"landing" | "app">("landing");
  const { isAuthenticated, login, signup, startDemo, logout, loading } = useAuth();

  // Merkt sich, ob die initiale Session-Prüfung schon stattgefunden hat
  const initialCheckDone = useRef(false);

  // Nur beim ERSTEN Laden: Falls bereits eine Session existiert (z.B. nach
  // E-Mail-Bestätigung), direkt zur App weiterleiten.
  // Spätere Änderungen von isAuthenticated (Login, Demo, Logout) werden
  // ausschließlich über die Handler gesteuert → kein Race Condition mit Modals.
  useEffect(() => {
    if (loading) return;
    if (!initialCheckDone.current) {
      initialCheckDone.current = true;
      if (isAuthenticated) {
        setView("app");
      }
    }
  }, [loading, isAuthenticated]);

  const handleLogin = async (
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    const result = await login(email, password);
    if (result.success) setView("app");
    return result;
  };

  const handleSignup = async (
    email: string,
    password: string,
    name: string,
  ): Promise<{ success: boolean; error?: string; needsEmailConfirmation?: boolean }> => {
    const result = await signup(email, password, name);
    if (result.success) setView("app");
    return result;
  };

  const handleStartDemo = () => {
    startDemo();
    setView("app");
  };

  const handleSwitchToLanding = () => {
    logout();
    setView("landing");
  };

  // Während die Session initial geprüft wird, nichts rendern (verhindert
  // kurzes Aufblitzen der Landing Page vor dem Redirect zur App).
  if (loading && !initialCheckDone.current) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Wird geladen...</p>
        </div>
      </div>
    );
  }

  const showApp = view === "app" && isAuthenticated;

  return (
    <>
      {!showApp ? (
        <LandingPage
          onOpenApp={() => setView("app")}
          onLogin={handleLogin}
          onSignup={handleSignup}
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
