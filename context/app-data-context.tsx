"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import { useAuth } from "./auth-context";
import {
  getObjekte,
  createObjekt,
  updateObjekt as updateObjektDB,
  deleteObjekt as deleteObjektDB,
  getWohnungen,
  createWohnung,
  updateWohnung as updateWohnungDB,
  deleteWohnung as deleteWohnungDB,
  getMieter,
  createMieter,
  updateMieter as updateMieterDB,
  deleteMieter as deleteMieterDB,
  getExpenses,
  createExpense,
  updateExpense as updateExpenseDB,
  deleteExpense as deleteExpenseDB,
} from "@/lib/supabase/queries";

// Types für die Datenstrukturen
export interface Objekt {
  id: string;
  name: string;
  adresse: string;
  typ: "Miete" | "WEG";
  einheiten: number;
  status: "aktiv" | "inaktiv";
  eigentuemer: {
    name: string;
    adresse: string;
    telefon: string;
    email: string;
    mobil: string;
  };
  bankverbindung: {
    kontoinhaber: string;
    bank: string;
    iban: string;
    bic: string;
  };
  objektdaten: {
    strasse: string;
    plz: string;
    ort: string;
    baujahr: string;
    sanierungsjahr: string;
    gesamtwohnflaeche: string;
    gesamtnutzflaeche: string;
    anzahlEinheiten: string;
    garagen: string;
    // Energieausweis
    energieArt?: string;
    energieWert?: string;
    energietraeger?: string;
    energieBaujahr?: string;
    energieKlasse?: string;
    // Grundstück
    flur?: string;
    flurstueck?: string;
    grundstueckGroesse?: string;
    gemarkung?: string;
    // Grundbuch
    amtsgericht?: string;
    blatt?: string;
    lastenAbt2?: string;
    lastenAbt3?: string;
    // Kontakt
    finanzamt?: string;
  };
  notizen: string;
}

export interface Wohnung {
  id: string;
  objektId: string;
  bezeichnung: string;
  etage: string;
  flaeche: number;
  zimmer: number;
  miete: number;
  nebenkosten: number;
  status: "vermietet" | "leer" | "eigennutzung";
}

export interface Mieter {
  id: string;
  wohnungId: string;
  name: string;
  email: string;
  telefon: string;
  einzugsDatum: string;
  mieteBis: string | null;
  kaltmiete: number;
  nebenkosten: number;
  kaution: number;
  isKurzzeitvermietung: boolean;
  kurzzeitBis?: string | null;
  isAktiv: boolean;
  prozentanteil?: number;
}

// Verteilerschlüssel-Typ — identisch mit DB-Constraint
export type Verteilerschluessel =
  | "wohnflaeche"
  | "nutzflaeche"
  | "einheiten"
  | "personen"
  | "verbrauch"
  | "mea"
  | "direkt";

export interface Expense {
  id: string;
  objektId: string;
  kostenart: string;
  betrag: number;
  zeitraumVon: string;  // ISO-Date
  zeitraumBis: string;  // ISO-Date
  verteilerschluessel: Verteilerschluessel;
  rechnungId?: string | null;
  notiz?: string | null;
}

export interface EhemalierMieter {
  id: string;
  name: string;
  email: string;
  telefon: string;
  letzteWohnungId: string;
  letztesAuszugsDatum: string;
}

interface AppDataContextType {
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, "id">) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  objekte: Objekt[];
  wohnungen: Wohnung[];
  mieter: Mieter[];
  ehemaligeMieter: EhemalierMieter[];
  selectedObjektId: string | null;
  loading: boolean;
  addObjekt: (objekt: Omit<Objekt, "id">) => Promise<void>;
  updateObjekt: (id: string, objekt: Partial<Objekt>) => Promise<void>;
  deleteObjekt: (id: string) => Promise<void>;
  addWohnung: (wohnung: Omit<Wohnung, "id">) => Promise<void>;
  updateWohnung: (id: string, wohnung: Partial<Wohnung>) => Promise<void>;
  deleteWohnung: (id: string) => Promise<void>;
  addMieter: (mieter: Omit<Mieter, "id">) => Promise<void>;
  updateMieter: (id: string, mieter: Partial<Mieter>) => Promise<void>;
  deleteMieter: (id: string) => Promise<void>;
  archiviereMieter: (id: string) => Promise<void>;
  reaktiviereMieter: (
    ehemaligerMieterId: string,
    wohnungId: string,
  ) => Promise<void>;
  setSelectedObjektId: (id: string | null) => void;
  refreshData: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

// Demo-Daten für nicht-eingeloggte User
const DEMO_OBJEKTE: Objekt[] = [
  {
    id: "demo-1",
    name: "Musterhaus Berlin",
    adresse: "Berliner Straße 42, 10115 Berlin",
    typ: "Miete",
    einheiten: 8,
    status: "aktiv",
    eigentuemer: {
      name: "Max Mustermann",
      adresse: "Musterstraße 123, 12345 Berlin",
      telefon: "030 12345678",
      email: "max@mustermann.de",
      mobil: "0170 1234567",
    },
    bankverbindung: {
      kontoinhaber: "Max Mustermann",
      bank: "Sparkasse Berlin",
      iban: "DE89 3704 0044 0532 0130 00",
      bic: "COBADEFFXXX",
    },
    objektdaten: {
      strasse: "Berliner Straße 42",
      plz: "10115",
      ort: "Berlin",
      baujahr: "1985",
      sanierungsjahr: "2018",
      gesamtwohnflaeche: "542,50",
      gesamtnutzflaeche: "68,00",
      anzahlEinheiten: "8",
      garagen: "4",
      energieArt: "bedarf",
      energieWert: "128",
      energietraeger: "gas",
      energieBaujahr: "2018",
      energieKlasse: "d",
      flur: "12",
      flurstueck: "145/2",
      grundstueckGroesse: "850",
      gemarkung: "Berlin-Mitte",
      amtsgericht: "Berlin-Mitte",
      blatt: "1234/56",
      lastenAbt2: "",
      lastenAbt3: "Grundschuld über 200.000 EUR zugunsten Sparkasse Berlin",
      finanzamt: "Berlin Mitte",
    },
    notizen:
      "Hausmeisterservice: Firma Schmidt, Tel. 030 9876543\nSchlüssel: 3x Haupteingang, 1x Keller\nNächste Wartung Heizung: März 2026",
  },
];

const DEMO_WOHNUNGEN: Wohnung[] = [
  {
    id: "demo-w1",
    objektId: "demo-1",
    bezeichnung: "EG links",
    etage: "EG",
    flaeche: 65,
    zimmer: 2,
    miete: 650,
    nebenkosten: 150,
    status: "vermietet",
  },
  {
    id: "demo-w2",
    objektId: "demo-1",
    bezeichnung: "EG rechts",
    etage: "EG",
    flaeche: 70,
    zimmer: 3,
    miete: 700,
    nebenkosten: 160,
    status: "vermietet",
  },
];

const DEMO_MIETER: Mieter[] = [
  {
    id: "demo-m1",
    wohnungId: "demo-w1",
    name: "Anna Schmidt",
    email: "anna@example.com",
    telefon: "030 11111111",
    einzugsDatum: "2023-01-01",
    mieteBis: null,
    kaltmiete: 650,
    nebenkosten: 150,
    kaution: 1950,
    isKurzzeitvermietung: false,
    isAktiv: true,
    prozentanteil: 12.0,
  },
];

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user, isAdmin } = useAuth();
  const [objekte, setObjekte] = useState<Objekt[]>([]);
  const [wohnungen, setWohnungen] = useState<Wohnung[]>([]);
  const [mieter, setMieter] = useState<Mieter[]>([]);
  const [ehemaligeMieter, setEhemaligeMieter] = useState<EhemalierMieter[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedObjektId, setSelectedObjektId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Konvertiert DB-Format zu App-Format
  const mapDBToObjekt = (dbObjekt: any): Objekt => ({
    id: dbObjekt.id,
    name: dbObjekt.name,
    adresse: dbObjekt.adresse,
    typ: dbObjekt.typ,
    einheiten: dbObjekt.einheiten,
    status: dbObjekt.status,
    eigentuemer: dbObjekt.eigentuemer,
    bankverbindung: dbObjekt.bankverbindung,
    objektdaten: dbObjekt.objektdaten,
    notizen: dbObjekt.notizen || "",
  });

  const mapDBToWohnung = (dbWohnung: any): Wohnung => ({
    id: dbWohnung.id,
    objektId: dbWohnung.objekt_id,
    bezeichnung: dbWohnung.bezeichnung,
    etage: dbWohnung.etage,
    flaeche: Number(dbWohnung.flaeche),
    zimmer: dbWohnung.zimmer,
    miete: Number(dbWohnung.miete),
    nebenkosten: Number(dbWohnung.nebenkosten),
    status: dbWohnung.status,
  });

  const mapDBToExpense = (db: any): Expense => ({
    id: db.id,
    objektId: db.objekt_id,
    kostenart: db.kostenart,
    betrag: Number(db.betrag),
    zeitraumVon: db.zeitraum_von,
    zeitraumBis: db.zeitraum_bis,
    verteilerschluessel: db.verteilerschluessel as Verteilerschluessel,
    rechnungId: db.rechnung_id,
    notiz: db.notiz,
  });

  const mapDBToMieter = (dbMieter: any): Mieter => ({
    id: dbMieter.id,
    wohnungId: dbMieter.wohnung_id,
    name: dbMieter.name,
    email: dbMieter.email,
    telefon: dbMieter.telefon,
    einzugsDatum: dbMieter.einzugs_datum,
    mieteBis: dbMieter.miete_bis,
    kaltmiete: Number(dbMieter.kaltmiete),
    nebenkosten: Number(dbMieter.nebenkosten),
    kaution: Number(dbMieter.kaution),
    isKurzzeitvermietung: dbMieter.is_kurzzeitvermietung,
    kurzzeitBis: dbMieter.kurzzeit_bis,
    isAktiv: dbMieter.is_aktiv,
    prozentanteil: dbMieter.prozentanteil
      ? Number(dbMieter.prozentanteil)
      : undefined,
  });

  // Lade alle Daten von Supabase
  const refreshData = async () => {
    // Demo-Modus oder Admin-Account: Zeige Demo-Daten
    // Admin hat keine echte Supabase user_id und kann daher nicht auf RLS-geschützte Daten zugreifen
    if (!user || isAdmin) {
      setObjekte(DEMO_OBJEKTE);
      setWohnungen(DEMO_WOHNUNGEN);
      setMieter(DEMO_MIETER);
      setEhemaligeMieter([]);
      setExpenses([]);
      setSelectedObjektId(DEMO_OBJEKTE[0]?.id || null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [objekteData, wohnungenData, mieterData] = await Promise.all([
        getObjekte(user.id),
        getWohnungen(user.id),
        getMieter(user.id),
      ]);

      // Expenses separat laden – falls Tabelle noch nicht migriert wurde, gracefully auf [] fallen
      let expensesData: any[] = [];
      try {
        expensesData = await getExpenses(user.id);
      } catch (expErr) {
        console.warn(
          "expenses-Tabelle nicht gefunden – Migration ausführen:",
          expErr,
        );
      }

      setObjekte(objekteData.map(mapDBToObjekt));
      setWohnungen(wohnungenData.map(mapDBToWohnung));
      setExpenses(expensesData.map(mapDBToExpense));

      const allMieter = mieterData.map(mapDBToMieter);
      setMieter(allMieter.filter((m: Mieter) => m.isAktiv));

      // Ehemalige Mieter (inaktive)
      const ehemalige = allMieter
        .filter((m: Mieter) => !m.isAktiv)
        .map((m: Mieter) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          telefon: m.telefon,
          letzteWohnungId: m.wohnungId,
          letztesAuszugsDatum: m.mieteBis || m.einzugsDatum,
        }));
      setEhemaligeMieter(ehemalige);

      // Wähle erstes Objekt aus wenn noch keins gewählt oder das gewählte nicht existiert
      if (
        !selectedObjektId ||
        !objekteData.find((o: any) => o.id === selectedObjektId)
      ) {
        setSelectedObjektId(objekteData[0]?.id || null);
      }
    } catch (error) {
      console.error("Error loading data from Supabase:", error);
    } finally {
      setLoading(false);
    }
  };

  // Lade Daten wenn User sich einloggt
  useEffect(() => {
    refreshData();
  }, [user?.id]);

  const addObjekt = async (objekt: Omit<Objekt, "id">) => {
    // Demo-Modus oder kein User: Lokales Erstellen
    if (!user || isAdmin) {
      const newObjekt: Objekt = {
        ...objekt,
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };
      setObjekte((prev) => [...prev, newObjekt]);
      setSelectedObjektId(newObjekt.id);
      return;
    }

    try {
      const newObjekt = await createObjekt({
        user_id: user.id,
        name: objekt.name,
        adresse: objekt.adresse,
        typ: objekt.typ,
        einheiten: objekt.einheiten,
        status: objekt.status,
        eigentuemer: objekt.eigentuemer,
        bankverbindung: objekt.bankverbindung,
        objektdaten: objekt.objektdaten,
        notizen: objekt.notizen,
      });

      if (!newObjekt || !newObjekt.id) {
        throw new Error(
          "Failed to create objekt: No data returned from database",
        );
      }

      const mapped = mapDBToObjekt(newObjekt);
      setObjekte((prev) => [...prev, mapped]);
      setSelectedObjektId(mapped.id);
    } catch (error) {
      console.error("Error adding objekt:", error);
      throw error;
    }
  };

  const updateObjekt = async (id: string, updates: Partial<Objekt>) => {
    // Demo-Modus oder kein User: Lokales Update
    if (!user || isAdmin) {
      setObjekte((prev) =>
        prev.map((obj: Objekt) =>
          obj.id === id ? { ...obj, ...updates } : obj,
        ),
      );
      return;
    }

    try {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.adresse !== undefined) dbUpdates.adresse = updates.adresse;
      if (updates.typ !== undefined) dbUpdates.typ = updates.typ;
      if (updates.einheiten !== undefined)
        dbUpdates.einheiten = updates.einheiten;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.eigentuemer !== undefined)
        dbUpdates.eigentuemer = updates.eigentuemer;
      if (updates.bankverbindung !== undefined)
        dbUpdates.bankverbindung = updates.bankverbindung;
      if (updates.objektdaten !== undefined)
        dbUpdates.objektdaten = updates.objektdaten;
      if (updates.notizen !== undefined) dbUpdates.notizen = updates.notizen;

      const updated = await updateObjektDB(id, dbUpdates);
      setObjekte((prev) =>
        prev.map((obj: Objekt) =>
          obj.id === id ? mapDBToObjekt(updated) : obj,
        ),
      );
    } catch (error) {
      console.error("Error updating objekt:", error);
      throw error;
    }
  };

  const deleteObjekt = async (id: string) => {
    try {
      await deleteObjektDB(id);
      setObjekte((prev) => prev.filter((obj: Objekt) => obj.id !== id));
      // DB CASCADE löscht automatisch Wohnungen und Mieter
      setWohnungen((prev) => prev.filter((w: Wohnung) => w.objektId !== id));
      setMieter((prev) =>
        prev.filter(
          (m: Mieter) =>
            !wohnungen.find(
              (w: Wohnung) => w.id === m.wohnungId && w.objektId === id,
            ),
        ),
      );
    } catch (error) {
      console.error("Error deleting objekt:", error);
      throw error;
    }
  };

  const addWohnung = async (wohnung: Omit<Wohnung, "id">) => {
    // Demo-Modus oder kein User: Lokales Erstellen
    if (!user || isAdmin) {
      const newWohnung: Wohnung = {
        ...wohnung,
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };
      setWohnungen((prev) => [...prev, newWohnung]);
      return;
    }

    try {
      const newWohnung = await createWohnung({
        user_id: user.id,
        objekt_id: wohnung.objektId,
        bezeichnung: wohnung.bezeichnung,
        etage: wohnung.etage,
        flaeche: wohnung.flaeche,
        zimmer: wohnung.zimmer,
        miete: wohnung.miete,
        nebenkosten: wohnung.nebenkosten,
        status: wohnung.status,
      });

      setWohnungen((prev) => [...prev, mapDBToWohnung(newWohnung)]);
    } catch (error) {
      console.error("Error adding wohnung:", error);
      throw error;
    }
  };

  const updateWohnung = async (id: string, updates: Partial<Wohnung>) => {
    // Demo-Modus oder kein User: Lokales Update
    if (!user || isAdmin) {
      setWohnungen((prev) =>
        prev.map((w: Wohnung) => (w.id === id ? { ...w, ...updates } : w)),
      );
      return;
    }

    try {
      const dbUpdates: any = {};
      if (updates.bezeichnung !== undefined)
        dbUpdates.bezeichnung = updates.bezeichnung;
      if (updates.etage !== undefined) dbUpdates.etage = updates.etage;
      if (updates.flaeche !== undefined) dbUpdates.flaeche = updates.flaeche;
      if (updates.zimmer !== undefined) dbUpdates.zimmer = updates.zimmer;
      if (updates.miete !== undefined) dbUpdates.miete = updates.miete;
      if (updates.nebenkosten !== undefined)
        dbUpdates.nebenkosten = updates.nebenkosten;
      if (updates.status !== undefined) dbUpdates.status = updates.status;

      const updated = await updateWohnungDB(id, dbUpdates);
      setWohnungen((prev) =>
        prev.map((w: Wohnung) => (w.id === id ? mapDBToWohnung(updated) : w)),
      );
    } catch (error) {
      console.error("Error updating wohnung:", error);
      throw error;
    }
  };

  const deleteWohnung = async (id: string) => {
    try {
      await deleteWohnungDB(id);
      setWohnungen((prev) => prev.filter((w: Wohnung) => w.id !== id));
      // DB CASCADE löscht automatisch Mieter
      setMieter((prev) => prev.filter((m: Mieter) => m.wohnungId !== id));
    } catch (error) {
      console.error("Error deleting wohnung:", error);
      throw error;
    }
  };

  const addMieter = async (newMieter: Omit<Mieter, "id">) => {
    // Demo-Modus oder kein User: Lokales Erstellen
    if (!user || isAdmin) {
      const mieter: Mieter = {
        ...newMieter,
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };
      setMieter((prev) => [...prev, mieter]);
      return;
    }

    try {
      const created = await createMieter({
        user_id: user.id,
        wohnung_id: newMieter.wohnungId,
        name: newMieter.name,
        email: newMieter.email,
        telefon: newMieter.telefon,
        einzugs_datum: newMieter.einzugsDatum,
        miete_bis: newMieter.mieteBis,
        kaltmiete: newMieter.kaltmiete,
        nebenkosten: newMieter.nebenkosten,
        kaution: newMieter.kaution,
        is_kurzzeitvermietung: newMieter.isKurzzeitvermietung,
        kurzzeit_bis: newMieter.kurzzeitBis,
        is_aktiv: newMieter.isAktiv,
        prozentanteil: newMieter.prozentanteil,
      });

      setMieter((prev) => [...prev, mapDBToMieter(created)]);
    } catch (error) {
      console.error("Error adding mieter:", error);
      throw error;
    }
  };

  const updateMieter = async (id: string, updates: Partial<Mieter>) => {
    // Demo-Modus oder kein User: Lokales Update
    if (!user || isAdmin) {
      const updatedMieter = mieter.find((m) => m.id === id);
      if (!updatedMieter) return;

      const mapped = { ...updatedMieter, ...updates };

      if (mapped.isAktiv) {
        setMieter((prev) =>
          prev.map((m: Mieter) => (m.id === id ? mapped : m)),
        );
      } else {
        // Wenn inaktiv, von aktiven zu ehemaligen verschieben
        setMieter((prev) => prev.filter((m: Mieter) => m.id !== id));
        setEhemaligeMieter((prev) => [
          ...prev,
          {
            id: mapped.id,
            name: mapped.name,
            email: mapped.email,
            telefon: mapped.telefon,
            letzteWohnungId: mapped.wohnungId,
            letztesAuszugsDatum: mapped.mieteBis || mapped.einzugsDatum,
          },
        ]);
      }
      return;
    }

    try {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.telefon !== undefined) dbUpdates.telefon = updates.telefon;
      if (updates.einzugsDatum !== undefined)
        dbUpdates.einzugs_datum = updates.einzugsDatum;
      if (updates.mieteBis !== undefined)
        dbUpdates.miete_bis = updates.mieteBis;
      if (updates.kaltmiete !== undefined)
        dbUpdates.kaltmiete = updates.kaltmiete;
      if (updates.nebenkosten !== undefined)
        dbUpdates.nebenkosten = updates.nebenkosten;
      if (updates.kaution !== undefined) dbUpdates.kaution = updates.kaution;
      if (updates.isKurzzeitvermietung !== undefined)
        dbUpdates.is_kurzzeitvermietung = updates.isKurzzeitvermietung;
      if (updates.kurzzeitBis !== undefined)
        dbUpdates.kurzzeit_bis = updates.kurzzeitBis;
      if (updates.isAktiv !== undefined) dbUpdates.is_aktiv = updates.isAktiv;
      if (updates.prozentanteil !== undefined)
        dbUpdates.prozentanteil = updates.prozentanteil;

      const updated = await updateMieterDB(id, dbUpdates);
      const mapped = mapDBToMieter(updated);

      if (mapped.isAktiv) {
        setMieter((prev) =>
          prev.map((m: Mieter) => (m.id === id ? mapped : m)),
        );
      } else {
        // Wenn inaktiv, von aktiven zu ehemaligen verschieben
        setMieter((prev) => prev.filter((m: Mieter) => m.id !== id));
        setEhemaligeMieter((prev) => [
          ...prev,
          {
            id: mapped.id,
            name: mapped.name,
            email: mapped.email,
            telefon: mapped.telefon,
            letzteWohnungId: mapped.wohnungId,
            letztesAuszugsDatum: mapped.mieteBis || mapped.einzugsDatum,
          },
        ]);
      }
    } catch (error) {
      console.error("Error updating mieter:", error);
      throw error;
    }
  };

  const deleteMieter = async (id: string) => {
    try {
      await deleteMieterDB(id);
      setMieter((prev) => prev.filter((m: Mieter) => m.id !== id));
    } catch (error) {
      console.error("Error deleting mieter:", error);
      throw error;
    }
  };

  const archiviereMieter = async (id: string) => {
    const mieterToArchive = mieter.find((m: Mieter) => m.id === id);
    if (!mieterToArchive) return;

    try {
      await updateMieter(id, {
        isAktiv: false,
        mieteBis:
          mieterToArchive.mieteBis || new Date().toISOString().split("T")[0],
      });
    } catch (error) {
      console.error("Error archiving mieter:", error);
      throw error;
    }
  };

  const reaktiviereMieter = async (
    ehemaligerMieterId: string,
    wohnungId: string,
  ) => {
    const ehemaligerMieterData = ehemaligeMieter.find(
      (m: EhemalierMieter) => m.id === ehemaligerMieterId,
    );
    if (!ehemaligerMieterData || !user) return;

    try {
      await addMieter({
        wohnungId,
        name: ehemaligerMieterData.name,
        email: ehemaligerMieterData.email,
        telefon: ehemaligerMieterData.telefon,
        einzugsDatum: new Date().toISOString().split("T")[0],
        mieteBis: null,
        kaltmiete: 0,
        nebenkosten: 0,
        kaution: 0,
        isKurzzeitvermietung: false,
        isAktiv: true,
        prozentanteil: 0,
      });
    } catch (error) {
      console.error("Error reactivating mieter:", error);
      throw error;
    }
  };

  // ============================================
  // EXPENSES CRUD
  // ============================================

  const addExpense = async (newExpense: Omit<Expense, "id">) => {
    if (!user || isAdmin) {
      // Demo/Admin: lokaler State
      const expense: Expense = {
        ...newExpense,
        id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };
      setExpenses((prev) => [expense, ...prev]);
      return;
    }

    try {
      const created = await createExpense({
        user_id: user.id,
        objekt_id: newExpense.objektId,
        kostenart: newExpense.kostenart,
        betrag: newExpense.betrag,
        zeitraum_von: newExpense.zeitraumVon,
        zeitraum_bis: newExpense.zeitraumBis,
        verteilerschluessel: newExpense.verteilerschluessel,
        rechnung_id: newExpense.rechnungId ?? null,
        notiz: newExpense.notiz ?? null,
      });
      setExpenses((prev) => [mapDBToExpense(created), ...prev]);
    } catch (error) {
      console.error("Error adding expense:", error);
      throw error;
    }
  };

  const updateExpense = async (id: string, updates: Partial<Expense>) => {
    if (!user || isAdmin) {
      setExpenses((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...updates } : e)),
      );
      return;
    }

    try {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.kostenart !== undefined) dbUpdates.kostenart = updates.kostenart;
      if (updates.betrag !== undefined) dbUpdates.betrag = updates.betrag;
      if (updates.zeitraumVon !== undefined) dbUpdates.zeitraum_von = updates.zeitraumVon;
      if (updates.zeitraumBis !== undefined) dbUpdates.zeitraum_bis = updates.zeitraumBis;
      if (updates.verteilerschluessel !== undefined)
        dbUpdates.verteilerschluessel = updates.verteilerschluessel;
      if (updates.notiz !== undefined) dbUpdates.notiz = updates.notiz;

      const updated = await updateExpenseDB(id, dbUpdates);
      setExpenses((prev) =>
        prev.map((e) => (e.id === id ? mapDBToExpense(updated) : e)),
      );
    } catch (error) {
      console.error("Error updating expense:", error);
      throw error;
    }
  };

  const deleteExpense = async (id: string) => {
    if (!user || isAdmin) {
      setExpenses((prev) => prev.filter((e) => e.id !== id));
      return;
    }

    try {
      await deleteExpenseDB(id);
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    } catch (error) {
      console.error("Error deleting expense:", error);
      throw error;
    }
  };

  // Berechne einheiten dynamisch aus wohnungen – nie mehr out of sync mit DB
  const objekteMitEinheiten = useMemo(
    () =>
      objekte.map((obj) => ({
        ...obj,
        einheiten: wohnungen.filter((w) => w.objektId === obj.id).length,
      })),
    [objekte, wohnungen],
  );

  return (
    <AppDataContext.Provider
      value={{
        expenses,
        addExpense,
        updateExpense,
        deleteExpense,
        objekte: objekteMitEinheiten,
        wohnungen,
        mieter,
        ehemaligeMieter,
        selectedObjektId,
        loading,
        addObjekt,
        updateObjekt,
        deleteObjekt,
        addWohnung,
        updateWohnung,
        deleteWohnung,
        addMieter,
        updateMieter,
        deleteMieter,
        archiviereMieter,
        reaktiviereMieter,
        setSelectedObjektId,
        refreshData,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error("useAppData must be used within an AppDataProvider");
  }
  return context;
}
