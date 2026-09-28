// El envío diario de la prospección, hecho por el sitio.
//
// La sesión automática investiga, elige y escribe, pero corre en un modo que
// no le permite mandar correos reales: deja los borradores guardados
// (POST /api/leads {accion:"borradores"}). Esta ruta los manda, una vez al
// día, con los candados de siempre (baja, sin recontacto, tope por país).
// Solo avisa a Junior por correo si algo falló.
//
// La llama el cron de Vercel (vercel.json) con `Authorization: Bearer
// CRON_SECRET`. También se puede llamar a mano con LEADS_SECRET:
//   curl -H "Authorization: Bearer $LEADS_SECRET" https://www.judomarketing.net/api/leads/cron

import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { sendBrandedEmail } from "@/lib/email";
import { autorizado, enviarPendientes, PAISES, secretoLeads, type Pais } from "@/lib/leads";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

const ADMIN = "admin@judomarketing.net";

function esCron(cabecera: string | null): boolean {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || !cabecera?.startsWith("Bearer ")) return false;
  const a = Buffer.from(cabecera.slice(7));
  const b = Buffer.from(secreto);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!secretoLeads()) {
    return NextResponse.json({ error: "Prospección no configurada: falta LEADS_SECRET en Vercel." }, { status: 503 });
  }
  if (!esCron(auth) && !autorizado(auth)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const r = await enviarPendientes();
    const salieron = r.resultados.filter((x) => x.ok);
    const quedaron = r.resultados.filter((x) => !x.ok && (x.motivo?.startsWith("tope diario") || x.motivo?.startsWith("SMTP")));
    const fallaron = r.resultados.filter((x) => !x.ok && !quedaron.includes(x));

    // Solo se avisa por correo cuando algo falló de verdad (SMTP caído o
    // borradores descartados). Del envío normal no llega nada a la bandeja:
    // Junior lo pidió así el 27 de septiembre de 2026; el detalle queda en
    // el informe de la rutina y en GET /api/leads?reporte=1.
    const smtpCaido = quedaron.some((x) => x.motivo?.startsWith("SMTP"));
    if (smtpCaido || fallaron.length) {
      const lista = (xs: typeof r.resultados) =>
        xs.length ? `<ul>${xs.map((x) => `<li><b>${x.nombre}</b> (${PAISES[x.pais].nombre})${x.ok ? "" : `: ${x.motivo}`}</li>`).join("")}</ul>` : "<p>Ninguno.</p>";
      const html = `
        <p>Prospección de hoy, modo <b>${r.modo}</b>: <b>${salieron.length}</b> correos enviados de ${r.pendientes} borradores pendientes, pero algo falló.</p>
        ${smtpCaido ? `<h3>No salieron por SMTP (se reintentan mañana)</h3>${lista(quedaron.filter((x) => x.motivo?.startsWith("SMTP")))}` : ""}
        ${fallaron.length ? `<h3>Descartados</h3>${lista(fallaron)}` : ""}`;
      await sendBrandedEmail(ADMIN, `Prospección: ${fallaron.length + (smtpCaido ? quedaron.length : 0)} correos con problema hoy`, html).catch((e) =>
        console.error("leads/cron: no se pudo avisar", (e as Error).message)
      );
    }

    return NextResponse.json({
      modo: r.modo,
      pendientes: r.pendientes,
      enviados: r.enviados,
      quedaron: quedaron.length,
      descartados: fallaron.length,
      resultados: r.resultados,
    });
  } catch (e) {
    const msg = (e as Error).message ?? String(e);
    console.error("leads/cron:", msg);
    return NextResponse.json({ error: /borrador|informe_path|does not exist/i.test(msg) ? `${msg}. ¿Falta aplicar supabase/migrations/0028_leads_paises.sql?` : msg }, { status: 500 });
  }
}
