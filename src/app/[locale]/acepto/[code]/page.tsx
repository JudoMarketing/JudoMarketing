import { setRequestLocale } from "next-intl/server";
import type { Metadata } from "next";
import { NOMBRE_TIPO } from "@/content/documentos";
import {
  COLUMNAS_DOCUMENTO,
  clienteDeServicio,
  fechaEste,
  fechaHoraEste,
  type FilaDocumento,
} from "@/lib/documentos";
import AceptarContrato from "./AceptarContrato";

/** Enlaces privados, uno por cliente: nada que indexar. */
export const metadata: Metadata = { robots: { index: false, follow: false } };

// Cada visita mira la base: si el cliente ya aceptó, tiene que verlo.
export const dynamic = "force-dynamic";

const TEXTOS = {
  es: {
    titulo: "Tu contrato con Judo Marketing",
    invalido: "Este enlace no es válido o el contrato ya no existe.",
    invalidoAyuda: "Si crees que es un error, responde al correo donde te llegó el contrato.",
    servicio: "Servicio",
    cliente: "Cliente",
    precio: "Precio mensual",
    inicio: "Inicio",
    firmado: "Firmado por Judo Marketing el",
    codigo: "Código",
    yaAceptado: "Este contrato ya fue aceptado",
    yaAceptadoPor: "por",
    yaAceptadoEl: "el",
    copia: "Tienes la copia definitiva en tu correo.",
    lee: "El contrato completo está adjunto en el correo que recibiste. Léelo antes de aceptar.",
  },
  en: {
    titulo: "Your contract with Judo Marketing",
    invalido: "This link is not valid or the contract no longer exists.",
    invalidoAyuda: "If you think this is a mistake, reply to the email the contract came in.",
    servicio: "Service",
    cliente: "Client",
    precio: "Monthly price",
    inicio: "Start",
    firmado: "Signed by Judo Marketing on",
    codigo: "Code",
    yaAceptado: "This contract has already been accepted",
    yaAceptadoPor: "by",
    yaAceptadoEl: "on",
    copia: "The final copy is in your inbox.",
    lee: "The full contract is attached to the email you received. Read it before accepting.",
  },
};

export default async function AceptoPage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale, code } = await params;
  setRequestLocale(locale);
  const t = TEXTOS[locale === "es" ? "es" : "en"];

  const supabase = clienteDeServicio();
  const codigo = code.toUpperCase();
  const { data } = supabase && /^JM-[A-Z2-9]{12}$/.test(codigo)
    ? await supabase.from("documents").select(COLUMNAS_DOCUMENTO).eq("code", codigo).single()
    : { data: null };
  const doc = data as FilaDocumento | null;

  return (
    <div className="judo-glow min-h-[70vh]">
      <section className="mx-auto max-w-xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="rounded-2xl border border-judo-lilac/15 bg-[#0e0e16] p-6 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] sm:p-8">
          <h1 className="text-2xl font-bold sm:text-3xl">{t.titulo}</h1>

          {!doc ? (
            <div className="mt-6 rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              <p className="font-semibold">{t.invalido}</p>
              <p className="mt-1 opacity-80">{t.invalidoAyuda}</p>
            </div>
          ) : (
            <>
              <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                {(
                  [
                    [t.servicio, `${NOMBRE_TIPO[doc.kind]}${doc.plan ? ` · ${doc.plan}` : ""}${doc.project ? ` · ${doc.project}` : ""}`],
                    [t.cliente, doc.business_name ? `${doc.recipient_name} · ${doc.business_name}` : doc.recipient_name],
                    [t.precio, `$${Number(doc.monthly_price)} USD`],
                    [t.inicio, doc.starts_on.slice(0, 10).split("-").reverse().join("/")],
                    [t.firmado, fechaEste(new Date(doc.created_at))],
                    [t.codigo, doc.code],
                  ] as [string, string][]
                ).map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-judo-fog/50">{k}</dt>
                    <dd className="text-white">{v}</dd>
                  </div>
                ))}
              </dl>

              {doc.accepted_at ? (
                <div className="mt-6 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
                  <p className="font-semibold">
                    ✓ {t.yaAceptado} {t.yaAceptadoPor} {doc.accepted_name} {t.yaAceptadoEl}{" "}
                    {fechaHoraEste(new Date(doc.accepted_at))}.
                  </p>
                  <p className="mt-1 opacity-80">{t.copia}</p>
                </div>
              ) : (
                <>
                  <p className="mt-6 text-sm text-judo-fog/70">{t.lee}</p>
                  <AceptarContrato code={doc.code} locale={locale === "es" ? "es" : "en"} />
                </>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
