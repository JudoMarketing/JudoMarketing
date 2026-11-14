import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { cuotaInicio, DIAS_DIAGNOSTICO, pagoUnico, precio, PRECIO_DIAGNOSTICO, type Plan } from "@/lib/pricing";

const PLAN_ENV: Record<string, string | undefined> = {
  essential: process.env.STRIPE_PRICE_ESSENTIAL,
  complex: process.env.STRIPE_PRICE_COMPLEX,
  apps: process.env.STRIPE_PRICE_APPS,
};

const NOMBRE_PLAN: Record<Plan, Record<"es" | "en", string>> = {
  essential: { es: "Website Esencial", en: "Essential Website" },
  complex: { es: "Website Complejo", en: "Complex Website" },
  apps: { es: "App de teléfono", en: "Mobile App" },
};

// Cache de prod_... → price_... para no consultar Stripe en cada checkout
const resolvedPrices = new Map<string, string>();

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const { plan, locale, modalidad, producto } = (await req.json()) as {
    plan?: string;
    locale?: string;
    modalidad?: string;
    producto?: string;
  };

  // El Full Diagnostic no es un plan ni una suscripción: va por su lado
  if (producto === "diagnostico") {
    return diagnostico(new Stripe(secret), req.nextUrl.origin, locale === "en" ? "en" : "es");
  }

  let price = plan ? PLAN_ENV[plan] : undefined;
  if (!price) {
    return NextResponse.json({ error: "unknown_plan" }, { status: 400 });
  }

  const stripe = new Stripe(secret);

  // Las variables aceptan tanto el price_... como el prod_...: si llega un
  // producto, se usa su precio por defecto
  if (price.startsWith("prod_")) {
    const cached = resolvedPrices.get(price);
    if (cached) {
      price = cached;
    } else {
      try {
        const product = await stripe.products.retrieve(price);
        const def =
          typeof product.default_price === "string"
            ? product.default_price
            : product.default_price?.id;
        if (!def) {
          return NextResponse.json(
            { error: "stripe_error", message: `El producto ${price} no tiene un precio por defecto` },
            { status: 502 }
          );
        }
        resolvedPrices.set(price, def);
        price = def;
      } catch (e) {
        const msg = e instanceof Error ? e.message : "unknown";
        return NextResponse.json({ error: "stripe_error", message: msg }, { status: 502 });
      }
    }
  }
  const origin = req.nextUrl.origin;
  const loc = locale === "en" ? "en" : "es";

  /**
   * Managed Payments apagado en estos cobros (12 de octubre de 2026). La
   * cuenta lo tiene activado por defecto, y con él Stripe exige un código de
   * impuesto en cada producto y solo admite productos digitales automáticos.
   * Un website hecho a la medida es un servicio profesional (diseño y
   * desarrollo), que Stripe excluye de Managed Payments: con él encendido, la
   * cuota de inicio y el pago único se rechazaban y el Esencial no se podía
   * pagar. JuditoADS y Juditos cobran por su lado y no se tocan.
   */
  const sinManagedPayments = { managed_payments: { enabled: false } } as const;

  // Inglés vive sin prefijo; solo el español lleva /es. Al pagar, lo llevamos
  // a entregar los datos de su negocio: es el momento en que más dispuesto
  // está a hacerlo.
  const exito = loc === "es" ? `${origin}/es/intake?pagado=1` : `${origin}/intake?pagado=1`;
  const volver = loc === "es" ? `${origin}/es/servicios` : `${origin}/services`;
  // Origen del cliente: dato de marketing para saber qué canal funciona
  const origenCliente: Stripe.Checkout.SessionCreateParams.CustomField[] = [
    {
      key: "source",
      label: {
        type: "custom",
        custom: loc === "es" ? "¿Dónde supiste de nosotros?" : "Where did you hear about us?",
      },
      type: "dropdown",
      optional: true,
      dropdown: {
        options: [
          { label: "Google", value: "google" },
          { label: loc === "es" ? "Un amigo" : "A friend", value: "friend" },
          { label: loc === "es" ? "Redes sociales" : "Social media", value: "social" },
        ],
      },
    },
  ];

  /**
   * Pago único: el año del contrato de una vez, por el precio de 10 meses y
   * sin cuota de inicio (Esencial y Apps desde el 14 de noviembre de 2026).
   * No es suscripción: un solo cobro en modo "payment", con el monto sacado
   * de pricing.json y factura para el cliente. Al terminar los 12 meses rige
   * la cláusula 4 del contrato, igual que con el pago mensual.
   */
  const unico = pagoUnico(plan as Plan);
  if (modalidad === "unico" && unico) {
    const nombrePlan = NOMBRE_PLAN[plan as Plan]?.[loc] ?? String(plan);
    const nombre = loc === "es" ? `${nombrePlan} · 12 meses (pago único)` : `${nombrePlan} · 12 months (one-time payment)`;
    try {
      const pagoUnicoSesion = await stripe.checkout.sessions.create({
        mode: "payment",
        ...sinManagedPayments,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: unico.total * 100,
              product_data: {
                name: nombre,
                description:
                  loc === "es"
                    ? `Los ${unico.meses} meses del contrato pagados de una vez: diseño, alojamiento, dominio, soporte y mantenimiento. Sin cuota de inicio.`
                    : `All ${unico.meses} months of the agreement paid at once: design, hosting, domain, support and maintenance. No setup fee.`,
              },
            },
          },
        ],
        customer_creation: "always",
        invoice_creation: { enabled: true },
        metadata: { plan: String(plan), modalidad: "unico", meses: String(unico.meses) },
        payment_intent_data: { metadata: { plan: String(plan), modalidad: "unico", meses: String(unico.meses) } },
        locale: loc,
        custom_fields: origenCliente,
        success_url: exito,
        cancel_url: volver,
      });
      return NextResponse.json({ url: pagoUnicoSesion.url });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown";
      console.error("stripe checkout error (pago único):", msg);
      return NextResponse.json({ error: "stripe_error", message: msg }, { status: 502 });
    }
  }

  /**
   * Lo que la página promete y lo que Stripe cobra tienen que ser el mismo
   * número. Si el precio guardado en Stripe quedó viejo, se arma el cobro con
   * el monto correcto en vez de cobrar de menos sin que nadie se entere.
   */
  const esperado = precio(plan as Plan) * 100; // centavos
  let linea: Stripe.Checkout.SessionCreateParams.LineItem = { price, quantity: 1 };
  try {
    const guardado = await stripe.prices.retrieve(price);
    if (guardado.unit_amount !== esperado) {
      console.warn(
        `[checkout] El precio de Stripe para "${plan}" dice ${guardado.unit_amount} y la tarifa vigente es ${esperado}. Se cobra la vigente; actualiza el precio en Stripe.`
      );
      linea = {
        quantity: 1,
        price_data: {
          currency: guardado.currency || "usd",
          product: typeof guardado.product === "string" ? guardado.product : guardado.product.id,
          unit_amount: esperado,
          recurring: { interval: "month" },
        },
      };
    }
  } catch {
    // Si Stripe no deja consultarlo, se sigue con el precio configurado
  }

  /**
   * Cuota de inicio (Esencial y Apps, $500 desde el 14 de noviembre de 2026):
   * un cobro único que Stripe suma a la primera factura de la suscripción y
   * no repite. Va con
   * price_data para que el monto salga de pricing.json y no haya que crear ni
   * mantener otro precio en el panel de Stripe.
   */
  const lineas: Stripe.Checkout.SessionCreateParams.LineItem[] = [linea];
  const cuota = cuotaInicio(plan as Plan);
  if (cuota > 0) {
    lineas.push({
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: cuota * 100,
        product_data: {
          name: loc === "es" ? "Cuota de inicio (pago único)" : "Setup fee (one-time)",
          description:
            loc === "es"
              ? "Configuración inicial del proyecto. Se cobra una sola vez, con el primer mes."
              : "Initial project setup. Charged once, with the first month.",
        },
      },
    });
  }

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create({
    mode: "subscription",
    ...sinManagedPayments,
    line_items: lineas,
    metadata: { plan: String(plan), modalidad: "mensual", cuota_inicio: String(cuota) },
    locale: loc,
    custom_fields: origenCliente,
    success_url: exito,
    cancel_url: volver,
    });
  } catch (e) {
    // El mensaje de Stripe dice exactamente qué está mal configurado
    // (price inexistente, clave inválida, precio no recurrente, etc.)
    const msg = e instanceof Error ? e.message : "unknown";
    console.error("stripe checkout error:", msg);
    return NextResponse.json({ error: "stripe_error", message: msg }, { status: 502 });
  }

  return NextResponse.json({ url: session.url });
}

/**
 * Full Diagnostic (Junior, 14 de noviembre de 2026): un solo cobro de $99,
 * en modo "payment" y con el monto de pricing.json, así que no hace falta
 * crear nada en el panel de Stripe. Stripe pide en el mismo pago el website
 * o el nombre del negocio y sus redes, para empezar sin otro formulario.
 */
async function diagnostico(stripe: Stripe, origin: string, loc: "es" | "en") {
  const pagina = loc === "es" ? `${origin}/es/diagnostico` : `${origin}/diagnostic`;
  try {
    const sesion = await stripe.checkout.sessions.create({
      mode: "payment",
      managed_payments: { enabled: false },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: PRECIO_DIAGNOSTICO * 100,
            product_data: {
              name: "Full Diagnostic",
              description:
                loc === "es"
                  ? `Diagnóstico completo de tu website y tu presencia en internet, en PDF, en ${DIAS_DIAGNOSTICO} días hábiles.`
                  : `A full diagnostic of your website and online presence, as a PDF, in ${DIAS_DIAGNOSTICO} business days.`,
            },
          },
        },
      ],
      customer_creation: "always",
      invoice_creation: { enabled: true },
      metadata: { producto: "diagnostico" },
      payment_intent_data: { metadata: { producto: "diagnostico" } },
      locale: loc,
      custom_fields: [
        {
          key: "negocio",
          label: { type: "custom", custom: loc === "es" ? "Tu website o el nombre del negocio" : "Your website or business name" },
          type: "text",
        },
        {
          key: "redes",
          label: { type: "custom", custom: loc === "es" ? "Tu Instagram o Facebook" : "Your Instagram or Facebook" },
          type: "text",
          optional: true,
        },
        {
          key: "ciudad",
          label: { type: "custom", custom: loc === "es" ? "Ciudad donde vendes" : "City where you sell" },
          type: "text",
          optional: true,
        },
      ],
      success_url: `${pagina}?pagado=1`,
      cancel_url: pagina,
    });
    return NextResponse.json({ url: sesion.url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    console.error("stripe checkout error (diagnóstico):", msg);
    return NextResponse.json({ error: "stripe_error", message: msg }, { status: 502 });
  }
}
