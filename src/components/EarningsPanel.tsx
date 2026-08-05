"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { getSupabase } from "@/lib/supabase";

/**
 * Panel de ganancias del vendedor.
 * Muestra total vendido (cero si no hay nada), comisiones pendiente/pagada,
 * la gráfica mensual que sube a medida que vende, y la proyección con los
 * ejes "cuánto vendes al mes vs cuánto ganas", para que se motiven.
 * La regla de solvencia se refleja: las comisiones anuladas no suman.
 */

type CommissionRow = {
  amount: number;
  status: "pendiente" | "pagada" | "anulada";
  period: string | null;
  created_at: string;
};
type PaymentRow = { amount: number; paid_at: string };
type Deal = { commission_kind: string | null; commission_value: number | null };

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default function EarningsPanel({ sellerId }: { sellerId: string }) {
  const t = useTranslations("portal");
  const locale = useLocale();
  const supabase = getSupabase();

  const [commissions, setCommissions] = useState<CommissionRow[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const [comRes, payRes, dealRes] = await Promise.all([
        supabase
          .from("commissions")
          .select("amount,status,period,created_at")
          .eq("seller_id", sellerId),
        supabase.from("payments").select("amount,paid_at"),
        supabase
          .from("sellers")
          .select("commission_kind,commission_value")
          .eq("id", sellerId)
          .single(),
      ]);
      setCommissions((comRes.data as CommissionRow[]) ?? []);
      setPayments((payRes.data as PaymentRow[]) ?? []);
      setDeal((dealRes.data as Deal) ?? null);
      setLoaded(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sellerId]);

  const stats = useMemo(() => {
    const totalSold = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const valid = commissions.filter((c) => c.status !== "anulada");
    const pending = valid
      .filter((c) => c.status === "pendiente")
      .reduce((s, c) => s + Number(c.amount), 0);
    const paid = valid
      .filter((c) => c.status === "pagada")
      .reduce((s, c) => s + Number(c.amount), 0);

    // Ganancias por mes, últimos 6 meses (los meses sin ventas marcan cero)
    const months: { key: string; label: string; earned: number; sold: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: monthKey(d),
        label: d
          .toLocaleDateString(locale === "es" ? "es-US" : "en-US", { month: "short" })
          .replace(".", ""),
        earned: 0,
        sold: 0,
      });
    }
    for (const c of valid) {
      const key = (c.period ?? c.created_at).slice(0, 7);
      const m = months.find((x) => x.key === key);
      if (m) m.earned += Number(c.amount);
    }
    for (const p of payments) {
      const m = months.find((x) => x.key === p.paid_at.slice(0, 7));
      if (m) m.sold += Number(p.amount);
    }

    const thisMonth = months[months.length - 1];
    // Proyección simple: promedio de los meses con actividad reciente
    const active = months.filter((m) => m.earned > 0);
    const projection =
      active.length > 0
        ? Math.round(active.reduce((s, m) => s + m.earned, 0) / active.length)
        : 0;

    return { totalSold, pending, paid, months, thisMonth, projection };
  }, [commissions, payments, locale]);

  const money = (n: number) =>
    `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

  const dealSet = Boolean(deal?.commission_kind && Number(deal?.commission_value) > 0);
  const earnFor = (sold: number): number => {
    if (!dealSet || !deal) return 0;
    return deal.commission_kind === "porcentaje"
      ? (sold * Number(deal.commission_value)) / 100
      : (sold / 50) * Number(deal.commission_value);
  };

  return (
    <>
      {/* Tarjetas de totales */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-judo-lilac/20 bg-judo-surface p-5">
          <p className="text-xs uppercase tracking-wide text-judo-fog/50">
            {t("statTotal")}
          </p>
          <p className="mt-1 text-3xl font-bold">
            {loaded ? money(stats.totalSold) : "…"}
          </p>
        </div>
        <div className="rounded-2xl border border-judo-lilac/20 bg-judo-surface p-5">
          <p className="text-xs uppercase tracking-wide text-judo-fog/50">
            {t("statCommission")}
          </p>
          <p className="mt-1 text-3xl font-bold text-judo-lilac">
            {loaded ? money(stats.pending + stats.paid) : "…"}
          </p>
          <p className="mt-1 text-[11px] text-judo-fog/45">
            {loaded && (stats.pending > 0 || stats.paid > 0)
              ? `${money(stats.pending)} ${t("earnPending")} · ${money(stats.paid)} ${t("earnPaid")}`
              : t("commissionNote")}
          </p>
        </div>
      </div>

      {/* Acuerdo de comisión (visible después de la aprobación) */}
      {dealSet && deal && (
        <p className="mt-3 rounded-xl border border-judo-lilac/20 bg-judo-purple/10 px-4 py-2 text-sm text-judo-fog/80">
          🤝 {t("earnDeal")}:{" "}
          <b className="text-judo-lilac">
            {deal.commission_kind === "porcentaje"
              ? t("earnDealPct", { value: Number(deal.commission_value) })
              : t("earnDealFixed", { value: Number(deal.commission_value) })}
          </b>
        </p>
      )}

      {/* Gráfica mensual: sube a medida que vende */}
      <div className="mt-4 rounded-2xl border border-judo-lilac/20 bg-judo-surface p-6">
        <h2 className="font-semibold">📈 {t("earnMonthly")}</h2>
        {stats.months.every((m) => m.earned === 0) ? (
          <p className="mt-3 text-sm text-judo-fog/50">{t("earnEmpty")}</p>
        ) : (
          <>
            <svg viewBox="0 0 300 120" className="mt-4 w-full" role="img">
              {(() => {
                const max = Math.max(...stats.months.map((m) => m.earned), 1);
                return stats.months.map((m, i) => {
                  const h = Math.round((m.earned / max) * 78);
                  const x = 14 + i * 48;
                  return (
                    <g key={m.key}>
                      <rect
                        x={x}
                        y={96 - h}
                        width={30}
                        height={Math.max(h, 2)}
                        rx={4}
                        fill={m.earned > 0 ? "#7B2DFF" : "#2a2a3a"}
                      />
                      {m.earned > 0 && (
                        <text
                          x={x + 15}
                          y={90 - h}
                          textAnchor="middle"
                          fontSize="9"
                          fill="#A855F7"
                        >
                          {money(m.earned)}
                        </text>
                      )}
                      <text
                        x={x + 15}
                        y={110}
                        textAnchor="middle"
                        fontSize="9"
                        fill="#8a8a99"
                      >
                        {m.label}
                      </text>
                    </g>
                  );
                });
              })()}
            </svg>
            {stats.projection > 0 && (
              <p className="mt-2 text-sm text-judo-fog/60">
                🚀 {t("earnIfPace", { amount: money(stats.projection) })}
              </p>
            )}
          </>
        )}
      </div>

      {/* Proyección: cuánto vendes vs cuánto ganas al mes */}
      {dealSet && (
        <div className="mt-4 rounded-2xl border border-judo-lilac/20 bg-judo-surface p-6">
          <h2 className="font-semibold">🎯 {t("earnProjection")}</h2>
          <p className="mt-1 text-xs text-judo-fog/50">{t("earnProjDesc")}</p>
          <svg viewBox="0 0 320 150" className="mt-4 w-full" role="img">
            {(() => {
              const maxSold = Math.max(1000, Math.ceil(stats.thisMonth.sold / 500) * 1000);
              const maxEarn = earnFor(maxSold);
              const X = (sold: number) => 34 + (sold / maxSold) * 270;
              const Y = (earn: number) => 118 - (earn / Math.max(maxEarn, 1)) * 96;
              const marks = [0.25, 0.5, 0.75, 1].map((f) => maxSold * f);
              return (
                <>
                  {/* Ejes */}
                  <line x1="34" y1="118" x2="310" y2="118" stroke="#3a3a4a" strokeWidth="1" />
                  <line x1="34" y1="118" x2="34" y2="14" stroke="#3a3a4a" strokeWidth="1" />
                  {/* Línea de ganancia según lo vendido */}
                  <line
                    x1={X(0)}
                    y1={Y(0)}
                    x2={X(maxSold)}
                    y2={Y(maxEarn)}
                    stroke="#7B2DFF"
                    strokeWidth="2.5"
                  />
                  {marks.map((sold) => (
                    <g key={sold}>
                      <circle cx={X(sold)} cy={Y(earnFor(sold))} r="3" fill="#A855F7" />
                      <text
                        x={X(sold)}
                        y={Y(earnFor(sold)) - 8}
                        textAnchor="middle"
                        fontSize="9"
                        fill="#A855F7"
                      >
                        {money(earnFor(sold))}
                      </text>
                      <text x={X(sold)} y="132" textAnchor="middle" fontSize="9" fill="#8a8a99">
                        {money(sold)}
                      </text>
                    </g>
                  ))}
                  {/* Punto del mes actual */}
                  {stats.thisMonth.sold > 0 && (
                    <g>
                      <circle
                        cx={X(Math.min(stats.thisMonth.sold, maxSold))}
                        cy={Y(earnFor(Math.min(stats.thisMonth.sold, maxSold)))}
                        r="5"
                        fill="#F5F5F7"
                        stroke="#7B2DFF"
                        strokeWidth="2"
                      />
                      <text
                        x={X(Math.min(stats.thisMonth.sold, maxSold))}
                        y={Y(earnFor(Math.min(stats.thisMonth.sold, maxSold))) + 16}
                        textAnchor="middle"
                        fontSize="9"
                        fill="#F5F5F7"
                      >
                        {t("earnYouAreHere")}
                      </text>
                    </g>
                  )}
                  {/* Nombres de los ejes */}
                  <text x="172" y="147" textAnchor="middle" fontSize="9" fill="#8a8a99">
                    {t("earnAxisSold")}
                  </text>
                  <text
                    x="12"
                    y="66"
                    textAnchor="middle"
                    fontSize="9"
                    fill="#8a8a99"
                    transform="rotate(-90 12 66)"
                  >
                    {t("earnAxisEarn")}
                  </text>
                </>
              );
            })()}
          </svg>
        </div>
      )}
    </>
  );
}
