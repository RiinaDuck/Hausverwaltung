-- Add archive columns to mieter table
alter table public.mieter add column if not exists archived_at timestamptz null;
alter table public.mieter add column if not exists archive_reason text null;

-- Add archive columns to wohnungen table
alter table public.wohnungen add column if not exists archived_at timestamptz null;
alter table public.wohnungen add column if not exists archive_reason text null;

-- Add archive columns to objekte table
alter table public.objekte add column if not exists archived_at timestamptz null;
alter table public.objekte add column if not exists archive_reason text null;

-- Create archive_log table for audit trail
create table if not exists public.archive_log (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null, -- 'mieter', 'wohnung', 'objektdaten'
  entity_id uuid not null,
  entity_name text not null,
  action text not null, -- 'archived', 'restored', 'deleted'
  reason text,
  archived_at timestamptz null,
  archived_by text,
  created_at timestamptz not null default now()
);

alter table public.archive_log enable row level security;

-- RLS Policies for archive_log
do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'archive_log' and policyname = 'Authenticated users can read archive_log'
  ) then
    execute 'create policy "Authenticated users can read archive_log" on public.archive_log for select to authenticated using (true)';
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'archive_log' and policyname = 'Authenticated users can insert archive_log'
  ) then
    execute 'create policy "Authenticated users can insert archive_log" on public.archive_log for insert to authenticated with check (true)';
  end if;
end $$;
