import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { brandedEmail, isEmailConfigured, sendBrandedEmail } from "@/lib/email";

/**
 * Notificaciones por email con diseño de marca:
 *  - applied: confirmación de que la aplicación de vendedor se recibió.
 *  - approved: aviso de que Administración aprobó al vendedor
 *    (solo puede dispararla una sesión de admin).
 */

// Límite básico por IP para el aviso público de aplicación (anti-spam;
// se refuerza con Turnstile en la ronda de seguridad)
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 3;
}

/**
 * El acuerdo de comisión, en palabras. Es el mismo texto que ve en su portal,
 * para que el correo y la pantalla no digan cosas distintas.
 */
function describirComision(kind?: string | null, value?: number | null): string {
  if (value == null) return "sin acuerdo definido";
  if (kind === "porcentaje") return `${value}% de cada venta`;
  return `$${value} por cada $50 vendidos`;
}

/**
 * Los avisos que salen del portal solo los puede disparar Administración.
 * Devuelve una respuesta de error si quien pide no es admin, o null si sí lo es.
 */
async function exigeAdmin(req: NextRequest): Promise<NextResponse | null> {
  const jwt = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!jwt) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${jwt}` } } }
  );
  const { data: userData } = await supabase.auth.getUser(jwt);
  if (!userData.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();
  if (prof?.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  return null;
}

export async function POST(req: NextRequest) {
  if (!isEmailConfigured()) {
    return NextResponse.json({ sent: false, reason: "smtp_not_configured" });
  }

  const cuerpo = (await req.json()) as {
    type?: string;
    email?: string;
    name?: string;
    site?: string;
    from?: number;
    to?: number;
    // Cambios en la ficha del vendedor
    kind?: string | null;
    value?: number | null;
    previousKind?: string | null;
    previousValue?: number | null;
    status?: string;
    previousStatus?: string;
  };
  const { type, email, name, site, from, to } = cuerpo;
  if (
    !email ||
    !name ||
    !type ||
    email.length > 120 ||
    name.length > 80 ||
    !email.includes("@")
  ) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (type === "applied" && rateLimited(ip)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  if (type === "applied") {
    const html = brandedEmail({
      title: "¡Recibimos tu aplicación!",
      greeting: `Hola, ${name.split(" ")[0]} 👋`,
      paragraphs: [
        "Gracias por querer ser parte del equipo de vendedores de Judo Marketing.",
        "Administración está revisando tu registro. Recuerda subir tu foto de perfil desde tu portal, es obligatoria para aprobarte.",
        "Te avisaremos por este mismo correo apenas tu cuenta sea aprobada.",
      ],
      ctaLabel: "Ir a mi portal",
      ctaUrl: "https://www.judomarketing.net/es/portal",
    });
    await sendBrandedEmail(email, "Recibimos tu aplicación, Judo Marketing", html);
    return NextResponse.json({ sent: true });
  }

  // Un cliente llenó el formulario de datos: aviso a Administración
  if (type === "intake") {
    if (rateLimited(ip)) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
    const html = brandedEmail({
      title: "Un cliente llenó sus datos 📋",
      greeting: name,
      paragraphs: [
        `<b>${name}</b> completó el formulario de arranque.`,
        `Contacto: <a href="mailto:${email}" style="color:#a855f7;">${email}</a>`,
        "Ábrelo en tu portal, pestaña Formularios, para ver todo lo que dejó y crear su website desde ahí.",
      ],
      ctaLabel: "Ver en mi portal",
      ctaUrl: "https://www.judomarketing.net/es/admin",
    });
    await sendBrandedEmail(
      "admin@judomarketing.net",
      `Datos recibidos: ${name}`,
      html
    );
    return NextResponse.json({ sent: true });
  }

  // Le subió el precio a un website: el vendedor tiene que enterarse, porque
  // su comisión se calcula sobre lo que el cliente paga.
  if (type === "price_up") {
    const problema = await exigeAdmin(req);
    if (problema) return problema;
    if (typeof from !== "number" || typeof to !== "number" || !site) {
      return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }
    const html = brandedEmail({
      title: "Subió el plan de uno de tus clientes 📈",
      greeting: `Hola, ${name.split(" ")[0]}`,
      paragraphs: [
        `<b>${site}</b> pasó de <b>$${from.toFixed(2)}</b> a <b>$${to.toFixed(2)}</b> al mes.`,
        "El cliente amplió su servicio. Tu comisión se calcula sobre lo que él paga, así que desde el próximo cobro cuenta con el monto nuevo.",
        "Lo puedes ver en tu portal, en “Mis websites”.",
      ],
      ctaLabel: "Ver mis websites",
      ctaUrl: "https://www.judomarketing.net/es/portal",
    });
    await sendBrandedEmail(email, `Subió el plan de ${site}`, html);
    return NextResponse.json({ sent: true });
  }

  // Le cambiaron el trato de comisión. Es su dinero: se entera por correo,
  // no cuando abra el portal por casualidad.
  if (type === "commission") {
    const problema = await exigeAdmin(req);
    if (problema) return problema;

    const html = brandedEmail({
      title: "Cambió tu acuerdo de comisión",
      greeting: `Hola, ${name.split(" ")[0]}`,
      paragraphs: [
        `Administración actualizó tu acuerdo. Desde ahora ganas <b>${describirComision(cuerpo.kind, cuerpo.value)}</b>.`,
        cuerpo.previousKind || cuerpo.previousValue != null
          ? `Antes era: ${describirComision(cuerpo.previousKind, cuerpo.previousValue)}.`
          : "",
        "Las comisiones que ya estaban registradas no cambian: el acuerdo nuevo aplica a lo que vendas desde hoy.",
        "Lo puedes ver en tu portal, en Ganancias y contratos. Si algo no te cuadra, escríbenos y lo revisamos.",
      ].filter(Boolean),
      ctaLabel: "Ver mi portal",
      ctaUrl: "https://www.judomarketing.net/es/portal",
    });
    await sendBrandedEmail(email, "Cambió tu acuerdo de comisión", html);
    return NextResponse.json({ sent: true });
  }

  // Cambió el estado de su cuenta: suspendida, reactivada o rechazada.
  if (type === "seller_status") {
    const problema = await exigeAdmin(req);
    if (problema) return problema;

    const nuevo = cuerpo.status;
    const reactivado = nuevo === "aprobado";
    const suspendido = nuevo === "suspendido";
    const html = brandedEmail({
      title: reactivado
        ? "Tu cuenta está activa otra vez 🎉"
        : suspendido
          ? "Tu cuenta quedó suspendida"
          : "Novedad con tu cuenta de vendedor",
      greeting: `Hola, ${name.split(" ")[0]}`,
      paragraphs: reactivado
        ? [
            "Administración reactivó tu cuenta de vendedor. Ya puedes volver a registrar visitas y firmar contratos desde tu portal.",
            "Tu código de referido y tu historial siguen intactos.",
          ]
        : suspendido
          ? [
              "Administración suspendió tu cuenta de vendedor. Por ahora no puedes registrar visitas ni firmar contratos nuevos.",
              "Tu historial y tus comisiones ya registradas se conservan.",
              "Si crees que es un error o quieres saber qué hace falta para volver, escríbenos y lo hablamos.",
            ]
          : [
              "Administración actualizó el estado de tu cuenta de vendedor.",
              "Entra a tu portal para ver cómo quedó. Si tienes dudas, escríbenos.",
            ],
      ctaLabel: "Ver mi portal",
      ctaUrl: "https://www.judomarketing.net/es/portal",
    });
    await sendBrandedEmail(
      email,
      reactivado
        ? "Tu cuenta de vendedor está activa otra vez"
        : suspendido
          ? "Tu cuenta de vendedor quedó suspendida"
          : "Novedad con tu cuenta de vendedor",
      html
    );
    return NextResponse.json({ sent: true });
  }

  if (type === "approved") {
    const problema = await exigeAdmin(req);
    if (problema) return problema;

    const html = brandedEmail({
      title: "¡Fuiste aprobado! 🎉",
      greeting: `Felicidades, ${name.split(" ")[0]}`,
      paragraphs: [
        "Tu cuenta de vendedor de Judo Marketing fue aprobada por Administración.",
        "Ya puedes registrar tus visitas, firmar contratos con tus clientes y seguir tus resultados desde tu portal.",
        "Tu acuerdo de comisión está visible dentro de tu portal. ¡Vamos a crecer juntos!",
      ],
      ctaLabel: "Entrar a mi portal",
      ctaUrl: "https://www.judomarketing.net/es/portal",
    });
    await sendBrandedEmail(email, "¡Bienvenido al equipo!, Judo Marketing", html);
    return NextResponse.json({ sent: true });
  }

  return NextResponse.json({ error: "unknown_type" }, { status: 400 });
}
