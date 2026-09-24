// El envío diario de la prospección, hecho por el sitio.
//
// La sesión automática investiga, elige y escribe, pero corre en un modo que
// no le permite mandar correos reales: deja los borradores guardados
// (POST /api/leads {accion:"borradores"}). Esta ruta los manda, una vez al
// día, con los candados de siempre (baja, sin recontacto, tope por país) y
// le avisa a Junior por correo cuántos salieron.
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

    if (r.pendientes > 0) {
      const porPais = (Object.keys(r.enviados) as Pais[])
        .filter((p) => r.enviados[p] > 0)
        .map((p) => `${PAISES[p].nombre}: ${r.enviados[p]}`)
        .join(" · ");
      const lista = (xs: typeof r.resultados) =>
        xs.length ? `<ul>${xs.map((x) => `<li><b>${x.nombre}</b> (${PAISES[x.pais].nombre})${x.ok ? "" : `: ${x.motivo}`}</li>`).join("")}</ul>` : "<p>Ninguno.</p>";
      const html = `
        <p>Prospección de hoy, modo <b>${r.modo}</b>: <b>${salieron.length}</b> correos enviados de ${r.pendientes} borradores pendientes.${porPais ? ` ${porPais}.` : ""}</p>
        <h3>Salieron</h3>${lista(salieron)}
        ${quedaron.length ? `<h3>Quedan para mañana (tope o SMTP)</h3>${lista(quedaron)}` : ""}
        ${fallaron.length ? `<h3>Descartados</h3>${lista(fallaron)}` : ""}
        <p>Auditoría: cada correo llegó en copia oculta a ${ADMIN}. Reporte de bajas y clics: GET /api/leads?reporte=1.</p>`;
      await sendBrandedEmail(ADMIN, `Prospección: ${salieron.length} correos enviados hoy${porPais ? ` (${porPais})` : ""}`, html).catch((e) =>
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
