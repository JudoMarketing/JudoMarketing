"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { getSupabase } from "@/lib/supabase";
import Turnstile, { bloqueaEnvio, resetTurnstile } from "./Turnstile";

const TERMS_VERSION = "2026-08-05";

/**
 * Cuando Supabase rechaza por captcha devuelve un texto en inglés que no le
 * dice nada a nadie. Se traduce a algo accionable.
 */
export function mensajeDeError(msg: string, locale: string): string {
  if (!/captcha/i.test(msg)) return msg;
  return locale === "es"
    ? "No se pudo verificar que no eres un robot. Desactiva el bloqueador de anuncios para esta página o intenta en otro navegador."
    : "We couldn't verify you're not a robot. Disable your ad blocker for this page or try another browser.";
}

// El inglés vive sin prefijo; solo el español lleva /es
export const localePath = (locale: string, path: string) =>
  locale === "es" ? `/es${path}` : path;

export const inputClass =
  "w-full rounded-xl border border-judo-lilac/25 bg-judo-black/60 px-4 py-3 text-sm text-judo-fog placeholder:text-judo-fog/35 outline-none transition focus:border-judo-lilac focus:ring-1 focus:ring-judo-lilac";

export function LoginForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [captchaRoto, setCaptchaRoto] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = getSupabase();
    const { data, error: err } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: captcha ? { captchaToken: captcha } : undefined,
    });
    setLoading(false);
    if (err) {
      resetTurnstile();
      setCaptcha("");
      setError(
        err.message === "Invalid login credentials"
          ? t("error")
          : mensajeDeError(err.message, locale)
      );
      return;
    }
    // El admin va directo a su dashboard; los vendedores a su portal
    const { data: prof } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();
    router.push(prof?.role === "admin" ? "/admin" : "/portal");
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 text-left">
      <input
        required
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("email")}
        className={inputClass}
      />
      <input
        required
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={t("password")}
        className={inputClass}
      />
      <Turnstile onToken={setCaptcha} onFallo={setCaptchaRoto} />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading || bloqueaEnvio(captcha, captchaRoto)}
        className="btn-3d py-3 disabled:opacity-60"
      >
        {loading ? "…" : t("submitLogin")}
      </button>
      <p className="text-center text-sm">
        <Link href="/forgot" className="text-judo-lilac hover:underline">
          {t("forgotLink")}
        </Link>
      </p>
      <p className="text-center text-sm text-judo-fog/60">
        {t("noAccount")}{" "}
        <Link href="/register" className="font-semibold text-judo-lilac hover:underline">
          {t("registerLink")}
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [refCode, setRefCode] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [captcha, setCaptcha] = useState("");
  const [captchaRoto, setCaptchaRoto] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accepted) return;
    setError("");
    setLoading(true);
    // Un solo correo: el de confirmación de Supabase, con el diseño de marca
    // y el aviso de esperar aprobación (plantilla en docs/emails/)
    const { error: err } = await getSupabase().auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}${localePath(locale, "/login")}`,
        captchaToken: captcha || undefined,
        data: {
          full_name: fullName.trim(),
          referred_by_code: refCode.trim(),
          terms_version: TERMS_VERSION,
          language: locale,
        },
      },
    });
    setLoading(false);
    if (err) {
      resetTurnstile();
      setCaptcha("");
      setError(mensajeDeError(err.message, locale));
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <p className="rounded-xl border border-judo-lilac/30 bg-judo-purple/10 p-5 text-judo-fog">
        ✉️ {t("checkEmail")}
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 text-left">
      <input
        required
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder={t("fullName")}
        className={inputClass}
      />
      <input
        required
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("email")}
        className={inputClass}
      />
      <input
        required
        type="password"
        autoComplete="new-password"
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder={t("password")}
        className={inputClass}
      />
      <input
        value={refCode}
        onChange={(e) => setRefCode(e.target.value)}
        placeholder={t("referralCode")}
        className={inputClass}
      />
      <label className="flex items-start gap-2 text-sm text-judo-fog/70">
        <input
          type="checkbox"
          required
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-1 accent-[#7b2dff]"
        />
        <span>
          {t("acceptTermsPre")}{" "}
          <Link href="/legal" target="_blank" className="text-judo-lilac hover:underline">
            {t("acceptTermsPolicy")}
          </Link>{" "}
          {t("acceptTermsAnd")}{" "}
          <a
            href="/legal/Acuerdo_Programa_Vendedores.pdf"
            target="_blank"
            className="text-judo-lilac hover:underline"
          >
            {t("acceptTermsSeller")}
          </a>
        </span>
      </label>
      <Turnstile onToken={setCaptcha} onFallo={setCaptchaRoto} />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading || !accepted || bloqueaEnvio(captcha, captchaRoto)}
        className="btn-3d py-3 disabled:opacity-60"
      >
        {loading ? "…" : t("submitRegister")}
      </button>
      <p className="text-center text-sm text-judo-fog/60">
        {t("haveAccount")}{" "}
        <Link href="/login" className="font-semibold text-judo-lilac hover:underline">
          {t("loginLink")}
        </Link>
      </p>
    </form>
  );
}
