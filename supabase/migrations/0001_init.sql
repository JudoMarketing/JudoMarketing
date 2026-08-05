-- Judo Marketing — Esquema inicial (Fase 0)
-- Proyecto: https://ajsuskyeatgatbubctzl.supabase.co
-- Aplicar en: Supabase Dashboard → SQL Editor, o `supabase db push`.
-- Las políticas RLS finas se agregan en Fase 3/4 junto con la autenticación;
-- por ahora RLS queda ACTIVADO en todas las tablas (deny-by-default) y solo
-- el service role (backend) puede operar.

create type user_role as enum ('admin', 'vendedor', 'cliente');
create type seller_status as enum ('pendiente', 'aprobado', 'rechazado', 'suspendido');
create type commission_kind as enum ('porcentaje', 'monto_fijo');
create type site_status as enum ('activo', 'deshabilitado', 'en_desarrollo', 'cancelado');
create type payment_method as enum ('stripe', 'manual');
create type commission_status as enum ('pendiente', 'pagada');

-- Perfiles: extiende auth.users (Supabase Auth) con rol e idioma
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null default 'cliente',
  full_name text not null,
  photo_url text,
  phone text,
  language text not null default 'es' check (language in ('es', 'en')),
  created_at timestamptz not null default now()
);

-- Vendedores: nombre obligatorio, el resto opcional; comisión se fija al aprobar
create table sellers (
  id uuid primary key references profiles (id) on delete cascade,
  status seller_status not null default 'pendiente',
  referral_code text unique,
  referred_by uuid references sellers (id),
  commission_kind commission_kind,
  commission_value numeric(10, 2),
  payout_method text,
  approved_at timestamptz,
  approved_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles (id),
  full_name text not null,
  business_name text,
  email text,
  phone text,
  contract_start date,
  contract_signed_pdf text,
  created_at timestamptz not null default now()
);

-- Websites de clientes conectados al panel central (Judo Site Kit)
create table sites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text unique,
  client_id uuid references clients (id),
  seller_id uuid references sellers (id),
  status site_status not null default 'en_desarrollo',
  monthly_price numeric(10, 2) not null default 50,
  vercel_project text,
  kit_api_key uuid not null default gen_random_uuid(),
  domain_expires_at date,
  next_payment_due date,
  months_paid int not null default 0,
  created_at timestamptz not null default now()
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites (id),
  amount numeric(10, 2) not null,
  method payment_method not null,
  paid_at date not null default current_date,
  recorded_by uuid references profiles (id),
  stripe_payment_id text,
  notes text,
  created_at timestamptz not null default now()
);

create table commissions (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references sellers (id),
  payment_id uuid not null references payments (id) unique,
  amount numeric(10, 2) not null,
  status commission_status not null default 'pendiente',
  paid_at date,
  created_at timestamptz not null default now()
);

-- Visitas registradas por vendedores (offline-first: client_generated_id
-- permite reintentos de sincronización sin duplicar)
create table visits (
  id uuid primary key default gen_random_uuid(),
  client_generated_id uuid not null unique,
  seller_id uuid not null references sellers (id),
  prospect_name text not null,
  company_name text,
  visited_on date not null,
  notes text,
  synced_at timestamptz not null default now()
);

-- Evidencia de aceptación de términos (póliza/contrato, versión y fecha)
create table terms_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id),
  document text not null,
  version text not null,
  accepted_at timestamptz not null default now(),
  ip_address inet
);

-- Auditoría de acciones sensibles (quién apagó qué sitio y cuándo)
create table audit_log (
  id bigint generated always as identity primary key,
  actor uuid references profiles (id),
  action text not null,
  target text,
  detail jsonb,
  created_at timestamptz not null default now()
);

-- Métricas reportadas por cada sitio vía Judo Site Kit
create table site_metrics (
  id bigint generated always as identity primary key,
  site_id uuid not null references sites (id),
  reported_at timestamptz not null default now(),
  is_live boolean,
  sales_count int,
  traffic_count int,
  seo_score int,
  detail jsonb
);

create index on sites (seller_id);
create index on payments (site_id, paid_at);
create index on commissions (seller_id, status);
create index on visits (seller_id, visited_on);
create index on site_metrics (site_id, reported_at);

alter table profiles enable row level security;
alter table sellers enable row level security;
alter table clients enable row level security;
alter table sites enable row level security;
alter table payments enable row level security;
alter table commissions enable row level security;
alter table visits enable row level security;
alter table terms_acceptances enable row level security;
alter table audit_log enable row level security;
alter table site_metrics enable row level security;
