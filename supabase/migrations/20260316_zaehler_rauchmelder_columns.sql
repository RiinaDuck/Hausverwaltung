-- Add missing columns to zaehler table
alter table public.zaehler add column if not exists montageort text;
alter table public.zaehler add column if not exists geraetnummer text;
alter table public.zaehler add column if not exists geeicht_bis text;
alter table public.zaehler add column if not exists geraeteart text;
alter table public.zaehler add column if not exists hersteller text;
alter table public.zaehler add column if not exists typ text;
alter table public.zaehler add column if not exists wohnungnr text;
alter table public.zaehler add column if not exists geschoss text;
alter table public.zaehler add column if not exists zaehlerart text;
alter table public.zaehler add column if not exists aktueller_stand numeric;
alter table public.zaehler add column if not exists stand_datum timestamptz;
alter table public.zaehler add column if not exists einbaudatum date;

-- Add missing columns to rauchmelder table
alter table public.rauchmelder add column if not exists modell text;
alter table public.rauchmelder add column if not exists einbaudatum date;
alter table public.rauchmelder add column if not exists letzte_wartung date;
alter table public.rauchmelder add column if not exists naechste_wartung date;
alter table public.rauchmelder add column if not exists batterie_gewechselt date;
alter table public.rauchmelder add column if not exists lebensdauer_bis date;
alter table public.rauchmelder add column if not exists status text default 'OK';
