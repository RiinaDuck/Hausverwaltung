"use client";

import { ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";

export function ProfileBanner() {
  const { showProfileBanner, dismissProfileBanner, isDemo } = useAuth();

  if (!showProfileBanner || isDemo) return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950">
      <p className="text-sm text-amber-800 dark:text-amber-200">
        Dein Profil ist unvollständig.{" "}
        <button
          type="button"
          className="inline-flex items-center gap-1 font-medium text-amber-900 hover:underline dark:text-amber-100"
          onClick={() => {
            // Profil-Dialog öffnen — dispatche Custom Event das der Header abfängt
            window.dispatchEvent(new CustomEvent("open-profile-dialog"));
            dismissProfileBanner();
          }}
        >
          Jetzt vervollständigen
          <ArrowRight className="h-3 w-3" />
        </button>
      </p>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0 text-amber-700 hover:text-amber-900 hover:bg-amber-100 dark:text-amber-300 dark:hover:text-amber-100 dark:hover:bg-amber-900"
        onClick={dismissProfileBanner}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
