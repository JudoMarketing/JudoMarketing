-- ============================================================
-- 0016: El expediente del cliente
--
-- Hasta aquí de cada website solo se sabía el precio y cuántas ventas decía
-- tener. Eso no alcanza para una agencia que quiere crecer con sus clientes:
-- no se podía calcular una ganancia, no se sabía dónde vivía nada, no había
-- rastro de los accesos de Google, y si había que apagar un sitio no quedaba
-- prueba de que se avisó.
--
-- Esta migración agrega cuatro cosas:
--   1. Inventario técnico y de cobro en `sites`
--   2. Costos por sitio  → para saber la ganancia real, no la facturación
--   3. Accesos por sitio → Google, Meta, pagos: pedidos y otorgados
--   4. Bitácora por sitio → la prueba que respalda un corte de servicio
--   5. Contactos del cliente → quién decide y quién paga
--   6. Métricas con forma fija → mismo dato en todos los sitios
-- ============================================================

-- ── 1. Inventario técnico, accesos y cobro ─────────────────────────

alter table sites
  -- Dónde vive cada cosa
  add column if not exists repo_url text,
  add column if not exists registrar text,
  add column if not exists domain_holder text,
  add column if not exists dns_provider text,
  add column if not exists email_provider text,
  add column if not exists db_provider text,
  -- Identificadores de medición
  add column if not exists ga4_property_id text,
  add column if not exists gsc_property text,
  add column if not exists gbp_location text,
  add column if not exists meta_pixel_id text,
  add column if not exists meta_page text,
  -- Cobro
  add column if not exists currency text not null default 'USD',
  add column if not exists billing_day int,
  add column if not exists payment_method text,
  add column if not exists grace_days int not null default 7,
  add column if not exists timezone text not null default 'America/New_York',
  -- Operación
  add column if not exists notes text,
  add column if not exists kit_key_rotated_at timestamptz;

alter table sites drop constraint if exists sites_billing_day_check;
alter table sites add constraint sites_billing_day_check
  check (billing_day is null or billing_day between 1 and 28);

alter table sites drop constraint if exists sites_grace_days_check;
alter table sites add constraint sites_grace_days_check
  check (grace_days between 0 and 90);

-- ── 2. Costos: lo que cuesta sostener cada sitio ───────────────────
-- Sin esto el panel muestra facturación, nunca ganancia.

create table if not exists site_costs (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites (id) on delete cascade,
  concept text not null check (char_length(concept) between 2 and 80),
  kind text not null default 'otro'
    check (kind in ('dominio', 'hosting', 'ads', 'servicio', 'otro')),
  amount_cents int not null check (amount_cents >= 0),
  currency text not null default 'USD',
  period text not null default 'mensual'
    check (period in ('unico', 'mensual', 'anual')),
  starts_on date not null default current_date,
  ends_on date,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists site_costs_por_sitio on site_costs (site_id);

-- ── 3. Accesos: lo que hay que pedirle al cliente el día 1 ─────────
-- Pedirlos tarde cuesta caro; tenerlos en lista evita que se olviden.

create table if not exists site_accesses (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites (id) on delete cascade,
  kind text not null check (kind in (
    'search_console', 'analytics', 'google_business', 'google_ads',
    'meta_business', 'meta_pixel', 'pagos', 'registrar', 'correo', 'otro'
  )),
  status text not null default 'pendiente'
    check (status in ('pendiente', 'solicitado', 'otorgado', 'no_aplica')),
  account text,
  requested_at timestamptz,
  granted_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  unique (site_id, kind)
);

create index if not exists site_accesses_por_sitio on site_accesses (site_id);

-- Al crear un website quedan listadas solas las que siempre hay que pedir.
create or replace function public.seed_site_accesses()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into site_accesses (site_id, kind)
  select new.id, k
  from unnest(array[
    'search_console', 'analytics', 'google_business',
    'meta_business', 'pagos', 'registrar'
  ]) as k
  on conflict (site_id, kind) do nothing;
  return new;
end;
$$;

drop trigger if exists sitios_accesos_iniciales on sites;
create trigger sitios_accesos_iniciales
  after insert on sites
  for each row execute function public.seed_site_accesses();

-- ── 4. Bitácora: la prueba detrás de un corte de servicio ──────────
-- Si algún día hay que apagar un sitio, esto es lo que demuestra que se
-- avisó, cuándo y a quién.

create table if not exists site_events (
  id bigint generated always as identity primary key,
  site_id uuid not null references sites (id) on delete cascade,
  kind text not null check (kind in (
    'contrato_firmado', 'factura_enviada', 'pago_recibido', 'recordatorio',
    'aviso_de_corte', 'suspendido', 'reactivado', 'entrega', 'nota'
  )),
  happened_at timestamptz not null default now(),
  detail text,
  actor uuid references profiles (id),
  created_at timestamptz not null default now()
);

create index if not exists site_events_por_sitio
  on site_events (site_id, happened_at desc);

-- Cada vez que se apaga o se reactiva un sitio queda escrito solo.
create or replace function public.log_site_status_change()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    insert into site_events (site_id, kind, detail, actor)
    values (
      new.id,
      case
        when new.status = 'deshabilitado' then 'suspendido'
        when old.status = 'deshabilitado' then 'reactivado'
        else 'nota'
      end,
      format('Estado: %s → %s', old.status, new.status),
      auth.uid()
    );
  end if;
  return new;
end;
$$;

drop trigger if exists sitios_bitacora_estado on sites;
create trigger sitios_bitacora_estado
  after update on sites
  for each row execute function public.log_site_status_change();

-- ── 5. Contactos del cliente ───────────────────────────────────────
-- Quién decide y quién paga no siempre son la misma persona, y el día que
-- haya que cobrar eso importa.

create table if not exists client_contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 80),
  role text,
  email text,
  phone text,
  whatsapp text,
  language text not null default 'es' check (language in ('es', 'en')),
  is_primary boolean not null default false,
  decides boolean not null default false,
  pays boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists client_contacts_por_cliente on client_contacts (client_id);

-- ── 6. Métricas con forma fija ─────────────────────────────────────
-- Antes cada sitio podía mandar lo que quisiera en `detail` y no había forma
-- de comparar dos clientes. El ingreso va en centavos: nunca en decimales.

alter table site_metrics
  add column if not exists revenue_cents int,
  add column if not exists currency text,
  add column if not exists orders int,
  add column if not exists sessions int,
  add column if not exists conversions int,
  add column if not exists uptime_pct numeric(5, 2),
  add column if not exists last_error text;

create index if not exists site_metrics_por_sitio
  on site_metrics (site_id, reported_at desc);

-- Nueva firma del reporte. La vieja se mantiene viva para no romper los
-- sitios que ya están publicados.
create or replace function public.report_site_metrics_v2(
  kit_key uuid,
  p_is_live boolean default true,
  p_orders int default null,
  p_revenue_cents int default null,
  p_currency text default null,
  p_sessions int default null,
  p_traffic int default null,
  p_conversions int default null,
  p_seo int default null,
  p_uptime_pct numeric default null,
  p_last_error text default null,
  p_detail jsonb default null
)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_site uuid;
begin
  select id into v_site from sites where kit_api_key = kit_key;
  if v_site is null then
    return; -- clave desconocida: se ignora en silencio
  end if;
  insert into site_metrics (
    site_id, is_live, sales_count, revenue_cents, currency, orders,
    sessions, traffic_count, conversions, seo_score, uptime_pct,
    last_error, detail
  )
  values (
    v_site, p_is_live, p_orders, p_revenue_cents, p_currency, p_orders,
    p_sessions, p_traffic, p_conversions, p_seo, p_uptime_pct,
    p_last_error, p_detail
  );
end;
$$;

revoke all on function public.report_site_metrics_v2(
  uuid, boolean, int, int, text, int, int, int, int, numeric, text, jsonb
) from public;
grant execute on function public.report_site_metrics_v2(
  uuid, boolean, int, int, text, int, int, int, int, numeric, text, jsonb
) to anon, authenticated;

-- Rotar la clave del kit: si una clave se filtra, se cambia desde el portal
-- sin tener que tocar la base a mano.
create or replace function public.rotate_kit_key(target uuid)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_new uuid;
begin
  if not public.is_admin() then
    raise exception 'Solo Administración puede rotar la clave del kit';
  end if;
  v_new := gen_random_uuid();
  update sites
     set kit_api_key = v_new, kit_key_rotated_at = now()
   where id = target;
  insert into site_events (site_id, kind, detail, actor)
  values (target, 'nota', 'Clave del kit rotada', auth.uid());
  return v_new;
end;
$$;

revoke all on function public.rotate_kit_key(uuid) from public;
grant execute on function public.rotate_kit_key(uuid) to authenticated;

-- ── 7. La cuenta: cuánto entra, cuánto cuesta, cuánto queda ────────
-- Una fila por sitio con su número mensual ya resuelto.

create or replace view site_finance as
select
  s.id as site_id,
  s.name,
  s.domain,
  s.status,
  s.currency,
  (s.monthly_price * 100)::int as revenue_cents,
  coalesce(c.mensual_cents, 0) as cost_cents,
  (s.monthly_price * 100)::int - coalesce(c.mensual_cents, 0) as margin_cents
from sites s
left join (
  select
    site_id,
    sum(
      case period
        when 'mensual' then amount_cents
        when 'anual' then amount_cents / 12
        else 0            -- los pagos únicos no son costo recurrente
      end
    )::int as mensual_cents
  from site_costs
  where ends_on is null or ends_on >= current_date
  group by site_id
) c on c.site_id = s.id;

-- ── 8. Permisos: todo esto es solo de Administración ───────────────

alter table site_costs enable row level security;
alter table site_accesses enable row level security;
alter table site_events enable row level security;
alter table client_contacts enable row level security;

drop policy if exists "admin: costos" on site_costs;
create policy "admin: costos" on site_costs for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin: accesos" on site_accesses;
create policy "admin: accesos" on site_accesses for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin: bitacora" on site_events;
create policy "admin: bitacora" on site_events for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin: contactos" on client_contacts;
create policy "admin: contactos" on client_contacts for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- La vista hereda el filtro de `sites`, que ya es solo de admin.
alter view site_finance set (security_invoker = on);

-- Los websites que ya existen también necesitan su lista de accesos.
insert into site_accesses (site_id, kind)
select s.id, k
from sites s
cross join unnest(array[
  'search_console', 'analytics', 'google_business',
  'meta_business', 'pagos', 'registrar'
]) as k
on conflict (site_id, kind) do nothing;
