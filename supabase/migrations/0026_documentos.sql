-- ============================================================
-- 0026: Documentos formales enviados desde el portal
--
-- El programa de vendedores se retiró, y con él la forma de firmar contratos
-- en el teléfono del vendedor. Ahora los contratos salen desde el portal de
-- administración: se elige el tipo (websites, JuditoADS, Juditos), se ponen
-- los datos del cliente, y el PDF se genera ya firmado por Judo Marketing y
-- se manda al correo del cliente con un enlace de aceptación.
--
-- Cada fila es un contrato enviado. Guarda a quién, qué, cuánto, dónde está
-- el PDF, si el correo salió, y —cuando el cliente acepta— su nombre, la
-- fecha y la IP desde la que aceptó. Eso es lo que convierte un PDF en un
-- contrato que se puede hacer valer.
-- ============================================================

do $$
begin
  if to_regclass('public.sites') is null then
    raise exception
      'Proyecto equivocado: aquí no existe la tabla "sites". Esta migración va en el proyecto de judomarketing.net (ajsuskyeatgatbubctzl).';
  end if;
end $$;

create table if not exists documents (
  id              uuid primary key default gen_random_uuid(),
  -- Código único que va impreso en el PDF y en el enlace de aceptación.
  -- Largo y aleatorio a propósito: el enlace no lleva contraseña.
  code            text not null unique,
  -- La misma lista que TIPOS_DOCUMENTO en src/content/documentos.ts.
  kind            text not null check (kind in ('websites', 'juditoads', 'juditos')),
  recipient_name  text not null,
  business_name   text,
  recipient_email text not null,
  plan            text,
  monthly_price   numeric(10, 2) not null,
  project         text,
  starts_on       date not null,
  -- Ruta dentro del bucket privado "contracts": <uid del admin>/documentos/<code>.pdf
  pdf_path        text not null,
  sent_at         timestamptz,
  send_error      text,
  accepted_at     timestamptz,
  accepted_name   text,
  accepted_ip     text,
  accepted_agent  text,
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now()
);

create index if not exists documents_por_correo on documents (lower(recipient_email));

alter table documents enable row level security;

-- Solo Administración ve y maneja los documentos. La aceptación del cliente
-- la escribe el servidor con la llave de servicio (el cliente no tiene
-- cuenta), comprobando el código y que no estuviera aceptado ya.
drop policy if exists "admin: documentos" on documents;
create policy "admin: documentos" on documents
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

comment on table documents is
  'Contratos generados y enviados desde el portal de admin, firmados por Judo Marketing, con el registro de aceptación del cliente.';
