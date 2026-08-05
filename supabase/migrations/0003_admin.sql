-- Judo Marketing — Fase 4: portal de administración
-- Aplicar DESPUÉS de 0002_portal.sql.
-- La cuenta admin es la que se registre con admin@judomarketing.net.

-- ── Helper: ¿el usuario actual es admin? ─────────────────────────────
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- ── Cierre de seguridad: nadie puede auto-cambiarse el rol ───────────
-- (la política "actualizar perfil propio" de 0002 permitía cambiar
-- cualquier columna, incluido role — esto lo corrige a nivel de columnas)
revoke update on public.profiles from authenticated;
grant update (full_name, photo_url, phone, language)
  on public.profiles to authenticated;

-- ── El registro de admin@judomarketing.net se vuelve admin ───────────
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
  -- La cuenta oficial de administración no es un vendedor
  if lower(new.email) = 'admin@judomarketing.net' then
    insert into public.profiles (id, role, full_name, language)
    values (new.id, 'admin', coalesce(v_full_name, 'Administración'), 'es');
    insert into public.terms_acceptances (user_id, document, version)
    values (new.id, 'service-policy', v_terms_version);
    return new;
  end if;

  insert into public.profiles (id, role, full_name, language)
  values (new.id, 'vendedor', v_full_name,
          coalesce(new.raw_user_meta_data ->> 'language', 'es'));

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

-- Si la cuenta admin ya se registró antes de esta migración, promoverla
update public.profiles set role = 'admin'
where id in (select id from auth.users where lower(email) = 'admin@judomarketing.net');
delete from public.sellers
where id in (select id from auth.users where lower(email) = 'admin@judomarketing.net');

-- ── Políticas de administrador ───────────────────────────────────────
create policy "admin: leer perfiles" on profiles
  for select to authenticated using (public.is_admin());
create policy "admin: leer vendedores" on sellers
  for select to authenticated using (public.is_admin());
create policy "admin: actualizar vendedores" on sellers
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin: clientes" on clients
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin: sitios" on sites
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin: pagos" on payments
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin: comisiones" on commissions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin: ver visitas" on visits
  for select to authenticated using (public.is_admin());
create policy "admin: ver aceptaciones" on terms_acceptances
  for select to authenticated using (public.is_admin());
create policy "admin: comprobantes" on payment_proofs
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin: auditoría" on audit_log
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin: métricas" on site_metrics
  for select to authenticated using (public.is_admin());

-- Admin puede ver las capturas de pago (necesario para URLs firmadas)
create policy "admin lee capturas de pago" on storage.objects
  for select to authenticated
  using (bucket_id = 'payment-proofs' and public.is_admin());
