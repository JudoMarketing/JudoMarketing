"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import TiltCard from "@/components/TiltCard";
import { inputClass, localePath, mensajeDeError } from "@/components/AuthForms";
import Turnstile, { bloqueaEnvio, resetTurnstile } from "@/components/Turnstile";
import { getSupabase } from "@/lib/supabase";

export default function ForgotPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [captchaRoto, setCaptchaRoto] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error: err } = await getSupabase().auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}${localePath(locale, "/reset")}`,
      captchaToken: captcha || undefined,
    });
    setLoading(false);
    if (err) {
      resetTurnstile();
      setCaptcha("");
      setError(mensajeDeError(err.message, locale));
      return;
    }
    setSent(true);
  };

  return (
    <div className="judo-glow">
      <section className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-20">
        <div className="text-center">
          <h1 className="hero-in text-4xl font-bold">{t("forgotTitle")}</h1>
          <p className="hero-in mt-2 text-judo-fog/60" style={{ animationDelay: "0.15s" }}>
            {t("forgotSubtitle")}
          </p>
        </div>
        <TiltCard className="mt-8 p-7">
          {sent ? (
            <p className="rounded-xl border border-judo-lilac/30 bg-judo-purple/10 p-5 text-sm">
              ✉️ {t("forgotSent")}
            </p>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("email")}
                className={inputClass}
              />
              <Turnstile onToken={setCaptcha} onFallo={setCaptchaRoto} />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={loading || bloqueaEnvio(captcha, captchaRoto)}
                className="btn-3d py-3 disabled:opacity-60"
              >
                {loading ? "…" : t("forgotSend")}
              </button>
            </form>
          )}
          <p className="mt-4 text-center text-sm text-judo-fog/60">
            <Link href="/login" className="text-judo-lilac hover:underline">
              ← {t("loginLink")}
            </Link>
          </p>
        </TiltCard>
      </section>
    </div>
  );
}
