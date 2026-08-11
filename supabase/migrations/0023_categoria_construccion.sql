-- ============================================================
-- 0023: Construcción, la novena categoría del showcase
--
-- El candado de la 0022 solo aceptaba ocho. Sin esto el selector del portal
-- ofrece "Construcción" pero la base rechaza el guardado y el website se
-- queda sin categoría, igual que pasó cuando se agregaron las cuatro
-- anteriores.
--
-- IMPORTANTE: esta lista tiene que ser la misma que la de
-- src/content/portfolio.ts (CATEGORIAS), src/lib/portfolio.ts
-- (CATEGORIAS_VALIDAS) y src/components/AdminPortal.tsx
-- (CATEGORIAS_PORTAFOLIO). Si se agrega una categoría, se agrega en las cuatro.
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
      'automotriz',
      'construccion'
    )
  );
