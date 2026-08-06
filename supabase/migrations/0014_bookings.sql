-- ============================================================
-- 0014: Citas por videollamada (Google Meet)
-- El visitante elige dia y hora desde el calendario de la pagina de
-- contacto. Las citas van cada dos horas, de 7:00 AM a 1:00 AM (hora de
-- Miami). Nadie del publico toca esta tabla directamente: todo entra por
-- /api/booking, que valida el horario y evita que dos personas agarren el
-- mismo cupo.
-- ============================================================

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  starts_at timestamptz not null,
  name text not null check (char_length(name) between 2 and 80),
  email text not null check (char_length(email) between 5 and 120),
  phone text check (char_length(phone) <= 40),
  note text check (char_length(note) <= 400),
  locale text not null default 'es' check (locale in ('es', 'en')),
  status text not null default 'confirmada'
    check (status in ('confirmada', 'cancelada')),
  created_at timestamptz not null default now()
);

-- Un solo cupo por horario: si dos personas envian a la vez, la segunda
-- rebota y el sitio le pide elegir otra hora.
create unique index if not exists bookings_cupo_unico
  on bookings (starts_at)
  where status = 'confirmada';

create index if not exists bookings_por_fecha on bookings (starts_at);

alter table bookings enable row level security;

-- Administracion ve y maneja todas las citas desde su portal.
drop policy if exists "admin: citas" on bookings;
create policy "admin: citas" on bookings
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- El publico no lee ni escribe aqui: la API usa la llave de servicio.
