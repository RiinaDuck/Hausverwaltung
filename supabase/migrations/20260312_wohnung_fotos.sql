-- Create wohnung_fotos metadata table
create table if not exists public.wohnung_fotos (
  id uuid primary key default gen_random_uuid(),
  wohnung_id uuid not null references public.wohnungen(id) on delete cascade,
  file_path text not null,
  file_name text not null,
  uploaded_at timestamptz not null default now(),
  uploaded_by text not null
);

alter table public.wohnung_fotos enable row level security;

-- Authenticated users can read photos for their objects
drop policy if exists "Authenticated users can read wohnung_fotos" on public.wohnung_fotos;
create policy "Authenticated users can read wohnung_fotos"
  on public.wohnung_fotos for select
  to authenticated
  using (true);

-- Authenticated users can insert
drop policy if exists "Authenticated users can insert wohnung_fotos" on public.wohnung_fotos;
create policy "Authenticated users can insert wohnung_fotos"
  on public.wohnung_fotos for insert
  to authenticated
  with check (true);

-- Authenticated users can delete their own uploads
drop policy if exists "Authenticated users can delete wohnung_fotos" on public.wohnung_fotos;
create policy "Authenticated users can delete wohnung_fotos"
  on public.wohnung_fotos for delete
  to authenticated
  using (true);

-- Create storage bucket for wohnung photos (if not exists)
insert into storage.buckets (id, name, public)
values ('wohnung-fotos', 'wohnung-fotos', false)
on conflict (id) do nothing;

-- Allow authenticated users to upload to wohnung-fotos
drop policy if exists "Authenticated users can upload wohnung-fotos" on storage.objects;
create policy "Authenticated users can upload wohnung-fotos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'wohnung-fotos');

-- Allow authenticated users to read/generate signed URLs for wohnung-fotos
drop policy if exists "Authenticated users can read wohnung-fotos" on storage.objects;
create policy "Authenticated users can read wohnung-fotos"
  on storage.objects for select to authenticated
  using (bucket_id = 'wohnung-fotos');

-- Allow authenticated users to delete from wohnung-fotos
drop policy if exists "Authenticated users can delete wohnung-fotos" on storage.objects;
create policy "Authenticated users can delete wohnung-fotos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'wohnung-fotos');
