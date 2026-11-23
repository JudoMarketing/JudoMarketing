// La revisión diaria de cobros (Junior, 23 de noviembre de 2026): un día
// después de la fecha en que vence cada suscripción, revisar en Stripe si el
// pago pasó. Si no pasó, avisarle al cliente con el enlace para completar el
// pago, y a admin@judomarketing.net con el resumen.
//
// Los lunes manda además a admin el inventario: cada suscripción con su
// cliente, su website (por el correo del cliente en el portal), el monto y la
// fecha del próximo cobro. Las que no se emparejan con un website salen
// marcadas para que Junior diga de quién son.
//
// La llama el cron de Vercel (vercel.json) con `Authorization: Bearer
// CRON_SECRET`. A mano, con LEADS_SECRET (el mismo de la prospección):
//   curl -H "Authorization: Bearer $LEADS_SECRET" "https://www.judomarketing.net/api/cobros/revision?inventario=1"
// La respuesta solo trae conteos: los datos de los clientes van por correo a admin.

import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import type Stripe from "stripe";
import { brandedEmail, isEmailConfigured, sendBrandedEmail } from "@/lib/email";
import { autorizado } from "@/lib/leads";
import { ADMIN, avisarCliente, ENVIAR_A_CLIENTES, fecha, fila, stripe, suscripcionesVivas, tabla, websitesPorCorreo, type Fila } from "@/lib/cobros";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

const DIA = 24 * 60 * 60;

function esCron(cabecera: string | null): boolean {
  const secreto = process.env.CRON_SECRET;
  if (!secreto || !cabecera?.startsWith("Bearer ")) return false;
  const a = Buffer.from(cabecera.slice(7));
  const b = Buffer.from(secreto);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!esCron(auth) && !autorizado(auth)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const st = stripe();
  if (!st) return NextResponse.json({ error: "Falta STRIPE_SECRET_KEY" }, { status: 501 });
  if (!isEmailConfigured()) return NextResponse.json({ error: "SMTP no configurado" }, { status: 501 });

  const ahora = Math.floor(Date.now() / 1000);
  const subs = await suscripcionesVivas(st);
  const websites = await websitesPorCorreo().catch(() => new Map<string, string>());

  // ── 1. Un día después de cada vencimiento ──────────────────────────
  // El pago venció hace entre 1 y 3 días (el cron corre una vez al día; el
  // margen cubre un día en que no haya corrido). Con tarjeta, vence el día de
  // la renovación; por factura, en su fecha límite (src/lib/cobros.ts,
  // vencimiento). Cada factura se avisa una sola vez.
  const revisadas: { f: Fila; resultado: string; pagada: boolean }[] = [];
  for (const s of subs) {
    const f = await fila(st, s, websites);
    if (f.vence > ahora - DIA || f.vence < ahora - 3 * DIA) continue;
    const inv = typeof s.latest_invoice === "string" || !s.latest_invoice ? null : (s.latest_invoice as Stripe.Invoice);
    if (!inv) {
      revisadas.push({ f, resultado: "sin factura en Stripe: revisar a mano", pagada: false });
      continue;
    }
    if (inv.status === "paid" || inv.amount_due === 0) {
      revisadas.push({ f, resultado: "pagada", pagada: true });
      continue;
    }
    if (inv.status === "open" || inv.status === "uncollectible") {
      const r = await avisarCliente(st, inv, "revision", s).catch((e) => `no se pudo avisar: ${(e as Error).message}`);
      revisadas.push({ f, resultado: `sin pagar · ${r}`, pagada: false });
      continue;
    }
    revisadas.push({ f, resultado: `factura en estado «${inv.status}»: revisar a mano`, pagada: false });
  }

  const pendientes = revisadas.filter((r) => !r.pagada);
  if (revisadas.length) {
    await sendBrandedEmail(
      ADMIN,
      pendientes.length
        ? `Cobros: ${pendientes.length} sin pagar de ${revisadas.length} renovaciones`
        : `Cobros: las ${revisadas.length} renovaciones están pagadas`,
      brandedEmail({
        title: "Revisión de cobros",
        greeting: "Un día después de cada vencimiento",
        paragraphs: [
          pendientes.length
            ? `<b>${pendientes.length}</b> sin pagar. ${ENVIAR_A_CLIENTES ? "Cada cliente recibió el enlace para completar el pago." : "Modo prueba: el correo de cada cliente te llegó a ti, no a ellos."}`
            : "Todo pagado.",
          tabla(
            revisadas.map((r) => ({ ...r.f, estado: r.resultado })),
            [(f) => `<b>${f.cliente}</b><br>${f.correo}`, (f) => f.website || "<i>¿de quién es?</i>", "producto", "monto", (f) => fecha(f.vence), "estado"],
            ["Cliente", "Website", "Producto", "Monto", "Venció", "Resultado"]
          ),
        ],
      })
    );
  }

  // ── 2. Los lunes (o con ?inventario=1): todas las suscripciones ────
  const lunes = new Date().toLocaleDateString("en-US", { timeZone: "America/New_York", weekday: "long" }) === "Monday";
  const inventario = lunes || req.nextUrl.searchParams.get("inventario") === "1";
  let sinWebsite = 0;
  if (inventario) {
    const filas = (await Promise.all(subs.map((s) => fila(st, s, websites)))).sort((a, b) => a.proximo - b.proximo);
    sinWebsite = filas.filter((f) => !f.website).length;
    await sendBrandedEmail(
      ADMIN,
      `Cobros: ${filas.length} suscripciones${sinWebsite ? ` · ${sinWebsite} sin website asignado` : ""}`,
      brandedEmail({
        title: "Suscripciones en Stripe",
        greeting: "Próximos cobros, del más cercano al más lejano",
        paragraphs: [
          sinWebsite
            ? `<b>${sinWebsite}</b> no se pudieron emparejar con un website del portal por el correo del cliente. Responde este correo diciendo de quién es cada una.`
            : "Todas emparejadas con su website.",
          tabla(
            filas,
            [(f) => `<b>${f.cliente}</b><br>${f.correo}`, (f) => f.website || "<b style='color:#ffd27a'>¿de quién es?</b>", "producto", (f) => `${f.monto}/${f.cada}<br><small>${f.cobro}</small>`, (f) => fecha(f.proximo), (f) => (f.factura === "open" ? `factura abierta, vence el ${fecha(f.vence)}` : `última factura: ${f.factura}`)],
            ["Cliente", "Website", "Producto", "Monto", "Próximo cobro", "Estado"]
          ),
        ],
        ctaLabel: "Abrir Stripe",
        ctaUrl: "https://dashboard.stripe.com/subscriptions",
      })
    );
  }

  return NextResponse.json({
    modo: ENVIAR_A_CLIENTES ? "clientes" : "prueba",
    suscripciones: subs.length,
    revisadas: revisadas.length,
    sinPagar: pendientes.length,
    inventario,
    sinWebsite,
  });
}
