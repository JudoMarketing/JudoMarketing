-- ============================================================
-- 0019: Corregir y borrar visitas
--
-- Hasta ahora una visita solo se podía crear. En la calle se escribe rápido
-- y con una mano: el nombre sale mal, la empresa queda a medias, o se
-- registra dos veces la misma puerta. Sin poder corregir, el número de
-- visitas de cada vendedor deja de ser confiable — y ese número es el que
-- se usa para medirlo.
--
-- Quién puede qué:
--   · el vendedor, solo sobre las visitas que él registró
--   · Administración, sobre todas (antes solo podía verlas)
-- ============================================================

do $$
begin
  if to_regclass('public.visits') is null then
    raise exception
      'Proyecto equivocado: aquí no existe la tabla "visits". Esta migración va en el proyecto de judomarketing.net (ajsuskyeatgatbubctzl).';
  end if;
end $$;

-- El vendedor corrige lo suyo, y no puede pasarle una visita a otro:
-- el seller_id tiene que seguir siendo el suyo antes y después del cambio.
drop policy if exists "vendedor: editar sus visitas" on visits;
create policy "vendedor: editar sus visitas" on visits
  for update to authenticated
  using (auth.uid() = seller_id)
  with check (auth.uid() = seller_id);

drop policy if exists "vendedor: borrar sus visitas" on visits;
create policy "vendedor: borrar sus visitas" on visits
  for delete to authenticated
  using (auth.uid() = seller_id);

-- Administración pasa de "solo ver" a poder corregir y borrar cualquiera.
drop policy if exists "admin: ver visitas" on visits;
drop policy if exists "admin: visitas" on visits;
create policy "admin: visitas" on visits
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
