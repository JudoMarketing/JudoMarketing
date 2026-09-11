// Avisos de Stripe: cuando a un cliente le falla el cobro de su suscripción.
//
// Stripe le escribe al CLIENTE cuando su tarjeta falla (si está activado en
// Billing), pero a la empresa no le avisa por suscripción. Este endpoint es
// el que le avisa a Administración: Stripe lo llama en cada intento fallido
// y en cada suscripción que se cancela por falta de pago, y de aquí sale un
// correo a admin@judomarketing.net con quién, cuánto, qué falló y el enlace a
// la factura en Stripe.
//
// Una sola cuenta de Stripe para toda la casa (websites, JuditoADS, Juditos),
// así que un solo endpoint recibe todo. Solo suscripciones: los pagos sueltos
// (Zelle, USDT, un cobro único) no pasan por aquí.
//
// Registro en Stripe: Developers → Webhooks → Add endpoint →
//   https://www.judomarketing.net/api/stripe/webhook
//   eventos: invoice.payment_failed, customer.subscription.deleted
// y el "Signing secret" (whsec_...) va en Vercel como STRIPE_WEBHOOK_SECRET.

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { brandedEmail, isEmailConfigured, sendBrandedEmail } from "@/lib/email";

const ADMIN = "admin@judomarketing.net";

const dinero = (centavos: number | null | undefined, moneda: string | null | undefined) =>
  `$${((centavos ?? 0) / 100).toFixed(2)} ${(moneda ?? "usd").toUpperCase()}`;

const cuando = (unix: number | null | undefined) =>
  unix
    ? new Date(unix * 1000).toLocaleString("es-US", { timeZone: "America/New_York", dateStyle: "medium", timeStyle: "short" })
    : "—";

/** Qué producto es, leyendo la primera línea de la factura. */
function queSuscripcion(inv: Stripe.Invoice): string {
  const linea = inv.lines?.data?.[0];
  const desc = linea?.description ?? "";
  return desc || "Suscripción";
}

async function avisar(asunto: string, titulo: string, saludo: string, parrafos: string[], enlace?: string) {
  if (!isEmailConfigured()) return "SMTP no configurado";
  await sendBrandedEmail(ADMIN, asunto, brandedEmail({
    title: titulo,
    greeting: saludo,
    paragraphs: parrafos,
    ctaLabel: enlace ? "Ver en Stripe" : undefined,
    ctaUrl: enlace,
  }));
  return null;
}

export async function POST(req: NextRequest) {
  const secreto = process.env.STRIPE_SECRET_KEY;
  const firma = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secreto || !firma) {
    return NextResponse.json({ error: "Falta STRIPE_SECRET_KEY o STRIPE_WEBHOOK_SECRET" }, { status: 501 });
  }

  // La firma se comprueba sobre el cuerpo crudo, byte a byte: si se parsea
  // antes, deja de coincidir y todo llega como "falso".
  const cuerpo = await req.text();
  const cabecera = req.headers.get("stripe-signature") ?? "";
  const stripe = new Stripe(secreto);

  let evento: Stripe.Event;
  try {
    evento = stripe.webhooks.constructEvent(cuerpo, cabecera, firma);
  } catch (e) {
    return NextResponse.json(
      { error: `Firma inválida: ${e instanceof Error ? e.message : "desconocido"}` },
      { status: 400 }
    );
  }

  // ── Un cobro de suscripción falló ─────────────────────────────────
  if (evento.type === "invoice.payment_failed") {
    const inv = evento.data.object as Stripe.Invoice;
    // Solo suscripciones. En la API nueva el vínculo va en parent.subscription_details.
    const sub = (inv as unknown as { subscription?: string | { id: string } | null }).subscription
      ?? (inv as unknown as { parent?: { subscription_details?: { subscription?: string | { id: string } } } }).parent?.subscription_details?.subscription;
    if (!sub) return NextResponse.json({ ok: true, ignorado: "no es suscripción" });

    const intento = inv.attempt_count ?? 1;
    const proximo = inv.next_payment_attempt;
    const motivo =
      (inv as unknown as { last_finalization_error?: { message?: string } }).last_finalization_error?.message ??
      "la tarjeta no aprobó el cobro";
    const enlace = `https://dashboard.stripe.com/invoices/${inv.id}`;

    const fallo = await avisar(
      `⚠ Cobro fallido · ${inv.customer_email ?? inv.customer_name ?? "cliente"} · ${dinero(inv.amount_due, inv.currency)}`,
      "Un cobro de suscripción falló",
      `${inv.customer_name ?? inv.customer_email ?? "Un cliente"}`,
      [
        `<b>${queSuscripcion(inv)}</b> · ${dinero(inv.amount_due, inv.currency)} · intento ${intento}.`,
        `Cliente: ${inv.customer_email ?? "sin correo"}${inv.customer_name ? ` (${inv.customer_name})` : ""}.`,
        `Motivo: ${motivo}.`,
        proximo
          ? `Stripe lo reintenta solo el ${cuando(proximo)}. Si vuelve a fallar, te llega otro aviso.`
          : "Stripe no va a reintentar: este era el último intento. Si el cliente no paga, la suscripción se cancela y te aviso.",
      ],
      enlace
    );
    return NextResponse.json({ ok: true, avisado: !fallo, motivo: fallo ?? undefined });
  }

  // ── Una suscripción se canceló (por impago o a mano) ──────────────
  if (evento.type === "customer.subscription.deleted") {
    const s = evento.data.object as Stripe.Subscription;
    const porImpago = s.cancellation_details?.reason === "payment_failed";
    const item = s.items?.data?.[0];
    const producto = (item?.price?.nickname ?? item?.plan?.nickname ?? "Suscripción") as string;
    const monto = dinero(item?.price?.unit_amount ?? item?.plan?.amount ?? 0, s.currency);
    const clienteId = typeof s.customer === "string" ? s.customer : s.customer?.id;
    const enlace = `https://dashboard.stripe.com/subscriptions/${s.id}`;

    const fallo = await avisar(
      `${porImpago ? "⛔ Suscripción cancelada por impago" : "ℹ Suscripción cancelada"} · ${monto}`,
      porImpago ? "Suscripción cancelada por falta de pago" : "Suscripción cancelada",
      `Cliente ${clienteId ?? ""}`,
      [
        `<b>${producto}</b> · ${monto} al mes.`,
        porImpago
          ? "Stripe agotó los reintentos y cerró la suscripción. Si es un website, toca decidir si se suspende (Portal → Websites → Apagar)."
          : `Motivo: ${s.cancellation_details?.reason ?? "no indicado"}${s.cancellation_details?.comment ? ` · "${s.cancellation_details.comment}"` : ""}.`,
      ],
      enlace
    );
    return NextResponse.json({ ok: true, avisado: !fallo, motivo: fallo ?? undefined });
  }

  // Lo demás se acusa recibo y ya: Stripe reintenta si no contestamos 2xx.
  return NextResponse.json({ ok: true, ignorado: evento.type });
}
