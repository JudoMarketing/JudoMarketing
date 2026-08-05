-- Judo Marketing — Fase 3: registro de vendedores, portal y pagos por Zelle
-- Aplicar DESPUÉS de 0001_init.sql en el SQL Editor de Supabase.

-- ── Comprobantes de pago por Zelle (los suben visitantes sin cuenta) ──
create table payment_proofs (
  id uuid primary key default gen_random_uuid(),
  plan text not null check (plan in ('essential', 'complex', 'apps')),
  payer_name text not null,
  referral_code text,
  source text check (source in ('google', 'friend', 'social') or source is null),
  screenshot_path text not null,
  status text not null default 'pendiente' check (status in ('pendiente', 'verificado', 'rechazado')),
  created_at timestamptz not null default now()
);
alter table payment_proofs enable row level security;

-- Cualquiera puede ENVIAR un comprobante; solo el backend (service role) los lee
create policy "anon puede insertar comprobantes"
  on payment_proofs for insert
  to anon, authenticated
  with check (true);

-- ── Buckets de Storage ────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "subir comprobante de pago"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'payment-proofs');

create policy "vendedor sube su propia foto"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "avatars son públicos para leer"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- ── Trigger: crear perfil + vendedor al registrarse ──────────────────
-- El registro público del sitio es SOLO para vendedores. El registro guarda
-- en metadata: full_name, referred_by_code (opcional) y la aceptación de
-- términos (versión + fecha) que este trigger vuelca como evidencia.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_full_name text := coalesce(new.raw_user_meta_data ->> 'full_name', 'Sin nombre');
  v_ref_code text := nullif(trim(new.raw_user_meta_data ->> 'referred_by_code'), '');
  v_terms_version text := coalesce(new.raw_user_meta_data ->> 'terms_version', 'unknown');
  v_my_code text;
  v_referrer uuid;
begin
  insert into public.profiles (id, role, full_name, language)
  values (new.id, 'vendedor', v_full_name,
          coalesce(new.raw_user_meta_data ->> 'language', 'es'));

  -- Código de referido propio = su nombre (regla del dueño); si choca,
  -- se le añade un sufijo corto del id
  v_my_code := lower(regexp_replace(v_full_name, '\s+', '', 'g'));
  if exists (select 1 from public.sellers s where s.referral_code = v_my_code) then
    v_my_code := v_my_code || substr(new.id::text, 1, 4);
  end if;

  if v_ref_code is not null then
    select s.id into v_referrer
    from public.sellers s
    where lower(s.referral_code) = lower(regexp_replace(v_ref_code, '\s+', '', 'g'))
    limit 1;
  end if;

  insert into public.sellers (id, status, referral_code, referred_by)
  values (new.id, 'pendiente', v_my_code, v_referrer);

  insert into public.terms_acceptances (user_id, document, version)
  values
    (new.id, 'service-policy', v_terms_version),
    (new.id, 'acuerdo-programa-vendedores', v_terms_version);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── Políticas RLS para el portal del vendedor ────────────────────────
create policy "perfil propio: leer" on profiles
  for select to authenticated using (auth.uid() = id);
create policy "perfil propio: actualizar" on profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "vendedor: leer su ficha" on sellers
  for select to authenticated using (auth.uid() = id);

create policy "vendedor: registrar visitas" on visits
  for insert to authenticated with check (auth.uid() = seller_id);
create policy "vendedor: ver sus visitas" on visits
  for select to authenticated using (auth.uid() = seller_id);

create policy "vendedor: ver sus comisiones" on commissions
  for select to authenticated using (auth.uid() = seller_id);

create policy "usuario: ver sus aceptaciones" on terms_acceptances
  for select to authenticated using (auth.uid() = user_id);
