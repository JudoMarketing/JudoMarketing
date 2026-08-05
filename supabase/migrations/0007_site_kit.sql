-- Judo Marketing — Fase 5: Judo Site Kit (red de sitios de clientes)
-- Aplicar DESPUÉS de 0006_hardening.sql.
--
-- Cada website de cliente lleva el Kit, que se identifica con la clave
-- secreta kit_api_key de su fila en `sites`. Con ella puede:
--   1. Consultar su estado (activo/deshabilitado) → kill switch
--   2. Reportar telemetría (ventas, tráfico, seo) → panel central

-- Estado del sitio (el kill switch consulta esto cada minuto)
create or replace function public.site_status(kit_key uuid)
returns text
language sql stable security definer set search_path = public
as $$
  select status::text from sites where kit_api_key = kit_key;
$$;

-- Telemetría del sitio hacia el panel central
create or replace function public.report_site_metrics(
  kit_key uuid,
  p_is_live boolean default true,
  p_sales int default null,
  p_traffic int default null,
  p_seo int default null,
  p_detail jsonb default null
)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_site uuid;
begin
  select id into v_site from sites where kit_api_key = kit_key;
  if v_site is null then
    return; -- clave desconocida: se ignora en silencio
  end if;
  insert into site_metrics (site_id, is_live, sales_count, traffic_count, seo_score, detail)
  values (v_site, p_is_live, p_sales, p_traffic, p_seo, p_detail);
end;
$$;

revoke all on function public.site_status(uuid) from public;
revoke all on function public.report_site_metrics(uuid, boolean, int, int, int, jsonb) from public;
grant execute on function public.site_status(uuid) to anon, authenticated;
grant execute on function public.report_site_metrics(uuid, boolean, int, int, int, jsonb) to anon, authenticated;
