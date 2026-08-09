-- ============================================================
-- 0022: Las categorías nuevas del showcase
--
-- La 0015 dejó un candado que solo aceptaba cuatro categorías. Al agregar
-- Fundaciones, Equipos, Educación y Automotriz en el portal, el selector las
-- ofrecía pero la base rechazaba el guardado y el website se quedaba sin
-- categoría — por eso no aparecían en el filtro del showcase.
--
-- IMPORTANTE: esta lista tiene que ser la misma que la de
-- src/content/portfolio.ts (CATEGORIAS) y src/lib/portfolio.ts
-- (CATEGORIAS_VALIDAS). Si se agrega una categoría allá, se agrega aquí.
-- ============================================================

do $$
begin
  if to_regclass('public.sites') is null then
    raise exception
      'Proyecto equivocado: aquí no existe la tabla "sites". Esta migración va en el proyecto de judomarketing.net (ajsuskyeatgatbubctzl).';
  end if;
end $$;

alter table sites drop constraint if exists sites_portfolio_category_check;
alter table sites add constraint sites_portfolio_category_check
  check (
    portfolio_category is null
    or portfolio_category in (
      'food',
      'delivery',
      'tiendas',
      'servicios',
      'fundaciones',
      'equipos',
      'educacion',
      'automotriz'
    )
  );
