"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Home,
  Building2,
  DoorOpen,
  Users,
  Gauge,
  BookUser,
  LogOut,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Archive,
  X,
  Wallet,
  TrendingUp,
  Receipt,
} from "lucide-react";
import type { AppView } from "@/components/app-dashboard";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/context/auth-context";

interface AppSidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onSwitchToLanding?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const navItemsBefore = [
  { id: "dashboard" as const, label: "Dashboard", icon: Home },
  { id: "objekte" as const, label: "Objekte", icon: Building2 },
  { id: "wohnungen" as const, label: "Wohnungen", icon: DoorOpen },
  { id: "mieter" as const, label: "Mieter", icon: Users },
];

const navItemsAfter = [
  { id: "zaehler" as const, label: "Zähler", icon: Gauge },
  { id: "statistiken" as const, label: "Statistiken", icon: BarChart3 },
  { id: "kontakte" as const, label: "Kontakte", icon: BookUser },
  { id: "archiv" as const, label: "Archiv", icon: Archive, dividerBefore: true },
];

const FINANZEN_VIEWS = ["einnahmen-ausgaben", "nebenkosten"] as const;


export function AppSidebar({
  currentView,
  onNavigate,
  onSwitchToLanding,
  isOpen = true,
  onClose,
}: AppSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [finanzenOpen, setFinanzenOpen] = useState(
    FINANZEN_VIEWS.includes(currentView as (typeof FINANZEN_VIEWS)[number]),
  );
  const isMobile = useIsMobile();
  const { profile, getInitials, logout } = useAuth();

  // Handle navigation on mobile - close sidebar after selection
  const handleNavigate = useCallback((view: AppView) => {
    onNavigate(view);
    if (isMobile && onClose) {
      onClose();
    }
  }, [onNavigate, isMobile, onClose]);

  // Handle logout and switch to landing
  const handleLogout = useCallback(() => {
    logout();
    if (onSwitchToLanding) {
      onSwitchToLanding();
    }
  }, [logout, onSwitchToLanding]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobile && isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobile, isOpen]);

  // Don't render on mobile if not open
  if (isMobile && !isOpen) return null;

  return (
    <TooltipProvider delayDuration={0}>
      {/* Mobile Overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "bg-sidebar text-sidebar-foreground flex flex-col shrink-0 relative transition-all duration-300 ease-in-out h-full",
          // Mobile styles
          isMobile && "fixed left-0 top-0 z-50 w-72 shadow-xl",
          // Desktop styles
          !isMobile && (isCollapsed ? "w-16" : "w-64"),
        )}
      >
        {/* Mobile Close Button */}
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute right-2 top-3 z-10 h-8 w-8 text-sidebar-foreground/70 hover:text-sidebar-foreground md:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        )}

        {/* Desktop Collapse Toggle Button */}
        {!isMobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-6 z-10 h-6 w-6 rounded-full border border-sidebar-border bg-sidebar hover:bg-sidebar-accent shadow-md"
          >
            {isCollapsed ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronLeft className="h-3 w-3" />
            )}
          </Button>
        )}

        {/* Logo - klickbar zurück zur Landing Page */}
        <div
          className={cn(
            "p-4 border-b border-sidebar-border transition-all duration-300",
            !isMobile && isCollapsed && "px-2",
          )}
        >
          <button
            onClick={onSwitchToLanding}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer w-full"
            title="Zurück zur Startseite"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success shrink-0">
              <Home className="h-5 w-5 text-success-foreground" />
            </div>
            <div
              className={cn(
                "overflow-hidden transition-all duration-300",
                !isMobile && isCollapsed
                  ? "w-0 opacity-0"
                  : "w-auto opacity-100",
              )}
            >
              <span className="font-semibold text-sm whitespace-nowrap">
                Hausverwaltung
              </span>
              <span className="text-success font-semibold text-sm ml-1">
                Boss
              </span>
            </div>
          </button>
        </div>

        {/* Navigation */}
        <nav
          className={cn(
            "flex-1 p-3 space-y-1 overflow-y-auto transition-all duration-300",
            !isMobile && isCollapsed && "px-2",
          )}
        >
          {/* Items before Finanzen group */}
          {navItemsBefore.map((item) => {
            const button = (
              <Button
                key={item.id}
                variant="ghost"
                className={cn(
                  "w-full h-10 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-300",
                  currentView === item.id &&
                    "bg-sidebar-accent text-sidebar-foreground",
                  !isMobile && isCollapsed
                    ? "justify-center px-0"
                    : "justify-start gap-3",
                )}
                onClick={() => handleNavigate(item.id)}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span
                  className={cn(
                    "text-sm transition-all duration-300 overflow-hidden whitespace-nowrap",
                    !isMobile && isCollapsed
                      ? "w-0 opacity-0"
                      : "w-auto opacity-100",
                  )}
                >
                  {item.label}
                </span>
              </Button>
            );
            return !isMobile && isCollapsed ? (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>{button}</TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            ) : (
              <div key={item.id}>{button}</div>
            );
          })}

          {/* Finanzen expandable group */}
          {!isMobile && isCollapsed ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full h-10 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-300 justify-center px-0",
                    FINANZEN_VIEWS.includes(
                      currentView as (typeof FINANZEN_VIEWS)[number],
                    ) && "bg-sidebar-accent text-sidebar-foreground",
                  )}
                  onClick={() => handleNavigate("einnahmen-ausgaben")}
                >
                  <Wallet className="h-4 w-4 shrink-0" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-medium">
                Finanzen
              </TooltipContent>
            </Tooltip>
          ) : (
            <div>
              {/* Group header */}
              <Button
                variant="ghost"
                className={cn(
                  "w-full h-10 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-300 justify-start gap-3",
                  FINANZEN_VIEWS.includes(
                    currentView as (typeof FINANZEN_VIEWS)[number],
                  ) && "text-sidebar-foreground",
                )}
                onClick={() => setFinanzenOpen((o) => !o)}
              >
                <Wallet className="h-4 w-4 shrink-0" />
                <span className="text-sm flex-1 text-left whitespace-nowrap">
                  Finanzen
                </span>
                <ChevronDown
                  className={cn(
                    "h-3 w-3 transition-transform",
                    finanzenOpen && "rotate-180",
                  )}
                />
              </Button>
              {/* Sub-items */}
              {finanzenOpen && (
                <div className="ml-4 mt-0.5 space-y-0.5 border-l border-sidebar-border pl-2">
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full h-9 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-300 justify-start gap-3",
                      currentView === "einnahmen-ausgaben" &&
                        "bg-sidebar-accent text-sidebar-foreground",
                    )}
                    onClick={() => handleNavigate("einnahmen-ausgaben")}
                  >
                    <TrendingUp className="h-4 w-4 shrink-0" />
                    <span className="text-sm whitespace-nowrap">
                      Einnahmen/Ausgaben
                    </span>
                  </Button>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full h-9 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-300 justify-start gap-3",
                      currentView === "nebenkosten" &&
                        "bg-sidebar-accent text-sidebar-foreground",
                    )}
                    onClick={() => handleNavigate("nebenkosten")}
                  >
                    <Receipt className="h-4 w-4 shrink-0" />
                    <span className="text-sm whitespace-nowrap">Nebenkosten</span>
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Items after Finanzen group */}
          {navItemsAfter.map((item) => {
            const button = (
              <Button
                key={item.id}
                variant="ghost"
                className={cn(
                  "w-full h-10 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all duration-300",
                  currentView === item.id &&
                    "bg-sidebar-accent text-sidebar-foreground",
                  !isMobile && isCollapsed
                    ? "justify-center px-0"
                    : "justify-start gap-3",
                )}
                onClick={() => handleNavigate(item.id)}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                <span
                  className={cn(
                    "text-sm transition-all duration-300 overflow-hidden whitespace-nowrap",
                    !isMobile && isCollapsed
                      ? "w-0 opacity-0"
                      : "w-auto opacity-100",
                  )}
                >
                  {item.label}
                </span>
              </Button>
            );
            const content = !isMobile && isCollapsed ? (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>{button}</TooltipTrigger>
                <TooltipContent side="right" className="font-medium">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            ) : (
              <div key={item.id}>{button}</div>
            );
            return (
              <div key={item.id}>
                {(item as any).dividerBefore && (
                  <div className="my-2 border-t border-sidebar-border" />
                )}
                {content}
              </div>
            );
          })}
        </nav>

        {/* User Profile */}
        <div
          className={cn(
            "p-4 border-t border-sidebar-border transition-all duration-300",
            !isMobile && isCollapsed && "px-2",
          )}
        >
          <div
            className={cn(
              "flex items-center transition-all duration-300",
              !isMobile && isCollapsed ? "justify-center" : "gap-3",
            )}
          >
            {!isMobile && isCollapsed ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="h-9 w-9 cursor-pointer">
                    <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground text-sm">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p className="font-medium">{`${profile.vorname} ${profile.nachname}`.trim()}</p>
                  <p className="text-xs text-muted-foreground">
                    {profile.email}
                  </p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <>
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground text-sm">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="text-sm font-medium truncate">{`${profile.vorname} ${profile.nachname}`.trim()}</p>
                  <p className="text-xs text-sidebar-foreground/60 truncate">
                    {profile.email}
                  </p>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleLogout}
                      className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground shrink-0"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Abmelden</TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
