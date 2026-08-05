-- Judo Marketing — Hora opcional en visitas + contratos firmados digitalmente
-- Aplicar DESPUÉS de 0003_admin.sql.

-- ── Hora opcional de la visita ───────────────────────────────────────
alter table visits add column if not exists visit_time time;

-- ── Contratos firmados desde el portal del vendedor ─────────────────
-- El cliente firma en el teléfono del vendedor, el vendedor firma,
-- la firma de Administración se agrega automáticamente, y el documento
-- queda guardado con un código único de verificación.
create table signed_contracts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  seller_id uuid not null references sellers (id),
  client_name text not null,
  business_name text,
  client_email text not null,
  plan text not null,
  monthly_price numeric(10, 2) not null,
  domain text,
  pdf_path text not null,
  client_signed_at timestamptz not null default now(),
  seller_signed_at timestamptz not null default now(),
  emailed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table signed_contracts enable row level security;

create policy "vendedor: crear contrato" on signed_contracts
  for insert to authenticated with check (seller_id = auth.uid());
create policy "vendedor: ver sus contratos" on signed_contracts
  for select to authenticated using (seller_id = auth.uid());
create policy "admin: contratos" on signed_contracts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Bucket privado para los PDF firmados
insert into storage.buckets (id, name, public)
values ('contracts', 'contracts', false)
on conflict (id) do nothing;

create policy "vendedor sube su contrato" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'contracts' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "vendedor lee sus contratos" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'contracts'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );
