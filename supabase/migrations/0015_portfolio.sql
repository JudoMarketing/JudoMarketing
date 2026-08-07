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

-- Los dos websites propios, con su categoría y descripción ya puestas.
update sites set
  portfolio_category = 'food',
  portfolio_desc_es = 'Postres saludables en Miami: donas de proteína, banana bread y carrot cake sin azúcar refinada. Catálogo con pedidos en línea, delivery y pickup.',
  portfolio_desc_en = 'Healthy desserts in Miami: protein donuts, banana bread, and carrot cake with no refined sugar. Online ordering, delivery, and pickup.'
where domain = 'zanoah.shop';

update sites set
  portfolio_category = 'delivery',
  portfolio_desc_es = 'Mensajería urgente en Miami y Orlando. Cotización según el tipo de vehículo, seguimiento del pedido y entregas en menos de dos horas.',
  portfolio_desc_en = 'Rush courier service in Miami and Orlando. Quotes by vehicle type, order tracking, and deliveries in under two hours.'
where domain = 'deliveryrushflorida.com';
