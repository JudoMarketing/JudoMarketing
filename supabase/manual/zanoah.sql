-- ============================================================
-- Alta de zanoah.shop
--
-- Website propio de Junior Osorio: el dominio es suyo y el sitio ya está
-- publicado. Por eso entra como 'activo' y con precio 0 (nadie paga una
-- mensualidad por él), y sin vendedor asignado, para que no genere comisión.
--
-- Se corre una sola vez, en Supabase → SQL Editor.
-- Si se corre dos veces falla por el dominio repetido: eso es a propósito.
-- ============================================================

with cliente as (
  insert into clients (full_name, email, profile_id)
  values (
    'Junior Osorio',
    'juniorosorio36@gmail.com',
    (select id from auth.users where email = 'juniorosorio36@gmail.com' limit 1)
  )
  returning id
)
insert into sites (name, domain, client_id, seller_id, status, monthly_price)
select 'Zanoah', 'zanoah.shop', cliente.id, null, 'activo', 0
from cliente;

-- Para confirmar que quedó:
-- select name, domain, status, monthly_price from sites where domain = 'zanoah.shop';
