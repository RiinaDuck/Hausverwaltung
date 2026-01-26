"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
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

export interface EhemalierMieter {
  id: string;
  name: string;
  email: string;
  telefon: string;
  letzteWohnungId: string;
  letztesAuszugsDatum: string;
}

interface AppDataContextType {
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
    },
    notizen: "Demo-Objekt",
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

      setObjekte(objekteData.map(mapDBToObjekt));
      setWohnungen(wohnungenData.map(mapDBToWohnung));

      const allMieter = mieterData.map(mapDBToMieter);
      setMieter(allMieter.filter((m) => m.isAktiv));

      // Ehemalige Mieter (inaktive)
      const ehemalige = allMieter
        .filter((m) => !m.isAktiv)
        .map((m) => ({
          id: m.id,
          name: m.name,
          email: m.email,
          telefon: m.telefon,
          letzteWohnungId: m.wohnungId,
          letztesAuszugsDatum: m.mieteBis || m.einzugsDatum,
        }));
      setEhemaligeMieter(ehemalige);

      // Wähle erstes Objekt aus wenn noch keins gewählt
      if (!selectedObjektId && objekteData.length > 0) {
        setSelectedObjektId(objekteData[0].id);
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
    if (!user) return;

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

      const mapped = mapDBToObjekt(newObjekt);
      setObjekte((prev) => [...prev, mapped]);
      setSelectedObjektId(mapped.id);
    } catch (error) {
      console.error("Error adding objekt:", error);
      throw error;
    }
  };

  const updateObjekt = async (id: string, updates: Partial<Objekt>) => {
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
        prev.map((obj) => (obj.id === id ? mapDBToObjekt(updated) : obj)),
      );
    } catch (error) {
      console.error("Error updating objekt:", error);
      throw error;
    }
  };

  const deleteObjekt = async (id: string) => {
    try {
      await deleteObjektDB(id);
      setObjekte((prev) => prev.filter((obj) => obj.id !== id));
      // DB CASCADE löscht automatisch Wohnungen und Mieter
      setWohnungen((prev) => prev.filter((w) => w.objektId !== id));
      setMieter((prev) =>
        prev.filter(
          (m) =>
            !wohnungen.find((w) => w.id === m.wohnungId && w.objektId === id),
        ),
      );
    } catch (error) {
      console.error("Error deleting objekt:", error);
      throw error;
    }
  };

  const addWohnung = async (wohnung: Omit<Wohnung, "id">) => {
    if (!user) return;

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
        prev.map((w) => (w.id === id ? mapDBToWohnung(updated) : w)),
      );
    } catch (error) {
      console.error("Error updating wohnung:", error);
      throw error;
    }
  };

  const deleteWohnung = async (id: string) => {
    try {
      await deleteWohnungDB(id);
      setWohnungen((prev) => prev.filter((w) => w.id !== id));
      // DB CASCADE löscht automatisch Mieter
      setMieter((prev) => prev.filter((m) => m.wohnungId !== id));
    } catch (error) {
      console.error("Error deleting wohnung:", error);
      throw error;
    }
  };

  const addMieter = async (newMieter: Omit<Mieter, "id">) => {
    if (!user) return;

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
        setMieter((prev) => prev.map((m) => (m.id === id ? mapped : m)));
      } else {
        // Wenn inaktiv, von aktiven zu ehemaligen verschieben
        setMieter((prev) => prev.filter((m) => m.id !== id));
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
      setMieter((prev) => prev.filter((m) => m.id !== id));
    } catch (error) {
      console.error("Error deleting mieter:", error);
      throw error;
    }
  };

  const archiviereMieter = async (id: string) => {
    const mieterToArchive = mieter.find((m) => m.id === id);
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
      (m) => m.id === ehemaligerMieterId,
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

  return (
    <AppDataContext.Provider
      value={{
        objekte,
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
