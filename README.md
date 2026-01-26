# 🏢 Hausverwaltung Boss

> Die moderne Lösung für private Vermieter und WEG-Verwalter - Keine doppelte Buchführung nötig.

Eine umfassende, benutzerfreundliche Immobilienverwaltungssoftware, die speziell für private Vermieter und WEG-Verwalter entwickelt wurde. Verwalten Sie Objekte, Wohnungen, Mieter, Nebenkosten und vieles mehr - alles an einem Ort.

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green)](https://supabase.com/)

## 🚀 Supabase Integration

Die App nutzt **Supabase** als Backend:

- ✅ PostgreSQL Datenbank
- ✅ User Authentication (Email/Password)
- ✅ Row Level Security (RLS)
- ✅ Realtime Subscriptions (optional)

👉 **[Supabase Setup Guide](SUPABASE_SETUP.md)** - Vollständige Einrichtungsanleitung

## ✨ Features

### 📊 Dashboard

- **Übersichtliche Statistiken** - Gesamtmieten, Objektanzahl, Leerstand auf einen Blick
- **Mietzahlungen** - Aktuelle Mieteinnahmen mit visuellen Charts
- **Interaktive Diagramme** - Monats- und Jahresvergleiche
- **Schnellzugriff** - Wichtige Funktionen direkt erreichbar

### 🏠 Objektverwaltung

- **Mehrere Objekte** verwalten (Miet- und WEG-Objekte)
- **Vollständige Objektdaten** - Adresse, Eigentümer, Bankverbindung
- **Objektspezifische Ansichten** - Automatische Filterung aller Daten
- **Notizen & Dokumentation** - Wichtige Informationen zentral speichern

### 🚪 Wohnungsverwaltung

- **Detaillierte Wohnungsdaten** - Flächen, Räume, Ausstattung
- **Punktesystem** - Für Nebenkostenabrechnungen
- **Ausstattungsmerkmale** - Bad, Heizung, Bodenbelag, Extras
- **Statusverwaltung** - Vermietet, Frei, Renovierung
- **Leerstandsübersicht** - Schneller Überblick über freie Einheiten

### 👥 Mieterverwaltung

- **Komplette Mieterdaten** - Stammdaten, Kontakt, Vertragsinformationen
- **Verteilungsschlüssel** - Individuelle Aufteilung von Nebenkosten
- **Zählerverwaltung** - Heizung, Wasser, Strom
- **Zahlungsübersicht** - Mietzahlungen und Kaution
- **Kommunikation** - Mitteilungen als PDF exportieren

### 💰 Nebenkosten & Abrechnungen

- **Jährliche Abrechnung** - Automatische Berechnung nach Verteilungsschlüssel
- **Verschiedene Kostenarten** - Wasser, Heizung, Hauswart, Versicherung, etc.
- **Umlageschlüssel** - Fläche, Personen, Einheiten, Verbrauch
- **Monatsübersicht** - Vorschüsse und tatsächliche Kosten
- **PDF-Export** - Professionelle Abrechnungsdokumente

### 🧾 Rechnungsverwaltung

- **Digitale Belegverwaltung** - Alle Rechnungen zentral erfasst
- **Kategorisierung** - Automatische Zuordnung zu Kostenarten
- **Objektzuordnung** - Mehrere Objekte pro Rechnung möglich
- **Zahlungsstatus** - Offen, Bezahlt, Überfällig
- **Uploadfunktion** - Belege direkt hochladen

### 📈 Statistiken & Auswertungen

- **Umsatzentwicklung** - Monatliche und jährliche Trends
- **Kostenanalyse** - Detaillierte Aufschlüsselung nach Kategorien
- **Leerstandsquote** - Auslastung Ihrer Objekte
- **Vergleichszeiträume** - Jahr-zu-Jahr Vergleiche
- **Exportfunktionen** - Daten als Excel oder CSV

## 🚀 Erste Schritte

### Voraussetzungen

- Node.js 18+ oder neuer
- pnpm (empfohlen) oder npm
- Git

### Installation

1. **Repository klonen**

```bash
git clone https://github.com/Miichiiii/Hausverwaltung.git
cd Hausverwaltung
```

2. **Abhängigkeiten installieren**

```bash
pnpm install
```

3. **Supabase einrichten**

📖 **Folge der detaillierten Anleitung**: [SUPABASE_SETUP.md](SUPABASE_SETUP.md)

Kurzversion:

- Erstelle ein Supabase-Projekt auf [supabase.com](https://supabase.com)
- Kopiere `.env.example` zu `.env.local`
- Füge deine Supabase Credentials ein
- Führe das SQL-Schema aus (`supabase/migrations/20260126_initial_schema.sql`)

4. **Entwicklungsserver starten**

```bash
pnpm dev
```

5. **Anwendung öffnen**

Öffne [http://localhost:3000](http://localhost:3000) in deinem Browser.

### Demo-Modus (Ohne Datenbank)

Du kannst die App auch ohne Supabase im **Demo-Modus** testen:

- Klicke auf "Demo starten" auf der Landing Page
- Alle Daten werden nur im Browser gespeichert (localStorage)
- Perfekt zum Ausprobieren der Features

## 📦 Verfügbare Scripts

| Script       | Beschreibung                                 |
| ------------ | -------------------------------------------- |
| `pnpm dev`   | Startet den Entwicklungsserver mit Turbopack |
| `pnpm build` | Erstellt einen optimierten Production Build  |
| `pnpm start` | Startet den Production Server                |
| `pnpm lint`  | Führt ESLint für Code-Qualität aus           |

## 🛠️ Technologie-Stack

### Frontend

- **[Next.js 16](https://nextjs.org/)** - React Framework mit App Router & Turbopack
- **[React 19](https://react.dev/)** - UI Library mit neuen Features
- **[TypeScript](https://www.typescriptlang.org/)** - Type-Safe Development
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-First CSS Framework

### Backend & Database

- **[Supabase](https://supabase.com/)** - PostgreSQL Database & Auth
- **[Supabase Auth](https://supabase.com/auth)** - User Authentication
- **Row Level Security (RLS)** - Sichere Datenisolation pro User

### UI Components

- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible Components
- **[shadcn/ui](https://ui.shadcn.com/)** - Beautiful Component Library
- **[Lucide React](https://lucide.dev/)** - Icon Library
- **[Recharts](https://recharts.org/)** - Charting Library

### PDF Generation

- **[jsPDF](https://github.com/parallax/jsPDF)** - PDF Dokumente erstellen
- **[jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable)** - Tabellen in PDFs

### Development Tools

- **[ESLint](https://eslint.org/)** - Code Linting
- **[Prettier](https://prettier.io/)** - Code Formatting

## 📁 Projektstruktur

```
Hausverwaltung/
├── app/                        # Next.js App Router
│   ├── globals.css            # Globale Styles
│   ├── layout.tsx             # Root Layout
│   └── page.tsx               # Landing Page
├── components/
│   ├── ui/                    # UI Komponenten (shadcn/ui)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ...
│   ├── views/                 # Feature Views
│   │   ├── dashboard-view.tsx
│   │   ├── objektdaten-view.tsx
│   │   ├── wohnungsdaten-view.tsx
│   │   ├── mieterdaten-view.tsx
│   │   ├── nebenkosten-view.tsx
│   │   ├── rechnungen-view.tsx
│   │   ├── statistiken-view.tsx
│   │   └── zaehler-view.tsx
│   ├── app-dashboard.tsx      # Haupt-Dashboard
│   ├── app-header.tsx         # Header mit Navigation
│   ├── app-sidebar.tsx        # Sidebar Navigation
│   └── landing-page.tsx       # Landing Page
├── context/
│   └── app-data-context.tsx   # Global State Management
├── hooks/                     # Custom React Hooks
│   ├── use-mobile.ts
│   └── use-toast.ts
├── lib/
│   ├── pdf-generator.tsx      # PDF Export Funktionen
│   └── utils.ts               # Utility Functions
├── public/                    # Statische Assets
├── styles/                    # Zusätzliche Styles
└── tsconfig.json              # TypeScript Config
```

## 🎨 Design System

Die Anwendung verwendet ein konsistentes Design System basierend auf:

- **Farbschema**: Modernes Dark/Light Theme
- **Typography**: Inter Font Family
- **Spacing**: Tailwind Spacing Scale
- **Components**: Radix UI Primitives mit Custom Styling
- **Responsive**: Mobile-First Approach

## 🔐 Datenschutz & Sicherheit

- ✅ **DSGVO-konform** - Keine externen Tracking-Dienste
- ✅ **Lokale Datenspeicherung** - Alle Daten bleiben auf Ihrem System
- ✅ **Security Headers** - HSTS, CSP, X-Frame-Options
- ✅ **Type-Safe** - TypeScript für fehlerfreien Code
- ✅ **Modern Security Standards** - Best Practices implementiert

## 📱 Responsive Design

Die Anwendung ist vollständig responsive und optimiert für:

- 📱 **Mobile** - Smartphones (320px+)
- 📱 **Tablet** - iPads und Tablets (768px+)
- 💻 **Desktop** - Laptops und Desktops (1024px+)
- 🖥️ **Large Screens** - Große Monitore (1920px+)

## 🚧 Roadmap

### Geplante Features

- [ ] **Datenbank Integration** - PostgreSQL/SQLite für persistente Datenspeicherung
- [ ] **Authentifizierung** - Multi-User Support mit Rollen
- [ ] **Cloud Sync** - Optional: Daten in der Cloud synchronisieren
- [ ] **Mobile App** - Native Apps für iOS/Android
- [ ] **Dokumentenverwaltung** - Upload und Verwaltung von Verträgen, Protokollen
- [ ] **E-Mail Integration** - Automatische Benachrichtigungen
- [ ] **API** - REST API für Integrationen
- [ ] **Export/Import** - Daten exportieren und importieren
- [ ] **Backup-Funktion** - Automatische Datensicherung
- [ ] **Mehrsprachigkeit** - Englisch, weitere Sprachen

## 🤝 Mitwirken

Contributions sind willkommen! Bitte beachten Sie:

1. Fork das Repository
2. Erstellen Sie einen Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Committen Sie Ihre Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. Pushen Sie zum Branch (`git push origin feature/AmazingFeature`)
5. Öffnen Sie einen Pull Request

## 📝 Lizenz

Copyright © 2026 Hausverwaltung Boss. Alle Rechte vorbehalten.

Dieses Projekt ist proprietär. Eine Nutzung, Vervielfältigung oder Verbreitung ohne ausdrückliche Genehmigung ist nicht gestattet.

## 👨‍💻 Autor

**Miichiiii**

- GitHub: [@Miichiiii](https://github.com/Miichiiii)

## 🙏 Danksagungen

- [Next.js Team](https://nextjs.org/) für das großartige Framework
- [shadcn](https://twitter.com/shadcn) für die wunderbare UI Component Library
- [Vercel](https://vercel.com/) für Hosting und Deployment Plattform
- Alle Open Source Contributors

---

**Made with ❤️ in Germany**
