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
  getExpenses,
  createExpense as createExpenseDB,
  updateExpense as updateExpenseDB,
  deleteExpense as deleteExpenseDB,
  getZaehler,
  createZaehler as createZaehlerDB,
  updateZaehler as updateZaehlerDB,
  deleteZaehler as deleteZaehlerDB,
  getRauchmelder,
  createRauchmelder as createRauchmelderDB,
  updateRauchmelder as updateRauchmelderDB,
  deleteRauchmelder as deleteRauchmelderDB,
  getRechnungen,
  createRechnung as createRechnungDB,
  updateRechnung as updateRechnungDB,
  deleteRechnung as deleteRechnungDB,
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
    anrede?: string;
    vorname?: string;
    nachname?: string;
    name: string;
    adresse: string;
    plz?: string;
    ort?: string;
    telefon: string;
    email: string;
    mobil: string;
    fax?: string;
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
    gesamtwohnflaeche2?: string;
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
    grundbuchbezeichnung?: string;
    amtsgericht?: string;
    blatt?: string;
    lastenAbt2?: string;
    lastenAbt3?: string;
    // Steuer
    finanzamt?: string;
    ustIdNr?: string;
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
  anrede: string;
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

export interface Zaehler {
  id: string;
  wohnungId: string;
  wohnungNr: string;
  geschoss: string;
  montageort: string;
  geraeteart: string;
  geraetnummer: string;
  geeichtBis: string;
  hersteller?: string;
  typ?: string;
}

export interface Rauchmelder {
  id: string;
  wohnungId: string;
  wohnungNr: string;
  geschoss: string;
  montageort: string;
  geraeteart: string;
  geraetnummer: string;
  lebensdauerBis: string;
  hersteller?: string;
  typ?: string;
}

export interface RechnungsPosition {
  id: string;
  beschreibung: string;
  menge: number;
  einzelpreis: number;
}

export interface Rechnung {
  id: string;
  userId: string;
  nummer: string;
  datum: string;
  empfaengerName: string;
  empfaengerAdresse: string;
  positionen: RechnungsPosition[];
  bemerkung: string;
  status: "offen" | "bezahlt" | "storniert";
  kostenart?: string;
  faelligkeitsdatum?: string;
  betragNetto?: number;
  betragBrutto?: number;
  mwstProzent?: number;
  notizen?: string;
  stornoVon?: string;
  createdAt: string;
  updatedAt: string;
}

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
  userId: string;
  objektId: string;
  kostenart: string;
  betrag: number;
  zeitraumVon: string;  // ISO-Date
  zeitraumBis: string;  // ISO-Date
  verteilerschluessel: Verteilerschluessel;
  rechnungId?: string | null;
  notiz?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ZahlungEintrag {
  id: string;
  mieterId: string;
  monat: string;
  faelligkeitsdatum: string;
  sollBetrag: number;
  istBetrag: number;
  buchungsdatum: string;
  wertstellungsdatum: string;
  verwendungszweck: string;
  ibanAbsender: string;
  auftraggeber: string;
  referenz: string;
  status: "bezahlt" | "ausstehend" | "offen" | "ueberfaellig";
}

interface AppDataContextType {
  objekte: Objekt[];
  wohnungen: Wohnung[];
  mieter: Mieter[];
  ehemaligeMieter: EhemalierMieter[];
  expenses: Expense[];
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
  addExpense: (expense: Omit<Expense, "id" | "userId" | "createdAt" | "updatedAt">) => Promise<void>;
  updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  zaehler: Zaehler[];
  rauchmelder: Rauchmelder[];
  rechnungen: Rechnung[];
  addZaehler: (z: Omit<Zaehler, "id">) => Promise<void>;
  updateZaehler: (id: string, z: Partial<Zaehler>) => Promise<void>;
  deleteZaehler: (id: string) => Promise<void>;
  addRauchmelder: (r: Omit<Rauchmelder, "id">) => Promise<void>;
  updateRauchmelder: (id: string, r: Partial<Rauchmelder>) => Promise<void>;
  deleteRauchmelder: (id: string) => Promise<void>;
  addRechnung: (r: Omit<Rechnung, "id" | "userId" | "createdAt" | "updatedAt">) => Promise<void>;
  updateRechnung: (id: string, r: Partial<Rechnung>) => Promise<void>;
  deleteRechnung: (id: string) => Promise<void>;
  zahlungen: ZahlungEintrag[];
  setZahlungen: React.Dispatch<React.SetStateAction<ZahlungEintrag[]>>;
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
      anrede: "Herr",
      vorname: "Max",
      nachname: "Mustermann",
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
    anrede: "frau",
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

const DEMO_EXPENSES: Expense[] = [
  {
    id: "demo-e1",
    userId: "demo",
    objektId: "demo-1",
    kostenart: "Gebäudeversicherung",
    betrag: 1250.0,
    zeitraumVon: "2025-01-01",
    zeitraumBis: "2025-12-31",
    verteilerschluessel: "wohnflaeche",
    notiz: "Allianz Versicherung, Rechnung vom 02.01.2025",
    createdAt: "2025-01-05T10:00:00Z",
    updatedAt: "2025-01-05T10:00:00Z",
  },
  {
    id: "demo-e2",
    userId: "demo",
    objektId: "demo-1",
    kostenart: "Grundsteuer",
    betrag: 890.0,
    zeitraumVon: "2025-01-01",
    zeitraumBis: "2025-12-31",
    verteilerschluessel: "mea",
    notiz: "Bescheid Finanzamt Berlin Mitte 2025",
    createdAt: "2025-01-10T10:00:00Z",
    updatedAt: "2025-01-10T10:00:00Z",
  },
  {
    id: "demo-e3",
    userId: "demo",
    objektId: "demo-1",
    kostenart: "Müllabfuhr",
    betrag: 780.0,
    zeitraumVon: "2025-01-01",
    zeitraumBis: "2025-12-31",
    verteilerschluessel: "personen",
    notiz: "",
    createdAt: "2025-01-15T10:00:00Z",
    updatedAt: "2025-01-15T10:00:00Z",
  },
  {
    id: "demo-e4",
    userId: "demo",
    objektId: "demo-1",
    kostenart: "Allgemeinstrom / Beleuchtung",
    betrag: 420.0,
    zeitraumVon: "2025-01-01",
    zeitraumBis: "2025-12-31",
    verteilerschluessel: "einheiten",
    notiz: "",
    createdAt: "2025-01-20T10:00:00Z",
    updatedAt: "2025-01-20T10:00:00Z",
  },
];

const DEMO_ZAEHLER: Zaehler[] = [
  { id: "demo-z1", wohnungId: "demo-w1", wohnungNr: "demo-w1", geschoss: "EG links", montageort: "Küche", geraeteart: "Kaltwasser", geraetnummer: "KW-2024-001", geeichtBis: "12/2030", hersteller: "Techem", typ: "Q water 5.5" },
  { id: "demo-z2", wohnungId: "demo-w1", wohnungNr: "demo-w1", geschoss: "EG links", montageort: "Bad", geraeteart: "Warmwasser", geraetnummer: "WW-2024-001", geeichtBis: "12/2030", hersteller: "Techem", typ: "Q water 5.5" },
  { id: "demo-z3", wohnungId: "demo-w2", wohnungNr: "demo-w2", geschoss: "EG rechts", montageort: "Küche", geraeteart: "Kaltwasser", geraetnummer: "KW-2024-002", geeichtBis: "12/2030", hersteller: "Ista", typ: "domaqua m" },
];

const DEMO_RAUCHMELDER: Rauchmelder[] = [
  { id: "demo-r1", wohnungId: "demo-w1", wohnungNr: "demo-w1", geschoss: "EG links", montageort: "Schlafzimmer", geraeteart: "Rauchmelder", geraetnummer: "RM-001-A", lebensdauerBis: "03/2034", hersteller: "Hekatron", typ: "Genius Plus X" },
  { id: "demo-r2", wohnungId: "demo-w1", wohnungNr: "demo-w1", geschoss: "EG links", montageort: "Flur", geraeteart: "Rauchmelder", geraetnummer: "RM-001-B", lebensdauerBis: "03/2034", hersteller: "Hekatron", typ: "Genius Plus X" },
  { id: "demo-r3", wohnungId: "demo-w2", wohnungNr: "demo-w2", geschoss: "EG rechts", montageort: "Schlafzimmer", geraeteart: "Rauchmelder", geraetnummer: "RM-002-A", lebensdauerBis: "06/2033", hersteller: "Ei Electronics", typ: "Ei650" },
];

const DEMO_RECHNUNGEN: Rechnung[] = [
  {
    id: "demo-re1", userId: "demo", nummer: "2025-001", datum: "2025-01-15",
    empfaengerName: "Anna Schmidt", empfaengerAdresse: "Berliner Straße 42, EG links\n10115 Berlin",
    positionen: [
      { id: "1", beschreibung: "Nebenkostennachzahlung 2024", menge: 1, einzelpreis: 245.50 },
      { id: "2", beschreibung: "Verwaltungsgebühr", menge: 1, einzelpreis: 25.00 },
    ],
    bemerkung: "Bitte innerhalb von 14 Tagen überweisen.", status: "bezahlt",
    createdAt: "2025-01-15T10:00:00Z", updatedAt: "2025-01-15T10:00:00Z",
  },
  {
    id: "demo-re2", userId: "demo", nummer: "2025-002", datum: "2025-02-20",
    empfaengerName: "Mieter EG rechts", empfaengerAdresse: "Berliner Straße 42, EG rechts\n10115 Berlin",
    positionen: [
      { id: "1", beschreibung: "Schlüsselersatz", menge: 2, einzelpreis: 35.00 },
    ],
    bemerkung: "", status: "offen",
    createdAt: "2025-02-20T10:00:00Z", updatedAt: "2025-02-20T10:00:00Z",
  },
];

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user, isAdmin } = useAuth();
  const [objekte, setObjekte] = useState<Objekt[]>([]);
  const [wohnungen, setWohnungen] = useState<Wohnung[]>([]);
  const [mieter, setMieter] = useState<Mieter[]>([]);
  const [ehemaligeMieter, setEhemaligeMieter] = useState<EhemalierMieter[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [zaehler, setZaehler] = useState<Zaehler[]>([]);
  const [rauchmelder, setRauchmelder] = useState<Rauchmelder[]>([]);
  const [rechnungen, setRechnungen] = useState<Rechnung[]>([]);
  const [zahlungenState, setZahlungenState] = useState<ZahlungEintrag[]>([]);
  const [selectedObjektId, setSelectedObjektIdState] = useState<string | null>(() => {
    // Beim ersten Render: gespeichertes Objekt aus localStorage laden
    if (typeof window !== "undefined") {
      return localStorage.getItem("selectedObjektId") ?? null;
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  // Wrapper: setzt State UND persistiert in localStorage
  const setSelectedObjektId = (id: string | null) => {
    setSelectedObjektIdState(id);
    if (typeof window !== "undefined") {
      if (id) {
        localStorage.setItem("selectedObjektId", id);
      } else {
        localStorage.removeItem("selectedObjektId");
      }
    }
  };

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
    anrede: dbMieter.anrede || 'familie',
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

  const mapDBToZaehler = (db: any): Zaehler => ({
    id: db.id,
    wohnungId: db.wohnung_id,
    wohnungNr: db.wohnungnr,
    geschoss: db.geschoss,
    montageort: db.montageort,
    geraeteart: db.geraeteart,
    geraetnummer: db.geraetnummer,
    geeichtBis: db.geeicht_bis,
    hersteller: db.hersteller ?? undefined,
    typ: db.typ ?? undefined,
  });

  const mapDBToRauchmelder = (db: any): Rauchmelder => ({
    id: db.id,
    wohnungId: db.wohnung_id,
    wohnungNr: db.wohnungnr,
    geschoss: db.geschoss,
    montageort: db.montageort,
    geraeteart: db.geraeteart,
    geraetnummer: db.geraetnummer,
    lebensdauerBis: db.lebensdauer_bis,
    hersteller: db.hersteller ?? undefined,
    typ: db.typ ?? undefined,
  });

  const mapDBToRechnung = (db: any): Rechnung => ({
    id: db.id,
    userId: db.user_id,
    nummer: db.nummer,
    datum: db.datum,
    empfaengerName: db.empfaenger_name,
    empfaengerAdresse: db.empfaenger_adresse,
    positionen: (db.positionen ?? []) as RechnungsPosition[],
    bemerkung: db.bemerkung ?? "",
    status: db.status,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  });

  const mapDBToExpense = (db: any): Expense => ({
    id: db.id,
    userId: db.user_id,
    objektId: db.objekt_id,
    kostenart: db.kostenart,
    betrag: Number(db.betrag),
    zeitraumVon: db.zeitraum_von,
    zeitraumBis: db.zeitraum_bis,
    verteilerschluessel: db.verteilerschluessel,
    rechnungId: db.rechnung_id ?? null,
    notiz: db.notiz ?? null,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
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
      setExpenses(DEMO_EXPENSES);
      setZaehler(DEMO_ZAEHLER);
      setRauchmelder(DEMO_RAUCHMELDER);
      setRechnungen(DEMO_RECHNUNGEN);
      setSelectedObjektId(DEMO_OBJEKTE[0]?.id || null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [objekteData, wohnungenData, mieterData, expensesData, zaehlerData, rauchmelderData, rechnungenData] = await Promise.all([
        getObjekte(user.id),
        getWohnungen(user.id),
        getMieter(user.id),
        getExpenses(user.id),
        getZaehler(user.id),
        getRauchmelder(user.id),
        getRechnungen(user.id),
      ]);

      setObjekte(objekteData.map(mapDBToObjekt));
      setWohnungen(wohnungenData.map(mapDBToWohnung));
      setExpenses(expensesData.map(mapDBToExpense));
      setZaehler(zaehlerData.map(mapDBToZaehler));
      setRauchmelder(rauchmelderData.map(mapDBToRauchmelder));
      setRechnungen(rechnungenData.map(mapDBToRechnung));

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

      // Zahlungen laden (für Dashboard-Anzeige beim initialen Laden)
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        if (supabase) {
          const { data: zahlungenData } = await supabase
            .from("zahlungen")
            .select("*")
            .order("buchungsdatum", { ascending: false });
          if (zahlungenData && zahlungenData.length > 0) {
            setZahlungenState(zahlungenData.map((row: any) => ({
              id: row.id,
              mieterId: row.mieter_id ?? "unbekannt",
              monat: row.monat ?? "",
              faelligkeitsdatum: row.monat ? `${row.monat}-01` : "",
              sollBetrag: row.soll_betrag ?? 0,
              istBetrag: row.betrag ?? 0,
              buchungsdatum: row.buchungsdatum ?? "",
              wertstellungsdatum: row.wertstellungsdatum ?? "",
              verwendungszweck: row.verwendungszweck ?? "",
              ibanAbsender: row.auftraggeber_iban ?? "",
              auftraggeber: row.auftraggeber_name ?? "",
              referenz: row.zahlungsreferenz ?? "",
              status: (row.status as ZahlungEintrag["status"]) ?? "offen",
            })));
          }
        }
      } catch {
        // Zahlungen konnten nicht geladen werden – ignorieren, Dashboard zeigt grün
      }

      // Wähle gespeichertes Objekt wenn vorhanden, sonst erstes
      const savedId = typeof window !== "undefined" ? localStorage.getItem("selectedObjektId") : null;
      const validId = savedId && objekteData.find((o: any) => o.id === savedId)
        ? savedId
        : objekteData[0]?.id || null;
      setSelectedObjektId(validId);
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
    if (id.startsWith("demo-")) return; // Demo-Daten bleiben immer erhalten
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
    if (id.startsWith("demo-")) return; // Demo-Daten bleiben immer erhalten
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
        anrede: newMieter.anrede,
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
    } catch (error: any) {
      console.error("Error adding mieter:", error?.message ?? JSON.stringify(error), error?.code, error?.details, error?.hint, error?.stack);
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
    if (id.startsWith("demo-")) return; // Demo-Daten bleiben immer erhalten
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
        anrede: "familie",
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

  // ---- Expenses CRUD ----

  const addExpense = async (
    expense: Omit<Expense, "id" | "userId" | "createdAt" | "updatedAt">,
  ) => {
    if (!user || isAdmin) {
      const newExpense: Expense = {
        ...expense,
        id: `local-exp-${Date.now()}`,
        userId: "demo",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setExpenses((prev) => [newExpense, ...prev]);
      return;
    }
    try {
      const created = await createExpenseDB({
        user_id: user.id,
        objekt_id: expense.objektId,
        kostenart: expense.kostenart,
        betrag: expense.betrag,
        zeitraum_von: expense.zeitraumVon,
        zeitraum_bis: expense.zeitraumBis,
        verteilerschluessel: expense.verteilerschluessel,
        rechnung_id: expense.rechnungId ?? null,
        notiz: expense.notiz ?? null,
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
      const dbUpdates: any = {};
      if (updates.kostenart !== undefined) dbUpdates.kostenart = updates.kostenart;
      if (updates.betrag !== undefined) dbUpdates.betrag = updates.betrag;
      if (updates.zeitraumVon !== undefined) dbUpdates.zeitraum_von = updates.zeitraumVon;
      if (updates.zeitraumBis !== undefined) dbUpdates.zeitraum_bis = updates.zeitraumBis;
      if (updates.verteilerschluessel !== undefined) dbUpdates.verteilerschluessel = updates.verteilerschluessel;
      if (updates.rechnungId !== undefined) dbUpdates.rechnung_id = updates.rechnungId;
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
    if (id.startsWith("demo-")) return; // Demo-Daten bleiben immer erhalten
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

  // ---- Zaehler CRUD ----

  const addZaehler = async (z: Omit<Zaehler, "id">) => {
    if (!user || isAdmin) {
      setZaehler((prev) => [{ ...z, id: `local-z-${Date.now()}` }, ...prev]);
      return;
    }
    try {
      const created = await createZaehlerDB({
        user_id: user.id,
        wohnung_id: z.wohnungId,
        wohnungnr: z.wohnungNr,
        geschoss: z.geschoss,
        montageort: z.montageort,
        geraeteart: z.geraeteart,
        geraetnummer: z.geraetnummer,
        geeicht_bis: z.geeichtBis,
        hersteller: z.hersteller ?? null,
        typ: z.typ ?? null,
      });
      setZaehler((prev) => [mapDBToZaehler(created), ...prev]);
    } catch (error) {
      console.error("Error adding zaehler:", error);
      throw error;
    }
  };

  const updateZaehler = async (id: string, z: Partial<Zaehler>) => {
    if (!user || isAdmin) {
      setZaehler((prev) => prev.map((e) => (e.id === id ? { ...e, ...z } : e)));
      return;
    }
    try {
      const dbUpdates: any = {};
      if (z.wohnungId !== undefined) dbUpdates.wohnung_id = z.wohnungId;
      if (z.wohnungNr !== undefined) dbUpdates.wohnungnr = z.wohnungNr;
      if (z.geschoss !== undefined) dbUpdates.geschoss = z.geschoss;
      if (z.montageort !== undefined) dbUpdates.montageort = z.montageort;
      if (z.geraeteart !== undefined) dbUpdates.geraeteart = z.geraeteart;
      if (z.geraetnummer !== undefined) dbUpdates.geraetnummer = z.geraetnummer;
      if (z.geeichtBis !== undefined) dbUpdates.geeicht_bis = z.geeichtBis;
      if (z.hersteller !== undefined) dbUpdates.hersteller = z.hersteller;
      if (z.typ !== undefined) dbUpdates.typ = z.typ;
      const updated = await updateZaehlerDB(id, dbUpdates);
      setZaehler((prev) => prev.map((e) => (e.id === id ? mapDBToZaehler(updated) : e)));
    } catch (error) {
      console.error("Error updating zaehler:", error);
      throw error;
    }
  };

  const deleteZaehler = async (id: string) => {
    if (id.startsWith("demo-")) return;
    if (!user || isAdmin) {
      setZaehler((prev) => prev.filter((e) => e.id !== id));
      return;
    }
    try {
      await deleteZaehlerDB(id);
      setZaehler((prev) => prev.filter((e) => e.id !== id));
    } catch (error) {
      console.error("Error deleting zaehler:", error);
      throw error;
    }
  };

  // ---- Rauchmelder CRUD ----

  const addRauchmelder = async (r: Omit<Rauchmelder, "id">) => {
    if (!user || isAdmin) {
      setRauchmelder((prev) => [{ ...r, id: `local-rm-${Date.now()}` }, ...prev]);
      return;
    }
    try {
      const created = await createRauchmelderDB({
        user_id: user.id,
        wohnung_id: r.wohnungId,
        wohnungnr: r.wohnungNr,
        geschoss: r.geschoss,
        montageort: r.montageort,
        geraeteart: r.geraeteart,
        geraetnummer: r.geraetnummer,
        lebensdauer_bis: r.lebensdauerBis,
        hersteller: r.hersteller ?? null,
        typ: r.typ ?? null,
      });
      setRauchmelder((prev) => [mapDBToRauchmelder(created), ...prev]);
    } catch (error) {
      console.error("Error adding rauchmelder:", error);
      throw error;
    }
  };

  const updateRauchmelder = async (id: string, r: Partial<Rauchmelder>) => {
    if (!user || isAdmin) {
      setRauchmelder((prev) => prev.map((e) => (e.id === id ? { ...e, ...r } : e)));
      return;
    }
    try {
      const dbUpdates: any = {};
      if (r.wohnungId !== undefined) dbUpdates.wohnung_id = r.wohnungId;
      if (r.wohnungNr !== undefined) dbUpdates.wohnungnr = r.wohnungNr;
      if (r.geschoss !== undefined) dbUpdates.geschoss = r.geschoss;
      if (r.montageort !== undefined) dbUpdates.montageort = r.montageort;
      if (r.geraeteart !== undefined) dbUpdates.geraeteart = r.geraeteart;
      if (r.geraetnummer !== undefined) dbUpdates.geraetnummer = r.geraetnummer;
      if (r.lebensdauerBis !== undefined) dbUpdates.lebensdauer_bis = r.lebensdauerBis;
      if (r.hersteller !== undefined) dbUpdates.hersteller = r.hersteller;
      if (r.typ !== undefined) dbUpdates.typ = r.typ;
      const updated = await updateRauchmelderDB(id, dbUpdates);
      setRauchmelder((prev) => prev.map((e) => (e.id === id ? mapDBToRauchmelder(updated) : e)));
    } catch (error) {
      console.error("Error updating rauchmelder:", error);
      throw error;
    }
  };

  const deleteRauchmelder = async (id: string) => {
    if (id.startsWith("demo-")) return;
    if (!user || isAdmin) {
      setRauchmelder((prev) => prev.filter((e) => e.id !== id));
      return;
    }
    try {
      await deleteRauchmelderDB(id);
      setRauchmelder((prev) => prev.filter((e) => e.id !== id));
    } catch (error) {
      console.error("Error deleting rauchmelder:", error);
      throw error;
    }
  };

  // ---- Rechnungen CRUD ----

  const addRechnung = async (r: Omit<Rechnung, "id" | "userId" | "createdAt" | "updatedAt">) => {
    if (!user || isAdmin) {
      const newR: Rechnung = {
        ...r,
        id: `local-re-${Date.now()}`,
        userId: "demo",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setRechnungen((prev) => [newR, ...prev]);
      return;
    }
    try {
      const created = await createRechnungDB({
        user_id: user.id,
        nummer: r.nummer,
        datum: r.datum,
        empfaenger_name: r.empfaengerName,
        empfaenger_adresse: r.empfaengerAdresse,
        positionen: r.positionen,
        bemerkung: r.bemerkung,
        status: r.status,
      });
      setRechnungen((prev) => [mapDBToRechnung(created), ...prev]);
    } catch (error) {
      console.error("Error adding rechnung:", error);
      throw error;
    }
  };

  const updateRechnung = async (id: string, r: Partial<Rechnung>) => {
    if (!user || isAdmin) {
      setRechnungen((prev) => prev.map((e) => (e.id === id ? { ...e, ...r } : e)));
      return;
    }
    try {
      const dbUpdates: any = {};
      if (r.nummer !== undefined) dbUpdates.nummer = r.nummer;
      if (r.datum !== undefined) dbUpdates.datum = r.datum;
      if (r.empfaengerName !== undefined) dbUpdates.empfaenger_name = r.empfaengerName;
      if (r.empfaengerAdresse !== undefined) dbUpdates.empfaenger_adresse = r.empfaengerAdresse;
      if (r.positionen !== undefined) dbUpdates.positionen = r.positionen;
      if (r.bemerkung !== undefined) dbUpdates.bemerkung = r.bemerkung;
      if (r.status !== undefined) dbUpdates.status = r.status;
      const updated = await updateRechnungDB(id, dbUpdates);
      setRechnungen((prev) => prev.map((e) => (e.id === id ? mapDBToRechnung(updated) : e)));
    } catch (error) {
      console.error("Error updating rechnung:", error);
      throw error;
    }
  };

  const deleteRechnung = async (id: string) => {
    if (id.startsWith("demo-")) return;
    if (!user || isAdmin) {
      setRechnungen((prev) => prev.filter((e) => e.id !== id));
      return;
    }
    try {
      await deleteRechnungDB(id);
      setRechnungen((prev) => prev.filter((e) => e.id !== id));
    } catch (error) {
      console.error("Error deleting rechnung:", error);
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
        expenses,
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
        addExpense,
        updateExpense,
        deleteExpense,
        zaehler,
        rauchmelder,
        rechnungen,
        addZaehler,
        updateZaehler,
        deleteZaehler,
        addRauchmelder,
        updateRauchmelder,
        deleteRauchmelder,
        addRechnung,
        updateRechnung,
        deleteRechnung,
        zahlungen: zahlungenState,
        setZahlungen: setZahlungenState,
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
