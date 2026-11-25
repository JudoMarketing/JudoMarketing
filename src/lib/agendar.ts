import { createClient } from "@supabase/supabase-js";
import { brandedEmail, isEmailConfigured, sendBrandedEmail } from "@/lib/email";
import {
  DIAS_A_FUTURO,
  TZ,
  chocaConOcupado,
  cupoValido,
  cuposEnRango,
  finDeCita,
  invitacionIcs,
} from "@/lib/booking";
import { crearCitaEnGoogle, horariosOcupados } from "@/lib/google-calendar";

/**
 * Agendar una videollamada (Google Meet), en un solo lugar.
 *
 * La usan el calendario de la página de contacto (/api/booking) y el chat de
 * la mascota (/api/chat), para que las dos agenden con las mismas reglas: la
 * rejilla de cada dos horas, el choque con la agenda de Google y con las citas
 * de la base, el tope por IP y los mismos correos. El chat nunca decide si un
 * horario está libre: lo decide esto (CEREBRO, «Asistentes de IA»).
 *
 * El correo de negocio (admin@judomarketing.net) recibe la confirmación con
 * los datos del cliente; el correo personal de Junior recibe la misma
 * invitación para que la cita caiga en su Google Calendar.
 */

const CORREO_NEGOCIO = "admin@judomarketing.net";
const CORREO_CALENDARIO = "juniorosorio36@gmail.com";
const ORGANIZADOR = "info@judomarketing.net";

/**
 * Agendas que se revisan para no ofrecer una hora en la que ya hay algo.
 * "primary" es la del calendario de negocio; la personal se suma para que los
 * compromisos propios también bloqueen. Se puede cambiar con
 * GOOGLE_BUSY_CALENDARS (separadas por coma).
 */
function agendasARevisar(): string[] {
  const desdeEntorno = process.env.GOOGLE_BUSY_CALENDARS?.trim();
  if (desdeEntorno) {
    return desdeEntorno
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
  }
  return ["primary", CORREO_CALENDARIO];
}

function servicio() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const llave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !llave) return null;
  return createClient(url, llave, { auth: { persistSession: false } });
}

/**
 * Tope de citas guardadas por IP: que nadie llene la agenda, ni desde el
 * calendario ni pidiéndoselo al chat. Un cliente que se equivoque escribiendo
 * su correo no lo quema: solo cuenta lo que llega a intentar guardarse.
 */
const reservas = new Map<string, number[]>();

export function pasoElLimite(mapa: Map<string, number[]>, ip: string, tope: number): boolean {
  const ahora = Date.now();
  const recientes = (mapa.get(ip) ?? []).filter((t) => ahora - t < 600_000);
  recientes.push(ahora);
  mapa.set(ip, recientes);
  return recientes.length > tope;
}

export function fechaLegible(inicio: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-ES", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(inicio);
}

/**
 * Los cupos ya tomados en un rango: las citas confirmadas de la base y los
 * ratos ocupados de las agendas de Google. Si algo falla devuelve lo que
 * pudo: el que manda sobre los choques es agendarCita, que vuelve a revisar.
 */
export async function cuposTomados(desde: Date, hasta: Date): Promise<Set<string>> {
  const [enBase, ocupados] = await Promise.all([
    (async () => {
      const supabase = servicio();
      if (!supabase) return [] as string[];
      const { data, error } = await supabase
        .from("bookings")
        .select("starts_at")
        .eq("status", "confirmada")
        .gte("starts_at", desde.toISOString())
        .lte("starts_at", hasta.toISOString());
      if (error) return [] as string[];
      return (data ?? []).map((fila) => fila.starts_at as string);
    })(),
    horariosOcupados(desde, hasta, agendasARevisar()).catch(() => []),
  ]);

  const tomados = new Set(enBase.map((s) => new Date(s).toISOString()));
  if (ocupados.length > 0) {
    for (const cupo of cuposEnRango(desde, hasta)) {
      if (chocaConOcupado(cupo, ocupados)) tomados.add(cupo.toISOString());
    }
  }
  return tomados;
}

export type DatosCita = {
  slot?: string;
  name?: string;
  email?: string;
  phone?: string | null;
  smsConsent?: boolean;
  note?: string | null;
  locale?: string;
};

export type ResultadoCita =
  | { ok: true; id: string; inicio: Date; meet: string | null; google: boolean }
  | {
      ok: false;
      error: "bad_request" | "slot_invalid" | "rate_limited" | "slot_taken" | "server_error";
      status: number;
    };

/** Valida, revisa choques, guarda la cita y avisa por correo. */
export async function agendarCita(datos: DatosCita, ip: string): Promise<ResultadoCita> {
  if (!datos.slot || !datos.name || !datos.email) {
    return { ok: false, error: "bad_request", status: 400 };
  }

  const nombre = datos.name.trim();
  const correo = datos.email.trim().toLowerCase();
  const telefono = datos.phone?.trim().slice(0, 40) || null;
  // Solo cuenta si hay teléfono y la casilla vino marcada de verdad
  const smsConsent = Boolean(telefono) && datos.smsConsent === true;
  const nota = datos.note?.trim().slice(0, 400) || null;
  const locale = datos.locale === "en" ? "en" : "es";

  if (
    nombre.length < 2 ||
    nombre.length > 80 ||
    correo.length < 5 ||
    correo.length > 120 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)
  ) {
    return { ok: false, error: "bad_request", status: 400 };
  }

  const inicio = new Date(datos.slot);
  if (Number.isNaN(inicio.getTime())) {
    return { ok: false, error: "bad_request", status: 400 };
  }

  // El horario tiene que caer en la rejilla de cada dos horas, estar en el
  // futuro y dentro de los próximos dos meses.
  const ahora = Date.now();
  const limite = ahora + DIAS_A_FUTURO * 24 * 60 * 60_000;
  if (!cupoValido(inicio) || inicio.getTime() < ahora || inicio.getTime() > limite) {
    return { ok: false, error: "slot_invalid", status: 400 };
  }

  // Ya sabemos que la solicitud es legítima: ahora sí cuenta contra el tope
  // de citas por IP.
  if (pasoElLimite(reservas, ip, 3)) {
    return { ok: false, error: "rate_limited", status: 429 };
  }

  // El calendario ya apaga las horas ocupadas, pero alguien podría mandar el
  // horario a mano: se vuelve a revisar contra la agenda antes de guardar.
  const ocupados = await horariosOcupados(inicio, finDeCita(inicio), agendasARevisar());
  if (chocaConOcupado(inicio, ocupados)) {
    return { ok: false, error: "slot_taken", status: 409 };
  }

  const supabase = servicio();
  if (!supabase) {
    return { ok: false, error: "server_error", status: 500 };
  }

  const { data: cita, error } = await supabase
    .from("bookings")
    .insert({
      starts_at: inicio.toISOString(),
      name: nombre,
      email: correo,
      phone: telefono,
      sms_consent: smsConsent,
      sms_consent_at: smsConsent ? new Date().toISOString() : null,
      note: nota,
      locale,
    })
    .select("id")
    .single();

  if (error) {
    // 23505 = el índice único rebotó: alguien agarró ese cupo primero.
    if (error.code === "23505") return { ok: false, error: "slot_taken", status: 409 };
    return { ok: false, error: "server_error", status: 500 };
  }

  // La cita ya quedó guardada. Si el correo falla no se devuelve un error al
  // cliente: la cita es real y Administración la ve igual en su portal.
  let aviso: Aviso = { meet: null, google: false };
  try {
    aviso = await avisarPorCorreo({ id: cita.id as string, inicio, nombre, correo, telefono, nota, locale });
  } catch (fallo) {
    console.error("cita guardada pero el aviso no salió:", fallo);
  }

  return { ok: true, id: cita.id as string, inicio, meet: aviso.meet, google: aviso.google };
}

/** Lo que sabemos de la cita después de avisar: enlace de Meet y si lo creó Google. */
type Aviso = { meet: string | null; google: boolean };

async function avisarPorCorreo({
  id,
  inicio,
  nombre,
  correo,
  telefono,
  nota,
  locale,
}: {
  id: string;
  inicio: Date;
  nombre: string;
  correo: string;
  telefono: string | null;
  nota: string | null;
  locale: string;
}): Promise<Aviso> {
  const fin = finDeCita(inicio);
  const cuandoEs = fechaLegible(inicio, "es");
  const cuandoCliente = fechaLegible(inicio, locale);
  const invitados = [CORREO_NEGOCIO, CORREO_CALENDARIO, correo];

  const detalle = [
    `Videollamada con ${nombre}.`,
    `Correo: ${correo}`,
    telefono ? `Teléfono: ${telefono}` : "",
    nota ? `Nota: ${nota}` : "",
  ].filter(Boolean);

  // Plan A: Google crea el evento con su propio enlace de Meet y manda las
  // invitaciones. Plan B (si Google no está configurado o falla): la
  // invitación estándar adjunta al correo, que Gmail agrega igual al calendario.
  const enGoogle = await crearCitaEnGoogle({
    id,
    inicio,
    fin,
    titulo: `Videollamada · ${nombre} · Judo Marketing`,
    descripcion: detalle.join("\n"),
    zonaHoraria: TZ,
    invitados,
  });

  const meet = enGoogle?.enlaceMeet ?? process.env.GOOGLE_MEET_URL?.trim() ?? null;
  const resultado: Aviso = { meet, google: Boolean(enGoogle) };

  if (!isEmailConfigured()) return resultado;

  // Si Google ya mandó sus invitaciones, no se adjunta otra: sería duplicada.
  const invitacion = enGoogle
    ? undefined
    : invitacionIcs({
        uid: id,
        inicio,
        fin,
        titulo: `Videollamada · ${nombre} · Judo Marketing`,
        descripcion: [...detalle, meet ? `Google Meet: ${meet}` : "Enlace de Google Meet: por confirmar."].join("\n"),
        lugar: meet || "Google Meet",
        organizador: ORGANIZADOR,
        invitados,
      });

  // 1) Aviso interno, al correo de negocio y al personal.
  const interno = brandedEmail({
    title: "Nueva videollamada agendada 🎥",
    greeting: cuandoEs,
    paragraphs: [
      `<b>${nombre}</b> agendó una videollamada.`,
      `Correo: <a href="mailto:${correo}" style="color:#a855f7;">${correo}</a>`,
      telefono ? `Teléfono: ${telefono}` : "Teléfono: no lo dejó.",
      nota ? `Nota del cliente: “${nota}”` : "Sin nota adicional.",
      meet
        ? `Google Meet: <a href="${meet}" style="color:#a855f7;">${meet}</a>`
        : "Recuerda mandarle el enlace de la reunión.",
      enGoogle
        ? "La cita ya está en tu Google Calendar con su enlace de Meet."
        : "La invitación va adjunta: al abrirla se agrega sola a tu Google Calendar.",
    ],
  });

  await sendBrandedEmail([CORREO_NEGOCIO, CORREO_CALENDARIO], `Videollamada: ${nombre} · ${cuandoEs}`, interno, {
    invitacion,
    replyTo: correo,
  });

  // 2) Confirmación para el cliente, en su idioma.
  const esIngles = locale === "en";
  const cliente = brandedEmail({
    title: esIngles ? "Your meeting is booked 🎥" : "Tu reunión quedó agendada 🎥",
    greeting: `${esIngles ? "Hi" : "Hola"}, ${nombre.split(" ")[0]} 👋`,
    paragraphs: esIngles
      ? [
          `We'll meet on <b>${cuandoCliente}</b> (Miami time).`,
          meet
            ? `Join on Google Meet: <a href="${meet}" style="color:#a855f7;">${meet}</a>`
            : "We'll send you the Google Meet link before the call.",
          enGoogle
            ? "Google sent you the calendar invite separately. Accept it and you're set."
            : "The invitation is attached. Open it and it goes straight into your calendar.",
          "Need to change it? Just reply to this email.",
        ]
      : [
          `Nos vemos el <b>${cuandoCliente}</b> (hora de Miami).`,
          meet
            ? `Entra por Google Meet: <a href="${meet}" style="color:#a855f7;">${meet}</a>`
            : "Te mandamos el enlace de Google Meet antes de la llamada.",
          enGoogle
            ? "Google te mandó la invitación de calendario por separado: acéptala y listo."
            : "La invitación va adjunta: al abrirla se guarda sola en tu calendario.",
          "¿Necesitas cambiarla? Respóndenos este mismo correo.",
        ],
    ctaLabel: esIngles ? "Visit our site" : "Visitar el sitio",
    ctaUrl: "https://www.judomarketing.net",
  });

  await sendBrandedEmail(
    correo,
    esIngles ? `Your meeting with Judo Marketing · ${cuandoCliente}` : `Tu reunión con Judo Marketing · ${cuandoCliente}`,
    cliente,
    { invitacion, replyTo: CORREO_NEGOCIO }
  );

  return resultado;
}
