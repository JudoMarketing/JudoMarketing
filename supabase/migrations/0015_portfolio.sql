-- ============================================================
-- 0015: El portafolio sale de la lista de websites
--
-- Lo que Administración da de alta en su portal aparece en el portafolio
-- público, y lo que deshabilita desaparece. Estas columnas guardan lo que
-- solo se puede decidir a mano: en qué categoría va, cómo se describe y, si
-- hace falta, una imagen propia en vez de la captura automática.
--
-- La tabla sites NO se abre al público: guarda la clave del Judo Site Kit.
-- La página lee con la llave de servicio y solo trae las columnas seguras.
--
-- Este archivo también da de alta los dos websites propios de Junior. Se
-- puede correr las veces que haga falta sin duplicar nada.
-- ============================================================

alter table sites
  add column if not exists portfolio_visible boolean not null default true,
  add column if not exists portfolio_category text,
  add column if not exists portfolio_desc_es text,
  add column if not exists portfolio_desc_en text,
  add column if not exists portfolio_image text;

-- Las categorías que entiende el filtro del sitio.
alter table sites drop constraint if exists sites_portfolio_category_check;
alter table sites add constraint sites_portfolio_category_check
  check (
    portfolio_category is null
    or portfolio_category in ('food', 'delivery', 'tiendas', 'servicios')
  );

-- Solo se consultan los activos y visibles: que el índice los tenga a mano.
create index if not exists sites_portfolio_idx
  on sites (status, portfolio_visible);

-- ── Websites propios de Junior Osorio ──────────────────────────────
-- Los dos ya están publicados y los dominios son suyos: entran activos, con
-- precio 0 (nadie paga mensualidad) y sin vendedor, para que no generen
-- comisión.

with cliente_existente as (
  select id from clients where email = 'juniorosorio36@gmail.com' limit 1
),
cliente_nuevo as (
  insert into clients (full_name, email, profile_id)
  select
    'Junior Osorio',
    'juniorosorio36@gmail.com',
    (select id from auth.users where email = 'juniorosorio36@gmail.com' limit 1)
  where not exists (select 1 from cliente_existente)
  returning id
)
insert into sites (name, domain, client_id, seller_id, status, monthly_price)
select
  nuevos.nombre,
  nuevos.dominio,
  coalesce(
    (select id from cliente_existente),
    (select id from cliente_nuevo)
  ),
  null,
  'activo',
  0
from (
  values
    ('Zanoah', 'zanoah.shop'),
    ('Delivery Rush Florida', 'deliveryrushflorida.com')
) as nuevos (nombre, dominio)
where not exists (
  select 1 from sites where sites.domain = nuevos.dominio
);

-- ── Su ficha en el portafolio ──────────────────────────────────────

update sites set
  portfolio_category = 'food',
  portfolio_desc_es = 'Postres saludables en Miami: donas de proteína, banana bread y carrot cake sin azúcar refinada. Pedidos en línea, delivery y pickup.',
  portfolio_desc_en = 'Healthy desserts in Miami: protein donuts, banana bread, and carrot cake with no refined sugar. Online ordering, delivery, and pickup.'
where domain = 'zanoah.shop';

update sites set
  portfolio_category = 'delivery',
  portfolio_desc_es = 'Mensajería urgente en Miami y Orlando. Cotización según el vehículo, seguimiento del pedido y entregas en menos de dos horas.',
  portfolio_desc_en = 'Rush courier service in Miami and Orlando. Quotes by vehicle type, order tracking, and deliveries in under two hours.'
where domain = 'deliveryrushflorida.com';

-- Para confirmar que quedó todo:
-- select name, domain, status, portfolio_visible, portfolio_category
-- from sites order by created_at desc;
