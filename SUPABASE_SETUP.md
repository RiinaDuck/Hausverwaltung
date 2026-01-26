# 🚀 Supabase Setup für Hausverwaltung

Diese Anleitung führt dich Schritt für Schritt durch die Einrichtung von Supabase für die Hausverwaltung-App.

## 📋 Voraussetzungen

- Ein Supabase-Account (kostenlos bei [supabase.com](https://supabase.com))
- Node.js und pnpm installiert
- Diese Hausverwaltung-App geklont

## 1️⃣ Supabase Projekt erstellen

1. Gehe zu [app.supabase.com](https://app.supabase.com)
2. Klicke auf "New Project"
3. Wähle eine Organisation oder erstelle eine neue
4. Fülle die Projekt-Details aus:
   - **Name**: `hausverwaltung` (oder einen beliebigen Namen)
   - **Database Password**: Wähle ein sicheres Passwort (speichere es!)
   - **Region**: Wähle die nächstgelegene Region (z.B. Frankfurt für Deutschland)
5. Klicke auf "Create new project"
6. Warte, bis das Projekt bereit ist (ca. 2 Minuten)

## 2️⃣ API Keys kopieren

1. Gehe in deinem Projekt zu **Settings** → **API**
2. Kopiere folgende Werte:
   - **Project URL** (z.B. `https://xxxxxxxxxxxxx.supabase.co`)
   - **anon public** Key
   - **service_role** Key (⚠️ GEHEIM!)

## 3️⃣ Environment Variables konfigurieren

1. Öffne die Datei `.env.local` in deinem Projekt
2. Füge deine Supabase Credentials ein:

```env
NEXT_PUBLIC_SUPABASE_URL=https://dein-projekt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dein-anon-key
SUPABASE_SERVICE_ROLE_KEY=dein-service-role-key
```

⚠️ **WICHTIG**: Die `.env.local` Datei wird NICHT in Git committed. Teile diese Keys niemals!

## 4️⃣ Datenbank Schema erstellen

### Option A: SQL Editor (Empfohlen)

1. Gehe in Supabase zu **SQL Editor**
2. Klicke auf "+ New query"
3. Öffne die Datei `supabase/migrations/20260126_initial_schema.sql` aus diesem Projekt
4. Kopiere den gesamten Inhalt
5. Füge ihn in den SQL Editor ein
6. Klicke auf "Run" (▶)
7. Warte auf die Bestätigung "Success. No rows returned"

### Option B: Supabase CLI (Fortgeschritten)

```bash
# Installiere Supabase CLI
npm install -g supabase

# Login
supabase login

# Link dein Projekt
supabase link --project-ref dein-projekt-ref

# Run Migration
supabase db push
```

## 5️⃣ Row Level Security (RLS) überprüfen

Die Datenbank ist jetzt mit Row Level Security (RLS) gesichert. Das bedeutet:

- ✅ Jeder User sieht nur seine eigenen Daten
- ✅ Automatische User-Isolation
- ✅ Sichere API-Aufrufe

Überprüfe in Supabase:

1. Gehe zu **Authentication** → **Policies**
2. Du solltest Policies für alle Tabellen sehen (objekte, wohnungen, mieter, etc.)

## 6️⃣ Email-Auth konfigurieren (Optional)

Standardmäßig ist Email/Password Auth aktiviert. Für Production empfohlen:

1. Gehe zu **Authentication** → **Providers**
2. Klicke auf **Email**
3. Konfiguriere:
   - ✅ **Enable Email provider**
   - ✅ **Confirm email** (empfohlen für Production)
   - **Email Templates**: Passe die E-Mail-Templates an (optional)

## 7️⃣ App starten

```bash
# Dependencies installieren (falls noch nicht geschehen)
pnpm install

# Dev Server starten
pnpm dev
```

Öffne [http://localhost:3000](http://localhost:3000)

## 8️⃣ Ersten User erstellen

1. Klicke auf der Landing Page auf **"Jetzt registrieren"**
2. Gib deine E-Mail und ein Passwort ein
3. Klicke auf **"Registrieren"**
4. ⚠️ **Falls Email Confirmation aktiviert ist**: Überprüfe deine Inbox und bestätige die E-Mail

**Oder**: Erstelle einen User direkt in Supabase:

1. Gehe zu **Authentication** → **Users**
2. Klicke auf "Add user" → "Create new user"
3. Gib E-Mail und Passwort ein
4. ✅ Auto Confirm User aktivieren
5. Klicke auf "Create user"

## 9️⃣ Testen

1. Logge dich mit deinem Account ein
2. Erstelle ein erstes Objekt
3. Füge Wohnungen hinzu
4. Überprüfe in Supabase unter **Table Editor**, ob die Daten gespeichert werden

## 🔧 Troubleshooting

### Problem: "Failed to fetch"

- ✅ Überprüfe `.env.local` - sind die Keys korrekt?
- ✅ Server neu starten: `pnpm dev`
- ✅ Browser Cache leeren

### Problem: "Invalid API key"

- ✅ Kopiere die Keys erneut aus Supabase → Settings → API
- ✅ Achte darauf, dass keine Leerzeichen vor/nach den Keys sind

### Problem: "Row Level Security policy violation"

- ✅ SQL Migration korrekt ausgeführt?
- ✅ Bist du eingeloggt?
- ✅ Überprüfe Policies in Supabase unter "Authentication → Policies"

### Problem: Email nicht erhalten

- ✅ Spam-Ordner überprüfen
- ✅ Für Development: Email Confirmation in Supabase deaktivieren
  - Gehe zu **Authentication** → **Providers** → **Email**
  - Deaktiviere "Confirm email"

## 📊 Datenbank-Struktur

Die App erstellt folgende Tabellen:

| Tabelle       | Beschreibung                       |
| ------------- | ---------------------------------- |
| `objekte`     | Immobilien/Objekte                 |
| `wohnungen`   | Wohneinheiten                      |
| `mieter`      | Mieter-Daten                       |
| `zaehler`     | Zählerstände (Wasser, Strom, etc.) |
| `rauchmelder` | Rauchmelder                        |
| `rechnungen`  | Rechnungen                         |

## 🔐 Sicherheit

- ✅ Row Level Security (RLS) ist aktiviert
- ✅ Jeder User sieht nur seine eigenen Daten
- ✅ `SERVICE_ROLE_KEY` niemals im Frontend verwenden
- ✅ In Production: Email-Bestätigung aktivieren
- ✅ Starke Passwörter erzwingen

## 🚀 Production Deployment

Für Vercel/Netlify:

1. Füge Environment Variables hinzu:

   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY
   ```

2. Deploy die App

3. In Supabase → Settings → API:
   - Füge deine Production-URL zu den **Allowed URLs** hinzu

## 📝 Nächste Schritte

- [ ] Custom Email Templates in Supabase konfigurieren
- [ ] Realtime Subscriptions aktivieren (optional)
- [ ] Storage für Dokument-Uploads einrichten (optional)
- [ ] Backup-Strategie festlegen

## 💡 Tipps

- **Demo-Modus**: Der Demo-Modus funktioniert weiterhin ohne Supabase
- **Entwicklung**: Nutze den Demo-Modus für schnelle Tests
- **Production**: Nutze echte Accounts mit Supabase Auth
- **Daten-Migration**: Bestehende localStorage-Daten können nicht automatisch migriert werden

## 🆘 Support

Bei Problemen:

- Supabase Docs: [supabase.com/docs](https://supabase.com/docs)
- Hausverwaltung Issues: GitHub Issues erstellen
- Supabase Discord: [discord.supabase.com](https://discord.supabase.com)
