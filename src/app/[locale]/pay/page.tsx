import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import PaymentOptions from "@/components/PaymentOptions";
import { cuotaInicio, cuotaInicioTexto, pagoUnico, pagoUnicoTexto, precioTexto, primerPagoTexto } from "@/lib/pricing";
import { privateMetadata } from "@/lib/seo";
import type { Metadata } from "next";

/**
 * El checkout no se indexa: es un paso, no una página que alguien busque, y
 * con ?plan= tiene tres versiones que Google veía como copias de la portada.
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return privateMetadata(locale === "es" ? "/es/pagar" : "/pay");
}

const PLAN_KEYS = ["essential", "complex", "apps"] as const;
type PlanKey = (typeof PLAN_KEYS)[number];

const STRIPE_PRICES: Record<string, string | undefined> = {
  essential: process.env.STRIPE_PRICE_ESSENTIAL,
  complex: process.env.STRIPE_PRICE_COMPLEX,
  apps: process.env.STRIPE_PRICE_APPS,
};

export default async function PayPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ plan?: string; pago?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { plan: rawPlan, pago } = await searchParams;
  const plan: PlanKey = PLAN_KEYS.includes(rawPlan as PlanKey)
    ? (rawPlan as PlanKey)
    : "essential";
  // Pago único (hoy solo el Esencial): el contrato completo de una vez, sin
  // cuota de inicio. Si el plan no lo ofrece, se ignora el parámetro.
  const unico = pagoUnico(plan);
  const modalidad: "mensual" | "unico" = pago === "unico" && unico ? "unico" : "mensual";
  const monto = modalidad === "unico" ? pagoUnicoTexto(plan)! : primerPagoTexto(plan);

  const t = await getTranslations("pay");
  const tPlans = await getTranslations("plans");

  const stripeReady = Boolean(process.env.STRIPE_SECRET_KEY && STRIPE_PRICES[plan]);
  const paypalMe = process.env.NEXT_PUBLIC_PAYPAL_ME || null;

  return (
    <div className="judo-glow min-h-[70vh]">
      {/* Panel sólido: las líneas animadas molestan al momento de pagar */}
      <section className="mx-auto max-w-xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="rounded-2xl border border-judo-lilac/15 bg-[#0e0e16] p-6 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] sm:p-8">
          <div className="text-center">
            <h1 className="hero-in text-3xl font-bold sm:text-4xl">
              {modalidad === "unico" ? t("titleOneTime") : t("title")}
            </h1>
            <p className="hero-in mt-3 text-judo-fog/70" style={{ animationDelay: "calc(var(--tiempo) * 1)" }}>
              {t("subtitle")}
            </p>
            <p className="mt-4 inline-block rounded-full border border-judo-lilac/40 bg-judo-surface/70 px-4 py-1.5 text-sm">
              {t("planLabel")}: <b className="text-judo-lilac">{tPlans(`${plan}.name`)}</b>{" "}
              ·{" "}
              {modalidad === "unico" ? (
                t("oneTimeChip", { total: monto })
              ) : (
                <>
                  {tPlans("from")} {precioTexto(plan)}
                  {tPlans("perMonth")}
                </>
              )}
            </p>
            {/* La cuota de inicio se dice antes de pagar, con la suma hecha:
                nadie debe enterarse en la pantalla de Stripe. Con las dos
                formas de pago, lo dice cada opción. */}
            {cuotaInicio(plan) > 0 && !unico && (
              <p className="mx-auto mt-3 max-w-sm text-sm text-judo-fog/70">
                {t("setupLine", {
                  total: primerPagoTexto(plan),
                  month: precioTexto(plan),
                  fee: cuotaInicioTexto(plan),
                })}
              </p>
            )}
          </div>
          {/* Dos formas de pagar el mismo contrato de 12 meses: en cuotas
              mensuales o todo de una vez. Son enlaces, no estado: el monto lo
              decide el servidor y la dirección se puede compartir. */}
          {unico && (
            <div className="mt-7">
              <p className="text-center text-sm font-semibold text-judo-fog/80">{t("howTitle")}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Link
                  href={{ pathname: "/pay", query: { plan } }}
                  scroll={false}
                  aria-current={modalidad === "mensual" ? "true" : undefined}
                  className={`rounded-2xl border p-4 text-left transition ${
                    modalidad === "mensual"
                      ? "border-judo-purple bg-judo-purple/15"
                      : "border-judo-lilac/20 hover:border-judo-lilac/60"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2 text-sm font-semibold">
                    {t("monthlyTitle")}
                    {modalidad === "mensual" && <span className="text-xs text-judo-lilac">✓ {t("selected")}</span>}
                  </span>
                  <span className="display-num mt-1 block text-2xl font-bold">
                    {t("monthlyPrice", { month: precioTexto(plan) })}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-judo-fog/65">
                    {cuotaInicio(plan) > 0
                      ? t("monthlyDesc", { total: primerPagoTexto(plan), fee: cuotaInicioTexto(plan), month: precioTexto(plan) })
                      : t("monthlyDescNoFee", { month: precioTexto(plan) })}
                  </span>
                </Link>
                <Link
                  href={{ pathname: "/pay", query: { plan, pago: "unico" } }}
                  scroll={false}
                  aria-current={modalidad === "unico" ? "true" : undefined}
                  className={`rounded-2xl border p-4 text-left transition ${
                    modalidad === "unico"
                      ? "border-judo-purple bg-judo-purple/15"
                      : "border-judo-lilac/20 hover:border-judo-lilac/60"
                  }`}
                >
                  <span className="flex items-center justify-between gap-2 text-sm font-semibold">
                    {t("oneTimeTitle")}
                    {modalidad === "unico" ? (
                      <span className="text-xs text-judo-lilac">✓ {t("selected")}</span>
                    ) : (
                      cuotaInicio(plan) > 0 && (
                        <span className="rounded-full bg-judo-purple/25 px-2 py-0.5 text-[11px] text-judo-lilac">
                          {t("oneTimeSave", { fee: cuotaInicioTexto(plan) })}
                        </span>
                      )
                    )}
                  </span>
                  <span className="display-num mt-1 block text-2xl font-bold">{pagoUnicoTexto(plan)}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-judo-fog/65">
                    {t("oneTimeDesc", { months: unico.meses })}
                  </span>
                </Link>
              </div>
            </div>
          )}
          <div className="mt-8">
            <PaymentOptions
              plan={plan}
              modalidad={modalidad}
              amount={monto}
              stripeReady={stripeReady}
              paypalMe={paypalMe}
            />
          </div>
          <p className="mt-6 text-center">
            <Link href="/services" className="text-sm text-judo-lilac hover:underline">
              {t("back")}
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
