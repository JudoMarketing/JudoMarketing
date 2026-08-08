import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const PLAN_ENV: Record<string, string | undefined> = {
  essential: process.env.STRIPE_PRICE_ESSENTIAL,
  complex: process.env.STRIPE_PRICE_COMPLEX,
  apps: process.env.STRIPE_PRICE_APPS,
};

// Cache de prod_... → price_... para no consultar Stripe en cada checkout
const resolvedPrices = new Map<string, string>();

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const { plan, locale } = (await req.json()) as {
    plan?: string;
    locale?: string;
  };
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

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price, quantity: 1 }],
    locale: loc,
    // Código de referido (nombre del vendedor) y origen del cliente —
    // se leen luego por webhook para asignar comisiones (fase de pagos)
    custom_fields: [
      {
        key: "referral_code",
        label: {
          type: "custom",
          custom:
            loc === "es"
              ? "Código de referido (nombre de tu vendedor)"
              : "Referral code (your seller's name)",
        },
        type: "text",
        optional: true,
      },
      {
        key: "source",
        label: {
          type: "custom",
          custom:
            loc === "es" ? "¿Dónde supiste de nosotros?" : "Where did you hear about us?",
        },
        type: "dropdown",
        optional: true,
        dropdown: {
          options: [
            { label: "Google", value: "google" },
            { label: loc === "es" ? "Un amigo" : "A friend", value: "friend" },
            {
              label: loc === "es" ? "Redes sociales" : "Social media",
              value: "social",
            },
          ],
        },
      },
    ],
    // Inglés vive sin prefijo; solo el español lleva /es
    // Al pagar, lo llevamos a entregar los datos de su negocio: es el
    // momento en que más dispuesto está a hacerlo.
    success_url:
      loc === "es" ? `${origin}/es/intake?pagado=1` : `${origin}/intake?pagado=1`,
    cancel_url: loc === "es" ? `${origin}/es/servicios` : `${origin}/services`,
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
