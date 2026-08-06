-- ============================================================
-- 0012: Candado de la foto de perfil del vendedor
-- Regla del dueño: el vendedor sube su selfie cuando pueda (antes o
-- después de ser aprobado), y una vez subida NO puede cambiarla.
-- Solo Administración puede desbloquearla pidiendo una foto nueva.
-- ============================================================

alter table profiles
  add column if not exists photo_change_requested boolean not null default false;

-- ── El candado: nadie que no sea admin cambia una foto ya puesta ──
create or replace function public.enforce_photo_lock()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if new.photo_url is distinct from old.photo_url then
    -- Solo se permite si no hay foto todavía, o si Administración la pidió
    if old.photo_url is not null and not coalesce(old.photo_change_requested, false) then
      raise exception 'La foto de perfil solo la puede cambiar Administración';
    end if;
    -- Al subir la nueva foto, la solicitud queda cerrada
    new.photo_change_requested := false;
  else
    -- El vendedor nunca levanta la bandera por su cuenta
    new.photo_change_requested := old.photo_change_requested;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_photo_lock on profiles;
create trigger trg_photo_lock
  before update on profiles
  for each row execute function public.enforce_photo_lock();

-- ── Administración pide una foto nueva (única forma de desbloquear) ──
create or replace function public.request_photo_change(target uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Solo Administración puede pedir una foto nueva';
  end if;
  update profiles set photo_change_requested = true where id = target;
end;
$$;

grant execute on function public.request_photo_change(uuid) to authenticated;
