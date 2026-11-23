// Cobros de suscripciones de Judo Marketing en Stripe (Junior, 23 de noviembre
// de 2026): "crea emails automatizados para notificar al cliente que su pago
// no pasó o hubo un problema; un día después de la fecha de expiración de cada
// suscripción, revisa en Stripe si el pago pasó; si no pasó, notifica al
// cliente y dale cómo completar el pago".
//
// Lo usan:
// - /api/stripe/webhook: cuando un cobro falla, el primer correo al cliente.
// - /api/cobros/revision (cron diario de Vercel): la revisión del día después
//   de cada renovación y, los lunes, el inventario de suscripciones para Junior.
//
// El cliente siempre recibe el enlace de su factura en Stripe
// (hosted_invoice_url): ahí paga con la misma tarjeta o con otra, sin cuenta.
// Cada aviso se anota en la metadata de la factura para no repetirlo.

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { brandedEmail, isEmailConfigured, sendBrandedEmail } from "@/lib/email";

export const ADMIN = "admin@judomarketing.net";

/**
 * Los correos le llegan al cliente, con copia oculta a admin. Junior lo
 * activó el 23 de noviembre de 2026 («quiero que lleguen dos»: el de Stripe y
 * el nuestro). En false, le llegan solo a admin con un aviso arriba («Este
 * correo le llegaría a…»), para probar textos nuevos.
 */
export const ENVIAR_A_CLIENTES = true;

/**
 * El website de cada cliente de Stripe, guardado en Vercel (COBROS_WEBSITES,
 * un JSON {"cus_…": "dominio"}) y no en el repositorio, que es público.
 */
function websitesDeVercel(): Record<string, string> {
  try {
    const m = JSON.parse(process.env.COBROS_WEBSITES || "{}");
    return m && typeof m === "object" ? (m as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export type Idioma = "es" | "en" | "ambos";
export type Aviso = "fallo" | "revision";

export function stripe(): Stripe | null {
  const secreto = process.env.STRIPE_SECRET_KEY;
  return secreto ? new Stripe(secreto) : null;
}

export const dinero = (centavos: number | null | undefined, moneda: string | null | undefined) =>
  `$${((centavos ?? 0) / 100).toFixed(2)}${(moneda ?? "usd").toLowerCase() === "usd" ? "" : ` ${(moneda ?? "").toUpperCase()}`}`;

export const fecha = (unix: number | null | undefined, idioma: "es" | "en" = "es") =>
  unix
    ? new Date(unix * 1000).toLocaleDateString(idioma === "en" ? "en-US" : "es-US", {
        timeZone: "America/New_York",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "sin fecha";

/** El idioma del cliente: el que tenga en Stripe; si no tiene, el correo va en los dos. */
export function idiomaDe(cliente: Stripe.Customer | Stripe.DeletedCustomer | string | null | undefined): Idioma {
  if (!cliente || typeof cliente === "string" || cliente.deleted) return "ambos";
  const l = (cliente.preferred_locales?.[0] ?? "").toLowerCase();
  if (l.startsWith("es")) return "es";
  if (l.startsWith("en")) return "en";
  return "ambos";
}

/** La suscripción de una factura (en la API nueva va en parent.subscription_details). */
export function suscripcionDe(inv: Stripe.Invoice): string | null {
  const s = inv.parent?.subscription_details?.subscription;
  if (!s) return null;
  return typeof s === "string" ? s : s.id;
}

/** Cuándo se renovó la suscripción: el inicio del período actual (el vencimiento del anterior). */
export function renovacion(sub: Stripe.Subscription): number {
  const inicios = sub.items.data.map((i) => i.current_period_start).filter(Boolean);
  return inicios.length ? Math.min(...inicios) : sub.billing_cycle_anchor;
}

/**
 * Cuándo venció el pago de una factura: el día en que empieza el mes que cobra
 * (Junior, 23 nov 2026: «es un servicio mensual»; también en quien paga por
 * factura, aunque Stripe le dé días para pagar). Si la factura trae un mes
 * pendiente sumado, cuenta el mes más nuevo. La revisión es un día después.
 */
export function vencimiento(inv: Stripe.Invoice | null, sub: Stripe.Subscription | null | undefined): number {
  const inicios = (inv?.lines?.data ?? []).map((l) => l.period?.start).filter((x): x is number => Boolean(x));
  if (inicios.length) return Math.max(...inicios);
  return sub ? renovacion(sub) : inv?.created ?? 0;
}

/** Las facturas sin pagar de una suscripción (abiertas o marcadas incobrables), de la más vieja a la más nueva. */
export async function pendientesDe(st: Stripe, subId: string): Promise<Stripe.Invoice[]> {
  const out: Stripe.Invoice[] = [];
  for (const status of ["open", "uncollectible"] as const) {
    for await (const inv of st.invoices.list({ subscription: subId, status, limit: 100 })) {
      if ((inv.amount_remaining ?? 0) > 0) out.push(inv);
    }
  }
  return out.sort((a, b) => a.created - b.created);
}

/** El mes que cobra una factura, para decirlo en palabras («16 de noviembre al 16 de diciembre»). */
function mesDe(inv: Stripe.Invoice, idioma: "es" | "en" = "es"): string {
  const l = inv.lines?.data?.find((x) => !x.metadata?.judo_mes_pendiente) ?? inv.lines?.data?.[0];
  if (!l?.period) return fecha(inv.created, idioma);
  return idioma === "en" ? `${fecha(l.period.start, "en")} to ${fecha(l.period.end, "en")}` : `${fecha(l.period.start)} al ${fecha(l.period.end)}`;
}

/**
 * Lo que no se pagó se suma al mes siguiente (Junior, 23 nov 2026: «si un mes
 * no pagan, ese mes se acumula para el otro»). Corre en la revisión diaria
 * cuando la próxima renovación está a menos de 30 horas: cada factura sin
 * pagar de esa suscripción pasa como una línea «Mes pendiente» a la próxima
 * factura, y la vieja se anula. Así el cliente paga los dos meses juntos.
 * Primero se crea la línea y después se anula la vieja; si anular falla (por
 * ejemplo, el cliente pagó en ese momento), la línea se borra. Devuelve una
 * nota por factura para el resumen de admin.
 */
export async function acumular(st: Stripe, sub: Stripe.Subscription, ahora: number): Promise<{ nota: string; problema: boolean }[]> {
  const prox = proximoCobro(sub);
  if (!prox || prox < ahora || prox - ahora > 30 * 3600) return [];
  const notas: { nota: string; problema: boolean }[] = [];
  const clienteId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const yaPasadas = new Set<string>();
  for await (const ii of st.invoiceItems.list({ customer: clienteId, pending: true, limit: 100 })) {
    if (ii.metadata?.judo_mes_pendiente) yaPasadas.add(ii.metadata.judo_mes_pendiente);
  }
  for (const inv of await pendientesDe(st, sub.id)) {
    if (yaPasadas.has(inv.id)) continue;
    const monto = inv.amount_remaining;
    const linea = inv.lines?.data?.find((l) => !l.metadata?.judo_mes_pendiente) ?? inv.lines?.data?.[0];
    const precio = sub.items.data[0]?.price;
    const productoLinea = linea?.pricing?.price_details?.product;
    const producto = productoLinea ?? (precio ? (typeof precio.product === "string" ? precio.product : precio.product.id) : null);
    if (!producto) {
      notas.push({ nota: `${inv.number ?? inv.id}: no se pudo pasar al mes siguiente (sin producto). Revisar a mano.`, problema: true });
      continue;
    }
    const mes = mesDe(inv);
    let item: Stripe.InvoiceItem;
    try {
      item = await st.invoiceItems.create({
        customer: clienteId,
        subscription: sub.id,
        currency: inv.currency,
        price_data: {
          currency: inv.currency,
          product: producto,
          unit_amount: monto,
          ...(precio?.tax_behavior && precio.tax_behavior !== "unspecified" ? { tax_behavior: precio.tax_behavior } : {}),
        },
        description: `Mes pendiente: ${mes} (factura ${inv.number ?? inv.id})`,
        ...(linea?.period ? { period: { start: linea.period.start, end: linea.period.end } } : {}),
        discountable: false,
        metadata: { judo_mes_pendiente: inv.id },
      });
    } catch (e) {
      notas.push({ nota: `${inv.number ?? inv.id}: no se pudo pasar al mes siguiente (${(e as Error).message}). Revisar a mano.`, problema: true });
      continue;
    }
    try {
      await st.invoices.voidInvoice(inv.id);
    } catch (e) {
      await st.invoiceItems.del(item.id).catch(() => null);
      notas.push({ nota: `${inv.number ?? inv.id}: no se anuló (${(e as Error).message}); quedó como estaba. Revisar si se pagó.`, problema: true });
      continue;
    }
    notas.push({ nota: `No pagó ${mes}: ${dinero(monto, inv.currency)} pasa a la factura del ${fecha(prox)}.`, problema: true });
  }
  return notas;
}

/** El próximo cobro: el fin del período actual. */
export function proximoCobro(sub: Stripe.Subscription): number {
  const fines = sub.items.data.map((i) => i.current_period_end).filter(Boolean);
  return fines.length ? Math.min(...fines) : 0;
}

const productos = new Map<string, string>();
/** El nombre del producto de cada línea («Website Esencial», «Juditos Pro»…). */
export async function nombreProducto(st: Stripe, sub: Stripe.Subscription): Promise<string> {
  const nombres: string[] = [];
  for (const it of sub.items.data) {
    const p = it.price.product;
    const id = typeof p === "string" ? p : p.id;
    if (!productos.has(id)) {
      const prod = typeof p === "string" ? await st.products.retrieve(id).catch(() => null) : p;
      productos.set(id, prod && !("deleted" in prod && prod.deleted) ? (prod as Stripe.Product).name : "Suscripción");
    }
    nombres.push(productos.get(id)!);
  }
  return [...new Set(nombres)].join(" + ") || "Suscripción";
}

type Texto = { titulo: string; saludo: string; parrafos: string[]; boton: string; asunto: string };

function textos(aviso: Aviso, idioma: "es" | "en", d: { nombre: string; producto: string; monto: string; dia: string; pendiente?: string }): Texto {
  const t = textosBase(aviso, idioma, d);
  if (d.pendiente) t.parrafos.splice(1, 0, idioma === "en" ? `It includes the month that was left unpaid (${d.pendiente}).` : `Incluye el mes que quedó pendiente (${d.pendiente}).`);
  return t;
}

function textosBase(aviso: Aviso, idioma: "es" | "en", d: { nombre: string; producto: string; monto: string; dia: string }): Texto {
  if (idioma === "en") {
    return aviso === "fallo"
      ? {
          asunto: `Your payment for ${d.producto} didn't go through`,
          titulo: "Your payment didn't go through",
          saludo: d.nombre ? `Hi ${d.nombre}` : "Hi there",
          parrafos: [
            `We tried to charge <b>${d.monto}</b> for your <b>${d.producto}</b> subscription, and the payment didn't go through.`,
            "It's usually an expired card, low funds or a block from the bank. You can pay with the same card or a different one on the secure Stripe page below.",
            "Already paid, or have a question? Reply to this email or message us on WhatsApp at +1&nbsp;305&nbsp;934&nbsp;9981.",
          ],
          boton: "Complete my payment",
        }
      : {
          asunto: `Your ${d.producto} payment is still pending`,
          titulo: "Your payment is still pending",
          saludo: d.nombre ? `Hi ${d.nombre}` : "Hi there",
          parrafos: [
            `The <b>${d.monto}</b> payment for your <b>${d.producto}</b> subscription was due on ${d.dia}, and we still don't see it.`,
            "To keep your service running without interruptions, complete the payment on the secure Stripe page below. You can use a different card.",
            "Already paid, or have a question? Reply to this email or message us on WhatsApp at +1&nbsp;305&nbsp;934&nbsp;9981.",
          ],
          boton: "Complete my payment",
        };
  }
  return aviso === "fallo"
    ? {
        asunto: `Tu pago de ${d.producto} no pasó`,
        titulo: "Tu pago no pasó",
        saludo: d.nombre ? `Hola ${d.nombre}` : "Hola",
        parrafos: [
          `Intentamos cobrar <b>${d.monto}</b> de tu suscripción de <b>${d.producto}</b> y el pago no pasó.`,
          "Casi siempre es una tarjeta vencida, sin fondos o un bloqueo del banco. Puedes pagar con la misma tarjeta o con otra en la página segura de Stripe.",
          "¿Ya lo pagaste o tienes una duda? Responde este correo o escríbenos por WhatsApp al +1&nbsp;305&nbsp;934&nbsp;9981.",
        ],
        boton: "Completar mi pago",
      }
    : {
        asunto: `Tu pago de ${d.producto} sigue pendiente`,
        titulo: "Tu pago sigue pendiente",
        saludo: d.nombre ? `Hola ${d.nombre}` : "Hola",
        parrafos: [
          `El pago de <b>${d.monto}</b> de tu suscripción de <b>${d.producto}</b> vencía el ${d.dia} y todavía no lo vemos.`,
          "Para que tu servicio siga sin interrupciones, completa el pago en la página segura de Stripe. Puedes usar otra tarjeta.",
          "¿Ya lo pagaste o tienes una duda? Responde este correo o escríbenos por WhatsApp al +1&nbsp;305&nbsp;934&nbsp;9981.",
        ],
        boton: "Completar mi pago",
      };
}

/** El correo al cliente, en su idioma (o en los dos si Stripe no lo sabe). */
export function correoCliente(
  aviso: Aviso,
  idioma: Idioma,
  d: { nombre: string; producto: string; monto: string; renovado: number; pendiente?: { es: string; en: string } },
  enlace: string
): { asunto: string; html: string } {
  const es = textos(aviso, "es", { ...d, dia: fecha(d.renovado, "es"), pendiente: d.pendiente?.es });
  const en = textos(aviso, "en", { ...d, dia: fecha(d.renovado, "en"), pendiente: d.pendiente?.en });
  if (idioma === "es") return { asunto: es.asunto, html: brandedEmail({ title: es.titulo, greeting: es.saludo, paragraphs: es.parrafos, ctaLabel: es.boton, ctaUrl: enlace }) };
  if (idioma === "en") return { asunto: en.asunto, html: brandedEmail({ title: en.titulo, greeting: en.saludo, paragraphs: en.parrafos, ctaLabel: en.boton, ctaUrl: enlace }) };
  // Sin idioma en Stripe: primero en español, después en inglés, con un solo botón.
  return {
    asunto: `${es.asunto} · ${en.asunto}`,
    html: brandedEmail({
      title: `${es.titulo} · ${en.titulo}`,
      greeting: `${es.saludo} · ${en.saludo}`,
      paragraphs: [
        ...es.parrafos.slice(0, 2),
        `<span style="color:#6b6b7a;font-size:12px;letter-spacing:.08em">ENGLISH</span>`,
        ...en.parrafos.slice(0, 2),
        es.parrafos[2],
        en.parrafos[2],
      ],
      ctaLabel: `${es.boton} · ${en.boton}`,
      ctaUrl: enlace,
    }),
  };
}

/** Si la factura trae un mes pendiente sumado, cuál (en los dos idiomas). */
function mesPendienteDe(inv: Stripe.Invoice): { es: string; en: string } | undefined {
  const l = inv.lines?.data?.find((x) => x.metadata?.judo_mes_pendiente);
  if (!l?.period) return undefined;
  return { es: `${fecha(l.period.start)} al ${fecha(l.period.end)}`, en: `${fecha(l.period.start, "en")} to ${fecha(l.period.end, "en")}` };
}

/**
 * Manda el aviso al cliente de una factura sin pagar, una sola vez por factura
 * y por tipo de aviso (queda anotado en la metadata de la factura).
 * En modo prueba (ENVIAR_A_CLIENTES = false) le llega a admin.
 */
export async function avisarCliente(st: Stripe, inv: Stripe.Invoice, aviso: Aviso, sub?: Stripe.Subscription): Promise<string> {
  const marca = aviso === "fallo" ? "judo_aviso_fallo" : "judo_aviso_revision";
  if (inv.metadata?.[marca]) return "ya avisado";
  const enlace = inv.hosted_invoice_url;
  const correo = inv.customer_email;
  if (!enlace) return "la factura no tiene enlace de pago";
  if (!correo) return "el cliente no tiene correo en Stripe";
  if (!isEmailConfigured()) return "SMTP no configurado";

  const subId = suscripcionDe(inv);
  const suscripcion = sub ?? (subId ? await st.subscriptions.retrieve(subId) : null);
  const cliente = typeof inv.customer === "string" ? await st.customers.retrieve(inv.customer).catch(() => null) : inv.customer;
  const producto = suscripcion ? await nombreProducto(st, suscripcion) : "Judo Marketing";
  const nombre = (inv.customer_name ?? (cliente && !cliente.deleted ? cliente.name : null) ?? "").trim().split(/\s+/)[0] ?? "";
  const { asunto, html } = correoCliente(
    aviso,
    idiomaDe(cliente),
    { nombre, producto, monto: dinero(inv.amount_remaining || inv.amount_due, inv.currency), renovado: vencimiento(inv, suscripcion), pendiente: mesPendienteDe(inv) },
    enlace
  );

  if (ENVIAR_A_CLIENTES) {
    await sendBrandedEmail(correo, asunto, html, { replyTo: ADMIN, bcc: ADMIN });
  } else {
    const prueba = `<p style="margin:0;padding:12px;background:#3a2a00;color:#ffd27a;font-family:Arial;font-size:13px;text-align:center">PRUEBA: este correo le llegaría a <b>${correo}</b>. Todavía no se manda a los clientes (src/lib/cobros.ts, ENVIAR_A_CLIENTES).</p>`;
    await sendBrandedEmail(ADMIN, `[Prueba] ${asunto}`, html.replace("<body style=\"margin:0;padding:0;background-color:#0b0b12;\">", `<body style="margin:0;padding:0;background-color:#0b0b12;">${prueba}`));
  }
  await st.invoices.update(inv.id, { metadata: { [marca]: new Date().toISOString().slice(0, 10) } });
  return ENVIAR_A_CLIENTES ? `avisado ${correo}` : `prueba (le llegaría a ${correo})`;
}

/** Todas las suscripciones que cobran (con su última factura y el cliente). */
export async function suscripcionesVivas(st: Stripe): Promise<Stripe.Subscription[]> {
  const todas: Stripe.Subscription[] = [];
  for await (const s of st.subscriptions.list({ status: "all", limit: 100, expand: ["data.latest_invoice", "data.customer"] })) {
    if (["active", "past_due", "unpaid", "incomplete", "trialing"].includes(s.status)) todas.push(s);
  }
  return todas;
}

export type Fila = {
  cliente: string;
  correo: string;
  producto: string;
  monto: string;
  cada: string;
  estado: string;
  renovado: number;
  proximo: number;
  factura: string;
  website: string;
  enlace: string;
  /** Cómo paga: con tarjeta automática o por factura con días para pagar. */
  cobro: string;
  /** Cuándo venció (o vence) el pago de la última factura. */
  vence: number;
  /** Lo que debe (en centavos) y desde cuándo; 0 si está al día. */
  debe: number;
  meses: number;
  /** Lo que hay que mirar, en palabras; vacío si está al día. Sale en amarillo. */
  problema: string;
};

/** Lo que hay que mirar de una suscripción: deuda, meses sin pagar, tarjeta y días para pagar. */
async function problemasDe(
  st: Stripe,
  s: Stripe.Subscription,
  cliente: Stripe.Customer | null,
  ultima: Stripe.Invoice | null
): Promise<{ debe: number; meses: number; problema: string }> {
  const pend = await pendientesDe(st, s.id).catch(() => [] as Stripe.Invoice[]);
  const debe = pend.reduce((t, i) => t + i.amount_remaining, 0);
  const meses = pend.reduce((t, i) => t + Math.max(1, (i.lines?.data ?? []).filter((l) => l.period).length), 0);
  const cosas: string[] = [];
  if (debe > 0) {
    cosas.push(`Debe <b>${dinero(debe, s.currency)}</b>${meses > 1 ? ` (${meses} meses)` : ""}, sin pagar desde el ${fecha(vencimiento(pend[0], s))}`);
  }
  if (ultima && ultima.status === "open" && (ultima.attempt_count ?? 0) > 0 && s.collection_method === "charge_automatically") {
    cosas.push(`la tarjeta no pasó (intento ${ultima.attempt_count})`);
  }
  if (["past_due", "unpaid", "incomplete"].includes(s.status)) cosas.push(`en Stripe dice «${s.status}»`);
  if (s.collection_method === "send_invoice" && (s.days_until_due ?? 30) > 1) {
    cosas.push(`paga por factura con ${s.days_until_due ?? 30} días para pagar: en Stripe hay que bajarlo a 1 día`);
  }
  if (
    s.collection_method === "charge_automatically" &&
    !s.default_payment_method &&
    !cliente?.invoice_settings?.default_payment_method &&
    !cliente?.default_source
  ) {
    cosas.push("no tiene tarjeta guardada para el cobro automático");
  }
  if (s.cancel_at_period_end) cosas.push(`se cancela el ${fecha(proximoCobro(s))}`);
  return { debe, meses, problema: cosas.join("; ") };
}

/** Los websites del portal por correo del cliente, para decir de quién es cada suscripción. */
export async function websitesPorCorreo(): Promise<Map<string, string>> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const llave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const mapa = new Map<string, string>();
  if (!url || !llave) return mapa;
  const sb = createClient(url, llave, { auth: { persistSession: false } });
  const { data } = await sb.from("sites").select("name, domain, clients(email)");
  for (const s of (data ?? []) as unknown as { name: string; domain: string | null; clients: { email: string | null } | { email: string | null }[] | null }[]) {
    const correos = (Array.isArray(s.clients) ? s.clients : [s.clients]).map((c) => c?.email?.trim().toLowerCase()).filter(Boolean) as string[];
    for (const c of correos) mapa.set(c, [mapa.get(c), s.domain || s.name].filter(Boolean).join(", "));
  }
  return mapa;
}

export async function fila(st: Stripe, s: Stripe.Subscription, websites: Map<string, string>): Promise<Fila> {
  const c = typeof s.customer === "string" ? null : s.customer;
  const viva = c && !c.deleted ? c : null;
  const inv = typeof s.latest_invoice === "string" || !s.latest_invoice ? null : s.latest_invoice;
  const correo = viva?.email ?? inv?.customer_email ?? "";
  const it = s.items.data[0];
  const total = s.items.data.reduce((t, i) => t + (i.price.unit_amount ?? 0) * (i.quantity ?? 1), 0);
  const intervalo = it?.price.recurring;
  return {
    cliente: viva?.name ?? inv?.customer_name ?? "(sin nombre)",
    correo,
    producto: await nombreProducto(st, s),
    monto: dinero(total, s.currency),
    cada: intervalo ? `${intervalo.interval_count > 1 ? intervalo.interval_count + " " : ""}${({ day: "día", week: "semana", month: "mes", year: "año" } as Record<string, string>)[intervalo.interval] ?? intervalo.interval}` : "",
    estado: s.status,
    renovado: renovacion(s),
    proximo: proximoCobro(s),
    factura: inv?.status ?? "sin factura",
    // El website: el anotado en el cliente de Stripe (metadata «website»), el de COBROS_WEBSITES en Vercel o el del portal por correo
    website: viva?.metadata?.website ?? (viva ? websitesDeVercel()[viva.id] : undefined) ?? websites.get(correo.trim().toLowerCase()) ?? "",
    cobro: s.collection_method === "send_invoice" ? `factura (${s.days_until_due ?? 30} días para pagar)` : "tarjeta automática",
    vence: vencimiento(inv, s),
    ...(await problemasDe(st, s, viva, inv)),
    enlace: `https://dashboard.stripe.com/subscriptions/${s.id}`,
  };
}

/** Tabla HTML sencilla para los correos a admin. */
export function tabla(filas: Fila[], columnas: (keyof Fila | ((f: Fila) => string))[], titulos: string[], amarilla?: (f: Fila) => boolean): string {
  const AMARILLO = "background:#fff3b0;color:#3a2a00;";
  const celda = (v: string, a = false) =>
    `<td style="padding:6px 8px;border-top:1px solid #26263a;${a ? AMARILLO : "color:#e4e0ee;"}font-size:12px;vertical-align:top">${v}</td>`;
  const cab = titulos.map((t) => `<th style="padding:6px 8px;text-align:left;color:#a855f7;font-size:11px">${t}</th>`).join("");
  const cuerpo = filas
    .map((f) => {
      const a = Boolean(amarilla?.(f));
      return `<tr>${columnas.map((c) => celda(typeof c === "function" ? c(f) : String(f[c] ?? ""), a)).join("")}</tr>`;
    })
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin:8px 0 16px">${`<tr>${cab}</tr>`}${cuerpo}</table>`;
}
