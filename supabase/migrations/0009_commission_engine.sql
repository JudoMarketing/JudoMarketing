-- ============================================================
-- 0009: Motor de comisiones
-- Reglas de negocio del dueño:
--  · Cada pago de un website genera automáticamente la comisión del
--    vendedor asignado, según su tarifa individual (monto fijo por cada
--    $50 vendidos, o porcentaje de la venta).
--  · Regla de solvencia: si un website está deshabilitado no genera
--    comisión, y al deshabilitarlo se anulan las comisiones pendientes
--    de ese mes para ese sitio.
--  · El vendedor puede ver sus comisiones, los pagos de sus sitios
--    (para "total vendido") y sus sitios asignados.
-- ============================================================

-- Nuevo estado para la regla de solvencia
alter type commission_status add value if not exists 'anulada';

-- Columnas nuevas: sitio de origen, mes de la comisión y nota
alter table commissions add column if not exists site_id uuid references sites (id);
alter table commissions add column if not exists period date;
alter table commissions add column if not exists note text;
create index if not exists commissions_site_period_idx on commissions (site_id, period);

-- ── Comisión automática al registrar un pago ─────────────────
create or replace function public.create_commission_for_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  the_site sites%rowtype;
  the_seller sellers%rowtype;
  commission_amount numeric(10, 2);
begin
  select * into the_site from sites where id = new.site_id;
  if the_site.id is null or the_site.seller_id is null then
    return new;
  end if;

  -- Regla de solvencia: un sitio deshabilitado no genera comisión
  if the_site.status = 'deshabilitado' then
    return new;
  end if;

  select * into the_seller from sellers where id = the_site.seller_id;
  if the_seller.commission_kind is null or coalesce(the_seller.commission_value, 0) <= 0 then
    return new;
  end if;

  if the_seller.commission_kind = 'porcentaje' then
    commission_amount := round(new.amount * the_seller.commission_value / 100.0, 2);
  else
    -- monto fijo por cada $50 cobrados (proporcional al monto del pago)
    commission_amount := round(new.amount / 50.0 * the_seller.commission_value, 2);
  end if;

  if commission_amount <= 0 then
    return new;
  end if;

  insert into commissions (seller_id, payment_id, site_id, amount, period)
  values (
    the_site.seller_id,
    new.id,
    new.site_id,
    commission_amount,
    date_trunc('month', new.paid_at)::date
  )
  on conflict (payment_id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_payment_commission on payments;
create trigger trg_payment_commission
  after insert on payments
  for each row execute function public.create_commission_for_payment();

-- ── Regla de solvencia al deshabilitar un sitio ──────────────
create or replace function public.void_commissions_on_disable()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'deshabilitado' and old.status is distinct from new.status then
    update commissions
       set status = 'anulada',
           note = trim(coalesce(note, '') || ' Anulada: el sitio fue deshabilitado este mes.')
     where site_id = new.id
       and status = 'pendiente'
       and period = date_trunc('month', current_date)::date;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_site_disable_void on sites;
create trigger trg_site_disable_void
  after update of status on sites
  for each row execute function public.void_commissions_on_disable();

-- ── Lo que el vendedor puede ver de lo suyo ──────────────────
drop policy if exists "vendedor: sus comisiones" on commissions;
create policy "vendedor: sus comisiones" on commissions
  for select to authenticated
  using (seller_id = auth.uid());

drop policy if exists "vendedor: sus sitios" on sites;
create policy "vendedor: sus sitios" on sites
  for select to authenticated
  using (seller_id = auth.uid());

drop policy if exists "vendedor: pagos de sus sitios" on payments;
create policy "vendedor: pagos de sus sitios" on payments
  for select to authenticated
  using (
    exists (
      select 1 from sites
      where sites.id = payments.site_id
        and sites.seller_id = auth.uid()
    )
  );
