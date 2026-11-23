// La revisión diaria de cobros (Junior, 23 de noviembre de 2026).
//
// 1. Lo que no se pagó se suma al mes siguiente: si una suscripción renueva en
//    las próximas 30 horas y tiene facturas sin pagar, pasan como «Mes
//    pendiente» a la próxima factura y las viejas se anulan (src/lib/cobros.ts,
//    acumular). «Si un mes no pagan, ese mes se acumula para el otro.»
// 2. Un día después de cada vencimiento (el día de la renovación), si el pago
//    no pasó: correo al cliente con el enlace para pagar, y resumen a admin.
// 3. Los lunes (o con ?inventario=1): a admin, cada suscripción con su próxima
//    fecha de pago; las que tienen deuda o algún detalle, en amarillo.
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
import { acumular, ADMIN, avisarCliente, ENVIAR_A_CLIENTES, fecha, fila, stripe, suscripcionesVivas, tabla, websitesPorCorreo, type Fila } from "@/lib/cobros";

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

const quien = (f: Fila) => `<b>${f.cliente}</b>${f.website ? `<br>${f.website}` : "<br><i>¿de quién es?</i>"}`;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!esCron(auth) && !autorizado(auth)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const st = stripe();
  if (!st) return NextResponse.json({ error: "Falta STRIPE_SECRET_KEY" }, { status: 501 });
  if (!isEmailConfigured()) return NextResponse.json({ error: "SMTP no configurado" }, { status: 501 });

  const ahora = Math.floor(Date.now() / 1000);
  let subs = await suscripcionesVivas(st);
  const websites = await websitesPorCorreo().catch(() => new Map<string, string>());

  // ── 1. Lo que no se pagó pasa al mes siguiente ─────────────────────
  const acumuladas: { f: Fila; nota: string }[] = [];
  for (const s of subs) {
    const notas = await acumular(st, s, ahora).catch((e) => [{ nota: `no se pudo revisar la deuda: ${(e as Error).message}`, problema: true }]);
    if (notas.length) {
      const f = await fila(st, s, websites);
      for (const n of notas) acumuladas.push({ f, nota: n.nota });
    }
  }
  if (acumuladas.length) subs = await suscripcionesVivas(st);

  // ── 2. Un día después de cada vencimiento ──────────────────────────
  // El pago vence el día de la renovación; se revisa cuando pasaron entre 1 y
  // 3 días (el cron corre una vez al día; el margen cubre un día en que no
  // haya corrido). Cada factura se avisa una sola vez.
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
      revisadas.push({ f, resultado: "pagado", pagada: true });
      continue;
    }
    if (inv.status === "open" || inv.status === "uncollectible") {
      const r = await avisarCliente(st, inv, "revision", s).catch((e) => `no se pudo avisar: ${(e as Error).message}`);
      revisadas.push({ f, resultado: `no pagó · ${r}`, pagada: false });
      continue;
    }
    revisadas.push({ f, resultado: `factura en estado «${inv.status}»: revisar a mano`, pagada: false });
  }

  const sinPagar = revisadas.filter((r) => !r.pagada);
  if (revisadas.length || acumuladas.length) {
    const partes: string[] = [];
    if (acumuladas.length) {
      partes.push("<b>Pasan al mes siguiente</b> (el cliente paga los dos meses juntos):");
      partes.push(
        tabla(
          acumuladas.map((a) => ({ ...a.f, problema: a.nota })),
          [quien, (f) => f.problema],
          ["Cliente", "Qué pasó"],
          () => true
        )
      );
    }
    if (revisadas.length) {
      partes.push(
        sinPagar.length
          ? `<b>${sinPagar.length}</b> no pagó el día después del vencimiento. ${ENVIAR_A_CLIENTES ? "Cada uno recibió el enlace para completar el pago (y el correo de Stripe)." : "Modo prueba: el correo de cada cliente te llegó a ti."}`
          : "Los pagos que vencieron ayer pasaron."
      );
      partes.push(
        tabla(
          revisadas.map((r) => ({ ...r.f, problema: r.pagada ? "" : r.resultado })),
          [quien, (f) => fecha(f.vence), (f) => (f.problema || `pagado · próximo pago el ${fecha(f.proximo)}`)],
          ["Cliente", "Venció", "Resultado"],
          (f) => Boolean(f.problema)
        )
      );
    }
    const problemas = sinPagar.length + acumuladas.length;
    await sendBrandedEmail(
      ADMIN,
      problemas ? `Cobros: ${problemas} con problema hoy` : `Cobros: ${revisadas.length} pagos al día`,
      brandedEmail({ title: "Revisión de cobros", greeting: "Lo que venció y lo que se acumula", paragraphs: partes })
    );
  }

  // ── 3. Los lunes (o con ?inventario=1): todas las suscripciones ────
  const lunes = new Date().toLocaleDateString("en-US", { timeZone: "America/New_York", weekday: "long" }) === "Monday";
  const inventario = lunes || req.nextUrl.searchParams.get("inventario") === "1";
  let conProblema = 0;
  let sinWebsite = 0;
  if (inventario) {
    const filas = (await Promise.all(subs.map((s) => fila(st, s, websites)))).sort(
      (a, b) => Number(Boolean(b.problema)) - Number(Boolean(a.problema)) || a.proximo - b.proximo
    );
    conProblema = filas.filter((f) => f.problema).length;
    sinWebsite = filas.filter((f) => !f.website).length;
    await sendBrandedEmail(
      ADMIN,
      conProblema ? `Cobros: ${conProblema} con problema de ${filas.length} clientes` : `Cobros: los ${filas.length} clientes al día`,
      brandedEmail({
        title: "Próximos pagos",
        greeting: conProblema ? "En amarillo, lo que hay que mirar" : "Todos al día",
        paragraphs: [
          tabla(
            filas,
            [quien, (f) => fecha(f.proximo), (f) => f.problema || "Al día"],
            ["Cliente", "Próximo pago", "Detalle"],
            (f) => Boolean(f.problema)
          ),
          sinWebsite ? `<b>${sinWebsite}</b> sin website asignado: responde este correo diciendo de quién es.` : "",
        ].filter(Boolean),
        ctaLabel: "Abrir Stripe",
        ctaUrl: "https://dashboard.stripe.com/subscriptions",
      })
    );
  }

  return NextResponse.json({
    modo: ENVIAR_A_CLIENTES ? "clientes" : "prueba",
    suscripciones: subs.length,
    acumuladas: acumuladas.length,
    revisadas: revisadas.length,
    sinPagar: sinPagar.length,
    inventario,
    conProblema,
    sinWebsite,
  });
}
