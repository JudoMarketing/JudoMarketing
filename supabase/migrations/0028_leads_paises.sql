-- ============================================================
-- 0028: Prospección en varios países y envío desde el sitio
--
-- 1. Los leads ya no son solo de Florida: `zip` guarda la zona
--    ("33130", "us:austin-tx", "es:sevilla", "uk:leeds", "de:hamburg").
--    El país se deduce del prefijo. Se agrega `pais` para filtrar rápido.
-- 2. La sesión automática corre en un modo que no le deja mandar correos
--    reales. Ahora deja el borrador en el lead (`borrador`, con el PDF en
--    Storage) y el sitio lo manda solo, cada día, desde /api/leads/cron.
-- 3. Alemania escribe en alemán: `idioma` admite 'de'.
-- ============================================================

do $$
begin
  if to_regclass('public.leads') is null then
    raise exception
      'Proyecto equivocado o falta 0027_leads.sql: aquí no existe la tabla "leads". Esta migración va en el proyecto de judomarketing.net (ajsuskyeatgatbubctzl).';
  end if;
end $$;

alter table leads
  add column if not exists pais         text not null default 'us',
  add column if not exists borrador     jsonb,
  add column if not exists borrador_en  timestamptz,
  add column if not exists informe_path text;

comment on column leads.pais is 'us, es, uk o de. Se deduce de la zona al guardar.';
comment on column leads.borrador is 'Correo escrito por la sesión y todavía no enviado: {idioma, asunto, saludo, parrafos, ps, rubro}. Lo manda /api/leads/cron y lo deja en null.';
comment on column leads.informe_path is 'Ruta en el bucket "leads" del PDF de presencia en línea que va adjunto.';

alter table leads drop constraint if exists leads_idioma_check;
alter table leads add constraint leads_idioma_check check (idioma in ('es', 'en', 'de'));

create index if not exists leads_pais_idx on leads (pais);
create index if not exists leads_borrador_idx on leads (borrador_en) where borrador is not null;

-- Los PDF de los informes viven aquí hasta que salen; solo el servidor
-- (service role) los lee. Privado.
insert into storage.buckets (id, name, public)
values ('leads', 'leads', false)
on conflict (id) do nothing;
