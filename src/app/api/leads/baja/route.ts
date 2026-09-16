// Baja de los correos de prospección.
//
// El enlace que va en cada correo trae el correo del destinatario y una
// firma HMAC con LEADS_SECRET: nadie puede dar de baja a otro adivinando
// la URL. Un clic basta (no hay formulario ni confirmación) y el lead queda
// como 'baja' para siempre. POST atiende el "List-Unsubscribe-Post" de
// Gmail y Yahoo, que dan de baja con un botón sin abrir el correo.

import { NextRequest, NextResponse } from "next/server";
import { clienteServicio, secretoLeads, verificarBaja } from "@/lib/leads";

const TEXTOS = {
  es: {
    titulo: "Listo, no te volveré a escribir",
    cuerpo: "Quité tu correo de mi lista. Si algún día necesitas un website o una app para tu negocio, aquí estaré.",
    invalido: "Este enlace no es válido",
    invalidoCuerpo: "Si quieres dejar de recibir correos, responde al mensaje con la palabra baja y lo hago a mano.",
    volver: "Ir a judomarketing.net",
  },
  en: {
    titulo: "Done, you won't hear from me again",
    cuerpo: "I removed your email from my list. If you ever need a website or an app for your business, I'll be here.",
    invalido: "This link is not valid",
    invalidoCuerpo: "If you want to stop receiving emails, reply to the message with the word unsubscribe and I'll do it by hand.",
    volver: "Go to judomarketing.net",
  },
};

function pagina(idioma: "es" | "en", ok: boolean): NextResponse {
  const t = TEXTOS[idioma];
  const html = `<!doctype html><html lang="${idioma}"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>Judo Marketing</title></head>
<body style="margin:0;background:#0b0b12;color:#f5f5f7;font-family:Arial,Helvetica,sans-serif;">
<div style="max-width:520px;margin:60px auto;padding:36px 30px;background:#11111a;border:1px solid #2c2444;border-radius:18px;text-align:center;">
<img src="https://www.judomarketing.net/brand/logo-white-transparent.png" width="64" height="64" alt="Judo Marketing" style="display:block;margin:0 auto 18px;"/>
<h1 style="font-size:22px;margin:0 0 12px;">${ok ? t.titulo : t.invalido}</h1>
<p style="color:#c9c9d4;line-height:1.6;margin:0 0 24px;">${ok ? t.cuerpo : t.invalidoCuerpo}</p>
<a href="https://www.judomarketing.net" style="display:inline-block;padding:12px 26px;border-radius:999px;background:#7b2dff;color:#fff;text-decoration:none;font-weight:bold;">${t.volver}</a>
</div></body></html>`;
  return new NextResponse(html, {
    status: ok ? 200 : 400,
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}

async function procesar(req: NextRequest): Promise<NextResponse> {
  const q = req.nextUrl.searchParams;
  const idioma = q.get("l") === "es" ? "es" : "en";
  if (!secretoLeads()) return pagina(idioma, false);
  const email = verificarBaja(q.get("e"), q.get("t"));
  if (!email) return pagina(idioma, false);

  try {
    const supabase = clienteServicio();
    await supabase
      .from("leads")
      .update({ estado: "baja", baja_en: new Date().toISOString() })
      .ilike("email", email);
  } catch {
    // Si la base falla, igual se le dice que sí: el correo queda en el log
    // de Vercel y se procesa a mano. Nunca se le contesta "inténtalo luego"
    // a alguien que pidió no recibir más correos.
    console.error("leads/baja: no se pudo marcar", email);
  }
  return pagina(idioma, true);
}

export async function GET(req: NextRequest) {
  return procesar(req);
}

export async function POST(req: NextRequest) {
  return procesar(req);
}
