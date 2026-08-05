"use client";

/**
 * Página de métodos de pago (orden pedido por el dueño):
 * 1º Stripe (tarjeta y todos sus métodos) · 2º PayPal · 3º Zelle.
 * Solo USD.
 */

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import QRCode from "qrcode";
import { getSupabase } from "@/lib/supabase";
import { inputClass } from "./AuthForms";

const AMOUNTS: Record<string, string> = {
  essential: "$50",
  complex: "$100",
  apps: "$150",
};

const ZELLE_EMAIL = "admin@judomarketing.net";
// USDT ERC-20 (red Ethereum), billetera de Judo Marketing
const USDT_ADDRESS = "0x1848289C74282b1b2F58CfEf43019A9f9d180086";

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
  const tc = useTranslations("crypto");
  const locale = useLocale();

  const [zelleOpen, setZelleOpen] = useState(false);
  const [cryptoOpen, setCryptoOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const [payerName, setPayerName] = useState("");
  const [refCode, setRefCode] = useState("");
  const [source, setSource] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [txHash, setTxHash] = useState("");
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (cryptoOpen && !qr) {
      QRCode.toDataURL(USDT_ADDRESS, {
        width: 190,
        margin: 1,
        color: { dark: "#0b0b12", light: "#f5f5f7" },
      }).then(setQr);
    }
  }, [cryptoOpen, qr]);

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

  const uploadScreenshot = async (theFile: File): Promise<string> => {
    const supabase = getSupabase();
    const ext = theFile.name.split(".").pop() ?? "jpg";
    const path = `${plan}/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("payment-proofs")
      .upload(path, theFile);
    if (upErr) throw upErr;
    return path;
  };

  const submitZelle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const path = await uploadScreenshot(file);
      const { error: insErr } = await getSupabase().from("payment_proofs").insert({
        plan,
        method: "zelle",
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

  const submitCrypto = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const path = file ? await uploadScreenshot(file) : null;
      const { error: insErr } = await getSupabase().from("payment_proofs").insert({
        plan,
        method: "usdt",
        payer_name: payerName.trim(),
        referral_code: refCode.trim() || null,
        source: source || null,
        tx_hash: txHash.trim(),
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
        onClick={() => {
          setZelleOpen(!zelleOpen);
          setCryptoOpen(false);
        }}
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

      {/* 4º CRIPTO (USDT ERC-20) */}
      <button
        onClick={() => {
          setCryptoOpen(!cryptoOpen);
          setZelleOpen(false);
        }}
        className={`${card} border-judo-lilac/25 hover:border-judo-lilac hover:bg-judo-purple/10`}
      >
        <span className="text-3xl">🪙</span>
        <span className="flex-1">
          <span className="block font-semibold">{tc("title")}</span>
          <span className="block text-sm text-judo-fog/60">{tc("desc")}</span>
        </span>
        <span className="font-bold text-judo-lilac">{cryptoOpen ? "▲" : "▼"}</span>
      </button>

      {cryptoOpen && (
        <form onSubmit={submitCrypto} className="flex flex-col gap-3 rounded-2xl border border-judo-lilac/20 bg-judo-surface p-5">
          <p className="text-sm font-semibold">{tc("panelTitle")}</p>
          <p className="rounded-xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
            ⚠️ {tc("warning")} ({AMOUNTS[plan].replace("$", "")} USDT)
          </p>
          <p className="text-xs text-judo-fog/60">{tc("network")}</p>
          <div className="flex flex-col items-center gap-2 rounded-xl border border-judo-lilac/25 bg-judo-black/50 p-4">
            {qr && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr} alt="QR USDT" className="rounded-lg" width={160} height={160} />
            )}
            <p className="text-xs text-judo-fog/60">{tc("address")}:</p>
            <code className="break-all text-center text-xs text-judo-lilac">{USDT_ADDRESS}</code>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(USDT_ADDRESS);
                setCopied(true);
                setTimeout(() => setCopied(false), 2200);
              }}
              className="btn-secondary px-4 py-1.5 text-xs"
            >
              {copied ? tc("copied") : `📋 ${tc("copy")}`}
            </button>
          </div>
          <input required value={payerName} onChange={(e) => setPayerName(e.target.value)} placeholder={tz("payerName")} className={inputClass} />
          <input
            required
            value={txHash}
            onChange={(e) => setTxHash(e.target.value)}
            placeholder={tc("txHash")}
            pattern="0x[a-fA-F0-9]{10,}"
            className={inputClass}
          />
          <input value={refCode} onChange={(e) => setRefCode(e.target.value)} placeholder={tz("refCode")} className={inputClass} />
          <select value={source} onChange={(e) => setSource(e.target.value)} className={inputClass}>
            <option value="" className="bg-judo-surface">{tz("source")} {tz("sourceNone")}</option>
            <option value="google" className="bg-judo-surface">{tz("sourceGoogle")}</option>
            <option value="friend" className="bg-judo-surface">{tz("sourceFriend")}</option>
            <option value="social" className="bg-judo-surface">{tz("sourceSocial")}</option>
          </select>
          <label className="flex flex-col gap-1 text-xs text-judo-fog/60">
            {tc("screenshot")}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className={`${inputClass} file:mr-3 file:rounded-lg file:border-0 file:bg-judo-purple file:px-3 file:py-1 file:text-white`}
            />
          </label>
          <p className="rounded-xl border border-judo-lilac/25 bg-judo-black/40 px-3 py-2 text-xs text-judo-fog/60">
            ⏳ {tc("verifyNote")}
          </p>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary disabled:opacity-60">
            {loading ? "…" : `${tc("submit")} →`}
          </button>
        </form>
      )}

      <p className="mt-1 text-center text-xs text-judo-fog/45">{t("feesNote")}</p>

      {error && !zelleOpen && !cryptoOpen && (
        <p className="text-center text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
