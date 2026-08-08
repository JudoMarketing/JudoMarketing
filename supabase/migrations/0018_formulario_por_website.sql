-- ============================================================
-- 0018: El formulario de arranque se puede colgar de un website
--
-- La columna site_id ya existía desde 0017, pero nadie la usaba. Ahora el
-- portal permite decir "este formulario es de este website", y así queda el
-- historial de lo que el cliente pidió el día que empezamos — aunque el
-- formulario haya llegado después de tener el sitio armado.
--
-- Aquí solo se agrega el índice: sin él, abrir el expediente de un website
-- obligaría a recorrer todos los formularios. Con diez da igual; con
-- quinientos, no.
--
-- Los permisos no cambian y no hace falta tocarlos:
--   · el público solo puede insertar, y siempre con site_id nulo
--   · Administración ya tiene "for all", así que puede vincular y desvincular
-- ============================================================

do $$
begin
  if to_regclass('public.client_intake') is null then
    raise exception
      'Proyecto equivocado: aquí no existe la tabla "client_intake". Esta migración va en el proyecto de judomarketing.net (ajsuskyeatgatbubctzl), y antes hay que correr la 0017.';
  end if;
end $$;

create index if not exists client_intake_por_sitio
  on public.client_intake (site_id)
  where site_id is not null;
