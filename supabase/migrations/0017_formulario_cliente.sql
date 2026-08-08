-- ============================================================
-- 0017: Formulario de datos del cliente
--
-- Un enlace que se le comparte al cliente para que llene, de una sola vez,
-- todo lo que hace falta para arrancar su proyecto. Sirve para dos cosas:
--   · el cliente entrega sus datos sin diez correos de ida y vuelta
--   · a Administración le queda la lista de lo que todavía falta pedir
--
-- Nadie puede LEER esta tabla desde afuera: solo escribir. Lo que el cliente
-- envía trae correos, teléfonos y detalles de su negocio, y no debe poder
-- consultarse con la llave pública.
-- ============================================================

create table if not exists client_intake (
  id uuid primary key default gen_random_uuid(),

  -- El negocio
  business_name text not null check (char_length(business_name) between 2 and 120),
  industry text,
  what_they_do text,
  who_they_serve text,
  current_website text,
  goal text,

  -- Quién responde
  contact_name text not null check (char_length(contact_name) between 2 and 80),
  contact_role text,
  contact_email text not null check (contact_email like '%_@_%._%'),
  contact_phone text,
  contact_whatsapp text,
  language text not null default 'es' check (language in ('es', 'en')),
  timezone text,

  -- Quién decide y quién paga (a veces no es el mismo)
  decision_maker text,
  billing_contact text,
  billing_email text,

  -- Qué necesita el sitio
  needs text[],
  has_brand boolean,
  brand_notes text,
  reference_sites text,

  -- Presencia actual
  domain_wanted text,
  domain_owned boolean,
  registrar text,
  google_business text,
  instagram text,
  facebook text,
  other_social text,

  -- Accesos: qué dice el cliente que puede entregar
  can_grant_search_console boolean,
  can_grant_analytics boolean,
  can_grant_google_business boolean,
  can_grant_meta boolean,
  can_grant_payments boolean,
  payments_processor text,

  -- Operación
  notes text,
  status text not null default 'nuevo'
    check (status in ('nuevo', 'revisado', 'convertido', 'descartado')),
  site_id uuid references sites (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists client_intake_por_fecha
  on client_intake (created_at desc);

alter table client_intake enable row level security;

-- El público SOLO puede insertar, y siempre como 'nuevo'. No puede leer nada,
-- ni suyo ni de nadie.
drop policy if exists "público: enviar formulario" on client_intake;
create policy "público: enviar formulario" on client_intake
  for insert to anon, authenticated
  with check (status = 'nuevo' and site_id is null);

drop policy if exists "admin: formularios" on client_intake;
create policy "admin: formularios" on client_intake
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
