"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

// Profil-Interface
export interface UserProfile {
  name: string;
  email: string;
  anschrift: string;
  ansprechpartner: string;
}

// Auth-Context-Interface
interface AuthContextType {
  isAuthenticated: boolean;
  isDemo: boolean;
  profile: UserProfile;
  login: (username: string, password: string) => boolean;
  startDemo: () => void;
  logout: () => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  getInitials: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Standard-Profil
const defaultProfile: UserProfile = {
  name: "Max Mustermann",
  email: "admin@example.de",
  anschrift: "Musterstraße 123, 12345 Berlin",
  ansprechpartner: "Max Mustermann",
};

// Demo-Profil (nicht änderbar)
const demoProfile: UserProfile = {
  name: "Demo Benutzer",
  email: "demo@hausverwaltung-boss.de",
  anschrift: "Demo-Straße 1, 00000 Demostadt",
  ansprechpartner: "Demo Support",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const STORAGE_KEY = "hausverwaltung_profile";
  const AUTH_STORAGE_KEY = "hausverwaltung_auth";

  // Helper: Load from localStorage with fallback
  const loadFromStorage = <T,>(key: string, fallback: T): T => {
    if (typeof window === "undefined") return fallback;
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : fallback;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return fallback;
    }
  };

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const authState = loadFromStorage(AUTH_STORAGE_KEY, { isAuthenticated: false, isDemo: false });
    return authState.isAuthenticated;
  });
  const [isDemo, setIsDemo] = useState<boolean>(() => {
    const authState = loadFromStorage(AUTH_STORAGE_KEY, { isAuthenticated: false, isDemo: false });
    return authState.isDemo;
  });
  const [profile, setProfile] = useState<UserProfile>(() =>
    loadFromStorage(STORAGE_KEY, defaultProfile)
  );

  // Speichere Profil-Änderungen
  useEffect(() => {
    if (typeof window === "undefined" || isDemo) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (error) {
      console.error("Error saving profile to localStorage:", error);
    }
  }, [profile, isDemo]);

  // Speichere Auth-Status
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ isAuthenticated, isDemo }));
    } catch (error) {
      console.error("Error saving auth state to localStorage:", error);
    }
  }, [isAuthenticated, isDemo]);

  // Login mit admin/admin Credentials
  const login = (username: string, password: string): boolean => {
    if (username === "admin" && password === "admin") {
      setIsAuthenticated(true);
      setIsDemo(false);
      setProfile(loadFromStorage(STORAGE_KEY, defaultProfile));
      return true;
    }
    return false;
  };

  // Demo-Modus starten
  const startDemo = () => {
    setIsAuthenticated(true);
    setIsDemo(true);
    setProfile(demoProfile);
  };

  // Logout
  const logout = () => {
    setIsAuthenticated(false);
    setIsDemo(false);
    // Auth-Status aus localStorage entfernen
    if (typeof window !== "undefined") {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  };

  // Profil aktualisieren (nur wenn nicht im Demo-Modus)
  const updateProfile = (updates: Partial<UserProfile>) => {
    if (isDemo) return; // Keine Änderungen im Demo-Modus
    setProfile((prev) => ({ ...prev, ...updates }));
  };

  // Initialen aus dem Namen generieren
  const getInitials = (): string => {
    const nameParts = profile.name.trim().split(/\s+/);
    if (nameParts.length === 0 || !nameParts[0]) return "??";
    if (nameParts.length === 1) {
      return nameParts[0].substring(0, 2).toUpperCase();
    }
    return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isDemo,
        profile,
        login,
        startDemo,
        logout,
        updateProfile,
        getInitials,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
