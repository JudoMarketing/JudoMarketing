-- ============================================================
-- 0010: Bono por referir vendedores
-- Regla del dueño: el vendedor que refirió a otro vendedor gana
-- $10 extra UNA SOLA VEZ por cada suscripción (website) que
-- consiga su referido. Dos contratos mensuales = $20, y nunca más
-- recibe por esos sitios, solo por sitios nuevos del referido.
-- El bono se acredita con el PRIMER pago del sitio (la suscripción
-- se considera conseguida cuando el cliente paga por primera vez).
-- Requiere la migración 0009.
-- ============================================================

create table if not exists referral_bonuses (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references sellers (id),
  referred_id uuid not null references sellers (id),
  site_id uuid not null references sites (id) unique,
  amount numeric(10, 2) not null default 10,
  status commission_status not null default 'pendiente',
  paid_at date,
  created_at timestamptz not null default now()
);

create index if not exists referral_bonuses_referrer_idx
  on referral_bonuses (referrer_id, status);

alter table referral_bonuses enable row level security;

create policy "admin: bonos de referido" on referral_bonuses
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "vendedor: sus bonos de referido" on referral_bonuses
  for select to authenticated
  using (referrer_id = auth.uid());

-- ── Bono automático con el primer pago del sitio ─────────────
create or replace function public.create_referral_bonus_for_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  the_site sites%rowtype;
  the_referrer uuid;
begin
  select * into the_site from sites where id = new.site_id;
  if the_site.id is null or the_site.seller_id is null then
    return new;
  end if;

  -- Solo el primer pago del sitio acredita el bono (una sola vez)
  if exists (
    select 1 from payments
    where site_id = new.site_id and id <> new.id
  ) then
    return new;
  end if;

  select referred_by into the_referrer
  from sellers where id = the_site.seller_id;
  if the_referrer is null then
    return new;
  end if;

  insert into referral_bonuses (referrer_id, referred_id, site_id)
  values (the_referrer, the_site.seller_id, new.site_id)
  on conflict (site_id) do nothing;

  return new;
end;
$$;

drop trigger if exists trg_payment_referral_bonus on payments;
create trigger trg_payment_referral_bonus
  after insert on payments
  for each row execute function public.create_referral_bonus_for_payment();
