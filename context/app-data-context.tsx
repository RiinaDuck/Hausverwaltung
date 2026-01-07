"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

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
}

interface AppDataContextType {
  objekte: Objekt[];
  wohnungen: Wohnung[];
  mieter: Mieter[];
  selectedObjektId: string | null;
  addObjekt: (objekt: Omit<Objekt, "id">) => void;
  updateObjekt: (id: string, objekt: Partial<Objekt>) => void;
  deleteObjekt: (id: string) => void;
  addWohnung: (wohnung: Omit<Wohnung, "id">) => void;
  updateWohnung: (id: string, wohnung: Partial<Wohnung>) => void;
  deleteWohnung: (id: string) => void;
  addMieter: (mieter: Omit<Mieter, "id">) => void;
  updateMieter: (id: string, mieter: Partial<Mieter>) => void;
  deleteMieter: (id: string) => void;
  setSelectedObjektId: (id: string | null) => void;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

// Initiale Demo-Daten
const initialObjekte: Objekt[] = [
  {
    id: "1",
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
    notizen:
      "Hausmeisterservice: Firma Schmidt, Tel. 030 9876543\nSchlüssel: 3x Haupteingang, 1x Keller\n\nNächste Wartung Heizung: März 2026",
  },
  {
    id: "2",
    name: "Gartenstraße 12",
    adresse: "Gartenstraße 12, 10115 Berlin",
    typ: "Miete",
    einheiten: 4,
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
      strasse: "Gartenstraße 12",
      plz: "10115",
      ort: "Berlin",
      baujahr: "1992",
      sanierungsjahr: "2020",
      gesamtwohnflaeche: "280,00",
      gesamtnutzflaeche: "40,00",
      anzahlEinheiten: "4",
      garagen: "2",
    },
    notizen: "",
  },
  {
    id: "3",
    name: "WEG Parkresidenz",
    adresse: "Parkalle 22, 10117 Berlin",
    typ: "WEG",
    einheiten: 12,
    status: "aktiv",
    eigentuemer: {
      name: "Max Mustermann",
      adresse: "Musterstraße 123, 12345 Berlin",
      telefon: "030 12345678",
      email: "max@mustermann.de",
      mobil: "0170 1234567",
    },
    bankverbindung: {
      kontoinhaber: "WEG Parkresidenz",
      bank: "Deutsche Bank",
      iban: "DE89 3704 0044 0532 0130 01",
      bic: "DEUTDEFF",
    },
    objektdaten: {
      strasse: "Parkalle 22",
      plz: "10117",
      ort: "Berlin",
      baujahr: "2005",
      sanierungsjahr: "",
      gesamtwohnflaeche: "980,00",
      gesamtnutzflaeche: "120,00",
      anzahlEinheiten: "12",
      garagen: "12",
    },
    notizen: "WEG-Verwaltung seit 2020",
  },
];

const initialWohnungen: Wohnung[] = [
  {
    id: "w1",
    objektId: "1",
    bezeichnung: "EG links",
    etage: "EG",
    flaeche: 65,
    zimmer: 2,
    miete: 650,
    nebenkosten: 150,
    status: "vermietet",
  },
  {
    id: "w2",
    objektId: "1",
    bezeichnung: "EG rechts",
    etage: "EG",
    flaeche: 70,
    zimmer: 3,
    miete: 700,
    nebenkosten: 160,
    status: "vermietet",
  },
  {
    id: "w3",
    objektId: "1",
    bezeichnung: "1.OG links",
    etage: "1.OG",
    flaeche: 65,
    zimmer: 2,
    miete: 680,
    nebenkosten: 150,
    status: "vermietet",
  },
  {
    id: "w4",
    objektId: "1",
    bezeichnung: "1.OG rechts",
    etage: "1.OG",
    flaeche: 70,
    zimmer: 3,
    miete: 720,
    nebenkosten: 160,
    status: "leer",
  },
  {
    id: "w5",
    objektId: "2",
    bezeichnung: "EG",
    etage: "EG",
    flaeche: 80,
    zimmer: 3,
    miete: 850,
    nebenkosten: 180,
    status: "vermietet",
  },
  {
    id: "w6",
    objektId: "2",
    bezeichnung: "1.OG",
    etage: "1.OG",
    flaeche: 80,
    zimmer: 3,
    miete: 880,
    nebenkosten: 180,
    status: "vermietet",
  },
];

const initialMieter: Mieter[] = [
  {
    id: "m1",
    wohnungId: "w1",
    name: "Schmidt, Anna",
    email: "anna.schmidt@email.de",
    telefon: "030 1111111",
    einzugsDatum: "2020-01-01",
    mieteBis: null,
    kaltmiete: 650,
    nebenkosten: 150,
    kaution: 1950,
  },
  {
    id: "m2",
    wohnungId: "w2",
    name: "Müller, Hans",
    email: "hans.mueller@email.de",
    telefon: "030 2222222",
    einzugsDatum: "2019-06-01",
    mieteBis: null,
    kaltmiete: 700,
    nebenkosten: 160,
    kaution: 2100,
  },
  {
    id: "m3",
    wohnungId: "w3",
    name: "Weber, Peter",
    email: "peter.weber@email.de",
    telefon: "030 3333333",
    einzugsDatum: "2021-03-01",
    mieteBis: null,
    kaltmiete: 680,
    nebenkosten: 150,
    kaution: 2040,
  },
  {
    id: "m4",
    wohnungId: "w5",
    name: "Fischer, Maria",
    email: "maria.fischer@email.de",
    telefon: "030 4444444",
    einzugsDatum: "2022-01-01",
    mieteBis: null,
    kaltmiete: 850,
    nebenkosten: 180,
    kaution: 2550,
  },
  {
    id: "m5",
    wohnungId: "w6",
    name: "Bauer, Thomas",
    email: "thomas.bauer@email.de",
    telefon: "030 5555555",
    einzugsDatum: "2023-07-01",
    mieteBis: null,
    kaltmiete: 880,
    nebenkosten: 180,
    kaution: 2640,
  },
];

export function AppDataProvider({ children }: { children: ReactNode }) {
  // LocalStorage Keys
  const STORAGE_KEYS = {
    objekte: "hausverwaltung_objekte",
    wohnungen: "hausverwaltung_wohnungen",
    mieter: "hausverwaltung_mieter",
    selectedObjektId: "hausverwaltung_selectedObjektId",
  };

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

  // Initialize state with localStorage or fallback to initial data
  const [objekte, setObjekte] = useState<Objekt[]>(() =>
    loadFromStorage(STORAGE_KEYS.objekte, initialObjekte)
  );
  const [wohnungen, setWohnungen] = useState<Wohnung[]>(() =>
    loadFromStorage(STORAGE_KEYS.wohnungen, initialWohnungen)
  );
  const [mieter, setMieter] = useState<Mieter[]>(() =>
    loadFromStorage(STORAGE_KEYS.mieter, initialMieter)
  );
  const [selectedObjektId, setSelectedObjektId] = useState<string | null>(() =>
    loadFromStorage(STORAGE_KEYS.selectedObjektId, "1")
  );

  // Auto-save to localStorage whenever data changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEYS.objekte, JSON.stringify(objekte));
    } catch (error) {
      console.error("Error saving objekte to localStorage:", error);
    }
  }, [objekte]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEYS.wohnungen, JSON.stringify(wohnungen));
    } catch (error) {
      console.error("Error saving wohnungen to localStorage:", error);
    }
  }, [wohnungen]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEYS.mieter, JSON.stringify(mieter));
    } catch (error) {
      console.error("Error saving mieter to localStorage:", error);
    }
  }, [mieter]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        STORAGE_KEYS.selectedObjektId,
        JSON.stringify(selectedObjektId)
      );
    } catch (error) {
      console.error("Error saving selectedObjektId to localStorage:", error);
    }
  }, [selectedObjektId]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addObjekt = (objekt: Omit<Objekt, "id">) => {
    const newId = generateId();
    const newObjekt = { ...objekt, id: newId };
    setObjekte((prev) => [...prev, newObjekt]);
    // Automatisch das neue Objekt auswählen
    setSelectedObjektId(newId);
  };

  const updateObjekt = (id: string, updates: Partial<Objekt>) => {
    setObjekte((prev) =>
      prev.map((obj) => (obj.id === id ? { ...obj, ...updates } : obj))
    );
  };

  const deleteObjekt = (id: string) => {
    setObjekte((prev) => prev.filter((obj) => obj.id !== id));
    // Auch zugehörige Wohnungen und Mieter löschen
    setWohnungen((prev) => prev.filter((w) => w.objektId !== id));
  };

  const addWohnung = (wohnung: Omit<Wohnung, "id">) => {
    const newWohnung = { ...wohnung, id: generateId() };
    setWohnungen((prev) => [...prev, newWohnung]);
  };

  const updateWohnung = (id: string, updates: Partial<Wohnung>) => {
    setWohnungen((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...updates } : w))
    );
  };

  const deleteWohnung = (id: string) => {
    setWohnungen((prev) => prev.filter((w) => w.id !== id));
    // Auch zugehörige Mieter löschen
    setMieter((prev) => prev.filter((m) => m.wohnungId !== id));
  };

  const addMieter = (newMieter: Omit<Mieter, "id">) => {
    const mieterWithId = { ...newMieter, id: generateId() };
    setMieter((prev) => [...prev, mieterWithId]);
  };

  const updateMieter = (id: string, updates: Partial<Mieter>) => {
    setMieter((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
  };

  const deleteMieter = (id: string) => {
    setMieter((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <AppDataContext.Provider
      value={{
        objekte,
        wohnungen,
        mieter,
        selectedObjektId,
        addObjekt,
        updateObjekt,
        deleteObjekt,
        addWohnung,
        updateWohnung,
        deleteWohnung,
        addMieter,
        updateMieter,
        deleteMieter,
        setSelectedObjektId,
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
