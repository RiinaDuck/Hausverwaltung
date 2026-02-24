"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthConfirmedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(5);

  const error = searchParams.get("error");
  const errorCode = searchParams.get("error_code");
  const errorDescription = searchParams.get("error_description");
  const isExpired = errorCode === "otp_expired";
  const hasError = !!error;

  useEffect(() => {
  if (hasError) return;

  const timer = setInterval(() => {
    setCountdown((prev) => prev - 1);
  }, 1000);

  return () => clearInterval(timer);
}, [hasError]);

useEffect(() => {
  if (!hasError && countdown <= 0) {
    router.push("/");
  }
}, [countdown, hasError, router]);

  if (hasError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-destructive" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold">
              {isExpired ? "Link abgelaufen" : "Bestätigung fehlgeschlagen"}
            </h1>
            <p className="text-muted-foreground">
              {isExpired
                ? "Der Bestätigungslink ist abgelaufen. Bitte registrieren Sie sich erneut oder fordern Sie einen neuen Link an."
                : errorDescription ?? "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut."}
            </p>
          </div>

          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive font-medium">
              Fehlercode: {errorCode ?? error}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button
              onClick={() => router.push("/")}
              variant="outline"
              className="gap-2 w-full"
            >
              <RefreshCw className="w-4 h-4" />
              Erneut registrieren
            </Button>
            <Button
              onClick={() => router.push("/")}
              className="gap-2 w-full"
            >
              <Home className="w-4 h-4" />
              Zur Startseite
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-success" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold">E-Mail bestätigt!</h1>
          <p className="text-muted-foreground">
            Ihre E-Mail-Adresse wurde erfolgreich bestätigt. Sie können sich jetzt anmelden.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-success/10 border border-success/20">
          <p className="text-sm text-success font-medium">
            Sie werden in {countdown} Sekunden weitergeleitet...
          </p>
        </div>

        <Button
          onClick={() => router.push("/")}
          className="bg-success hover:bg-success/90 text-success-foreground gap-2 w-full"
        >
          <Home className="w-4 h-4" />
          Jetzt anmelden
        </Button>
      </div>
    </div>
  );
}