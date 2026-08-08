"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";

/**
 * El expediente de un website: todo lo que hay que saber de un cliente en un
 * solo lugar. Está pensado para llenarse el día del alta, porque casi nada de
 * esto se consigue barato después.
 *
 * Va por secciones plegadas para que la lista de websites siga siendo corta;
 * se abre solo la que se necesita.
 */

export type SitioExpediente = {
  id: string;
  name: string;
  client_id: string | null;
  kit_api_key: string;
  currency: string | null;
  billing_day: number | null;
  payment_method: string | null;
  grace_days: number | null;
  timezone: string | null;
  repo_url: string | null;
  vercel_project: string | null;
  registrar: string | null;
  domain_holder: string | null;
  dns_provider: string | null;
  email_provider: string | null;
  db_provider: string | null;
  ga4_property_id: string | null;
  gsc_property: string | null;
  gbp_location: string | null;
  meta_pixel_id: string | null;
  meta_page: string | null;
  notes: string | null;
};

type Costo = {
  id: string;
  concept: string;
  kind: string;
  amount_cents: number;
  period: string;
};
type Acceso = {
  id: string;
  kind: string;
  status: string;
  account: string | null;
};
type Evento = {
  id: number;
  kind: string;
  happened_at: string;
  detail: string | null;
};
type Contacto = {
  id: string;
  full_name: string;
  role: string | null;
  email: string | null;
  whatsapp: string | null;
  is_primary: boolean;
  decides: boolean;
  pays: boolean;
};
/** Lo que el cliente llenó en el formulario de arranque, si se vinculó aquí. */
type Formulario = {
  id: string;
  business_name: string;
  industry: string | null;
  what_they_do: string | null;
  who_they_serve: string | null;
  goal: string | null;
  current_website: string | null;
  needs: string[] | null;
  has_brand: boolean | null;
  brand_notes: string | null;
  reference_sites: string | null;
  domain_wanted: string | null;
  notes: string | null;
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

const ACCESOS_NOMBRE: Record<string, string> = {
  search_console: "Search Console",
  analytics: "Google Analytics",
  google_business: "Perfil de Empresa",
  google_ads: "Google Ads",
  meta_business: "Meta Business",
  meta_pixel: "Pixel de Meta",
  pagos: "Procesador de pagos",
  registrar: "Registrar del dominio",
  correo: "Correo del negocio",
  otro: "Otro",
};

const ESTADOS_ACCESO = [
  { id: "pendiente", nombre: "pendiente", color: "text-amber-300" },
  { id: "solicitado", nombre: "solicitado", color: "text-sky-300" },
  { id: "otorgado", nombre: "otorgado ✓", color: "text-emerald-300" },
  { id: "no_aplica", nombre: "no aplica", color: "text-judo-fog/40" },
];

const EVENTOS_NOMBRE: Record<string, string> = {
  contrato_firmado: "Contrato firmado",
  factura_enviada: "Factura enviada",
  pago_recibido: "Pago recibido",
  recordatorio: "Recordatorio enviado",
  aviso_de_corte: "Aviso de corte",
  suspendido: "Suspendido",
  reactivado: "Reactivado",
  entrega: "Entrega",
  nota: "Nota",
};

const COSTO_TIPOS = ["dominio", "hosting", "ads", "servicio", "otro"];
const COSTO_PERIODOS = [
  { id: "mensual", nombre: "al mes" },
  { id: "anual", nombre: "al año" },
  { id: "unico", nombre: "una vez" },
];

const input =
  "w-full rounded-lg border border-judo-lilac/25 bg-judo-black/60 px-2 py-1 text-xs text-judo-fog outline-none focus:border-judo-lilac";
const btn = "rounded-full px-3 py-1 text-xs font-semibold transition";
const btnPurple = `${btn} bg-judo-purple text-white hover:bg-judo-lilac`;
const btnGhost = `${btn} border border-judo-lilac/30 text-judo-lilac hover:bg-judo-purple/15`;
const btnDanger = `${btn} border border-red-400/40 text-red-300 hover:bg-red-400/10`;

/**
 * Campo de texto que se guarda solo al salir de él.
 *
 * Vive fuera del componente a propósito. Definido adentro, React lo trataba
 * como un componente distinto en cada render: desmontaba el input y el cursor
 * saltaba fuera de la casilla con cada tecla.
 */
function Campo({
  etiqueta,
  inicial,
  tipo = "text",
  onGuardar,
}: {
  etiqueta: string;
  inicial: string;
  tipo?: string;
  onGuardar: (valor: string | number | null) => void;
}) {
  const [valor, setValor] = useState(inicial);
  return (
    <label className="flex flex-col gap-1 text-[11px] text-judo-fog/50">
      {etiqueta}
      <input
        type={tipo}
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        onBlur={() => {
          if (valor !== inicial) {
            onGuardar(tipo === "number" ? (valor === "" ? null : Number(valor)) : valor);
          }
        }}
        className={input}
      />
    </label>
  );
}

/** Dato de solo lectura: se calla si está vacío. */
function DatoFijo({ etiqueta, valor }: { etiqueta: string; valor: string | null }) {
  if (!valor) return null;
  return (
    <p className="text-xs">
      <span className="text-judo-fog/40">{etiqueta}: </span>
      <span className="text-judo-fog/80">{valor}</span>
    </p>
  );
}

/** Sección plegable. Fuera del componente por la misma razón que Campo. */
function Seccion({
  titulo,
  resumen,
  abierto,
  onToggle,
  children,
}: {
  titulo: string;
  resumen?: string;
  abierto: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-judo-lilac/10 pt-2">
      <button
        onClick={onToggle}
        className={`flex w-full items-center justify-between text-left text-xs font-semibold transition ${
          abierto ? "text-emerald-300" : "text-white hover:text-emerald-300"
        }`}
      >
        <span>
          {titulo}
          {resumen && (
            <span
              className={`ml-2 font-normal ${
                abierto ? "text-emerald-300/60" : "text-judo-fog/40"
              }`}
            >
              {resumen}
            </span>
          )}
        </span>
        <span className={abierto ? "text-emerald-300" : "text-judo-lilac"}>
          {abierto ? "−" : "+"}
        </span>
      </button>
      {abierto && <div className="mt-3 mb-2">{children}</div>}
    </div>
  );
}

export default function SiteDossier({
  site,
  flash,
  onSaved,
}: {
  site: SitioExpediente;
  flash: (m: string) => void;
  onSaved: () => void;
}) {
  const supabase = getSupabase();
  const [abierta, setAbierta] = useState<string | null>(null);
  const [costos, setCostos] = useState<Costo[]>([]);
  const [accesos, setAccesos] = useState<Acceso[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [contactos, setContactos] = useState<Contacto[]>([]);
  const [formulario, setFormulario] = useState<Formulario | null>(null);

  const cargar = useCallback(async () => {
    const [c, a, e, f] = await Promise.all([
      supabase.from("site_costs").select("id,concept,kind,amount_cents,period").eq("site_id", site.id),
      supabase.from("site_accesses").select("id,kind,status,account").eq("site_id", site.id),
      supabase
        .from("site_events")
        .select("id,kind,happened_at,detail")
        .eq("site_id", site.id)
        .order("happened_at", { ascending: false })
        .limit(30),
      // Lo que el cliente pidió al arrancar, si se colgó un formulario de aquí
      supabase
        .from("client_intake")
        .select(
          "id,business_name,industry,what_they_do,who_they_serve,goal,current_website,needs,has_brand,brand_notes,reference_sites,domain_wanted,notes,created_at"
        )
        .eq("site_id", site.id)
        .order("created_at", { ascending: false })
        .limit(1),
    ]);
    setCostos((c.data as Costo[]) ?? []);
    setAccesos((a.data as Acceso[]) ?? []);
    setEventos((e.data as Evento[]) ?? []);
    setFormulario(((f.data as Formulario[]) ?? [])[0] ?? null);
    if (site.client_id) {
      const { data } = await supabase
        .from("client_contacts")
        .select("id,full_name,role,email,whatsapp,is_primary,decides,pays")
        .eq("client_id", site.client_id);
      setContactos((data as Contacto[]) ?? []);
    }
  }, [supabase, site.id, site.client_id]);

  // El expediente solo se monta cuando su website está abierto, así que se
  // carga entero de una: los resúmenes de cada sección sirven sin abrirlas.
  useEffect(() => {
    void cargar();
  }, [cargar]);

  const guardarCampo = async (campo: string, valor: string | number | null) => {
    const { error } = await supabase
      .from("sites")
      .update({ [campo]: valor === "" ? null : valor })
      .eq("id", site.id);
    if (error) return flash(`Error: ${error.message}`);
    onSaved();
  };

  const otorgados = accesos.filter((a) => a.status === "otorgado").length;
  const pendientes = accesos.filter(
    (a) => a.status === "pendiente" || a.status === "solicitado"
  ).length;
  const costoMensual = costos.reduce(
    (t, c) =>
      t +
      (c.period === "mensual"
        ? c.amount_cents
        : c.period === "anual"
          ? Math.round(c.amount_cents / 12)
          : 0),
    0
  );

  return (
    <div className="mt-3 flex flex-col gap-2 rounded-xl border border-judo-lilac/15 bg-judo-black/30 p-3">
      <p className="text-[11px] font-semibold tracking-wider text-judo-fog/40 uppercase">
        Expediente
      </p>

      {/* Lo que el cliente pidió el día que empezamos. Es historia, no se
          edita: sirve para saber a qué se comprometió el proyecto. */}
      <Seccion
        titulo="📨 Lo que pidió al inicio"
        resumen={
          formulario
            ? new Date(formulario.created_at).toLocaleDateString("es-US", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "sin formulario vinculado"
        }
        abierto={abierta === "formulario"}
        onToggle={() => setAbierta(abierta === "formulario" ? null : "formulario")}
      >
        {formulario ? (
          <div className="flex flex-col gap-1.5">
            <DatoFijo etiqueta="Negocio" valor={formulario.business_name} />
            <DatoFijo etiqueta="Rubro" valor={formulario.industry} />
            <DatoFijo etiqueta="Qué hacen" valor={formulario.what_they_do} />
            <DatoFijo etiqueta="Sus clientes" valor={formulario.who_they_serve} />
            <DatoFijo etiqueta="Meta a un año" valor={formulario.goal} />
            <DatoFijo etiqueta="Website que tenía" valor={formulario.current_website} />
            <DatoFijo etiqueta="Dominio que quería" valor={formulario.domain_wanted} />
            <DatoFijo
              etiqueta="Marca"
              valor={
                formulario.has_brand === null
                  ? null
                  : formulario.has_brand
                    ? "ya tenía"
                    : "había que crearla"
              }
            />
            <DatoFijo etiqueta="Notas de marca" valor={formulario.brand_notes} />
            <DatoFijo etiqueta="Referencias" valor={formulario.reference_sites} />
            <DatoFijo etiqueta="Notas" valor={formulario.notes} />
            {formulario.needs && formulario.needs.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {formulario.needs.map((n) => (
                  <span
                    key={n}
                    className="rounded-full border border-judo-lilac/25 px-2 py-0.5 text-[11px] text-judo-lilac"
                  >
                    {NECESIDADES[n] ?? n}
                  </span>
                ))}
              </div>
            )}
            <p className="mt-1 text-[11px] text-judo-fog/35">
              Esto quedó tal cual lo escribió el cliente. Si hoy pide algo que
              no está aquí, es trabajo nuevo.
            </p>
          </div>
        ) : (
          <p className="text-[11px] text-judo-fog/35">
            Ningún formulario apunta todavía a este website. Se vinculan desde
            la pestaña Formularios, con el selector “Pertenece a”.
          </p>
        )}
      </Seccion>

      {/* Accesos: lo que hay que pedirle al cliente el día 1 */}
      <Seccion titulo="🔑 Accesos"
        resumen={
          accesos.length
            ? `${otorgados} de ${accesos.length} · ${pendientes} por pedir`
            : undefined
        } abierto={abierta === "accesos"} onToggle={() => setAbierta(abierta === "accesos" ? null : "accesos")}>
        <div className="flex flex-col gap-2">
          {accesos.map((acceso) => (
            <div key={acceso.id} className="flex flex-wrap items-center gap-2">
              <span className="w-40 shrink-0 text-xs text-judo-fog/70">
                {ACCESOS_NOMBRE[acceso.kind] ?? acceso.kind}
              </span>
              <select
                value={acceso.status}
                onChange={async (e) => {
                  const status = e.target.value;
                  await supabase
                    .from("site_accesses")
                    .update({
                      status,
                      granted_at: status === "otorgado" ? new Date().toISOString() : null,
                      requested_at:
                        status === "solicitado" ? new Date().toISOString() : undefined,
                    })
                    .eq("id", acceso.id);
                  void cargar();
                }}
                className={`${input} w-32`}
              >
                {ESTADOS_ACCESO.map((s) => (
                  <option key={s.id} value={s.id} className="bg-judo-surface">
                    {s.nombre}
                  </option>
                ))}
              </select>
              <input
                defaultValue={acceso.account ?? ""}
                onBlur={async (e) => {
                  await supabase
                    .from("site_accesses")
                    .update({ account: e.target.value.trim() || null })
                    .eq("id", acceso.id);
                }}
                placeholder="cuenta o correo con el que entra"
                className={`${input} min-w-[12rem] flex-1`}
              />
            </div>
          ))}
          <p className="text-[11px] text-judo-fog/35">
            Pídelos el día 1, junto con el contrato. A los tres meses cuesta el
            doble y el cliente responde la mitad de rápido.
          </p>
        </div>
      </Seccion>

      {/* Costos: sin esto no hay ganancia, hay facturación */}
      <Seccion titulo="💵 Costos"
        resumen={
          costos.length ? `$${(costoMensual / 100).toFixed(2)}/mes` : "sin cargar"
        } abierto={abierta === "costos"} onToggle={() => setAbierta(abierta === "costos" ? null : "costos")}>
        <div className="flex flex-col gap-2">
          {costos.map((costo) => (
            <div key={costo.id} className="flex flex-wrap items-center gap-2 text-xs">
              <span className="flex-1 text-judo-fog/70">
                {costo.concept}{" "}
                <span className="text-judo-fog/35">· {costo.kind}</span>
              </span>
              <span className="font-semibold text-judo-fog">
                ${(costo.amount_cents / 100).toFixed(2)}{" "}
                {COSTO_PERIODOS.find((p) => p.id === costo.period)?.nombre}
              </span>
              <button
                onClick={async () => {
                  await supabase.from("site_costs").delete().eq("id", costo.id);
                  void cargar();
                }}
                className={btnDanger}
              >
                Quitar
              </button>
            </div>
          ))}
          <NuevoCosto siteId={site.id} onHecho={cargar} flash={flash} />
        </div>
      </Seccion>

      {/* Dónde vive cada cosa */}
      <Seccion titulo="🛠️ Dónde vive cada cosa" abierto={abierta === "tecnico"} onToggle={() => setAbierta(abierta === "tecnico" ? null : "tecnico")}>
        <div className="grid gap-2 sm:grid-cols-2">
          <Campo etiqueta="Repositorio" inicial={String(site.repo_url ?? "")} onGuardar={(v) => guardarCampo("repo_url", v)} />
          <Campo etiqueta="Proyecto en Vercel" inicial={String(site.vercel_project ?? "")} onGuardar={(v) => guardarCampo("vercel_project", v)} />
          <Campo etiqueta="Registrar del dominio" inicial={String(site.registrar ?? "")} onGuardar={(v) => guardarCampo("registrar", v)} />
          <Campo etiqueta="Dominio a nombre de" inicial={String(site.domain_holder ?? "")} onGuardar={(v) => guardarCampo("domain_holder", v)} />
          <Campo etiqueta="DNS" inicial={String(site.dns_provider ?? "")} onGuardar={(v) => guardarCampo("dns_provider", v)} />
          <Campo etiqueta="Correo transaccional" inicial={String(site.email_provider ?? "")} onGuardar={(v) => guardarCampo("email_provider", v)} />
          <Campo etiqueta="Base de datos" inicial={String(site.db_provider ?? "")} onGuardar={(v) => guardarCampo("db_provider", v)} />
        </div>
      </Seccion>

      {/* Medición */}
      <Seccion titulo="📊 Medición" abierto={abierta === "medicion"} onToggle={() => setAbierta(abierta === "medicion" ? null : "medicion")}>
        <div className="grid gap-2 sm:grid-cols-2">
          <Campo etiqueta="Search Console (propiedad)" inicial={String(site.gsc_property ?? "")} onGuardar={(v) => guardarCampo("gsc_property", v)} />
          <Campo etiqueta="Analytics (ID de propiedad)" inicial={String(site.ga4_property_id ?? "")} onGuardar={(v) => guardarCampo("ga4_property_id", v)} />
          <Campo etiqueta="Perfil de Empresa (ficha)" inicial={String(site.gbp_location ?? "")} onGuardar={(v) => guardarCampo("gbp_location", v)} />
          <Campo etiqueta="Pixel de Meta" inicial={String(site.meta_pixel_id ?? "")} onGuardar={(v) => guardarCampo("meta_pixel_id", v)} />
          <Campo etiqueta="Página de Facebook" inicial={String(site.meta_page ?? "")} onGuardar={(v) => guardarCampo("meta_page", v)} />
        </div>
      </Seccion>

      {/* Cobro */}
      <Seccion titulo="🧾 Cobro" abierto={abierta === "cobro"} onToggle={() => setAbierta(abierta === "cobro" ? null : "cobro")}>
        <div className="grid gap-2 sm:grid-cols-2">
          <Campo etiqueta="Moneda" inicial={String(site.currency ?? "")} onGuardar={(v) => guardarCampo("currency", v)} />
          <Campo etiqueta="Día de cobro (1 a 28)" inicial={String(site.billing_day ?? "")} tipo="number" onGuardar={(v) => guardarCampo("billing_day", v)} />
          <Campo etiqueta="Método de pago" inicial={String(site.payment_method ?? "")} onGuardar={(v) => guardarCampo("payment_method", v)} />
          <Campo etiqueta="Días de gracia antes de apagar" inicial={String(site.grace_days ?? "")} tipo="number" onGuardar={(v) => guardarCampo("grace_days", v)} />
          <Campo etiqueta="Zona horaria" inicial={String(site.timezone ?? "")} onGuardar={(v) => guardarCampo("timezone", v)} />
        </div>
      </Seccion>

      {/* Contactos */}
      <Seccion titulo="👥 Contactos"
        resumen={contactos.length ? `${contactos.length}` : "ninguno"} abierto={abierta === "contactos"} onToggle={() => setAbierta(abierta === "contactos" ? null : "contactos")}>
        <div className="flex flex-col gap-2">
          {contactos.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-2 text-xs">
              <span className="flex-1 text-judo-fog/70">
                <b className="text-judo-fog">{c.full_name}</b>
                {c.role && <span className="text-judo-fog/40"> · {c.role}</span>}
                {c.email && <span className="text-judo-fog/40"> · {c.email}</span>}
                {c.whatsapp && <span className="text-judo-fog/40"> · {c.whatsapp}</span>}
              </span>
              {c.decides && <span className="text-emerald-300">decide</span>}
              {c.pays && <span className="text-amber-300">paga</span>}
              <button
                onClick={async () => {
                  await supabase.from("client_contacts").delete().eq("id", c.id);
                  void cargar();
                }}
                className={btnDanger}
              >
                Quitar
              </button>
            </div>
          ))}
          {site.client_id ? (
            <NuevoContacto clientId={site.client_id} onHecho={cargar} flash={flash} />
          ) : (
            <p className="text-[11px] text-judo-fog/35">
              Este website no tiene cliente asociado todavía.
            </p>
          )}
        </div>
      </Seccion>

      {/* Bitácora */}
      <Seccion titulo="📓 Bitácora"
        resumen={eventos.length ? `${eventos.length} registros` : "vacía"} abierto={abierta === "bitacora"} onToggle={() => setAbierta(abierta === "bitacora" ? null : "bitacora")}>
        <div className="flex flex-col gap-2">
          <NuevoEvento siteId={site.id} onHecho={cargar} flash={flash} />
          {eventos.map((e) => (
            <div key={e.id} className="flex gap-2 text-[11px] text-judo-fog/55">
              <span className="w-24 shrink-0 text-judo-fog/35">
                {new Date(e.happened_at).toLocaleDateString("es-US", {
                  day: "2-digit",
                  month: "short",
                  year: "2-digit",
                })}
              </span>
              <span className="w-32 shrink-0 font-semibold text-judo-fog/70">
                {EVENTOS_NOMBRE[e.kind] ?? e.kind}
              </span>
              <span className="flex-1">{e.detail}</span>
            </div>
          ))}
          <p className="text-[11px] text-judo-fog/35">
            Esto es lo que te respalda el día que tengas que apagar un sitio por
            incumplimiento. Suspender y reactivar se escriben solos.
          </p>
        </div>
      </Seccion>

      {/* Clave del kit */}
      <Seccion titulo="🔐 Clave del kit" abierto={abierta === "kit"} onToggle={() => setAbierta(abierta === "kit" ? null : "kit")}>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(site.kit_api_key);
              flash("Clave del kit copiada ✓");
            }}
            className={btnGhost}
          >
            Copiar clave
          </button>
          <button
            onClick={async () => {
              if (
                !confirm(
                  `Rotar la clave de ${site.name}. El sitio dejará de reportar hasta que actualices JUDO_KIT_KEY en su Vercel. ¿Seguir?`
                )
              )
                return;
              const { data, error } = await supabase.rpc("rotate_kit_key", {
                target: site.id,
              });
              if (error) return flash(`Error: ${error.message}`);
              await navigator.clipboard.writeText(String(data));
              flash("Clave rotada y copiada ✓ Actualízala en Vercel");
              onSaved();
            }}
            className={btnDanger}
          >
            Rotar clave
          </button>
          <p className="w-full text-[11px] text-judo-fog/35">
            Rótala si la clave se filtró o si cambió quien tenía acceso al
            repositorio. Después hay que pegarla en la variable JUDO_KIT_KEY del
            Vercel de ese sitio.
          </p>
        </div>
      </Seccion>

      {/* Notas */}
      <Seccion titulo="📝 Notas" abierto={abierta === "notas"} onToggle={() => setAbierta(abierta === "notas" ? null : "notas")}>
        <textarea
          rows={3}
          defaultValue={site.notes ?? ""}
          onBlur={(e) => guardarCampo("notes", e.target.value.trim())}
          placeholder="Lo que haya que recordar de este cliente"
          className={`${input} resize-none`}
        />
      </Seccion>
    </div>
  );
}

// ── Formularios cortos ─────────────────────────────────────────────

function NuevoCosto({
  siteId,
  onHecho,
  flash,
}: {
  siteId: string;
  onHecho: () => void;
  flash: (m: string) => void;
}) {
  const supabase = getSupabase();
  const [concepto, setConcepto] = useState("");
  const [tipo, setTipo] = useState("hosting");
  const [monto, setMonto] = useState("");
  const [periodo, setPeriodo] = useState("mensual");

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const cents = Math.round(Number(monto) * 100);
        if (!concepto.trim() || !Number.isFinite(cents) || cents < 0) return;
        const { error } = await supabase.from("site_costs").insert({
          site_id: siteId,
          concept: concepto.trim(),
          kind: tipo,
          amount_cents: cents,
          period: periodo,
        });
        if (error) return flash(`Error: ${error.message}`);
        setConcepto("");
        setMonto("");
        onHecho();
      }}
      className="flex flex-wrap items-end gap-2"
    >
      <input
        value={concepto}
        onChange={(e) => setConcepto(e.target.value)}
        placeholder="Concepto"
        className={`${input} min-w-[9rem] flex-1`}
      />
      <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={`${input} w-28`}>
        {COSTO_TIPOS.map((t) => (
          <option key={t} value={t} className="bg-judo-surface">
            {t}
          </option>
        ))}
      </select>
      <input
        value={monto}
        onChange={(e) => setMonto(e.target.value)}
        type="number"
        step="0.01"
        min="0"
        placeholder="0.00"
        className={`${input} w-24`}
      />
      <select
        value={periodo}
        onChange={(e) => setPeriodo(e.target.value)}
        className={`${input} w-24`}
      >
        {COSTO_PERIODOS.map((p) => (
          <option key={p.id} value={p.id} className="bg-judo-surface">
            {p.nombre}
          </option>
        ))}
      </select>
      <button type="submit" className={btnPurple}>
        Agregar
      </button>
    </form>
  );
}

function NuevoContacto({
  clientId,
  onHecho,
  flash,
}: {
  clientId: string;
  onHecho: () => void;
  flash: (m: string) => void;
}) {
  const supabase = getSupabase();
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState("");
  const [correo, setCorreo] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [decide, setDecide] = useState(false);
  const [paga, setPaga] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (nombre.trim().length < 2) return;
        const { error } = await supabase.from("client_contacts").insert({
          client_id: clientId,
          full_name: nombre.trim(),
          role: rol.trim() || null,
          email: correo.trim() || null,
          whatsapp: whatsapp.trim() || null,
          decides: decide,
          pays: paga,
        });
        if (error) return flash(`Error: ${error.message}`);
        setNombre("");
        setRol("");
        setCorreo("");
        setWhatsapp("");
        setDecide(false);
        setPaga(false);
        onHecho();
      }}
      className="flex flex-wrap items-center gap-2"
    >
      <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre" className={`${input} w-32`} />
      <input value={rol} onChange={(e) => setRol(e.target.value)} placeholder="Cargo" className={`${input} w-28`} />
      <input value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="Correo" className={`${input} w-40`} />
      <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp" className={`${input} w-32`} />
      <label className="flex items-center gap-1 text-[11px] text-judo-fog/55">
        <input type="checkbox" checked={decide} onChange={(e) => setDecide(e.target.checked)} />
        decide
      </label>
      <label className="flex items-center gap-1 text-[11px] text-judo-fog/55">
        <input type="checkbox" checked={paga} onChange={(e) => setPaga(e.target.checked)} />
        paga
      </label>
      <button type="submit" className={btnPurple}>
        Agregar
      </button>
    </form>
  );
}

function NuevoEvento({
  siteId,
  onHecho,
  flash,
}: {
  siteId: string;
  onHecho: () => void;
  flash: (m: string) => void;
}) {
  const supabase = getSupabase();
  const [tipo, setTipo] = useState("nota");
  const [detalle, setDetalle] = useState("");

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const { data: usuario } = await supabase.auth.getUser();
        const { error } = await supabase.from("site_events").insert({
          site_id: siteId,
          kind: tipo,
          detail: detalle.trim() || null,
          actor: usuario.user?.id ?? null,
        });
        if (error) return flash(`Error: ${error.message}`);
        setDetalle("");
        onHecho();
      }}
      className="flex flex-wrap items-center gap-2"
    >
      <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={`${input} w-40`}>
        {Object.entries(EVENTOS_NOMBRE)
          .filter(([k]) => k !== "suspendido" && k !== "reactivado")
          .map(([k, nombre]) => (
            <option key={k} value={k} className="bg-judo-surface">
              {nombre}
            </option>
          ))}
      </select>
      <input
        value={detalle}
        onChange={(e) => setDetalle(e.target.value)}
        placeholder="Detalle (a quién, por qué, monto…)"
        className={`${input} min-w-[12rem] flex-1`}
      />
      <button type="submit" className={btnPurple}>
        Anotar
      </button>
    </form>
  );
}
