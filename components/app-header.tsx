"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bell, HelpCircle, Menu } from "lucide-react";
import type { AppView } from "@/components/app-dashboard";
import { useAppData } from "@/context/app-data-context";

interface AppHeaderProps {
  currentView: AppView;
  onMenuClick?: () => void;
}

const viewTitles: Record<AppView, string> = {
  dashboard: "Dashboard",
  objekte: "Objektdaten (Stammdaten)",
  wohnungen: "Wohnungsdaten",
  mieter: "Mieter & Mieten",
  nebenkosten: "Nebenkostenabrechnung",
  zaehler: "Zähler & Rauchmelder",
  hausmanager: "Hausmanager / Finanzamt",
  rechnungen: "Rechnungen",
  statistiken: "Statistiken",
};

export function AppHeader({ currentView, onMenuClick }: AppHeaderProps) {
  const { objekte, selectedObjektId, setSelectedObjektId } = useAppData();

  return (
    <header className="h-14 md:h-16 border-b border-border bg-card px-4 md:px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-9 w-9"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-base md:text-xl font-semibold truncate">
          {viewTitles[currentView]}
        </h1>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        {objekte.length > 0 && (
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden lg:inline">
              Aktuelles Objekt:
            </span>
            <Select
              value={selectedObjektId || ""}
              onValueChange={setSelectedObjektId}
            >
              <SelectTrigger className="w-[140px] md:w-[200px] h-9">
                <SelectValue placeholder="Objekt wählen" />
              </SelectTrigger>
              <SelectContent>
                {objekte.map((objekt) => (
                  <SelectItem key={objekt.id} value={objekt.id}>
                    {objekt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Bell className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 hidden sm:flex">
          <HelpCircle className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
