import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { precio, type Plan } from "@/lib/pricing";

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

  /**
   * Lo que la página promete y lo que Stripe cobra tienen que ser el mismo
   * número. Si el precio guardado en Stripe quedó viejo (por ejemplo el 1 de
   * septiembre, cuando la tarifa sube sola), se arma el cobro con el monto
   * correcto en vez de cobrar de menos sin que nadie se entere.
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

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [linea],
    locale: loc,
    // Origen del cliente — dato de marketing para saber qué canal funciona
    custom_fields: [
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
