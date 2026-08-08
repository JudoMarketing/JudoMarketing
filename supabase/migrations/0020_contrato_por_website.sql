-- ============================================================
-- 0020: Cada contrato firmado pertenece a un website
--
-- Un contrato suelto no es papeleo: es plata que ya se cerró y trabajo que
-- todavía no existe. Mientras no tenga website asignado queda como pendiente
-- en el portal, porque significa exactamente eso — el cliente firmó y su
-- sitio no está creado.
--
-- Al asignarlo, el contrato deja de flotar: se ve dentro del expediente de
-- ese website, junto a lo que el cliente pidió el primer día.
-- ============================================================

do $$
begin
  if to_regclass('public.signed_contracts') is null then
    raise exception
      'Proyecto equivocado: aquí no existe la tabla "signed_contracts". Esta migración va en el proyecto de judomarketing.net (ajsuskyeatgatbubctzl).';
  end if;
end $$;

alter table signed_contracts
  add column if not exists site_id uuid references sites (id) on delete set null;

create index if not exists signed_contracts_por_sitio
  on signed_contracts (site_id)
  where site_id is not null;

-- El vendedor firma, pero no decide a qué website va: eso lo asigna
-- Administración desde su portal. Su contrato nace sin sitio.
drop policy if exists "vendedor: crear contrato" on signed_contracts;
create policy "vendedor: crear contrato" on signed_contracts
  for insert to authenticated
  with check (seller_id = auth.uid() and site_id is null);
