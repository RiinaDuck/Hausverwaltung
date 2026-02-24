"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthConfirmedPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

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