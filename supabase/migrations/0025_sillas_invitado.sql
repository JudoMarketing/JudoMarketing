-- ============================================================
-- 0025: Sillas de invitado
--
-- Personas que pueden entrar a una de nuestras apps sin pagar suscripción:
-- pruebas, familia, socios, un cliente al que se le regala el acceso, un
-- tester de la app del teléfono.
--
-- La lista vive AQUÍ y no en cada app, por tres razones:
--   1. El portal siempre puede mostrarla, aunque la app hermana esté caída.
--   2. Queda constancia de quién la dio, cuándo y por qué. Un acceso gratis
--      sin registro se olvida y se vuelve un agujero de dinero.
--   3. Si una app se reinstala o se migra, la lista se vuelve a empujar.
--
-- La app hermana es la que de verdad deja de cobrar; aquí se guarda la orden
-- y el resultado de habérsela mandado. Por eso hay `status` y `last_error`:
-- una silla que la app todavía no aceptó se queda en "pendiente" a la vista,
-- en vez de aparentar que quedó dada.
-- ============================================================

do $$
begin
  if to_regclass('public.sites') is null then
    raise exception
      'Proyecto equivocado: aquí no existe la tabla "sites". Esta migración va en el proyecto de judomarketing.net (ajsuskyeatgatbubctzl).';
  end if;
end $$;

create table if not exists guest_seats (
  id          uuid primary key default gen_random_uuid(),
  -- Qué app. La misma lista está en src/lib/apps-hermanas.ts (APPS_INVITADO):
  -- si se agrega una app, se agrega en los dos lados.
  app         text not null check (app in ('juditoads', 'juditos', 'judimental')),
  email       text not null,
  name        text,
  -- Por qué se le dio. Obligarse a escribirlo es lo que evita la lista fantasma.
  note        text,
  -- Nulo = para siempre. Con fecha = acceso de cortesía con final.
  expires_at  timestamptz,
  status      text not null default 'pendiente'
              check (status in ('pendiente', 'activa', 'revocada', 'error')),
  synced_at   timestamptz,
  last_error  text,
  granted_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- Una silla por persona y por app. En minúsculas: Juan@x.com y juan@x.com son
-- el mismo señor y no deben ocupar dos sillas.
create unique index if not exists guest_seats_app_email
  on guest_seats (app, lower(email));

create index if not exists guest_seats_app_status
  on guest_seats (app, status);

alter table guest_seats enable row level security;

drop policy if exists "admin: sillas de invitado" on guest_seats;
create policy "admin: sillas de invitado" on guest_seats
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

comment on table guest_seats is
  'Accesos gratuitos a las apps hermanas, otorgados desde el portal de admin. La app hermana es quien deja de cobrar; aquí queda el registro y el estado del envío.';
