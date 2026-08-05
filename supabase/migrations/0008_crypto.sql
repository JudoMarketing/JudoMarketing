-- Judo Marketing — Fase de pagos: opción cripto (USDT ERC-20, red Ethereum)
-- Aplicar DESPUÉS de 0007_site_kit.sql.
-- El comprobante de Zelle exige captura; el de USDT exige el hash de la
-- transacción (la captura queda opcional).

alter table payment_proofs add column if not exists method text not null default 'zelle';
alter table payment_proofs add column if not exists tx_hash text;
alter table payment_proofs alter column screenshot_path drop not null;

alter table payment_proofs
  add constraint payment_proofs_method_check
  check (method in ('zelle', 'usdt'));

alter table payment_proofs
  add constraint payment_proofs_proof_check
  check (
    (method = 'zelle' and screenshot_path is not null)
    or (method = 'usdt' and tx_hash is not null)
  );
