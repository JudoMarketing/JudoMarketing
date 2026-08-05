"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import TiltCard from "@/components/TiltCard";
import { inputClass } from "@/components/AuthForms";
import { getSupabase } from "@/lib/supabase";

export default function ResetPage() {
  const t = useTranslations("auth");
  const router = useRouter();
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    // El enlace del correo crea la sesión de recuperación al cargar
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setHasSession(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setHasSession(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError(t("resetMismatch"));
      return;
    }
    setLoading(true);
    setError("");
    const { error: err } = await getSupabase().auth.updateUser({ password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setDone(true);
    setTimeout(() => router.replace("/portal"), 1800);
  };

  return (
    <div className="judo-glow">
      <section className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-20">
        <h1 className="hero-in text-center text-4xl font-bold">{t("resetTitle")}</h1>
        <TiltCard className="mt-8 p-7">
          {done ? (
            <p className="rounded-xl border border-judo-lilac/30 bg-judo-purple/10 p-5 text-center text-sm">
              ✅ {t("resetDone")}
            </p>
          ) : !hasSession ? (
            <p className="text-center text-sm text-judo-fog/60">{t("resetWaiting")}</p>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <input
                required
                type="password"
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("newPassword")}
                className={inputClass}
              />
              <input
                required
                type="password"
                minLength={8}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder={t("confirmPassword")}
                className={inputClass}
              />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button type="submit" disabled={loading} className="btn-3d py-3 disabled:opacity-60">
                {loading ? "…" : t("resetSave")}
              </button>
            </form>
          )}
        </TiltCard>
      </section>
    </div>
  );
}
