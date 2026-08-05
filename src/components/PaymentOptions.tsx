"use client";

/**
 * Página de métodos de pago (orden pedido por el dueño):
 * 1º Stripe (tarjeta y todos sus métodos) · 2º PayPal · 3º Zelle.
 * Solo USD.
 */

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getSupabase } from "@/lib/supabase";
import { inputClass } from "./AuthForms";

const AMOUNTS: Record<string, string> = {
  essential: "$50",
  complex: "$100",
  apps: "$150",
};

const ZELLE_EMAIL = "admin@judomarketing.net";

export default function PaymentOptions({
  plan,
  stripeReady,
  paypalMe,
}: {
  plan: "essential" | "complex" | "apps";
  stripeReady: boolean;
  paypalMe: string | null;
}) {
  const t = useTranslations("pay");
  const tz = useTranslations("zelle");
  const locale = useLocale();

  const [zelleOpen, setZelleOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const [payerName, setPayerName] = useState("");
  const [refCode, setRefCode] = useState("");
  const [source, setSource] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const amount = AMOUNTS[plan];

  const goStripe = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, locale }),
      });
      const data = (await res.json()) as { url?: string };
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error();
    } catch {
      setError(tz("error"));
      setLoading(false);
    }
  };

  const submitZelle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const supabase = getSupabase();
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${plan}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("payment-proofs")
        .upload(path, file);
      if (upErr) throw upErr;
      const { error: insErr } = await supabase.from("payment_proofs").insert({
        plan,
        payer_name: payerName.trim(),
        referral_code: refCode.trim() || null,
        source: source || null,
        screenshot_path: path,
      });
      if (insErr) throw insErr;
      setDone(true);
    } catch {
      setError(tz("error"));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <p className="rounded-xl border border-judo-lilac/30 bg-judo-purple/10 p-5 text-sm">
        ✅ {tz("success")}
      </p>
    );
  }

  const card =
    "flex w-full items-center gap-4 rounded-2xl border p-5 text-left transition";

  return (
    <div className="flex flex-col gap-3">
      {/* 1º STRIPE */}
      <button
        onClick={goStripe}
        disabled={!stripeReady || loading}
        className={`${card} ${
          stripeReady
            ? "border-judo-purple bg-judo-purple/10 hover:border-judo-lilac hover:bg-judo-purple/20"
            : "cursor-not-allowed border-judo-lilac/15 opacity-50"
        }`}
      >
        <span className="text-3xl">💳</span>
        <span className="flex-1">
          <span className="block font-semibold">{t("stripeTitle")}</span>
          <span className="block text-sm text-judo-fog/60">{t("stripeDesc")}</span>
        </span>
        <span className="font-bold text-judo-lilac">
          {stripeReady ? `${t("pay")} ${amount} →` : t("paypalSoon")}
        </span>
      </button>

      {/* 2º PAYPAL */}
      {paypalMe ? (
        <a
          href={`https://paypal.me/${paypalMe}/${amount.replace("$", "")}usd`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${card} border-judo-lilac/25 hover:border-judo-lilac hover:bg-judo-purple/10`}
        >
          <span className="text-3xl">🅿️</span>
          <span className="flex-1">
            <span className="block font-semibold">{t("paypalTitle")}</span>
            <span className="block text-sm text-judo-fog/60">{t("paypalDesc")}</span>
          </span>
          <span className="font-bold text-judo-lilac">{t("pay")} {amount} →</span>
        </a>
      ) : (
        <div className={`${card} cursor-not-allowed border-judo-lilac/15 opacity-50`}>
          <span className="text-3xl">🅿️</span>
          <span className="flex-1">
            <span className="block font-semibold">{t("paypalTitle")}</span>
            <span className="block text-sm text-judo-fog/60">{t("paypalDesc")}</span>
          </span>
          <span className="text-sm text-judo-fog/50">{t("paypalSoon")}</span>
        </div>
      )}

      {/* 3º ZELLE */}
      <button
        onClick={() => setZelleOpen(!zelleOpen)}
        className={`${card} border-judo-lilac/25 hover:border-judo-lilac hover:bg-judo-purple/10`}
      >
        <span className="text-3xl">🏦</span>
        <span className="flex-1">
          <span className="block font-semibold">{t("zelleTitle")}</span>
          <span className="block text-sm text-judo-fog/60">{t("zelleDesc")}</span>
        </span>
        <span className="font-bold text-judo-lilac">{zelleOpen ? "▲" : "▼"}</span>
      </button>

      {zelleOpen && (
        <form onSubmit={submitZelle} className="flex flex-col gap-3 rounded-2xl border border-judo-lilac/20 bg-judo-surface p-5">
          <p className="rounded-xl border border-judo-lilac/25 bg-judo-black/50 px-4 py-3 text-sm">
            {tz("instructions")}{" "}
            <span className="font-bold text-judo-lilac">{ZELLE_EMAIL}</span>
            <br />
            <span className="text-judo-fog/60">
              {tz("amountLabel")}: <b className="text-judo-fog">{amount} USD</b> · {tz("usdOnly")}
            </span>
          </p>
          <p className="text-xs text-judo-fog/55">{tz("thenUpload")}</p>
          <input required value={payerName} onChange={(e) => setPayerName(e.target.value)} placeholder={tz("payerName")} className={inputClass} />
          <input value={refCode} onChange={(e) => setRefCode(e.target.value)} placeholder={tz("refCode")} className={inputClass} />
          <select value={source} onChange={(e) => setSource(e.target.value)} className={inputClass}>
            <option value="" className="bg-judo-surface">{tz("source")} {tz("sourceNone")}</option>
            <option value="google" className="bg-judo-surface">{tz("sourceGoogle")}</option>
            <option value="friend" className="bg-judo-surface">{tz("sourceFriend")}</option>
            <option value="social" className="bg-judo-surface">{tz("sourceSocial")}</option>
          </select>
          <label className="flex flex-col gap-1 text-xs text-judo-fog/60">
            {tz("upload")}
            <input
              required
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className={`${inputClass} file:mr-3 file:rounded-lg file:border-0 file:bg-judo-purple file:px-3 file:py-1 file:text-white`}
            />
          </label>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary disabled:opacity-60">
            {loading ? "…" : `${tz("submit")} →`}
          </button>
        </form>
      )}

      {error && !zelleOpen && <p className="text-center text-sm text-red-400">{error}</p>}
    </div>
  );
}
