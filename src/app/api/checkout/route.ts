import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const PLAN_ENV: Record<string, string | undefined> = {
  essential: process.env.STRIPE_PRICE_ESSENTIAL,
  complex: process.env.STRIPE_PRICE_COMPLEX,
  apps: process.env.STRIPE_PRICE_APPS,
};

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const { plan, locale } = (await req.json()) as {
    plan?: string;
    locale?: string;
  };
  const price = plan ? PLAN_ENV[plan] : undefined;
  if (!price) {
    return NextResponse.json({ error: "unknown_plan" }, { status: 400 });
  }

  const stripe = new Stripe(secret);
  const origin = req.nextUrl.origin;
  const loc = locale === "en" ? "en" : "es";

  const session = await stripe.checkout.sessions.create({
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
    success_url: `${origin}/${loc}?checkout=success`,
    cancel_url: `${origin}/${loc}/${loc === "es" ? "servicios" : "services"}`,
  });

  return NextResponse.json({ url: session.url });
}
