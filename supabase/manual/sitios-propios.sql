-- ============================================================
-- Alta de los websites propios de Junior Osorio
--
--   zanoah.shop               · postres saludables (Miami)
--   deliveryrushflorida.com   · mensajería urgente (Miami y Orlando)
--
-- Los dos ya están publicados y los dominios son suyos, así que entran como
-- 'activo', con precio 0 (nadie paga mensualidad por ellos) y sin vendedor
-- asignado, para que no generen comisión.
--
-- Se corre en Supabase → SQL Editor. Se puede correr las veces que haga
-- falta: si un dominio ya existe, ese se salta y los demás siguen.
-- ============================================================

with cliente_existente as (
  select id from clients where email = 'juniorosorio36@gmail.com' limit 1
),
cliente_nuevo as (
  insert into clients (full_name, email, profile_id)
  select
    'Junior Osorio',
    'juniorosorio36@gmail.com',
    (select id from auth.users where email = 'juniorosorio36@gmail.com' limit 1)
  where not exists (select 1 from cliente_existente)
  returning id
)
insert into sites (name, domain, client_id, seller_id, status, monthly_price)
select
  nuevos.nombre,
  nuevos.dominio,
  coalesce(
    (select id from cliente_existente),
    (select id from cliente_nuevo)
  ),
  null,
  'activo',
  0
from (
  values
    ('Zanoah', 'zanoah.shop'),
    ('Delivery Rush Florida', 'deliveryrushflorida.com')
) as nuevos (nombre, dominio)
where not exists (
  select 1 from sites where sites.domain = nuevos.dominio
);

-- Para confirmar que quedaron:
-- select name, domain, status, monthly_price from sites order by created_at desc;
