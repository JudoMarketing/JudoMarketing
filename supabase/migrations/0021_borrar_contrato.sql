-- ============================================================
-- 0021: Borrar un contrato que nunca se volvió cliente
--
-- Pasa: el cliente firma, no paga nunca, o se arrepiente a los dos días. Ese
-- contrato no puede quedarse contando como venta cerrada ni ensuciando la
-- lista de pendientes.
--
-- La fila la borra Administración desde su portal (ya podía, con "admin:
-- contratos"). Lo que faltaba era poder borrar también el PDF: el bucket solo
-- tenía permisos de subir y de leer, así que el archivo quedaba huérfano
-- ocupando espacio para siempre.
--
-- Nadie más puede borrar: el vendedor que lo firmó, tampoco. Un contrato es
-- evidencia, y quien la retira tiene que ser uno solo.
-- ============================================================

do $$
begin
  if to_regclass('public.signed_contracts') is null then
    raise exception
      'Proyecto equivocado: aquí no existe la tabla "signed_contracts". Esta migración va en el proyecto de judomarketing.net (ajsuskyeatgatbubctzl).';
  end if;
end $$;

drop policy if exists "admin borra contratos" on storage.objects;
create policy "admin borra contratos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'contracts' and public.is_admin());
