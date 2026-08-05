-- ============================================================
-- 0011: Reseñas enviadas por visitantes
-- Cualquiera puede enviar una reseña desde el home (botón pequeño
-- "Agregar tu reseña"). Nada se publica solo: quedan pendientes y
-- Administración las aprueba o rechaza desde su portal.
-- ============================================================

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 60),
  place text not null check (char_length(place) between 2 and 60),
  body text not null check (char_length(body) between 10 and 400),
  status text not null default 'pendiente'
    check (status in ('pendiente', 'aprobada', 'rechazada')),
  created_at timestamptz not null default now()
);

alter table reviews enable row level security;

-- El público envía (siempre entra como pendiente) y solo lee aprobadas
create policy "público: enviar reseña" on reviews
  for insert to anon, authenticated
  with check (status = 'pendiente');

create policy "público: leer aprobadas" on reviews
  for select to anon, authenticated
  using (status = 'aprobada');

-- Administración modera
create policy "admin: reseñas" on reviews
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
