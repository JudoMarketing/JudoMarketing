-- ============================================================
-- 0027: Prospección por correo (leads)
--
-- Cada dos días una sesión automática busca negocios de un código postal en
-- Google, visita sus websites, elige los que pueden necesitar un website o
-- una app, y les escribe un correo personal desde Judo Marketing. El sitio
-- es el que guarda, envía y procesa las bajas; la sesión solo investiga,
-- selecciona y redacta (ver docs/LEADS.md).
--
-- Una fila por negocio. Nunca se borra: si alguien pide no recibir más
-- correos, queda como 'baja' para siempre y no se le vuelve a escribir.
-- ============================================================

do $$
begin
  if to_regclass('public.sites') is null then
    raise exception
      'Proyecto equivocado: aquí no existe la tabla "sites". Esta migración va en el proyecto de judomarketing.net (ajsuskyeatgatbubctzl).';
  end if;
end $$;

create table if not exists leads (
  id              uuid primary key default gen_random_uuid(),
  -- Id del negocio en Google Places. Es lo que evita repetir un negocio
  -- aunque aparezca en dos búsquedas o en dos códigos postales.
  place_id        text not null unique,
  nombre          text not null,
  zip             text not null,
  direccion       text,
  telefono        text,
  website         text,
  -- Correo elegido para escribirle (el mejor que se encontró en su website).
  email           text,
  -- De dónde salió el lead: 'places' (Google) o 'sunbiz' (registro de Florida).
  fuente          text not null default 'places' check (fuente in ('places', 'sunbiz')),
  -- Lo que dice Sunbiz cuando el lead viene de ahí: número de documento,
  -- fecha de registro, quién figura al frente y a dónde le llega el correo
  -- postal. Es la única forma de contactar a un negocio sin presencia en línea.
  sunbiz_numero   text,
  sunbiz_fecha    date,
  oficial         text,
  direccion_postal text,
  -- Rubro según Google (restaurant, plumber, car_repair...) y nuestra lectura.
  tipo_google     text,
  rubro           text,
  rating          numeric(3, 2),
  resenas         integer,
  -- Lo que se vio en su website: idioma, constructor (wix, godaddy...),
  -- señales de que le falta algo, y un resumen corto para personalizar.
  idioma          text check (idioma in ('es', 'en')),
  constructor     text,
  senales         jsonb not null default '[]'::jsonb,
  resumen_sitio   text,
  puntaje         integer not null default 0,
  -- nuevo: investigado, sin escribirle todavía
  -- sin_correo: no se encontró correo (candidato a llamada o WhatsApp)
  -- descartado: la sesión decidió no escribirle (franquicia, no aplica)
  -- enviado: se le escribió
  -- respondio: contestó (se marca a mano desde el portal)
  -- cliente: contrató
  -- baja: pidió no recibir más correos
  -- rebotado: el correo no existe
  estado          text not null default 'nuevo'
                  check (estado in ('nuevo', 'sin_correo', 'descartado', 'enviado', 'respondio', 'cliente', 'baja', 'rebotado')),
  enviado_en      timestamptz,
  asunto          text,
  -- El correo tal cual salió, para saber qué se le dijo si contesta.
  cuerpo          text,
  baja_en         timestamptz,
  notas           text,
  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now()
);

create index if not exists leads_zip_idx on leads (zip);
create index if not exists leads_estado_idx on leads (estado);
create index if not exists leads_email_idx on leads (lower(email));

-- Una fila por corrida de la automatización, para saber qué zip tocó, cuánto
-- encontró y cuánto mandó. Es lo que decide el siguiente zip de la rotación.
create table if not exists leads_corridas (
  id              uuid primary key default gen_random_uuid(),
  zip             text not null,
  encontrados     integer not null default 0,
  con_correo      integer not null default 0,
  enviados        integer not null default 0,
  modo            text not null default 'prueba' check (modo in ('prueba', 'real')),
  resumen         text,
  creado_en       timestamptz not null default now()
);

-- Archivos diarios de Sunbiz que ya se procesaron, para no repetir ninguno.
create table if not exists leads_archivos (
  archivo         text primary key,
  registros       integer not null default 0,
  en_zona         integer not null default 0,
  candidatos      integer not null default 0,
  procesado_en    timestamptz not null default now()
);

create index if not exists leads_sunbiz_idx on leads (sunbiz_numero);

-- Solo el servidor (service role) toca estas tablas. Sin políticas, la anon
-- key no puede leer ni escribir nada aquí.
alter table leads enable row level security;
alter table leads_corridas enable row level security;
alter table leads_archivos enable row level security;

create or replace function leads_touch() returns trigger as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists leads_touch on leads;
create trigger leads_touch before update on leads
  for each row execute function leads_touch();
