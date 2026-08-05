"use client";

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
}: {
  plan: "essential" | "complex" | "apps";
  stripeReady: boolean;
}) {
  const t = useTranslations("zelle");
  const tBuy = useTranslations("buy");
  const locale = useLocale();

  const [mode, setMode] = useState<"choose" | "zelle" | "done">("choose");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [payerName, setPayerName] = useState("");
  const [refCode, setRefCode] = useState("");
  const [source, setSource] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const goStripe = async () => {
    setLoading(true);
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
      throw new Error("no url");
    } catch {
      setError(t("error"));
    } finally {
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
      setMode("done");
    } catch {
      setError(t("error"));
    } finally {
      setLoading(false);
    }
  };

  if (mode === "done") {
    return (
      <p className="mt-8 rounded-xl border border-judo-lilac/30 bg-judo-purple/10 p-4 text-sm">
        ✅ {t("success")}
      </p>
    );
  }

  if (mode === "zelle") {
    return (
      <form onSubmit={submitZelle} className="mt-8 flex flex-col gap-3 text-left">
        <p className="text-sm font-semibold">{t("title")}</p>
        <p className="rounded-xl border border-judo-lilac/25 bg-judo-black/50 px-4 py-3 text-sm">
          {t("instructions")}{" "}
          <span className="font-bold text-judo-lilac">{ZELLE_EMAIL}</span>
          <br />
          <span className="text-judo-fog/60">
            {t("amountLabel")}: <b className="text-judo-fog">{AMOUNTS[plan]} USD</b> ·{" "}
            {t("usdOnly")}
          </span>
        </p>
        <p className="text-xs text-judo-fog/55">{t("thenUpload")}</p>
        <input
          required
          value={payerName}
          onChange={(e) => setPayerName(e.target.value)}
          placeholder={t("payerName")}
          className={inputClass}
        />
        <input
          value={refCode}
          onChange={(e) => setRefCode(e.target.value)}
          placeholder={t("refCode")}
          className={inputClass}
        />
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          className={inputClass}
        >
          <option value="" className="bg-judo-surface">
            {t("source")} {t("sourceNone")}
          </option>
          <option value="google" className="bg-judo-surface">
            {t("sourceGoogle")}
          </option>
          <option value="friend" className="bg-judo-surface">
            {t("sourceFriend")}
          </option>
          <option value="social" className="bg-judo-surface">
            {t("sourceSocial")}
          </option>
        </select>
        <label className="flex flex-col gap-1 text-xs text-judo-fog/60">
          {t("upload")}
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
          {loading ? "…" : `${t("submit")} →`}
        </button>
        <button
          type="button"
          onClick={() => setMode("choose")}
          className="text-xs text-judo-fog/50 hover:text-judo-lilac"
        >
          ← {t("back")}
        </button>
      </form>
    );
  }

  return (
    <div className="mt-8">
      <p className="text-center text-sm font-semibold">{t("chooseTitle")}</p>
      <div className="mt-3 flex flex-col gap-2">
        {stripeReady && (
          <button
            onClick={goStripe}
            disabled={loading}
            className="btn-primary w-full disabled:opacity-60"
          >
            💳 {t("card")} · {tBuy("subscribe")}
          </button>
        )}
        <button onClick={() => setMode("zelle")} className="btn-secondary w-full">
          🏦 {t("zelle")} — {t("zelleDesc")}
        </button>
      </div>
      {error && <p className="mt-2 text-center text-sm text-red-400">{error}</p>}
      <p className="mt-2 text-center text-xs text-judo-fog/40">
        {stripeReady ? `🔒 ${tBuy("secure")} · ` : ""}
        {t("usdOnly")}
      </p>
    </div>
  );
}
