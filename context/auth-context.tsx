"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

// Profil-Interface
export interface UserProfile {
  vorname: string;
  nachname: string;
  email: string;
  telefon: string;
  anschrift: string;
}

// Hilfsfunktion: Voller Name aus Vor- und Nachname
export function getFullName(p: UserProfile): string {
  return [p.vorname, p.nachname].filter(Boolean).join(" ") || "User";
}

// Auth-Context-Interface
interface AuthContextType {
  isAuthenticated: boolean;
  isDemo: boolean;
  isAdmin: boolean;
  user: User | null;
  profile: UserProfile;
  needsOnboarding: boolean;
  showProfileBanner: boolean;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  signup: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string; needsEmailConfirmation?: boolean }>;
  startDemo: () => void;
  logout: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => void;
  completeOnboarding: (data: { vorname: string; nachname: string; telefon: string; anschrift: string }) => Promise<void>;
  dismissOnboarding: () => void;
  dismissProfileBanner: () => void;
  getInitials: () => string;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Standard-Profil
const defaultProfile: UserProfile = {
  vorname: "Max",
  nachname: "Mustermann",
  email: "admin@example.de",
  telefon: "",
  anschrift: "Musterstraße 123, 12345 Berlin",
};

// Demo-Profil (nicht änderbar)
const demoProfile: UserProfile = {
  vorname: "Demo",
  nachname: "Benutzer",
  email: "demo@hausverwaltung-boss.de",
  telefon: "",
  anschrift: "Demo-Straße 1, 00000 Demostadt",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const STORAGE_KEY = "hausverwaltung_profile";
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [showProfileBanner, setShowProfileBanner] = useState(false);

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

  // Initialize auth state from Supabase
  useEffect(() => {
    // Skip if no supabase client (e.g., during build)
    if (!supabase) {
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setUser(session?.user ?? null);

        if (session?.user) {
          const profileCompleted = session.user.user_metadata?.profile_completed === true;
          setNeedsOnboarding(!profileCompleted);
          const meta = session.user.user_metadata || {};
          setProfile({
            vorname: meta.vorname || meta.name?.split?.(/\s+/)?.[0] || session.user.email?.split("@")[0] || "User",
            nachname: meta.nachname || meta.name?.split?.(/\s+/)?.slice?.(1)?.join?.(" ") || "",
            email: session.user.email || "",
            telefon: meta.telefon || "",
            anschrift: meta.anschrift || "",
          });
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        const profileCompleted = session.user.user_metadata?.profile_completed === true;
        setNeedsOnboarding(!profileCompleted);
        const meta = session.user.user_metadata || {};
        setProfile({
          vorname: meta.vorname || meta.name?.split?.(/\s+/)?.[0] || session.user.email?.split("@")[0] || "User",
          nachname: meta.nachname || meta.name?.split?.(/\s+/)?.slice?.(1)?.join?.(" ") || "",
          email: session.user.email || "",
          telefon: meta.telefon || "",
          anschrift: meta.anschrift || "",
        });
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Speichere Profil-Änderungen
  useEffect(() => {
    if (typeof window === "undefined" || isDemo || !user) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch (error) {
      console.error("Error saving profile to localStorage:", error);
    }
  }, [profile, isDemo, user]);

  // Login mit Supabase Auth
  const login = async (
    email: string,
    password: string,
  ): Promise<{ success: boolean; error?: string }> => {
    // Hardcoded Admin-Account
    if (email === "admin" && password === "admin") {
      const adminUser = {
        id: "admin-user",
        email: "admin@hausverwaltung-boss.de",
        user_metadata: {
          vorname: "Admin",
          nachname: "istrator",
          anschrift: "Admin-Straße 1, 00000 Admin",
        },
      } as unknown as User;

      setUser(adminUser);
      setIsDemo(false);
      setIsAdmin(true);
      setProfile({
        vorname: "Admin",
        nachname: "istrator",
        email: "admin@hausverwaltung-boss.de",
        telefon: "",
        anschrift: "Admin-Straße 1, 00000 Admin",
      });
      return { success: true };
    }

    // Skip if no supabase client
    if (!supabase) {
      return { success: false, error: "Supabase ist nicht konfiguriert" };
    }

    // Normale Supabase-Authentifizierung
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        setUser(data.user);
        setIsDemo(false);
        setIsAdmin(false);
        return { success: true };
      }

      return { success: false, error: "Login fehlgeschlagen" };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: "Ein unerwarteter Fehler ist aufgetreten",
      };
    }
  };

  // Signup mit Supabase Auth
  const signup = async (email: string, password: string) => {
  const supabase = createClient();
  if (!supabase) {
    return { success: false, error: "Supabase ist nicht konfiguriert" };
  }

    try {
      const siteUrl = `${window.location.origin}/auth/callback`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: siteUrl,
          data: {
            vorname: "",
            nachname: "",
            anschrift: "",
            telefon: "",
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // E-Mail-Bestätigung ausstehend (data.session ist null, aber data.user wurde erstellt)
      if (data.user && !data.session) {
        return {
          success: false,
          needsEmailConfirmation: true,
          error:
            `Registrierung erfolgreich! Bitte bestätigen Sie Ihre E-Mail-Adresse. Eine Bestätigungsmail wurde an ${email} gesendet.`,
        };
      }

      if (data.user && data.session) {
        setUser(data.user);
        return { success: true };
      }

      return { success: false, error: "Registrierung fehlgeschlagen" };
    } catch (error) {
      console.error("Signup error:", error);
      return {
        success: false,
        error: "Ein unerwarteter Fehler ist aufgetreten",
      };
    }
  };

  // Demo-Modus starten
  const startDemo = () => {
    setIsDemo(true);
    setProfile(demoProfile);
  };

  // Logout
  const logout = async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.error("Logout error:", error);
      }
    }
    setUser(null);
    setIsDemo(false);
    setIsAdmin(false);
    setProfile(defaultProfile);
  };

  // Profil aktualisieren (nur wenn nicht im Demo-Modus)
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (isDemo || !user) return;

    const updatedProfile = { ...profile, ...updates };
    setProfile(updatedProfile);

    if (supabase) {
      try {
        // Update user metadata in Supabase
        await supabase.auth.updateUser({
          data: {
            vorname: updatedProfile.vorname,
            nachname: updatedProfile.nachname,
            telefon: updatedProfile.telefon,
            anschrift: updatedProfile.anschrift,
          },
        });
      } catch (error) {
        console.error("Error updating profile:", error);
      }
    }
  };

  // Initialen aus dem Namen generieren
  const getInitials = (): string => {
    const v = profile.vorname.trim();
    const n = profile.nachname.trim();
    if (v && n) return (v[0] + n[0]).toUpperCase();
    if (v) return v.substring(0, 2).toUpperCase();
    return "??";
  };

  // Onboarding abschließen: Profil speichern und Flag setzen
  const completeOnboarding = async (data: { vorname: string; nachname: string; telefon: string; anschrift: string }) => {
    const updatedProfile = { ...profile, ...data };
    setProfile(updatedProfile);
    setNeedsOnboarding(false);

    if (supabase) {
      try {
        await supabase.auth.updateUser({
          data: {
            vorname: data.vorname,
            nachname: data.nachname,
            telefon: data.telefon,
            anschrift: data.anschrift,
            profile_completed: true,
          },
        });
      } catch (error) {
        console.error("Error completing onboarding:", error);
      }
    }
  };

  // Onboarding überspringen (Modal schließen, aber Banner zeigen)
  const dismissOnboarding = () => {
    setNeedsOnboarding(false);
    setShowProfileBanner(true);
  };

  // Banner permanent ausblenden
  const dismissProfileBanner = () => {
    setShowProfileBanner(false);
    if (supabase) {
      supabase.auth.updateUser({ data: { profile_completed: true } }).catch(console.error);
    }
  };

  const isAuthenticated = !!user || isDemo;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isDemo,
        isAdmin,
        user,
        profile,
        needsOnboarding,
        showProfileBanner,
        login,
        signup,
        startDemo,
        logout,
        updateProfile,
        completeOnboarding,
        dismissOnboarding,
        dismissProfileBanner,
        getInitials,
        loading,
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
