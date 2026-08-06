import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { brandedEmail, isEmailConfigured, sendBrandedEmail } from "@/lib/email";
import {
  DIAS_A_FUTURO,
  TZ,
  cupoValido,
  finDeCita,
  invitacionIcs,
} from "@/lib/booking";

/**
 * Citas por Zoom.
 *  GET  ?desde=YYYY-MM-DD&hasta=YYYY-MM-DD  → cupos ya tomados en ese rango.
 *  POST                                     → agenda la cita, avisa por correo
 *                                             y manda la invitación de calendario.
 *
 * El correo de negocio (admin@judomarketing.net) recibe la confirmación con
 * los datos del cliente; el correo personal (juniorosorio36@gmail.com) recibe
 * la misma invitación para que la cita caiga en su Google Calendar.
 */

const CORREO_NEGOCIO = "admin@judomarketing.net";
const CORREO_CALENDARIO = "juniorosorio36@gmail.com";
const ORGANIZADOR = "info@judomarketing.net";

function servicio() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const llave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !llave) return null;
  return createClient(url, llave, { auth: { persistSession: false } });
}

/**
 * Dos límites por IP: uno flojo contra inundaciones (cualquier envío, aunque
 * venga mal) y otro apretado sobre las citas que sí se llegan a guardar, para
 * que nadie llene la agenda. Un cliente que se equivoque escribiendo su correo
 * no quema el segundo.
 */
const inundacion = new Map<string, number[]>();
const reservas = new Map<string, number[]>();

function pasoElLimite(
  mapa: Map<string, number[]>,
  ip: string,
  tope: number
): boolean {
  const ahora = Date.now();
  const recientes = (mapa.get(ip) ?? []).filter((t) => ahora - t < 600_000);
  recientes.push(ahora);
  mapa.set(ip, recientes);
  return recientes.length > tope;
}

function fechaLegible(inicio: Date, locale: string): string {
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

export async function GET(req: NextRequest) {
  const desde = req.nextUrl.searchParams.get("desde");
  const hasta = req.nextUrl.searchParams.get("hasta");
  if (!desde || !hasta) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  // Si la consulta falla no bloqueamos el calendario: se muestra todo libre y
  // el POST sigue siendo el que manda sobre los choques de horario.
  try {
    const supabase = servicio();
    if (!supabase) return NextResponse.json({ tomados: [] });

    const { data, error } = await supabase
      .from("bookings")
      .select("starts_at")
      .eq("status", "confirmada")
      .gte("starts_at", desde)
      .lte("starts_at", hasta);

    if (error) return NextResponse.json({ tomados: [] });

    return NextResponse.json({
      tomados: (data ?? []).map((fila) => fila.starts_at as string),
    });
  } catch {
    return NextResponse.json({ tomados: [] });
  }
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "desconocido";
  if (pasoElLimite(inundacion, ip, 20)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const cuerpo = (await req.json().catch(() => null)) as {
    slot?: string;
    name?: string;
    email?: string;
    phone?: string;
    note?: string;
    locale?: string;
  } | null;

  if (!cuerpo?.slot || !cuerpo.name || !cuerpo.email) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const nombre = cuerpo.name.trim();
  const correo = cuerpo.email.trim().toLowerCase();
  const telefono = cuerpo.phone?.trim().slice(0, 40) || null;
  const nota = cuerpo.note?.trim().slice(0, 400) || null;
  const locale = cuerpo.locale === "en" ? "en" : "es";

  if (
    nombre.length < 2 ||
    nombre.length > 80 ||
    correo.length < 5 ||
    correo.length > 120 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)
  ) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const inicio = new Date(cuerpo.slot);
  if (Number.isNaN(inicio.getTime())) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  // El horario tiene que caer en la rejilla de cada dos horas, estar en el
  // futuro y dentro de los proximos dos meses.
  const ahora = Date.now();
  const limite = ahora + DIAS_A_FUTURO * 24 * 60 * 60_000;
  if (!cupoValido(inicio) || inicio.getTime() < ahora || inicio.getTime() > limite) {
    return NextResponse.json({ error: "slot_invalid" }, { status: 400 });
  }

  // Ya sabemos que la solicitud es legítima: ahora sí cuenta contra el tope
  // de citas por IP.
  if (pasoElLimite(reservas, ip, 3)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const supabase = servicio();
  if (!supabase) {
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  const { data: cita, error } = await supabase
    .from("bookings")
    .insert({
      starts_at: inicio.toISOString(),
      name: nombre,
      email: correo,
      phone: telefono,
      note: nota,
      locale,
    })
    .select("id")
    .single();

  if (error) {
    // 23505 = el índice único rebotó: alguien agarró ese cupo primero.
    if (error.code === "23505") {
      return NextResponse.json({ error: "slot_taken" }, { status: 409 });
    }
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }

  // La cita ya quedó guardada. Si el correo falla no le devolvemos un error al
  // cliente: la cita es real y Administración la ve igual en su portal.
  try {
    await avisarPorCorreo({
      id: cita.id as string,
      inicio,
      nombre,
      correo,
      telefono,
      nota,
      locale,
    });
  } catch (fallo) {
    console.error("cita guardada pero el correo no salió:", fallo);
  }

  return NextResponse.json({ ok: true, id: cita.id });
}

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
}) {
  if (!isEmailConfigured()) return;

  const fin = finDeCita(inicio);
  const zoom = process.env.ZOOM_MEETING_URL?.trim();
  const cuandoEs = fechaLegible(inicio, "es");
  const cuandoCliente = fechaLegible(inicio, locale);

  const invitacion = invitacionIcs({
    uid: id,
    inicio,
    fin,
    titulo: `Cita Zoom · ${nombre} · Judo Marketing`,
    descripcion: [
      `Videollamada con ${nombre}.`,
      `Correo: ${correo}`,
      telefono ? `Teléfono: ${telefono}` : "",
      nota ? `Nota: ${nota}` : "",
      zoom ? `Zoom: ${zoom}` : "Enlace de Zoom: por confirmar.",
    ]
      .filter(Boolean)
      .join("\n"),
    lugar: zoom || "Zoom",
    organizador: ORGANIZADOR,
    invitados: [CORREO_NEGOCIO, CORREO_CALENDARIO, correo],
  });

  // 1) Aviso interno + invitación que cae en el Google Calendar personal.
  const interno = brandedEmail({
    title: "Nueva cita por Zoom 🎥",
    greeting: cuandoEs,
    paragraphs: [
      `<b>${nombre}</b> agendó una videollamada.`,
      `Correo: <a href="mailto:${correo}" style="color:#a855f7;">${correo}</a>`,
      telefono ? `Teléfono: ${telefono}` : "Teléfono: no lo dejó.",
      nota ? `Nota del cliente: “${nota}”` : "Sin nota adicional.",
      zoom
        ? `Enlace de Zoom: <a href="${zoom}" style="color:#a855f7;">${zoom}</a>`
        : "Recuerda mandarle el enlace de Zoom.",
      "La invitación va adjunta: al abrirla se agrega sola a tu Google Calendar.",
    ],
  });

  await sendBrandedEmail(
    [CORREO_NEGOCIO, CORREO_CALENDARIO],
    `Cita Zoom: ${nombre} · ${cuandoEs}`,
    interno,
    { invitacion, replyTo: correo }
  );

  // 2) Confirmación para el cliente, con su propia invitación.
  const esIngles = locale === "en";
  const cliente = brandedEmail({
    title: esIngles ? "Your call is booked 🎥" : "Tu cita quedó agendada 🎥",
    greeting: `${esIngles ? "Hi" : "Hola"}, ${nombre.split(" ")[0]} 👋`,
    paragraphs: esIngles
      ? [
          `We'll meet on <b>${cuandoCliente}</b> (Miami time).`,
          zoom
            ? `Join here: <a href="${zoom}" style="color:#a855f7;">${zoom}</a>`
            : "We'll send you the Zoom link before the call.",
          "The invitation is attached — open it and it goes straight into your calendar.",
          "Need to change it? Just reply to this email.",
        ]
      : [
          `Nos vemos el <b>${cuandoCliente}</b> (hora de Miami).`,
          zoom
            ? `Entra por aquí: <a href="${zoom}" style="color:#a855f7;">${zoom}</a>`
            : "Te mandamos el enlace de Zoom antes de la llamada.",
          "La invitación va adjunta: al abrirla se guarda sola en tu calendario.",
          "¿Necesitas cambiarla? Respóndenos este mismo correo.",
        ],
    ctaLabel: esIngles ? "Visit our site" : "Visitar el sitio",
    ctaUrl: "https://www.judomarketing.net",
  });

  await sendBrandedEmail(
    correo,
    esIngles
      ? `Your Zoom call with Judo Marketing · ${cuandoCliente}`
      : `Tu cita por Zoom con Judo Marketing · ${cuandoCliente}`,
    cliente,
    { invitacion, replyTo: CORREO_NEGOCIO }
  );
}
