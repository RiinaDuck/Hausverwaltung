# Hausverwaltung Boss

Eine moderne Immobilienverwaltungssoftware für private Vermieter und WEG-Verwalter.

## 🚀 Erste Schritte

### Voraussetzungen

- Node.js 18+
- pnpm (empfohlen) oder npm

### Installation

1. Repository klonen
2. Abhängigkeiten installieren:

```bash
pnpm install
```

3. Umgebungsvariablen konfigurieren:

```bash
cp .env.example .env.local
```

4. Entwicklungsserver starten:

```bash
pnpm dev
```

Öffnen Sie [http://localhost:3000](http://localhost:3000) im Browser.

## 📦 Scripts

- `pnpm dev` - Entwicklungsserver starten
- `pnpm build` - Production Build erstellen
- `pnpm start` - Production Server starten
- `pnpm lint` - Code Linting
- `pnpm analyze` - Bundle-Größe analysieren

## 🛠️ Technologie-Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **Sprache**: TypeScript
- **Icons**: Lucide React

## 📁 Projektstruktur

```
├── app/              # Next.js App Router
├── components/       # React Komponenten
│   ├── ui/          # UI Komponenten (shadcn/ui)
│   └── views/       # View Komponenten
├── hooks/           # Custom React Hooks
├── lib/             # Utility-Funktionen
└── public/          # Statische Dateien
```

## 🔒 Sicherheit

Das Projekt implementiert moderne Sicherheitsstandards:

- Security Headers (HSTS, X-Frame-Options, CSP, etc.)
- DSGVO-konforme Datenverarbeitung
- Keine Tracking ohne Einwilligung

## 📝 Lizenz

Proprietary - Alle Rechte vorbehalten
