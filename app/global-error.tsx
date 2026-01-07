"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global application error:", error);
  }, [error]);

  return (
    <html lang="de">
      <body>
        <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
          <div className="max-w-md w-full space-y-6 text-center">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-white">
                Schwerwiegender Fehler
              </h1>
              <p className="text-slate-400">
                Es ist ein kritischer Fehler aufgetreten. Bitte laden Sie die
                Seite neu.
              </p>
            </div>
            {error.digest && (
              <p className="text-xs text-slate-500 font-mono">
                Fehler-ID: {error.digest}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => reset()}
                className="px-4 py-2 bg-white text-slate-950 rounded-md hover:bg-slate-100 transition-colors"
              >
                Erneut versuchen
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                className="px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700 transition-colors"
              >
                Zur Startseite
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
