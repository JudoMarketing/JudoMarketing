"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { getSupabase } from "@/lib/supabase";

/**
 * Formulario de arranque: el cliente llena de una sola vez todo lo que hace
 * falta para empezar su proyecto.
 *
 * Va por pasos a propósito. Una sola pantalla con cuarenta campos espanta;
 * cuatro pantallas cortas se llenan. Solo el primer paso es obligatorio, así
 * que si alguien no sabe algo puede seguir y dejarlo para después.
 *
 * Los campos viven FUERA del componente. Definirlos adentro hacía que React
 * los tratara como componentes nuevos en cada render: se desmontaban y se
 * volvían a montar con cada tecla, y el cursor saltaba fuera de la casilla.
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

const inputClase =
  "w-full rounded-xl border border-judo-lilac/25 bg-judo-black/60 px-4 py-3 text-sm text-judo-fog outline-none transition focus:border-judo-lilac focus:ring-1 focus:ring-judo-lilac";
const labelClase = "flex flex-col gap-1.5 text-sm text-judo-fog/70";

function Texto({
  etiqueta,
  valor,
  onChange,
  tipo = "text",
}: {
  etiqueta: string;
  valor: string;
  onChange: (v: string) => void;
  tipo?: string;
}) {
  return (
    <label className={labelClase}>
      {etiqueta}
      <input
        type={tipo}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className={inputClase}
      />
    </label>
  );
}

function Area({
  etiqueta,
  valor,
  onChange,
}: {
  etiqueta: string;
  valor: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className={labelClase}>
      {etiqueta}
      <textarea
        rows={3}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClase} resize-none`}
      />
    </label>
  );
}

function SiNo({
  etiqueta,
  valor,
  onChange,
}: {
  etiqueta: string;
  valor: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 text-sm text-judo-fog/70">
      <input
        type="checkbox"
        checked={valor}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 shrink-0 accent-[#7b2dff]"
      />
      <span>{etiqueta}</span>
    </label>
  );
}

type Datos = Record<string, string | boolean | string[]>;

export default function IntakeForm() {
  const t = useTranslations("intake");
  const locale = useLocale() === "es" ? "es" : "en";
  const supabase = getSupabase();
  const router = useRouter();

  const [paso, setPaso] = useState(1);
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [datos, setDatos] = useState<Datos>({ needs: [] });

  const texto = (campo: string) => String(datos[campo] ?? "");
  const marca = (campo: string) => Boolean(datos[campo]);
  const set = (campo: string) => (valor: string | boolean | string[]) =>
    setDatos((prev) => ({ ...prev, [campo]: valor }));

  const enviar = async () => {
    if (enviando) return;
    setEnviando(true);
    setError(null);
    try {
      const { error: err } = await supabase.from("client_intake").insert({
        business_name: texto("business_name").trim(),
        industry: texto("industry").trim() || null,
        what_they_do: texto("what_they_do").trim() || null,
        who_they_serve: texto("who_they_serve").trim() || null,
        current_website: texto("current_website").trim() || null,
        goal: texto("goal").trim() || null,
        contact_name: texto("contact_name").trim(),
        contact_role: texto("contact_role").trim() || null,
        contact_email: texto("contact_email").trim().toLowerCase(),
        contact_phone: texto("contact_phone").trim() || null,
        contact_whatsapp: texto("contact_whatsapp").trim() || null,
        language: locale,
        timezone: texto("timezone").trim() || null,
        decision_maker: texto("decision_maker").trim() || null,
        billing_contact: texto("billing_contact").trim() || null,
        billing_email: texto("billing_email").trim() || null,
        needs: (datos.needs as string[]) ?? [],
        has_brand: marca("has_brand"),
        brand_notes: texto("brand_notes").trim() || null,
        reference_sites: texto("reference_sites").trim() || null,
        domain_wanted: texto("domain_wanted").trim() || null,
        domain_owned: marca("domain_owned"),
        registrar: texto("registrar").trim() || null,
        google_business: texto("google_business").trim() || null,
        instagram: texto("instagram").trim() || null,
        facebook: texto("facebook").trim() || null,
        other_social: texto("other_social").trim() || null,
        can_grant_search_console: marca("can_grant_search_console"),
        can_grant_analytics: marca("can_grant_analytics"),
        can_grant_google_business: marca("can_grant_google_business"),
        can_grant_meta: marca("can_grant_meta"),
        can_grant_payments: marca("can_grant_payments"),
        payments_processor: texto("payments_processor").trim() || null,
        notes: texto("notes").trim() || null,
      });
      if (err) throw err;

      // Aviso a Administración: que no dependa de entrar al portal a mirar
      void fetch("/api/notify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: "intake",
          name: texto("business_name"),
          email: texto("contact_email"),
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
    texto("business_name").trim().length >= 2 &&
    texto("contact_name").trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texto("contact_email"));

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
          <Texto etiqueta={t("businessName")} valor={texto("business_name")} onChange={set("business_name")} />
          <Texto etiqueta={t("industry")} valor={texto("industry")} onChange={set("industry")} />
          <Area etiqueta={t("whatTheyDo")} valor={texto("what_they_do")} onChange={set("what_they_do")} />
          <Area etiqueta={t("whoTheyServe")} valor={texto("who_they_serve")} onChange={set("who_they_serve")} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Texto etiqueta={t("contactName")} valor={texto("contact_name")} onChange={set("contact_name")} />
            <Texto etiqueta={t("contactRole")} valor={texto("contact_role")} onChange={set("contact_role")} />
            <Texto etiqueta={t("contactEmail")} valor={texto("contact_email")} onChange={set("contact_email")} tipo="email" />
            <Texto etiqueta={t("contactWhatsapp")} valor={texto("contact_whatsapp")} onChange={set("contact_whatsapp")} />
          </div>
          {!puedeSeguir && <p className="text-xs text-judo-fog/45">{t("requiredHint")}</p>}
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
                      set("needs")(
                        activa ? elegidas.filter((x) => x !== n.id) : [...elegidas, n.id]
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
          <Area etiqueta={t("goal")} valor={texto("goal")} onChange={set("goal")} />
          <SiNo etiqueta={t("hasBrand")} valor={marca("has_brand")} onChange={set("has_brand")} />
          <Area etiqueta={t("brandNotes")} valor={texto("brand_notes")} onChange={set("brand_notes")} />
          <Area etiqueta={t("referenceSites")} valor={texto("reference_sites")} onChange={set("reference_sites")} />
        </div>
      )}

      {/* 3 · Lo que ya tienes */}
      {paso === 3 && (
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Texto etiqueta={t("currentWebsite")} valor={texto("current_website")} onChange={set("current_website")} />
            <Texto etiqueta={t("domainWanted")} valor={texto("domain_wanted")} onChange={set("domain_wanted")} />
          </div>
          <SiNo etiqueta={t("domainOwned")} valor={marca("domain_owned")} onChange={set("domain_owned")} />
          <Texto etiqueta={t("registrar")} valor={texto("registrar")} onChange={set("registrar")} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Texto etiqueta={t("googleBusiness")} valor={texto("google_business")} onChange={set("google_business")} />
            <Texto etiqueta="Instagram" valor={texto("instagram")} onChange={set("instagram")} />
            <Texto etiqueta="Facebook" valor={texto("facebook")} onChange={set("facebook")} />
            <Texto etiqueta={t("otherSocial")} valor={texto("other_social")} onChange={set("other_social")} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Texto etiqueta={t("decisionMaker")} valor={texto("decision_maker")} onChange={set("decision_maker")} />
            <Texto etiqueta={t("billingContact")} valor={texto("billing_contact")} onChange={set("billing_contact")} />
            <Texto etiqueta={t("billingEmail")} valor={texto("billing_email")} onChange={set("billing_email")} tipo="email" />
            <Texto etiqueta={t("timezone")} valor={texto("timezone")} onChange={set("timezone")} />
          </div>
        </div>
      )}

      {/* 4 · Accesos */}
      {paso === 4 && (
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-judo-lilac/20 bg-judo-purple/5 p-4">
            <p className="text-sm leading-relaxed text-judo-fog/70">{t("accessIntro")}</p>
          </div>
          <div className="flex flex-col gap-3">
            <SiNo etiqueta={t("accSearchConsole")} valor={marca("can_grant_search_console")} onChange={set("can_grant_search_console")} />
            <SiNo etiqueta={t("accAnalytics")} valor={marca("can_grant_analytics")} onChange={set("can_grant_analytics")} />
            <SiNo etiqueta={t("accGoogleBusiness")} valor={marca("can_grant_google_business")} onChange={set("can_grant_google_business")} />
            <SiNo etiqueta={t("accMeta")} valor={marca("can_grant_meta")} onChange={set("can_grant_meta")} />
            <SiNo etiqueta={t("accPayments")} valor={marca("can_grant_payments")} onChange={set("can_grant_payments")} />
          </div>
          <Texto etiqueta={t("paymentsProcessor")} valor={texto("payments_processor")} onChange={set("payments_processor")} />
          <Area etiqueta={t("notes")} valor={texto("notes")} onChange={set("notes")} />
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

      {/* Salida para quien ya nos dio sus datos antes (por correo, en persona o
          en una llamada). Se ve siempre: quien llega desde el pago no es el
          único que puede haberlos entregado ya. */}
      <button
        type="button"
        onClick={() => router.push({ pathname: "/", query: { listo: "1" } })}
        className="mx-auto flex items-center gap-2.5 rounded-full border border-emerald-400/35 bg-emerald-400/5 px-5 py-2.5 text-sm text-emerald-200/85 transition hover:border-emerald-400/70 hover:bg-emerald-400/10 hover:text-emerald-100"
      >
        <span
          aria-hidden
          className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 text-[11px] font-bold text-judo-black"
        >
          ✓
        </span>
        {t("alreadySent")}
      </button>
    </div>
  );
}
