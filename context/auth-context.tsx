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
  name: string;
  email: string;
  anschrift: string;
  ansprechpartner: string;
}

// Auth-Context-Interface
interface AuthContextType {
  isAuthenticated: boolean;
  isDemo: boolean;
  isAdmin: boolean;
  user: User | null;
  profile: UserProfile;
  login: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  signup: (
    email: string,
    password: string,
    name: string,
  ) => Promise<{ success: boolean; error?: string }>;
  startDemo: () => void;
  logout: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => void;
  getInitials: () => string;
  loading: boolean;
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
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);

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
    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setUser(session?.user ?? null);

        if (session?.user) {
          setProfile({
            name:
              session.user.user_metadata?.name ||
              session.user.email?.split("@")[0] ||
              "User",
            email: session.user.email || "",
            anschrift: session.user.user_metadata?.anschrift || "",
            ansprechpartner:
              session.user.user_metadata?.ansprechpartner ||
              session.user.user_metadata?.name ||
              "",
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
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);

      if (session?.user) {
        setProfile({
          name:
            session.user.user_metadata?.name ||
            session.user.email?.split("@")[0] ||
            "User",
          email: session.user.email || "",
          anschrift: session.user.user_metadata?.anschrift || "",
          ansprechpartner:
            session.user.user_metadata?.ansprechpartner ||
            session.user.user_metadata?.name ||
            "",
        });
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

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
          name: "Administrator",
          anschrift: "Admin-Straße 1, 00000 Admin",
          ansprechpartner: "Administrator",
        },
      } as unknown as User;

      setUser(adminUser);
      setIsDemo(false);
      setIsAdmin(true);
      setProfile({
        name: "Administrator",
        email: "admin@hausverwaltung-boss.de",
        anschrift: "Admin-Straße 1, 00000 Admin",
        ansprechpartner: "Administrator",
      });
      return { success: true };
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
  const signup = async (
    email: string,
    password: string,
    name: string,
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
            anschrift: "",
            ansprechpartner: name,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
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
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsDemo(false);
      setIsAdmin(false);
      setProfile(defaultProfile);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Profil aktualisieren (nur wenn nicht im Demo-Modus)
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (isDemo || !user) return;

    const updatedProfile = { ...profile, ...updates };
    setProfile(updatedProfile);

    try {
      // Update user metadata in Supabase
      await supabase.auth.updateUser({
        data: {
          name: updatedProfile.name,
          anschrift: updatedProfile.anschrift,
          ansprechpartner: updatedProfile.ansprechpartner,
        },
      });
    } catch (error) {
      console.error("Error updating profile:", error);
    }
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

  const isAuthenticated = !!user || isDemo;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isDemo,
        isAdmin,
        user,
        profile,
        login,
        signup,
        startDemo,
        logout,
        updateProfile,
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
