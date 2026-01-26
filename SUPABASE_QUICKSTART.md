# 🚀 Supabase Quick Start

## Setup in 5 Minuten

### 1. Supabase Projekt erstellen

```bash
# Gehe zu https://app.supabase.com
# Klicke auf "New Project"
# Wähle einen Namen und Region
# Warte ~2 Minuten
```

### 2. Environment Variables

```bash
# Kopiere .env.example zu .env.local
cp .env.example .env.local

# Öffne .env.local und füge deine Supabase Credentials ein:
# (Findest du in Supabase unter Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### 3. Datenbank Schema

```bash
# Gehe in Supabase zu SQL Editor
# Kopiere den Inhalt von: supabase/migrations/20260126_initial_schema.sql
# Füge ihn ein und klicke "Run"
```

### 4. App starten

```bash
pnpm install
pnpm dev
```

### 5. Ersten User erstellen

```
# Option A: In der App
- Klicke auf "Jetzt registrieren"
- Gib E-Mail und Passwort ein
- Fertig!

# Option B: In Supabase
- Gehe zu Authentication → Users
- Klicke "Add user" → "Create new user"
- ✅ Auto Confirm User aktivieren
```

## 📁 Was wurde erstellt?

```
Hausverwaltung/
├── lib/supabase/
│   ├── client.ts              # Supabase Client (Browser)
│   ├── server.ts              # Supabase Client (Server)
│   ├── database.types.ts      # TypeScript Types
│   └── queries.ts             # Helper Functions
├── supabase/migrations/
│   └── 20260126_initial_schema.sql  # Datenbank Schema
├── middleware.ts              # Auth Middleware
├── .env.local                 # Deine Credentials (NICHT committen!)
├── .env.example               # Template
└── SUPABASE_SETUP.md         # Vollständige Anleitung
```

## 🔑 Login & Auth

### Demo-Modus (Ohne Datenbank)

```
- Klicke auf "Demo starten"
- Keine Registrierung nötig
- Daten nur im Browser (localStorage)
```

### Produktiv-Modus (Mit Supabase)

```
- Registriere dich mit E-Mail/Passwort
- Deine Daten werden in Supabase gespeichert
- Zugriff von überall möglich
```

## 📊 Datenbank-Tabellen

| Tabelle       | Beschreibung       | RLS |
| ------------- | ------------------ | --- |
| `objekte`     | Immobilien/Objekte | ✅  |
| `wohnungen`   | Wohneinheiten      | ✅  |
| `mieter`      | Mieter-Daten       | ✅  |
| `zaehler`     | Zählerstände       | ✅  |
| `rauchmelder` | Rauchmelder        | ✅  |
| `rechnungen`  | Rechnungen         | ✅  |

**RLS = Row Level Security**: Jeder User sieht nur seine eigenen Daten!

## 🔧 Nützliche Supabase Features

### SQL Editor

```sql
-- Alle deine Objekte anzeigen
SELECT * FROM objekte WHERE user_id = auth.uid();

-- Alle Mieter mit Wohnungs-Info
SELECT m.*, w.bezeichnung
FROM mieter m
JOIN wohnungen w ON m.wohnung_id = w.id
WHERE m.user_id = auth.uid();
```

### Table Editor

- Daten direkt in Supabase bearbeiten
- Praktisch für Debugging
- Gehe zu: Table Editor → wähle Tabelle

### Authentication

- User verwalten: Authentication → Users
- Policies anzeigen: Authentication → Policies
- Email-Templates: Authentication → Email Templates

## 🚨 Troubleshooting

### "Failed to fetch"

```bash
# Check 1: Sind die ENV Variables korrekt?
cat .env.local

# Check 2: Server neu starten
pnpm dev
```

### "Row Level Security policy violation"

```bash
# Check: Bist du eingeloggt?
# Check: SQL Migration korrekt ausgeführt?
# Lösung: In Supabase SQL Editor nochmal ausführen
```

### Keine E-Mail erhalten

```bash
# Für Development:
# Supabase → Authentication → Providers → Email
# ❌ Deaktiviere "Confirm email"
```

## 📚 Weitere Infos

- **Vollständige Anleitung**: [SUPABASE_SETUP.md](SUPABASE_SETUP.md)
- **Supabase Docs**: https://supabase.com/docs
- **Next.js + Supabase**: https://supabase.com/docs/guides/getting-started/quickstarts/nextjs

## 💡 Tipps

1. **Development**: Nutze Demo-Modus für schnelle Tests
2. **Production**: Aktiviere Email-Confirmation in Supabase
3. **Backup**: Supabase macht automatisch Backups (kostenloser Plan: täglich)
4. **Migration**: Alte localStorage-Daten können nicht automatisch migriert werden

## 🎉 Du bist ready!

```bash
# Starte die App
pnpm dev

# Öffne http://localhost:3000
# Klicke "Jetzt registrieren"
# Lege los!
```
