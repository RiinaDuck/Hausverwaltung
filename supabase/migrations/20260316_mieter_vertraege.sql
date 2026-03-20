-- Create mieter_vertraege metadata table
create table if not exists public.mieter_vertraege (
  id uuid primary key default gen_random_uuid(),
  mieter_id uuid not null references public.mieter(id) on delete cascade,
  file_path text not null,
  file_name text not null,
  file_type text not null, -- 'pdf' or 'docx'
  uploaded_at timestamptz not null default now(),
  uploaded_by text not null
);

alter table public.mieter_vertraege enable row level security;

-- Authenticated users can read vertraege for their mieter
drop policy if exists "Authenticated users can read mieter_vertraege" on public.mieter_vertraege;
create policy "Authenticated users can read mieter_vertraege"
  on public.mieter_vertraege for select
  to authenticated
  using (true);

-- Authenticated users can insert
drop policy if exists "Authenticated users can insert mieter_vertraege" on public.mieter_vertraege;
create policy "Authenticated users can insert mieter_vertraege"
  on public.mieter_vertraege for insert
  to authenticated
  with check (true);

-- Authenticated users can delete their own uploads
drop policy if exists "Authenticated users can delete mieter_vertraege" on public.mieter_vertraege;
create policy "Authenticated users can delete mieter_vertraege"
  on public.mieter_vertraege for delete
  to authenticated
  using (true);

-- Create storage bucket for mieter contracts (if not exists)
insert into storage.buckets (id, name, public)
values ('mieter-vertraege', 'mieter-vertraege', false)
on conflict (id) do nothing;

-- Allow authenticated users to upload to mieter-vertraege
drop policy if exists "Authenticated users can upload mieter-vertraege" on storage.objects;
create policy "Authenticated users can upload mieter-vertraege"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'mieter-vertraege');

-- Allow authenticated users to read/generate signed URLs for mieter-vertraege
drop policy if exists "Authenticated users can read mieter-vertraege" on storage.objects;
create policy "Authenticated users can read mieter-vertraege"
  on storage.objects for select to authenticated
  using (bucket_id = 'mieter-vertraege');

-- Allow authenticated users to delete from mieter-vertraege
drop policy if exists "Authenticated users can delete mieter-vertraege" on storage.objects;
create policy "Authenticated users can delete mieter-vertraege"
  on storage.objects for delete to authenticated
  using (bucket_id = 'mieter-vertraege');
