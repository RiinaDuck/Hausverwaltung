"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";

export function OnboardingModal() {
  const { profile, needsOnboarding, isDemo, completeOnboarding, dismissOnboarding } = useAuth();

  const [vorname, setVorname] = useState("");
  const [nachname, setNachname] = useState("");
  const [telefon, setTelefon] = useState("");
  const [anschrift, setAnschrift] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Nicht im Demo-Modus oder wenn kein Onboarding nötig
  if (isDemo || !needsOnboarding) return null;

  const handleSave = async () => {
    if (!vorname.trim() || !nachname.trim()) {
      setError("Bitte geben Sie Vor- und Nachname ein.");
      return;
    }

    setSaving(true);
    setError("");

    await completeOnboarding({
      vorname: vorname.trim(),
      nachname: nachname.trim(),
      telefon: telefon.trim(),
      anschrift: anschrift.trim(),
    });

    setSaving(false);
  };

  const handleSkip = () => {
    dismissOnboarding();
  };

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-xl">Willkommen! Vervollständige dein Profil</DialogTitle>
          <DialogDescription>
            Damit wir dich richtig ansprechen können. Du kannst dein Profil auch
            später noch bearbeiten.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="onboarding-email">E-Mail</Label>
            <Input
              id="onboarding-email"
              type="email"
              value={profile.email}
              readOnly
              className="bg-muted cursor-not-allowed"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="onboarding-vorname">
                Vorname <span className="text-destructive">*</span>
              </Label>
              <Input
                id="onboarding-vorname"
                placeholder="Max"
                value={vorname}
                onChange={(e) => setVorname(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="onboarding-nachname">
                Nachname <span className="text-destructive">*</span>
              </Label>
              <Input
                id="onboarding-nachname"
                placeholder="Mustermann"
                value={nachname}
                onChange={(e) => setNachname(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="onboarding-telefon">Telefon</Label>
            <Input
              id="onboarding-telefon"
              type="tel"
              placeholder="+49 123 456789"
              value={telefon}
              onChange={(e) => setTelefon(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="onboarding-anschrift">Anschrift</Label>
            <Input
              id="onboarding-anschrift"
              placeholder="Straße, PLZ Ort"
              value={anschrift}
              onChange={(e) => setAnschrift(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>
          {error && (
            <div className="text-sm text-destructive">{error}</div>
          )}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleSkip}
              disabled={saving}
            >
              Überspringen
            </Button>
            <Button
              className="flex-1 bg-success hover:bg-success/90 text-success-foreground"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Wird gespeichert..." : "Loslegen"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
