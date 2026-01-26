// This file will be auto-generated after running: npx supabase gen types typescript --local
// For now, we'll use a placeholder type that will be replaced

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      objekte: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          adresse: string;
          typ: "Miete" | "WEG";
          einheiten: number;
          status: "aktiv" | "inaktiv";
          eigentuemer: Json;
          bankverbindung: Json;
          objektdaten: Json;
          notizen: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          adresse: string;
          typ: "Miete" | "WEG";
          einheiten: number;
          status?: "aktiv" | "inaktiv";
          eigentuemer: Json;
          bankverbindung: Json;
          objektdaten: Json;
          notizen?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          adresse?: string;
          typ?: "Miete" | "WEG";
          einheiten?: number;
          status?: "aktiv" | "inaktiv";
          eigentuemer?: Json;
          bankverbindung?: Json;
          objektdaten?: Json;
          notizen?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      wohnungen: {
        Row: {
          id: string;
          objekt_id: string;
          user_id: string;
          bezeichnung: string;
          etage: string;
          flaeche: number;
          zimmer: number;
          miete: number;
          nebenkosten: number;
          status: "vermietet" | "leer" | "eigennutzung";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          objekt_id: string;
          user_id: string;
          bezeichnung: string;
          etage: string;
          flaeche: number;
          zimmer: number;
          miete: number;
          nebenkosten: number;
          status?: "vermietet" | "leer" | "eigennutzung";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          objekt_id?: string;
          user_id?: string;
          bezeichnung?: string;
          etage?: string;
          flaeche?: number;
          zimmer?: number;
          miete?: number;
          nebenkosten?: number;
          status?: "vermieted" | "leer" | "eigennutzung";
          created_at?: string;
          updated_at?: string;
        };
      };
      mieter: {
        Row: {
          id: string;
          wohnung_id: string;
          user_id: string;
          name: string;
          email: string;
          telefon: string;
          einzugs_datum: string;
          miete_bis: string | null;
          kaltmiete: number;
          nebenkosten: number;
          kaution: number;
          is_kurzzeitvermietung: boolean;
          kurzzeit_bis: string | null;
          is_aktiv: boolean;
          prozentanteil: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          wohnung_id: string;
          user_id: string;
          name: string;
          email: string;
          telefon: string;
          einzugs_datum: string;
          miete_bis?: string | null;
          kaltmiete: number;
          nebenkosten: number;
          kaution: number;
          is_kurzzeitvermietung?: boolean;
          kurzzeit_bis?: string | null;
          is_aktiv?: boolean;
          prozentanteil?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          wohnung_id?: string;
          user_id?: string;
          name?: string;
          email?: string;
          telefon?: string;
          einzugs_datum?: string;
          miete_bis?: string | null;
          kaltmiete?: number;
          nebenkosten?: number;
          kaution?: number;
          is_kurzzeitvermietung?: boolean;
          kurzzeit_bis?: string | null;
          is_aktiv?: boolean;
          prozentanteil?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      zaehler: {
        Row: {
          id: string;
          wohnung_id: string;
          user_id: string;
          wohnungnr: string;
          geschoss: string;
          montageort: string;
          geraeteart: string;
          geraetnummer: string;
          geeicht_bis: string;
          hersteller: string | null;
          typ: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          wohnung_id: string;
          user_id: string;
          wohnungnr: string;
          geschoss: string;
          montageort: string;
          geraeteart: string;
          geraetnummer: string;
          geeicht_bis: string;
          hersteller?: string | null;
          typ?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          wohnung_id?: string;
          user_id?: string;
          wohnungnr?: string;
          geschoss?: string;
          montageort?: string;
          geraeteart?: string;
          geraetnummer?: string;
          geeicht_bis?: string;
          hersteller?: string | null;
          typ?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      rauchmelder: {
        Row: {
          id: string;
          wohnung_id: string;
          user_id: string;
          wohnungnr: string;
          geschoss: string;
          montageort: string;
          geraeteart: string;
          geraetnummer: string;
          lebensdauer_bis: string;
          hersteller: string | null;
          typ: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          wohnung_id: string;
          user_id: string;
          wohnungnr: string;
          geschoss: string;
          montageort: string;
          geraeteart: string;
          geraetnummer: string;
          lebensdauer_bis: string;
          hersteller?: string | null;
          typ?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          wohnung_id?: string;
          user_id?: string;
          wohnungnr?: string;
          geschoss?: string;
          montageort?: string;
          geraeteart?: string;
          geraetnummer?: string;
          lebensdauer_bis?: string;
          hersteller?: string | null;
          typ?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      rechnungen: {
        Row: {
          id: string;
          user_id: string;
          nummer: string;
          datum: string;
          empfaenger_name: string;
          empfaenger_adresse: string;
          positionen: Json;
          bemerkung: string | null;
          status: "offen" | "bezahlt" | "storniert";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          nummer: string;
          datum: string;
          empfaenger_name: string;
          empfaenger_adresse: string;
          positionen: Json;
          bemerkung?: string | null;
          status?: "offen" | "bezahlt" | "storniert";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          nummer?: string;
          datum?: string;
          empfaenger_name?: string;
          empfaenger_adresse?: string;
          positionen?: Json;
          bemerkung?: string | null;
          status?: "offen" | "bezahlt" | "storniert";
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
