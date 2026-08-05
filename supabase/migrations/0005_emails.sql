-- Judo Marketing — Email visible en profiles (para notificaciones y
-- para que Administración pueda escribirle a sus vendedores).
-- Aplicar DESPUÉS de 0004_contracts.sql.

alter table profiles add column if not exists email text;

-- Rellenar los existentes desde auth.users
update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is null;

-- El trigger ahora guarda el email al crear el perfil
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
  if lower(new.email) = 'admin@judomarketing.net' then
    insert into public.profiles (id, role, full_name, language, email)
    values (new.id, 'admin', coalesce(v_full_name, 'Administración'), 'es', new.email);
    insert into public.terms_acceptances (user_id, document, version)
    values (new.id, 'service-policy', v_terms_version);
    return new;
  end if;

  insert into public.profiles (id, role, full_name, language, email)
  values (new.id, 'vendedor', v_full_name,
          coalesce(new.raw_user_meta_data ->> 'language', 'es'), new.email);

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
