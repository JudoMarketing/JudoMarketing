-- ============================================================
-- 0024: Poder volver a tomar la portada de un website
--
-- Las portadas del showcase las saca un servicio de capturas, y ese servicio
-- guarda cada foto por 24 horas contra la dirección exacta que se le pidió,
-- salga bien o salga mal. Si el sitio todavía estaba pintando cuando disparó,
-- la portada queda en blanco y no hay forma de arreglarla: pedir lo mismo
-- devuelve el mismo blanco hasta el otro día.
--
-- Esta columna guarda cuándo se pidió la última foto. Cambia la dirección que
-- se le pide al servicio, así que obliga a una captura nueva. La llena el
-- botón "Actualizar portada" del portal.
-- ============================================================

do $$
begin
  if to_regclass('public.sites') is null then
    raise exception
      'Proyecto equivocado: aquí no existe la tabla "sites". Esta migración va en el proyecto de judomarketing.net (ajsuskyeatgatbubctzl).';
  end if;
end $$;

alter table sites add column if not exists portfolio_shot_at timestamptz;

comment on column sites.portfolio_shot_at is
  'Cuándo se pidió la última portada del showcase. Al cambiarlo se fuerza una captura nueva.';
