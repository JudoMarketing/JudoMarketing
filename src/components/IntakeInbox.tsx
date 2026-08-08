"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";

/**
 * Lo que los clientes llenaron en el formulario de arranque.
 *
 * Sirve de dos maneras: es la bandeja donde llegan sus datos, y es el
 * recordatorio de lo que todavía hay que pedirles — cada ficha marca en verde
 * los accesos que dijeron poder dar y en ámbar los que faltan.
 */

/** Los websites a los que se puede colgar un formulario. */
export type SitioBreve = { id: string; name: string; domain: string | null };

type Intake = {
  id: string;
  site_id: string | null;
  business_name: string;
  industry: string | null;
  what_they_do: string | null;
  who_they_serve: string | null;
  current_website: string | null;
  goal: string | null;
  contact_name: string;
  contact_role: string | null;
  contact_email: string;
  contact_phone: string | null;
  contact_whatsapp: string | null;
  timezone: string | null;
  decision_maker: string | null;
  billing_contact: string | null;
  billing_email: string | null;
  needs: string[] | null;
  has_brand: boolean | null;
  brand_notes: string | null;
  reference_sites: string | null;
  domain_wanted: string | null;
  domain_owned: boolean | null;
  registrar: string | null;
  google_business: string | null;
  instagram: string | null;
  facebook: string | null;
  other_social: string | null;
  can_grant_search_console: boolean | null;
  can_grant_analytics: boolean | null;
  can_grant_google_business: boolean | null;
  can_grant_meta: boolean | null;
  can_grant_payments: boolean | null;
  payments_processor: string | null;
  notes: string | null;
  status: string;
  created_at: string;
};

const NECESIDADES: Record<string, string> = {
  tienda: "Tienda online",
  citas: "Citas",
  catalogo: "Catálogo",
  cotizador: "Cotizador",
  delivery: "Delivery",
  donaciones: "Donaciones",
  reservas: "Reservas",
  blog: "Contenido",
};

const ACCESOS: [keyof Intake, string][] = [
  ["can_grant_search_console", "Search Console"],
  ["can_grant_analytics", "Analytics"],
  ["can_grant_google_business", "Perfil de Empresa"],
  ["can_grant_meta", "Meta Business"],
  ["can_grant_payments", "Procesador de pagos"],
];

const box = "rounded-2xl border border-judo-lilac/20 bg-judo-surface p-5";
const btn = "rounded-full px-3 py-1 text-xs font-semibold transition whitespace-nowrap";
const btnGhost = `${btn} border border-judo-lilac/30 text-judo-lilac hover:bg-judo-purple/15`;
const btnGreen = `${btn} bg-emerald-500/90 text-white hover:bg-emerald-500`;

export default function IntakeInbox({
  flash,
  sitios,
  onIrASitio,
  onCambio,
}: {
  flash: (m: string) => void;
  /** Websites existentes, para poder decir de cuál es cada formulario. */
  sitios: SitioBreve[];
  /** Abre ese website en la pestaña Websites. */
  onIrASitio: (id: string) => void;
  /** Avisa al portal que algo cambió (para refrescar contadores). */
  onCambio: () => void;
}) {
  const supabase = getSupabase();
  const [fichas, setFichas] = useState<Intake[]>([]);
  const [abierta, setAbierta] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    const { data } = await supabase
      .from("client_intake")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    setFichas((data as Intake[]) ?? []);
  }, [supabase]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const marcar = async (id: string, status: string) => {
    const { error } = await supabase
      .from("client_intake")
      .update({ status })
      .eq("id", id);
    if (error) return flash(`Error: ${error.message}`);
    void cargar();
    onCambio();
  };

  /**
   * Cuelga (o descuelga) el formulario de un website. A partir de ahí sus
   * datos salen en el expediente de ese sitio, en “Lo que pidió al inicio”.
   */
  const vincular = async (ficha: Intake, siteId: string) => {
    const { error } = await supabase
      .from("client_intake")
      .update({ site_id: siteId || null })
      .eq("id", ficha.id);
    if (error) return flash(`Error: ${error.message}`);
    if (siteId) {
      // Que quede escrito en la bitácora del sitio, con fecha
      await supabase.from("site_events").insert({
        site_id: siteId,
        kind: "nota",
        detail: `Formulario de arranque de ${ficha.business_name} vinculado a este website`,
        actor: (await supabase.auth.getUser()).data.user?.id ?? null,
      });
      const sitio = sitios.find((s) => s.id === siteId);
      flash(`Formulario vinculado a ${sitio?.name ?? "el website"} ✓`);
    } else {
      flash("Formulario desvinculado");
    }
    void cargar();
    onCambio();
  };

  const Dato = ({ etiqueta, valor }: { etiqueta: string; valor: string | null }) =>
    valor ? (
      <div className="text-xs">
        <span className="text-judo-fog/40">{etiqueta}: </span>
        <span className="text-judo-fog/80">{valor}</span>
      </div>
    ) : null;

  if (fichas.length === 0) {
    return (
      <div className={`${box} mt-6`}>
        <h2 className="font-semibold">📋 Formularios de clientes</h2>
        <p className="mt-2 text-sm text-judo-fog/60">
          Todavía no ha llegado ninguno. Comparte este enlace con un cliente
          nuevo y sus datos aparecen aquí:
        </p>
        <button
          onClick={async () => {
            await navigator.clipboard.writeText("https://www.judomarketing.net/intake");
            flash("Enlace copiado ✓");
          }}
          className={`${btnGhost} mt-3`}
        >
          📋 Copiar enlace del formulario
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-4">
      <div className={`${box} flex flex-wrap items-center gap-3`}>
        <p className="flex-1 text-sm text-judo-fog/70">
          Comparte <b className="text-judo-lilac">judomarketing.net/intake</b> con
          un cliente nuevo y llena sus datos él mismo. Se abre en su idioma solo.
        </p>
        <button
          onClick={async () => {
            await navigator.clipboard.writeText("https://www.judomarketing.net/intake");
            flash("Enlace copiado ✓");
          }}
          className={btnGhost}
        >
          📋 Copiar enlace
        </button>
      </div>

      {fichas.map((f) => {
        const faltan = ACCESOS.filter(([campo]) => !f[campo]);
        const sitio = sitios.find((s) => s.id === f.site_id);
        return (
          <div key={f.id} className={box}>
            <div className="flex flex-wrap items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {f.business_name}
                  {f.industry && (
                    <span className="ml-2 text-sm font-normal text-judo-fog/45">
                      {f.industry}
                    </span>
                  )}
                </p>
                <p className="text-xs text-judo-fog/50">
                  {f.contact_name}
                  {f.contact_role && ` · ${f.contact_role}`} ·{" "}
                  <a href={`mailto:${f.contact_email}`} className="text-judo-lilac">
                    {f.contact_email}
                  </a>
                  {f.contact_whatsapp && ` · ${f.contact_whatsapp}`} ·{" "}
                  {new Date(f.created_at).toLocaleDateString("es-US")}
                </p>
                <p className="mt-1 text-xs">
                  <span
                    className={
                      faltan.length === 0 ? "text-emerald-300" : "text-amber-300"
                    }
                  >
                    {faltan.length === 0
                      ? "✓ Puede dar todos los accesos"
                      : `Falta pedirle: ${faltan.map(([, n]) => n).join(", ")}`}
                  </span>
                </p>
              </div>
              <span
                className={`text-xs font-semibold ${
                  f.status === "convertido"
                    ? "text-emerald-300"
                    : f.status === "descartado"
                      ? "text-judo-fog/30"
                      : f.status === "revisado"
                        ? "text-sky-300"
                        : "text-amber-300"
                }`}
              >
                {f.status}
              </span>
              <button
                onClick={() => setAbierta(abierta === f.id ? null : f.id)}
                className={btnGhost}
              >
                {abierta === f.id ? "Cerrar" : "Ver todo"}
              </button>
              {f.status !== "convertido" && (
                <button onClick={() => marcar(f.id, "convertido")} className={btnGreen}>
                  Ya es cliente
                </button>
              )}
            </div>

            {/* De qué website es este formulario. Puede llegar antes o después
                de tener el sitio armado; al colgarlo aquí queda como historia
                dentro del expediente de ese website. */}
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-judo-lilac/10 pt-3 text-xs text-judo-fog/50">
              <span>🌐 Pertenece a:</span>
              <select
                value={f.site_id ?? ""}
                onChange={(e) => void vincular(f, e.target.value)}
                className="max-w-[16rem] rounded-lg border border-judo-lilac/25 bg-judo-black/60 px-2 py-1 text-xs text-judo-fog outline-none focus:border-judo-lilac"
              >
                <option value="" className="bg-judo-surface">
                  — ningún website todavía —
                </option>
                {sitios.map((s) => (
                  <option key={s.id} value={s.id} className="bg-judo-surface">
                    {s.name}
                    {s.domain ? ` · ${s.domain}` : ""}
                  </option>
                ))}
              </select>
              {sitio ? (
                <button
                  onClick={() => onIrASitio(sitio.id)}
                  className="text-judo-lilac hover:underline"
                >
                  abrir {sitio.name} →
                </button>
              ) : (
                <span className="text-judo-fog/35">
                  {sitios.length === 0
                    ? "crea primero el website en la pestaña Websites"
                    : "sin vincular, sus datos no salen en ningún expediente"}
                </span>
              )}
            </div>

            {abierta === f.id && (
              <div className="mt-4 grid gap-4 border-t border-judo-lilac/10 pt-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <p className="text-[11px] font-semibold tracking-wider text-judo-fog/40 uppercase">
                    El negocio
                  </p>
                  <Dato etiqueta="Qué hacen" valor={f.what_they_do} />
                  <Dato etiqueta="Sus clientes" valor={f.who_they_serve} />
                  <Dato etiqueta="Meta a un año" valor={f.goal} />
                  <Dato etiqueta="Website actual" valor={f.current_website} />
                  {f.needs && f.needs.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {f.needs.map((n) => (
                        <span
                          key={n}
                          className="rounded-full border border-judo-lilac/25 px-2 py-0.5 text-[11px] text-judo-lilac"
                        >
                          {NECESIDADES[n] ?? n}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <p className="text-[11px] font-semibold tracking-wider text-judo-fog/40 uppercase">
                    Marca y dominio
                  </p>
                  <Dato
                    etiqueta="Tiene marca"
                    valor={f.has_brand ? "sí" : "no, hay que crearla"}
                  />
                  <Dato etiqueta="Notas de marca" valor={f.brand_notes} />
                  <Dato etiqueta="Referencias" valor={f.reference_sites} />
                  <Dato etiqueta="Dominio que quiere" valor={f.domain_wanted} />
                  <Dato
                    etiqueta="Ya lo compró"
                    valor={f.domain_owned ? `sí, en ${f.registrar ?? "?"}` : "no"}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <p className="text-[11px] font-semibold tracking-wider text-judo-fog/40 uppercase">
                    Presencia y personas
                  </p>
                  <Dato etiqueta="Perfil de Google" valor={f.google_business} />
                  <Dato etiqueta="Instagram" valor={f.instagram} />
                  <Dato etiqueta="Facebook" valor={f.facebook} />
                  <Dato etiqueta="Otra red" valor={f.other_social} />
                  <Dato etiqueta="Quién decide" valor={f.decision_maker} />
                  <Dato etiqueta="Quién paga" valor={f.billing_contact} />
                  <Dato etiqueta="Correo de facturas" valor={f.billing_email} />
                  <Dato etiqueta="Zona horaria" valor={f.timezone} />
                </div>

                <div className="flex flex-col gap-1.5">
                  <p className="text-[11px] font-semibold tracking-wider text-judo-fog/40 uppercase">
                    Accesos que dijo poder dar
                  </p>
                  {ACCESOS.map(([campo, nombre]) => (
                    <div key={String(campo)} className="text-xs">
                      <span className={f[campo] ? "text-emerald-300" : "text-amber-300"}>
                        {f[campo] ? "✓" : "○"} {nombre}
                      </span>
                    </div>
                  ))}
                  <Dato etiqueta="Procesador de pagos" valor={f.payments_processor} />
                  <Dato etiqueta="Notas" valor={f.notes} />
                  {f.status === "nuevo" && (
                    <button
                      onClick={() => marcar(f.id, "revisado")}
                      className={`${btnGhost} mt-2 self-start`}
                    >
                      Marcar revisado
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
