import { NextRequest, NextResponse } from "next/server";
import { brandedEmail, isEmailConfigured, sendBrandedEmail } from "@/lib/email";

/**
 * Notificaciones por email con diseño de marca.
 * Único tipo vigente: "intake" — un cliente llenó el formulario de datos y
 * Administración recibe el aviso sin tener que entrar al panel a mirar.
 * (Los avisos del programa de vendedores se retiraron junto con el programa.)
 */

// Límite básico por IP (anti-spam)
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 3;
}

export async function POST(req: NextRequest) {
  if (!isEmailConfigured()) {
    return NextResponse.json({ sent: false, reason: "smtp_not_configured" });
  }

  const cuerpo = (await req.json()) as {
    type?: string;
    email?: string;
    name?: string;
  };
  const { type, email, name } = cuerpo;
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

  return NextResponse.json({ error: "unknown_type" }, { status: 400 });
}
