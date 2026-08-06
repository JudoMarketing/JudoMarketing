/**
 * Reglas de las citas por videollamada (Google Meet).
 *
 * Todo se maneja en hora de Miami. Las citas arrancan a las 7:00 AM y la
 * ultima entra a la 1:00 AM (madrugada del dia siguiente), con dos horas de
 * separacion entre una y otra. Este archivo lo comparten el calendario del
 * visitante y la API, para que ambos calculen exactamente los mismos horarios.
 */

export const TZ = "America/New_York";
export const PRIMERA_HORA = 7; // 7:00 AM
export const SALTO_HORAS = 2; // dos horas entre cita y cita
export const CUPOS_POR_DIA = 10; // 7, 9, 11, 13, 15, 17, 19, 21, 23 y 1 AM
export const DURACION_MINUTOS = 45;
export const DIAS_A_FUTURO = 60;

/** Horas de pared validas: 7, 9, 11, 13, 15, 17, 19, 21, 23 y 25 (= 1 AM). */
export function horasDelDia(): number[] {
  return Array.from(
    { length: CUPOS_POR_DIA },
    (_, i) => PRIMERA_HORA + i * SALTO_HORAS
  );
}

/** Cuanto se adelanta Miami respecto a UTC en ese instante, en milisegundos. */
function desfaseMiami(instante: Date): number {
  const formato = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const partes = formato.formatToParts(instante);
  const leer = (tipo: string) =>
    Number(partes.find((p) => p.type === tipo)?.value ?? 0);
  const hora = leer("hour") === 24 ? 0 : leer("hour");
  const comoUtc = Date.UTC(
    leer("year"),
    leer("month") - 1,
    leer("day"),
    hora,
    leer("minute"),
    leer("second")
  );
  return comoUtc - (instante.getTime() - instante.getMilliseconds());
}

/**
 * Convierte una hora de pared de Miami al instante real. La hora puede pasarse
 * de 24 (25 = 1:00 AM del dia siguiente); el calculo lo resuelve solo.
 * Se calcula dos veces porque en los cambios de horario de verano el desfase
 * del primer intento puede no ser el definitivo.
 */
export function miamiAUtc(
  anio: number,
  mes: number,
  dia: number,
  hora: number
): Date {
  const tentativo = Date.UTC(anio, mes - 1, dia, hora);
  const primer = tentativo - desfaseMiami(new Date(tentativo));
  const segundo = tentativo - desfaseMiami(new Date(primer));
  return new Date(segundo);
}

/** Fecha y hora de pared en Miami para un instante dado. */
export function partesMiami(instante: Date) {
  const formato = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
  const partes = formato.formatToParts(instante);
  const leer = (tipo: string) =>
    Number(partes.find((p) => p.type === tipo)?.value ?? 0);
  return {
    anio: leer("year"),
    mes: leer("month"),
    dia: leer("day"),
    hora: leer("hour") === 24 ? 0 : leer("hour"),
    minuto: leer("minute"),
  };
}

/** Los diez cupos de un dia, como instantes reales. */
export function cuposDelDia(anio: number, mes: number, dia: number): Date[] {
  return horasDelDia().map((hora) => miamiAUtc(anio, mes, dia, hora));
}

/**
 * Un cupo es valido si cae en punto y en una de las horas permitidas.
 * Las horas validas son todas impares: 1 AM, y de 7 AM a 11 PM.
 */
export function cupoValido(instante: Date): boolean {
  const { hora, minuto } = partesMiami(instante);
  if (minuto !== 0) return false;
  if (hora === 1) return true;
  return hora >= PRIMERA_HORA && hora <= 23 && hora % 2 === 1;
}

/** "7:00 AM", "1:00 PM", "1:00 AM"… a partir de la hora de pared. */
export function etiquetaHora(hora: number): string {
  const h = hora % 24;
  const sufijo = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:00 ${sufijo}`;
}

/** Fin de la reunion. */
export function finDeCita(inicio: Date): Date {
  return new Date(inicio.getTime() + DURACION_MINUTOS * 60_000);
}

// ── Invitación de calendario (.ics) ────────────────────────────────────────

function marcaIcs(fecha: Date): string {
  return fecha.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapar(texto: string): string {
  return texto
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Invitación estándar de calendario. Al llegar por correo, Gmail la reconoce
 * y la agrega sola al Google Calendar de quien la recibe.
 */
export function invitacionIcs({
  uid,
  inicio,
  fin,
  titulo,
  descripcion,
  lugar,
  organizador,
  invitados,
}: {
  uid: string;
  inicio: Date;
  fin: Date;
  titulo: string;
  descripcion: string;
  lugar: string;
  organizador: string;
  invitados: string[];
}): string {
  const lineas = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Judo Marketing//Citas//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${uid}@judomarketing.net`,
    `DTSTAMP:${marcaIcs(new Date())}`,
    `DTSTART:${marcaIcs(inicio)}`,
    `DTEND:${marcaIcs(fin)}`,
    `SUMMARY:${escapar(titulo)}`,
    `DESCRIPTION:${escapar(descripcion)}`,
    `LOCATION:${escapar(lugar)}`,
    `ORGANIZER;CN=Judo Marketing:mailto:${organizador}`,
    ...invitados.map(
      (correo) =>
        `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${correo}`
    ),
    "STATUS:CONFIRMED",
    "SEQUENCE:0",
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapar(titulo)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lineas.join("\r\n");
}
