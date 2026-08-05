import { setRequestLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import PaymentOptions from "@/components/PaymentOptions";

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
  searchParams: Promise<{ plan?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { plan: rawPlan } = await searchParams;
  const plan: PlanKey = PLAN_KEYS.includes(rawPlan as PlanKey)
    ? (rawPlan as PlanKey)
    : "essential";

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
            <h1 className="hero-in text-3xl font-bold sm:text-4xl">{t("title")}</h1>
            <p className="hero-in mt-3 text-judo-fog/70" style={{ animationDelay: "0.15s" }}>
              {t("subtitle")}
            </p>
            <p className="mt-4 inline-block rounded-full border border-judo-lilac/40 bg-judo-surface/70 px-4 py-1.5 text-sm">
              {t("planLabel")}: <b className="text-judo-lilac">{tPlans(`${plan}.name`)}</b>{" "}
              · {tPlans(`${plan}.price`)}
            </p>
          </div>
          <div className="mt-8">
            <PaymentOptions plan={plan} stripeReady={stripeReady} paypalMe={paypalMe} />
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
