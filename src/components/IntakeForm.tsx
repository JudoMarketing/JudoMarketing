"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getSupabase } from "@/lib/supabase";

/**
 * Formulario de arranque: el cliente llena de una sola vez todo lo que hace
 * falta para empezar su proyecto.
 *
 * Va por pasos a propósito. Una sola pantalla con cuarenta campos espanta;
 * cuatro pantallas cortas se llenan. Solo el primer paso es obligatorio, así
 * que si alguien no sabe algo puede seguir y dejarlo para después.
 */

const NECESIDADES = [
  { id: "tienda", es: "Vender productos en línea", en: "Sell products online" },
  { id: "citas", es: "Que me agenden citas", en: "Let people book appointments" },
  { id: "catalogo", es: "Mostrar mi catálogo o servicios", en: "Show my catalog or services" },
  { id: "cotizador", es: "Que pidan cotizaciones", en: "Request quotes" },
  { id: "delivery", es: "Pedidos y delivery", en: "Orders and delivery" },
  { id: "donaciones", es: "Recibir donaciones", en: "Receive donations" },
  { id: "reservas", es: "Reservas de eventos o clases", en: "Event or class bookings" },
  { id: "blog", es: "Publicar contenido o noticias", en: "Publish content or news" },
];

const input =
  "w-full rounded-xl border border-judo-lilac/25 bg-judo-black/60 px-4 py-3 text-sm text-judo-fog outline-none transition focus:border-judo-lilac focus:ring-1 focus:ring-judo-lilac";
const label = "flex flex-col gap-1.5 text-sm text-judo-fog/70";

export default function IntakeForm() {
  const t = useTranslations("intake");
  const locale = useLocale() === "es" ? "es" : "en";
  const supabase = getSupabase();

  const [paso, setPaso] = useState(1);
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [datos, setDatos] = useState<Record<string, string | boolean | string[]>>({
    language: locale,
    needs: [],
  });

  const set = (campo: string, valor: string | boolean | string[]) =>
    setDatos((prev) => ({ ...prev, [campo]: valor }));

  const Texto = ({
    campo,
    etiqueta,
    tipo = "text",
    ancho = "",
  }: {
    campo: string;
    etiqueta: string;
    tipo?: string;
    ancho?: string;
  }) => (
    <label className={`${label} ${ancho}`}>
      {etiqueta}
      <input
        type={tipo}
        value={String(datos[campo] ?? "")}
        onChange={(e) => set(campo, e.target.value)}
        className={input}
      />
    </label>
  );

  const Area = ({ campo, etiqueta }: { campo: string; etiqueta: string }) => (
    <label className={label}>
      {etiqueta}
      <textarea
        rows={3}
        value={String(datos[campo] ?? "")}
        onChange={(e) => set(campo, e.target.value)}
        className={`${input} resize-none`}
      />
    </label>
  );

  const SiNo = ({ campo, etiqueta }: { campo: string; etiqueta: string }) => (
    <label className="flex items-start gap-3 text-sm text-judo-fog/70">
      <input
        type="checkbox"
        checked={Boolean(datos[campo])}
        onChange={(e) => set(campo, e.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 accent-[#7b2dff]"
      />
      <span>{etiqueta}</span>
    </label>
  );

  const enviar = async () => {
    if (enviando) return;
    setEnviando(true);
    setError(null);
    try {
      const { error: err } = await supabase.from("client_intake").insert({
        business_name: String(datos.business_name ?? "").trim(),
        industry: String(datos.industry ?? "").trim() || null,
        what_they_do: String(datos.what_they_do ?? "").trim() || null,
        who_they_serve: String(datos.who_they_serve ?? "").trim() || null,
        current_website: String(datos.current_website ?? "").trim() || null,
        goal: String(datos.goal ?? "").trim() || null,
        contact_name: String(datos.contact_name ?? "").trim(),
        contact_role: String(datos.contact_role ?? "").trim() || null,
        contact_email: String(datos.contact_email ?? "").trim().toLowerCase(),
        contact_phone: String(datos.contact_phone ?? "").trim() || null,
        contact_whatsapp: String(datos.contact_whatsapp ?? "").trim() || null,
        language: locale,
        timezone: String(datos.timezone ?? "").trim() || null,
        decision_maker: String(datos.decision_maker ?? "").trim() || null,
        billing_contact: String(datos.billing_contact ?? "").trim() || null,
        billing_email: String(datos.billing_email ?? "").trim() || null,
        needs: (datos.needs as string[]) ?? [],
        has_brand: Boolean(datos.has_brand),
        brand_notes: String(datos.brand_notes ?? "").trim() || null,
        reference_sites: String(datos.reference_sites ?? "").trim() || null,
        domain_wanted: String(datos.domain_wanted ?? "").trim() || null,
        domain_owned: Boolean(datos.domain_owned),
        registrar: String(datos.registrar ?? "").trim() || null,
        google_business: String(datos.google_business ?? "").trim() || null,
        instagram: String(datos.instagram ?? "").trim() || null,
        facebook: String(datos.facebook ?? "").trim() || null,
        other_social: String(datos.other_social ?? "").trim() || null,
        can_grant_search_console: Boolean(datos.can_grant_search_console),
        can_grant_analytics: Boolean(datos.can_grant_analytics),
        can_grant_google_business: Boolean(datos.can_grant_google_business),
        can_grant_meta: Boolean(datos.can_grant_meta),
        can_grant_payments: Boolean(datos.can_grant_payments),
        payments_processor: String(datos.payments_processor ?? "").trim() || null,
        notes: String(datos.notes ?? "").trim() || null,
      });
      if (err) throw err;

      // Aviso a Administración: que no dependa de entrar al portal a mirar
      void fetch("/api/notify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: "intake",
          name: String(datos.business_name ?? ""),
          email: String(datos.contact_email ?? ""),
        }),
      }).catch(() => {});

      setListo(true);
    } catch {
      setError(t("error"));
    } finally {
      setEnviando(false);
    }
  };

  if (listo) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <span className="text-5xl">🥋</span>
        <h2 className="text-2xl font-bold">{t("okTitle")}</h2>
        <p className="max-w-md text-judo-fog/65">{t("okBody")}</p>
      </div>
    );
  }

  const puedeSeguir =
    String(datos.business_name ?? "").trim().length >= 2 &&
    String(datos.contact_name ?? "").trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(datos.contact_email ?? ""));

  const pasos = [t("step1"), t("step2"), t("step3"), t("step4")];

  return (
    <div className="flex flex-col gap-7">
      {/* Dónde va */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {pasos.map((nombre, i) => (
          <span
            key={nombre}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              paso === i + 1
                ? "bg-judo-purple text-white"
                : paso > i + 1
                  ? "border border-emerald-400/40 text-emerald-300"
                  : "border border-judo-lilac/20 text-judo-fog/40"
            }`}
          >
            {paso > i + 1 ? "✓ " : `${i + 1}. `}
            {nombre}
          </span>
        ))}
      </div>

      {/* 1 · Quién eres */}
      {paso === 1 && (
        <div className="flex flex-col gap-4">
          <Texto campo="business_name" etiqueta={t("businessName")} />
          <Texto campo="industry" etiqueta={t("industry")} />
          <Area campo="what_they_do" etiqueta={t("whatTheyDo")} />
          <Area campo="who_they_serve" etiqueta={t("whoTheyServe")} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Texto campo="contact_name" etiqueta={t("contactName")} />
            <Texto campo="contact_role" etiqueta={t("contactRole")} />
            <Texto campo="contact_email" etiqueta={t("contactEmail")} tipo="email" />
            <Texto campo="contact_whatsapp" etiqueta={t("contactWhatsapp")} />
          </div>
          {!puedeSeguir && (
            <p className="text-xs text-judo-fog/45">{t("requiredHint")}</p>
          )}
        </div>
      )}

      {/* 2 · Qué necesitas */}
      {paso === 2 && (
        <div className="flex flex-col gap-4">
          <div>
            <p className="mb-3 text-sm text-judo-fog/70">{t("needsTitle")}</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {NECESIDADES.map((n) => {
                const elegidas = (datos.needs as string[]) ?? [];
                const activa = elegidas.includes(n.id);
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() =>
                      set(
                        "needs",
                        activa
                          ? elegidas.filter((x) => x !== n.id)
                          : [...elegidas, n.id]
                      )
                    }
                    className={`rounded-xl border px-4 py-2.5 text-left text-sm transition ${
                      activa
                        ? "border-judo-purple bg-judo-purple/20 text-judo-fog"
                        : "border-judo-lilac/20 text-judo-fog/60 hover:border-judo-lilac/50"
                    }`}
                  >
                    {activa ? "✓ " : ""}
                    {n[locale]}
                  </button>
                );
              })}
            </div>
          </div>
          <Area campo="goal" etiqueta={t("goal")} />
          <SiNo campo="has_brand" etiqueta={t("hasBrand")} />
          <Area campo="brand_notes" etiqueta={t("brandNotes")} />
          <Area campo="reference_sites" etiqueta={t("referenceSites")} />
        </div>
      )}

      {/* 3 · Lo que ya tienes */}
      {paso === 3 && (
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Texto campo="current_website" etiqueta={t("currentWebsite")} />
            <Texto campo="domain_wanted" etiqueta={t("domainWanted")} />
          </div>
          <SiNo campo="domain_owned" etiqueta={t("domainOwned")} />
          <Texto campo="registrar" etiqueta={t("registrar")} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Texto campo="google_business" etiqueta={t("googleBusiness")} />
            <Texto campo="instagram" etiqueta="Instagram" />
            <Texto campo="facebook" etiqueta="Facebook" />
            <Texto campo="other_social" etiqueta={t("otherSocial")} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Texto campo="decision_maker" etiqueta={t("decisionMaker")} />
            <Texto campo="billing_contact" etiqueta={t("billingContact")} />
            <Texto campo="billing_email" etiqueta={t("billingEmail")} tipo="email" />
            <Texto campo="timezone" etiqueta={t("timezone")} />
          </div>
        </div>
      )}

      {/* 4 · Accesos */}
      {paso === 4 && (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-judo-lilac/20 bg-judo-purple/5 p-4">
            <p className="text-sm leading-relaxed text-judo-fog/70">
              {t("accessIntro")}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <SiNo campo="can_grant_search_console" etiqueta={t("accSearchConsole")} />
            <SiNo campo="can_grant_analytics" etiqueta={t("accAnalytics")} />
            <SiNo campo="can_grant_google_business" etiqueta={t("accGoogleBusiness")} />
            <SiNo campo="can_grant_meta" etiqueta={t("accMeta")} />
            <SiNo campo="can_grant_payments" etiqueta={t("accPayments")} />
          </div>
          <Texto campo="payments_processor" etiqueta={t("paymentsProcessor")} />
          <Area campo="notes" etiqueta={t("notes")} />
          {error && (
            <p className="rounded-xl border border-red-400/40 bg-red-400/10 px-4 py-2 text-sm text-red-300">
              {error}
            </p>
          )}
        </div>
      )}

      {/* Navegación */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setPaso(paso - 1)}
          disabled={paso === 1}
          className="text-sm text-judo-fog/50 transition hover:text-judo-fog disabled:opacity-0"
        >
          ← {t("back")}
        </button>
        {paso < 4 ? (
          <button
            type="button"
            onClick={() => setPaso(paso + 1)}
            disabled={paso === 1 && !puedeSeguir}
            className="btn-3d px-7 py-2.5 text-sm disabled:opacity-40"
          >
            {t("next")} →
          </button>
        ) : (
          <button
            type="button"
            onClick={enviar}
            disabled={enviando || !puedeSeguir}
            className="btn-3d px-7 py-2.5 text-sm disabled:opacity-40"
          >
            {enviando ? t("sending") : t("submit")}
          </button>
        )}
      </div>
    </div>
  );
}
