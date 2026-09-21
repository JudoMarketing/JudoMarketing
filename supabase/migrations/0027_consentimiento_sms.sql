-- ============================================================
-- 0027: Consentimiento de SMS en las citas
--
-- Para mandar mensajes de texto desde un número de empresa en EE. UU.
-- (registro 10DLC, el que pide Zoom Phone y cualquier operador) hay que
-- poder demostrar que la persona dio su consentimiento: cuándo y desde
-- dónde. El formulario de cita tiene una casilla, sin marcar por defecto,
-- y aquí queda constancia de si la marcó.
-- ============================================================

do $$
begin
  if to_regclass('public.bookings') is null then
    raise exception
      'Proyecto equivocado: aquí no existe la tabla "bookings". Esta migración va en el proyecto de judomarketing.net (ajsuskyeatgatbubctzl).';
  end if;
end $$;

alter table bookings
  add column if not exists sms_consent boolean not null default false,
  add column if not exists sms_consent_at timestamptz;

comment on column bookings.sms_consent is
  'La persona marcó la casilla de recibir mensajes de texto al agendar. Falso por defecto: nunca se asume.';
