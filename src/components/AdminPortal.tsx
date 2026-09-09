"use client";

/**
 * Portal de Administración (/es/admin). MVP Fase 4.
 * Solo para la cuenta con role='admin' (admin@judomarketing.net).
 * Texto en español: el admin es el dueño.
 */

import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import Turnstile, { bloqueaEnvio, resetTurnstile } from "./Turnstile";
import SiteDossier from "./SiteDossier";
import IntakeInbox from "./IntakeInbox";
import { precio, PRECIO_ASISTENTE, PRECIO_JUDITOADS } from "@/lib/pricing";
import { APPS_INVITADO, nombreApp, type AppInvitado } from "@/content/apps-hermanas";
import { NOMBRE_TIPO, TIPOS_DOCUMENTO, type TipoDocumento } from "@/content/documentos";
// Solo el tipo: el módulo en sí es de servidor y no entra al navegador.
import type { GoogleDeSitio } from "@/lib/google";

/** "▲ 12 %", "▼ 8 %" o "=" : ahora contra el periodo anterior. */
function tendencia(ahora: number, antes: number): { texto: string; clase: string } {
  if (!antes) return ahora ? { texto: "nuevo", clase: "text-judo-fog/45" } : { texto: "", clase: "" };
  const p = Math.round(((ahora - antes) / antes) * 100);
  if (Math.abs(p) < 3) return { texto: "=", clase: "text-judo-fog/45" };
  return p > 0
    ? { texto: `▲ ${p} %`, clase: "text-emerald-300" }
    : { texto: `▼ ${Math.abs(p)} %`, clase: "text-amber-300" };
}

// Campo de texto estándar del panel (antes vivía en AuthForms)
const inputClass =
  "w-full rounded-xl border border-judo-lilac/25 bg-judo-black/60 px-4 py-3 text-sm text-judo-fog placeholder:text-judo-fog/35 outline-none transition focus:border-judo-lilac focus:ring-1 focus:ring-judo-lilac";

/**
 * Las pestañas van en el orden en que pasan las cosas de verdad:
 * llega un formulario → se abre el website → se cobra
 * → se cuida la reputación. El Resumen manda al frente.
 */
/**
 * Comprueba que una escritura cambiara algo de verdad.
 *
 * Supabase NO devuelve error cuando las políticas de la base (RLS) dejan
 * fuera la fila: responde OK con cero filas tocadas. Mirando solo `error`,
 * el portal decía "Sitio deshabilitado ✓" sin haber deshabilitado nada, y
 * "contrato borrado" con el contrato intacto. El fallo era invisible.
 *
 * Por eso cada escritura de aquí lleva .select(): es lo que hace que
 * Supabase devuelva las filas afectadas y se pueda distinguir "funcionó"
 * de "me lo bloquearon".
 *
 * Devuelve null si todo bien, o el motivo si no.
 */
function fallo(res: {
  data: unknown[] | null;
  error: { message: string } | null;
}): string | null {
  if (res.error) return res.error.message;
  if (!res.data || res.data.length === 0) {
    return "la base de datos no dejó hacer el cambio. Comprueba que tu cuenta siga teniendo el rol de administración.";
  }
  return null;
}

type Tab =
  | "resumen"
  | "formularios"
  | "sitios"
  | "pagos"
  | "resenas"
  | "juditoads"
  | "juditos"
  | "judimental"
  | "invitados"
  | "documentos";

/** Un contrato enviado desde el portal (tabla documents). */
type DocumentoRow = {
  id: string;
  code: string;
  kind: TipoDocumento;
  recipient_name: string;
  business_name: string | null;
  recipient_email: string;
  plan: string | null;
  monthly_price: number | string;
  project: string | null;
  starts_on: string;
  sent_at: string | null;
  send_error: string | null;
  accepted_at: string | null;
  accepted_name: string | null;
  accepted_ip: string | null;
  created_at: string;
};

/** Los planes de website que se pueden poner en un contrato, con su precio. */
const PLANES_CONTRATO: { etiqueta: string; precio: number }[] = [
  { etiqueta: "Website Esencial", precio: precio("essential") },
  { etiqueta: "Website Complejo", precio: precio("complex") },
  { etiqueta: "App de teléfono", precio: precio("apps") },
];

/** Hoy en hora del Este, como aaaa-mm-dd para el <input type="date">. */
const hoyEste = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });

/** Una silla de invitado: alguien que entra a una app sin pagar. */
type Silla = {
  id: string;
  app: AppInvitado;
  email: string;
  name: string | null;
  note: string | null;
  expires_at: string | null;
  status: "pendiente" | "activa" | "revocada" | "error";
  synced_at: string | null;
  last_error: string | null;
  created_at: string;
};

/** Una persona registrada en JudiMental, tal como la devuelve esa app. */
type PersonaMental = {
  id: string;
  nombre?: string;
  email?: string;
  registradoEn?: string;
  ultimaActividad?: string | null;
  racha?: number;
  plan?: string;
  progreso?: { etiqueta?: string; porcentaje?: number } | null;
};

type ResumenMental = {
  totales?: { registrados?: number; activos7d?: number; sesiones?: number };
  personas?: PersonaMental[];
};

/** Un cliente de Juditos, los asistentes de IA (vive en otra base de datos). */
type JuditoCliente = {
  id: string;
  nombre: string;
  estado: string;
  juditos: {
    id: string;
    nombre: string;
    estado: string;
    modelo: string;
    mensajesMes: number;
  }[];
  canales: number;
  documentos: number;
  productos: number;
  mensajesHoy: number;
  mensajesMes: number;
  costeMes: string;
  esperandoPersona: number;
};

/** El cerebro de un Judito, tal como lo devuelve Juditos. */
type JuditoDetalle = {
  id: string;
  nombre: string;
  estado: string;
  cliente: { id: string; name: string };
  negocio: string;
  tono: string;
  reglas: string;
  saludo: string;
  idioma: string;
  modelo: string;
  capacidades: Record<string, boolean>;
  canales: { kind: string; displayName: string; active: boolean }[];
};

type JuditosResumen = {
  clientes: JuditoCliente[];
  totales: {
    clientes: number;
    juditosEnVivo: number;
    mensajesHoy: number;
    esperandoPersona: number;
    /** Negocios que ya contrataron y esperan a que alguien los monte. */
    solicitudesPendientes?: number;
    costeMes: string;
  };
};

/** Una cuenta del portal de JuditoADS (vive en otra base de datos). */
type JuditoUser = {
  id: string;
  email: string;
  nombre: string;
  negocio: string | null;
  telefono: string | null;
  creada: string;
  emailVerificado: boolean;
  suscripcion: string;
  pruebaHasta: string | null;
  whitelabel: boolean;
  campanas: number;
  cuentasMeta: number;
  /** Sin acceso, con sus campañas pausadas; se puede reactivar. */
  suspendida?: boolean;
  /** Resto de una baja lógica antigua: solo queda borrarla de verdad. */
  dadaDeBaja?: boolean;
};

type ContractRow = {
  id: string;
  client_name: string;
  business_name: string | null;
  client_email: string;
  plan: string;
  monthly_price: number;
  domain: string | null;
  pdf_path: string;
  code: string;
  /** Nulo = contrato pendiente: se cerró la venta y su website no existe. */
  site_id: string | null;
  created_at: string;
};
type PayRow = {
  amount: number;
  paid_at: string;
  site_id: string | null;
  method: string | null;
};

/** "2026-09-15" + 1 mes → "2026-10-15", sin pasar por Date ni por zonas horarias. */
function unMesDespues(fecha: string): string {
  const [a, m, d] = fecha.slice(0, 10).split("-").map(Number);
  const mes = m === 12 ? 1 : m + 1;
  const anio = m === 12 ? a + 1 : a;
  // Si el día no existe en el mes siguiente (31 → febrero), se recorta al último
  const ultimo = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  return `${anio}-${String(mes).padStart(2, "0")}-${String(Math.min(d, ultimo)).padStart(2, "0")}`;
}

/** "hace 3 min", "hace 2 h", "hace 4 d": cuándo reportó el kit por última vez. */
function haceCuanto(iso: string): string {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 48) return `hace ${h} h`;
  return `hace ${Math.round(h / 24)} d`;
}

/** "2026-09-15" → "15 sep". Sin Date: una fecha sin hora no tiene zona. */
function fechaCorta(iso: string): string {
  const [a, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${d} ${new Date(Date.UTC(a, m - 1, d)).toLocaleDateString("es-US", { month: "short", timeZone: "UTC" })}`;
}

/** "2026-09" → "sep 2026", para las columnas de ingresos por mes. */
function nombreDeMes(clave: string): string {
  const [a, m] = clave.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, 1)).toLocaleDateString("es-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

type ProofRow = {
  id: string;
  plan: string;
  method: string | null;
  tx_hash: string | null;
  payer_name: string;
  source: string | null;
  screenshot_path: string | null;
  status: string;
  created_at: string;
};

type SiteRow = {
  id: string;
  name: string;
  domain: string | null;
  status: string;
  monthly_price: number;
  months_paid: number;
  next_payment_due: string | null;
  kit_api_key: string;
  domain_expires_at: string | null;
  portfolio_visible: boolean | null;
  portfolio_category: string | null;
  portfolio_desc_es: string | null;
  portfolio_desc_en: string | null;
  portfolio_image: string | null;
  portfolio_shot_at: string | null;
  client_id: string | null;
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
  clients: { full_name: string; business_name: string | null } | null;
};

type FinanceRow = {
  site_id: string;
  status: string;
  revenue_cents: number;
  cost_cents: number;
  margin_cents: number;
};

type SiteMetric = {
  is_live: boolean | null;
  reported_at: string;
  salesTotal: number;
  traffic: number | null;
};

type ReviewModRow = {
  id: string;
  name: string;
  place: string;
  body: string;
  status: string;
  created_at: string;
};

const box = "rounded-2xl border border-judo-lilac/20 bg-judo-surface p-5";

// Botones compactos y consistentes en todo el panel
const btn = "rounded-full px-3 py-1 text-xs font-semibold transition whitespace-nowrap";
const btnGreen = `${btn} bg-emerald-500/90 text-white hover:bg-emerald-500`;
const btnPurple = `${btn} bg-judo-purple text-white hover:bg-judo-lilac`;
const btnGhost = `${btn} border border-judo-lilac/30 text-judo-lilac hover:bg-judo-purple/15`;
const btnDanger = `${btn} border border-red-400/40 text-red-300 hover:bg-red-400/10`;
const fieldSm =
  "rounded-lg border border-judo-lilac/25 bg-judo-black/60 px-2 py-1 text-xs text-judo-fog outline-none focus:border-judo-lilac";

export default function AdminPortal() {
  const supabase = getSupabase();

  const [ready, setReady] = useState(false);
  const [denied, setDenied] = useState(false);
  const [tab, setTab] = useState<Tab>("resumen");
  // JuditoADS se consulta aparte y solo al abrir su pestaña: es otra app y
  // no tiene por qué frenar la carga del resto del panel.
  const [juditoUsers, setJuditoUsers] = useState<JuditoUser[] | null>(null);
  const [juditoEmail, setJuditoEmail] = useState<{
    configured: boolean;
    ok: boolean;
    error: string | null;
  } | null>(null);
  const [juditoError, setJuditoError] = useState<string | null>(null);
  const [juditoBusy, setJuditoBusy] = useState(false);
  // Cuenta del revisor de Meta (App Review). La contraseña se elige aquí y
  // se enseña UNA vez al crearla: JuditoADS no la guarda en claro.
  const [revisorClave, setRevisorClave] = useState("");
  const [revisorBusy, setRevisorBusy] = useState(false);
  const [revisorListo, setRevisorListo] = useState<{
    url: string;
    email: string;
    password: string;
  } | null>(null);

  // Juditos (asistentes de IA): igual que JuditoADS, otra app y otra base de
  // datos, así que también se consulta solo al abrir su pestaña.
  const [juditos, setJuditos] = useState<JuditosResumen | null>(null);
  const [juditosError, setJuditosError] = useState<string | null>(null);
  const [juditosBusy, setJuditosBusy] = useState(false);
  // El Judito que se está editando, si hay alguno abierto.
  const [juditoAbierto, setJuditoAbierto] = useState<JuditoDetalle | null>(null);
  const [juditoGuardando, setJuditoGuardando] = useState(false);

  // JudiMental: la app del teléfono. Solo se mira, no se toca desde aquí.
  const [mental, setMental] = useState<ResumenMental | null>(null);
  const [mentalError, setMentalError] = useState<string | null>(null);
  const [mentalBusy, setMentalBusy] = useState(false);

  // Sillas de invitado: la lista sí vive en nuestra base, pero quien deja de
  // cobrar es cada app hermana, así que cada silla lleva su estado de envío.
  const [sillas, setSillas] = useState<Silla[] | null>(null);
  const [sillasError, setSillasError] = useState<string | null>(null);
  const [sillasBusy, setSillasBusy] = useState(false);
  const [sillaApp, setSillaApp] = useState<AppInvitado>("juditoads");
  const [sillaEmail, setSillaEmail] = useState("");
  const [sillaNombre, setSillaNombre] = useState("");
  const [sillaNota, setSillaNota] = useState("");
  const [sillaExpira, setSillaExpira] = useState("");

  // Documentos: contratos que salen de aquí ya firmados y se aceptan por enlace.
  const [documentos, setDocumentos] = useState<DocumentoRow[] | null>(null);
  const [documentosError, setDocumentosError] = useState<string | null>(null);
  const [documentosBusy, setDocumentosBusy] = useState(false);
  const [docTipo, setDocTipo] = useState<TipoDocumento>("websites");
  const [docEmail, setDocEmail] = useState("");
  const [docNombre, setDocNombre] = useState("");
  const [docEmpresa, setDocEmpresa] = useState("");
  const [docPlan, setDocPlan] = useState(PLANES_CONTRATO[0].etiqueta);
  const [docPrecio, setDocPrecio] = useState(String(PLANES_CONTRATO[0].precio));
  const [docProyecto, setDocProyecto] = useState("");
  const [docInicio, setDocInicio] = useState(hoyEste);

  // Google (Search Console + Analytics) por website. Llega aparte y después:
  // Google tarda, y el portal no tiene por qué esperarlo para pintarse.
  const [google, setGoogle] = useState<Record<string, GoogleDeSitio>>({});
  const [googleRobot, setGoogleRobot] = useState<string | null>(null);
  const [googleBusy, setGoogleBusy] = useState(false);

  // Acceso propio del panel: sin sesión se muestra el formulario de entrada
  const [needsLogin, setNeedsLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [captcha, setCaptcha] = useState("");
  const [captchaRoto, setCaptchaRoto] = useState(false);

  const [proofs, setProofs] = useState<ProofRow[]>([]);
  const [sites, setSites] = useState<SiteRow[]>([]);
  const [reviews, setReviews] = useState<ReviewModRow[]>([]);
  const [contractRows, setContractRows] = useState<ContractRow[]>([]);
  const [payRows, setPayRows] = useState<PayRow[]>([]);
  const [metrics, setMetrics] = useState<Record<string, SiteMetric>>({});
  const [finance, setFinance] = useState<FinanceRow[]>([]);
  const [accessGaps, setAccessGaps] = useState(0);
  const [msg, setMsg] = useState("");

  // Formularios: cuántos están sin atender y de qué website es cada uno
  const [intakeNuevos, setIntakeNuevos] = useState(0);
  const [intakeSueltos, setIntakeSueltos] = useState(0);
  const [intakePorSitio, setIntakePorSitio] = useState<Record<string, string>>({});

  // La lista de websites es larga: se muestra plegada y se abre de a uno
  const [sitioAbierto, setSitioAbierto] = useState<string | null>(null);
  const [buscarSitio, setBuscarSitio] = useState("");
  // El alta de un website es cosa de vez en cuando: no debe tapar la lista
  const [altaAbierta, setAltaAbierta] = useState(false);

  // Formulario de nuevo sitio
  const [siteName, setSiteName] = useState("");
  const [siteDomain, setSiteDomain] = useState("");
  const [sitePrice, setSitePrice] = useState(String(precio("essential")));
  const [siteClient, setSiteClient] = useState("");
  const [siteDue, setSiteDue] = useState("");
  // Un website que ya está publicado entra directo como activo
  const [siteStatus, setSiteStatus] = useState<"en_desarrollo" | "activo">(
    "en_desarrollo"
  );

  const loadAll = useCallback(async () => {
    const [proofRes, siteRes, metricsRes, finRes, accRes, contractRes, payRes, revRes, intakeRes] = await Promise.all([
      supabase
        .from("payment_proofs")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("sites")
        .select(
          "id,name,domain,status,monthly_price,months_paid,next_payment_due,kit_api_key,domain_expires_at,portfolio_visible,portfolio_category,portfolio_desc_es,portfolio_desc_en,portfolio_image,portfolio_shot_at,client_id,currency,billing_day,payment_method,grace_days,timezone,repo_url,vercel_project,registrar,domain_holder,dns_provider,email_provider,db_provider,ga4_property_id,gsc_property,gbp_location,meta_pixel_id,meta_page,notes,clients(full_name,business_name)"
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("site_metrics")
        .select("site_id,is_live,sales_count,traffic_count,reported_at")
        .order("reported_at", { ascending: false })
        .limit(400),
      // Cuánto entra, cuánto cuesta y cuánto queda, por sitio
      supabase.from("site_finance").select("site_id,status,revenue_cents,cost_cents,margin_cents"),
      // Accesos del cliente que todavía no están otorgados
      supabase
        .from("site_accesses")
        .select("id,status")
        .in("status", ["pendiente", "solicitado"]),
      supabase
        .from("signed_contracts")
        .select(
          "id,client_name,business_name,client_email,plan,monthly_price,domain,pdf_path,code,site_id,created_at"
        )
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("payments")
        .select("amount,paid_at,site_id,method")
        .order("paid_at", { ascending: false })
        .limit(1000),
      supabase
        .from("reviews")
        .select("id,name,place,body,status,created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      // Lo justo para los avisos: qué formularios faltan por atender y cuáles
      // ya están colgados de un website
      supabase
        .from("client_intake")
        .select("id,status,site_id,business_name")
        .order("created_at", { ascending: false })
        .limit(200),
    ]);
    setProofs((proofRes.data as ProofRow[]) ?? []);
    setSites((siteRes.data as unknown as SiteRow[]) ?? []);
    setReviews((revRes.data as ReviewModRow[]) ?? []);
    setContractRows((contractRes.data as ContractRow[]) ?? []);
    setPayRows((payRes.data as unknown as PayRow[]) ?? []);
    setFinance((finRes.data as FinanceRow[]) ?? []);
    setAccessGaps((accRes.data ?? []).length);

    const intakeRows = (intakeRes.data ?? []) as {
      id: string;
      status: string;
      site_id: string | null;
      business_name: string;
    }[];
    setIntakeNuevos(intakeRows.filter((r) => r.status === "nuevo").length);
    setIntakeSueltos(
      intakeRows.filter((r) => !r.site_id && r.status !== "descartado").length
    );
    const porSitio: Record<string, string> = {};
    for (const r of intakeRows) if (r.site_id) porSitio[r.site_id] = r.business_name;
    setIntakePorSitio(porSitio);

    // Telemetría del Judo Site Kit: último reporte y ventas acumuladas por sitio
    const metricRows = (metricsRes.data ?? []) as {
      site_id: string;
      is_live: boolean | null;
      sales_count: number | null;
      traffic_count: number | null;
      reported_at: string;
    }[];
    const byId: Record<string, SiteMetric> = {};
    for (const row of metricRows) {
      if (!byId[row.site_id]) {
        byId[row.site_id] = {
          is_live: row.is_live,
          reported_at: row.reported_at,
          salesTotal: 0,
          traffic: row.traffic_count,
        };
      }
      byId[row.site_id].salesTotal += row.sales_count ?? 0;
    }
    setMetrics(byId);
  }, [supabase]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setNeedsLogin(true);
        return;
      }
      const { data: prof } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.session.user.id)
        .single();
      if (prof?.role !== "admin") {
        setDenied(true);
        return;
      }
      await loadAll();
      setReady(true);
      // Los contratos enviados también cuentan en "por hacer" del Resumen
      void cargarDocumentos();
      void cargarGoogle();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flash = (text: string, ms = 3000) => {
    setMsg(text);
    setTimeout(() => setMsg(""), ms);
  };

  // ── Acceso ─────────────────────────────────────────────────────────
  // El panel tiene su propia puerta: ya no existe una página /login aparte.
  const iniciarSesion = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginBusy(true);
    // El captcha de Supabase Auth exige el token también aquí: sin él,
    // ningún login pasa, ni el de Administración.
    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
      options: captcha ? { captchaToken: captcha } : undefined,
    });
    setLoginBusy(false);
    if (error) {
      resetTurnstile();
      setCaptcha("");
      setLoginError(
        error.message === "Invalid login credentials"
          ? "Correo o contraseña incorrectos."
          : /captcha/i.test(error.message)
            ? "No se pudo verificar que no eres un robot. Desactiva el bloqueador de anuncios para esta página o intenta en otro navegador."
            : error.message
      );
      return;
    }
    // Con la sesión ya guardada, recargar repite el chequeo de rol completo
    window.location.reload();
  };

  // ── Pagos Zelle ────────────────────────────────────────────────────
  const viewProof = async (path: string) => {
    const { data, error } = await supabase.storage
      .from("payment-proofs")
      .createSignedUrl(path, 3600);
    if (error || !data) return flash("No se pudo abrir la captura");
    window.open(data.signedUrl, "_blank", "noopener");
  };

  const setProofStatus = async (id: string, status: string) => {
    const err = fallo(
      await supabase
        .from("payment_proofs")
        .update({ status })
        .eq("id", id)
        .select("id")
    );
    if (err) return flash(`No se guardó: ${err}`);
    flash("Comprobante actualizado ✓");
    void loadAll();
  };

  // ── Sitios / Clientes ─────────────────────────────────────────────
  const createSite = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: client, error: cErr } = await supabase
      .from("clients")
      .insert({ full_name: siteClient.trim() })
      .select("id")
      .single();
    if (cErr || !client) return flash(`Error: ${cErr?.message}`);
    const { error: sErr } = await supabase.from("sites").insert({
      name: siteName.trim(),
      domain: siteDomain.trim() || null,
      // Un sitio propio puede ir en 0: Number("0") es 0, así que no lo
      // pisamos con el default de 50.
      monthly_price: sitePrice === "" ? precio("essential") : Number(sitePrice),
      client_id: client.id,
      next_payment_due: siteDue || null,
      status: siteStatus,
    });
    if (sErr) return flash(`Error: ${sErr.message}`);
    setSiteName("");
    setSiteDomain("");
    setSiteClient("");
    setSiteDue("");
    setSiteStatus("en_desarrollo");
    setAltaAbierta(false);
    flash("Sitio creado ✓");
    void loadAll();
  };

  const toggleSite = async (site: SiteRow) => {
    const next = site.status === "deshabilitado" ? "activo" : "deshabilitado";
    const err = fallo(
      await supabase
        .from("sites")
        .update({ status: next })
        .eq("id", site.id)
        .select("id")
    );
    if (err) return flash(`No se guardó: ${err}`);
    await supabase.from("audit_log").insert({
      actor: (await supabase.auth.getUser()).data.user?.id,
      action: next === "deshabilitado" ? "site_disabled" : "site_enabled",
      target: site.name,
    });
    flash(next === "deshabilitado" ? "Sitio deshabilitado" : "Sitio activado ✓");
    void loadAll();
  };

  const registerPayment = async (site: SiteRow) => {
    const { data: user } = await supabase.auth.getUser();
    const { error } = await supabase.from("payments").insert({
      site_id: site.id,
      amount: site.monthly_price,
      method: "manual",
      recorded_by: user.user?.id,
    });
    if (error) return flash(`Error: ${error.message}`);
    // Un mes más sobre la fecha de cobro, como texto: con Date el "2026-09-15"
    // se leía en UTC y de noche salía un día antes.
    const siguiente = unMesDespues(site.next_payment_due ?? hoyEste());
    const err = fallo(
      await supabase
        .from("sites")
        .update({ months_paid: site.months_paid + 1, next_payment_due: siguiente })
        .eq("id", site.id)
        .select("id")
    );
    if (err) return flash(`Pago registrado, pero no se movió la fecha: ${err}`);
    flash(`Pago de $${site.monthly_price} registrado ✓`);
    void loadAll();
  };

  const setReviewStatus = async (id: string, status: "aprobada" | "rechazada") => {
    const err = fallo(
      await supabase.from("reviews").update({ status }).eq("id", id).select("id")
    );
    if (err) return flash(`No se guardó: ${err}`);
    flash(status === "aprobada" ? "Reseña publicada ✓" : "Reseña rechazada");
    void loadAll();
  };

  /**
   * Cambia lo que el cliente paga al mes. Pasa cuando amplía el servicio.
   * Queda escrito en la bitácora del sitio.
   */
  const cambiarPrecio = async (site: SiteRow, nuevo: number) => {
    const anterior = Number(site.monthly_price);
    if (!Number.isFinite(nuevo) || nuevo < 0 || nuevo === anterior) return;

    const err = fallo(
      await supabase
        .from("sites")
        .update({ monthly_price: nuevo })
        .eq("id", site.id)
        .select("id")
    );
    if (err) return flash(`No se guardó: ${err}`);

    const { data: user } = await supabase.auth.getUser();
    await supabase.from("site_events").insert({
      site_id: site.id,
      kind: "nota",
      detail: `Precio mensual: $${anterior.toFixed(2)} → $${nuevo.toFixed(2)}`,
      actor: user.user?.id ?? null,
    });

    flash(`Precio actualizado a $${nuevo.toFixed(2)} ✓`);
    void loadAll();
  };

  /**
   * Le avisa a los buscadores que no son Google que hay contenido nuevo.
   * Google ya se entera solo por Search Console; el resto necesitan que se
   * les diga.
   */
  const avisarBuscadores = async () => {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) return flash("Sesión vencida, vuelve a entrar");
    flash("Avisando a los buscadores…");
    try {
      const res = await fetch("/api/indexnow", {
        method: "POST",
        headers: { Authorization: `Bearer ${sess.session.access_token}` },
      });
      const data = (await res.json()) as {
        urls?: number;
        resultados?: { motor: string; estado: number | string }[];
        error?: string;
      };
      if (data.error) return flash(`No se pudo avisar: ${data.error}`);
      const ok = (data.resultados ?? []).filter(
        (r) => r.estado === 200 || r.estado === 202
      );
      flash(
        ok.length
          ? `${data.urls} páginas avisadas ✓: ${ok.map((r) => r.motor).join(", ")}`
          : `Ningún buscador confirmó: ${(data.resultados ?? [])
              .map((r) => `${r.motor} ${r.estado}`)
              .join(" · ")}`
      );
    } catch {
      flash("No se pudo avisar a los buscadores");
    }
  };

  /** Abre el PDF firmado. El bucket es privado: se pide un enlace de una hora. */
  const abrirContrato = async (c: ContractRow) => {
    const { data, error } = await supabase.storage
      .from("contracts")
      .createSignedUrl(c.pdf_path, 3600);
    if (error || !data) return flash(`No se pudo abrir el contrato: ${error?.message}`);
    window.open(data.signedUrl, "_blank", "noopener");
  };

  /**
   * Cuelga el contrato de un website. Mientras no tenga uno queda pendiente:
   * es una venta cerrada cuyo sitio todavía no existe.
   *
   * Casi siempre el website nace antes que el contrato: primero se le hace el
   * borrador al cliente y solo cuando lo aprueba se firma y se paga. Eso quiere
   * decir que el website se creó con el precio de arranque, y que el contrato
   * es el que trae los números de verdad. Al colgarlo se ofrece copiarlos: si
   * no, el sitio se queda cobrando lo que se tecleó al abrirlo.
   */
  const asignarContrato = async (c: ContractRow, siteId: string) => {
    const err = fallo(
      await supabase
        .from("signed_contracts")
        .update({ site_id: siteId || null })
        .eq("id", c.id)
        .select("id")
    );
    if (err) return flash(`No se guardó: ${err}`);
    if (!siteId) {
      flash(`Contrato ${c.code} sin website: vuelve a quedar pendiente`);
      return void loadAll();
    }

    const actor = (await supabase.auth.getUser()).data.user?.id ?? null;
    await supabase.from("site_events").insert({
      site_id: siteId,
      kind: "contrato_firmado",
      detail: `Contrato ${c.code} de ${c.client_name}, $${Number(c.monthly_price).toFixed(2)}/mes`,
      actor,
    });

    // Lo que dice el contrato firmado contra lo que tiene puesto el website
    const sitio = sites.find((s) => s.id === siteId);
    const precioContrato = Number(c.monthly_price);
    const cambios: Record<string, unknown> = {};
    const lista: string[] = [];
    if (sitio && precioContrato > 0 && Number(sitio.monthly_price) !== precioContrato) {
      cambios.monthly_price = precioContrato;
      lista.push(
        `Precio: $${Number(sitio.monthly_price).toFixed(2)} → $${precioContrato.toFixed(2)}`
      );
    }

    if (lista.length === 0) {
      flash(`Contrato ${c.code} asignado ✓ Ya sale en el expediente del website`);
      return void loadAll();
    }

    if (
      !window.confirm(
        `El contrato firmado no dice lo mismo que ${sitio!.name}:\n\n${lista.join(
          "\n"
        )}\n\n¿Dejo el website igual que el contrato? (Cancelar deja el website como está.)`
      )
    ) {
      flash(`Contrato ${c.code} asignado ✓ El website quedó como estaba`);
      return void loadAll();
    }

    const sErr = fallo(
      await supabase.from("sites").update(cambios).eq("id", siteId).select("id")
    );
    if (sErr) {
      flash(`Contrato asignado, pero no se pudo copiar: ${sErr}`);
      return void loadAll();
    }
    await supabase.from("site_events").insert({
      site_id: siteId,
      // La bitácora solo acepta los tipos de la migración 0016; esto es una nota
      kind: "nota",
      detail: `Copiado del contrato ${c.code}: ${lista.join(" · ")}`,
      actor,
    });
    flash(`Contrato ${c.code} asignado y website actualizado ✓`);
    void loadAll();
  };

  /**
   * Borra un contrato que nunca se volvió cliente: firmó y no pagó, o se
   * arrepintió. Se lleva también el PDF, para no dejar archivos huérfanos.
   *
   * Un contrato es evidencia, así que pregunta dos veces cuando el website al
   * que pertenece está activo: ese cliente sí está pagando y ese documento
   * es lo que respalda el cobro.
   */
  const borrarContrato = async (c: ContractRow) => {
    const sitio = sites.find((s) => s.id === c.site_id);
    if (
      !window.confirm(
        `¿Borrar el contrato ${c.code} de ${c.client_name}? Se borra el PDF firmado y no se puede deshacer.`
      )
    )
      return;
    if (
      sitio?.status === "activo" &&
      !window.confirm(
        `Ojo: ${sitio.name} está ACTIVO y este es el documento que respalda su cobro. Si lo borras te quedas sin con qué sustentar el pago ni una suspensión. ¿Aun así lo borras?`
      )
    )
      return;

    const err = fallo(
      await supabase.from("signed_contracts").delete().eq("id", c.id).select("id")
    );
    if (err) return flash(`No se borró: ${err}`);

    // El archivo va después: si falla, al menos la fila ya no cuenta como venta
    const { error: archivoErr } = await supabase.storage
      .from("contracts")
      .remove([c.pdf_path]);

    await supabase.from("audit_log").insert({
      actor: (await supabase.auth.getUser()).data.user?.id,
      action: "contract_deleted",
      target: `${c.code} · ${c.client_name}${sitio ? ` · ${sitio.name}` : ""}`,
    });

    flash(
      archivoErr
        ? `Contrato ${c.code} borrado, pero el PDF quedó guardado (${archivoErr.message})`
        : `Contrato ${c.code} borrado ✓`
    );
    void loadAll();
  };

  /**
   * Crea el website que le falta a un contrato y lo deja ya asignado.
   * Es el camino natural de un contrato pendiente.
   */
  const sitioDesdeContrato = async (c: ContractRow) => {
    const { data: client, error: cErr } = await supabase
      .from("clients")
      .insert({ full_name: c.client_name, business_name: c.business_name })
      .select("id")
      .single();
    if (cErr || !client) return flash(`Error: ${cErr?.message}`);
    const { data: site, error: sErr } = await supabase
      .from("sites")
      .insert({
        name: c.business_name || c.client_name,
        domain: c.domain || null,
        monthly_price: Number(c.monthly_price),
        client_id: client.id,
        status: "en_desarrollo",
      })
      .select("id")
      .single();
    if (sErr || !site) return flash(`Error: ${sErr?.message}`);
    await supabase
      .from("signed_contracts")
      .update({ site_id: site.id })
      .eq("id", c.id);
    await supabase.from("site_events").insert({
      site_id: site.id,
      kind: "contrato_firmado",
      detail: `Website creado desde el contrato ${c.code} de ${c.client_name}`,
      actor: (await supabase.auth.getUser()).data.user?.id ?? null,
    });
    flash(`Website creado y contrato ${c.code} asignado ✓`);
    await loadAll();
    irASitio(site.id);
  };

  /**
   * Suspender, reactivar o eliminar una cuenta de JuditoADS.
   *
   * La orden viaja portal → /api/admin/juditoads → app de JuditoADS, que es
   * quien la ejecuta en su base. Si la app todavía no implementa acciones,
   * el error lo dice tal cual en vez de fingir que funcionó.
   */
  const accionJudito = async (
    u: JuditoUser,
    accion: "suspender" | "reactivar" | "eliminar"
  ) => {
    const quien = u.negocio || u.nombre || u.email;
    const avisos: Record<string, string> = {
      suspender: `¿Suspender la cuenta de ${quien}? El cliente no podrá usar JuditoADS hasta que la reactives.`,
      reactivar: `¿Reactivar la cuenta de ${quien}?`,
      eliminar: `¿ELIMINAR la cuenta de ${quien} (${u.email})? Se borra de verdad con sus campañas, cuentas de Meta y conexión; sus anuncios se pausan y su cobro se cancela primero. El correo queda libre. No se puede deshacer. Si es por falta de pago, mejor suspéndela.`,
    };
    if (!window.confirm(avisos[accion])) return;
    if (accion === "eliminar" && u.campanas > 0 &&
        !window.confirm(`Ojo: ${quien} tiene ${u.campanas} campaña(s) registradas. ¿Aun así la eliminas?`))
      return;

    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) return flash("Sesión vencida, vuelve a entrar");
    setJuditoBusy(true);
    try {
      const res = await fetch("/api/admin/juditoads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sess.session.access_token}`,
        },
        body: JSON.stringify({ accion, userId: u.id }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        detalle?: string;
      };
      if (!res.ok || !body.ok) {
        flash(body.error ?? `No se pudo: JuditoADS respondió ${res.status}`, 8000);
      } else {
        // JuditoADS cuenta qué hizo de verdad: cuántas campañas paró, si
        // canceló el cobro. Eso vale más que un ✓ y se deja leer.
        flash(body.detalle ? `✓ ${body.detalle}` : `Cuenta de ${quien} ${accion === "eliminar" ? "eliminada" : accion === "suspender" ? "suspendida" : "reactivada"} ✓`, 8000);
        await cargarJuditoads();
      }
    } catch {
      flash("No se pudo contactar a JuditoADS.");
    }
    setJuditoBusy(false);
  };

  /**
   * Crear o restablecer la cuenta que se le da al revisor de Meta.
   *
   * La ejecuta la app de JuditoADS: deja el correo verificado, acceso sin
   * cobro y una cuenta publicitaria de demostración con campañas. Se puede
   * repetir cuando haga falta; cada vez pone la contraseña nueva.
   */
  const crearRevisor = async () => {
    const clave = revisorClave.trim();
    if (clave.length < 8) return flash("La contraseña necesita al menos 8 caracteres.");
    if (!window.confirm(`¿Dejar la cuenta del revisor de Meta con la contraseña «${clave}»? Si ya existía, la anterior deja de valer.`))
      return;

    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) return flash("Sesión vencida, vuelve a entrar");
    setRevisorBusy(true);
    setRevisorListo(null);
    try {
      const res = await fetch("/api/admin/juditoads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sess.session.access_token}`,
        },
        body: JSON.stringify({ accion: "revisor", password: clave }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        credenciales?: { url: string; email: string; password: string };
      };
      if (!res.ok || !body.ok || !body.credenciales) {
        flash(body.error ?? `No se pudo: JuditoADS respondió ${res.status}`);
      } else {
        setRevisorListo(body.credenciales);
        setRevisorClave("");
        flash("Cuenta del revisor lista ✓");
        await cargarJuditoads();
      }
    } catch {
      flash("No se pudo contactar a JuditoADS.");
    }
    setRevisorBusy(false);
  };

  const cargarJuditoads = async () => {
    setJuditoBusy(true);
    setJuditoError(null);
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setJuditoBusy(false);
      setJuditoError("Sesión vencida, vuelve a entrar.");
      return;
    }
    try {
      const res = await fetch("/api/admin/juditoads", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setJuditoError(body.error || `Error ${res.status}`);
        setJuditoUsers(null);
      } else {
        setJuditoUsers(body.usuarios || []);
        setJuditoEmail(body.email ?? null);
      }
    } catch {
      setJuditoError("No se pudo contactar a JuditoADS.");
    }
    setJuditoBusy(false);
  };

  const cargarJuditos = async () => {
    setJuditosBusy(true);
    setJuditosError(null);
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setJuditosBusy(false);
      setJuditosError("Sesión vencida, vuelve a entrar.");
      return;
    }
    try {
      const res = await fetch("/api/admin/juditos", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setJuditosError(body.error || `Error ${res.status}`);
        setJuditos(null);
      } else {
        setJuditos(body as JuditosResumen);
      }
    } catch {
      setJuditosError("No se pudo contactar a Juditos.");
    }
    setJuditosBusy(false);
  };

  const cargarJudimental = async () => {
    setMentalBusy(true);
    setMentalError(null);
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setMentalBusy(false);
      setMentalError("Sesión vencida, vuelve a entrar.");
      return;
    }
    try {
      const res = await fetch("/api/admin/judimental", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMentalError(body.error || `Error ${res.status}`);
        setMental(null);
      } else {
        setMental(body as ResumenMental);
      }
    } catch {
      setMentalError("No se pudo contactar a JudiMental.");
    }
    setMentalBusy(false);
  };

  // ── Sillas de invitado ────────────────────────────────────────────
  const cargarSillas = async () => {
    setSillasBusy(true);
    setSillasError(null);
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setSillasBusy(false);
      setSillasError("Sesión vencida, vuelve a entrar.");
      return;
    }
    try {
      const res = await fetch("/api/admin/invitados", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSillasError(body.error || `Error ${res.status}`);
        setSillas(null);
      } else {
        setSillas((body.sillas ?? []) as Silla[]);
      }
    } catch {
      setSillasError("No se pudo leer la lista de invitados.");
    }
    setSillasBusy(false);
  };

  /** Manda una orden de invitados y recarga la lista. */
  const pedirSilla = async (cuerpo: Record<string, unknown>): Promise<boolean> => {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) {
      flash("Sesión vencida, vuelve a entrar");
      return false;
    }
    setSillasBusy(true);
    try {
      const res = await fetch("/api/admin/invitados", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sess.session.access_token}`,
        },
        body: JSON.stringify(cuerpo),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        silla?: Silla;
      };
      setSillasBusy(false);
      if (!res.ok || !body.ok) {
        flash(body.error ?? `No se pudo: error ${res.status}`);
        // Aunque falle el envío a la app, la fila pudo quedar guardada: se
        // recarga para que se vea el estado real y el botón de reintentar.
        await cargarSillas();
        return false;
      }
      await cargarSillas();
      return true;
    } catch {
      setSillasBusy(false);
      flash("No se pudo contactar al servidor.");
      return false;
    }
  };

  const otorgarSilla = async () => {
    const email = sillaEmail.trim().toLowerCase();
    if (!email) return flash("Falta el correo");
    if (!sillaNota.trim()) return flash("Escribe por qué le das el acceso: sin motivo, esta lista se olvida.");

    const ok = await pedirSilla({
      accion: "otorgar",
      app: sillaApp,
      email,
      nombre: sillaNombre.trim() || undefined,
      nota: sillaNota.trim(),
      expira: sillaExpira ? new Date(`${sillaExpira}T23:59:59`).toISOString() : null,
    });
    if (ok) {
      flash(`${email} entra gratis a ${nombreApp(sillaApp)} ✓`);
      setSillaEmail("");
      setSillaNombre("");
      setSillaNota("");
      setSillaExpira("");
    }
  };

  const accionSilla = async (s: Silla, accion: "revocar" | "reintentar" | "eliminar") => {
    const quien = s.name || s.email;
    if (accion === "revocar" && !window.confirm(`¿Quitarle a ${quien} el acceso gratis a ${nombreApp(s.app)}?`)) return;
    if (accion === "eliminar" && !window.confirm(`¿Borrar la silla de ${quien} en ${nombreApp(s.app)}? Primero se le quita el acceso en la app; si eso falla, la fila no se borra.`)) return;

    const ok = await pedirSilla({ accion, id: s.id });
    if (ok) {
      flash(
        accion === "eliminar"
          ? `Silla de ${quien} borrada ✓`
          : accion === "revocar"
            ? `${quien} ya no entra gratis ✓`
            : `Orden reenviada a ${nombreApp(s.app)} ✓`
      );
    }
  };

  // ── Documentos ────────────────────────────────────────────────────
  const cargarDocumentos = async () => {
    setDocumentosBusy(true);
    setDocumentosError(null);
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setDocumentosBusy(false);
      setDocumentosError("Sesión vencida, vuelve a entrar.");
      return;
    }
    try {
      const res = await fetch("/api/admin/documentos", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDocumentosError(body.error || `Error ${res.status}`);
        setDocumentos(null);
      } else {
        setDocumentos((body.documentos ?? []) as DocumentoRow[]);
      }
    } catch {
      setDocumentosError("No se pudo leer la lista de documentos.");
    }
    setDocumentosBusy(false);
  };

  /** Manda una orden de documentos; devuelve el cuerpo o null si falló. */
  const pedirDocumento = async (
    cuerpo: Record<string, unknown>
  ): Promise<{ ok?: boolean; error?: string; documento?: DocumentoRow } | null> => {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) {
      flash("Sesión vencida, vuelve a entrar");
      return null;
    }
    setDocumentosBusy(true);
    try {
      const res = await fetch("/api/admin/documentos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sess.session.access_token}`,
        },
        body: JSON.stringify(cuerpo),
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        documento?: DocumentoRow;
      };
      setDocumentosBusy(false);
      if (!res.ok) {
        flash(body.error ?? `No se pudo: error ${res.status}`);
        await cargarDocumentos();
        return null;
      }
      await cargarDocumentos();
      return body;
    } catch {
      setDocumentosBusy(false);
      flash("No se pudo contactar al servidor.");
      return null;
    }
  };

  /** Al cambiar el tipo, el plan y el precio se ponen solos; se pueden retocar. */
  const cambiarTipoDocumento = (tipo: TipoDocumento) => {
    setDocTipo(tipo);
    if (tipo === "websites") {
      setDocPlan(PLANES_CONTRATO[0].etiqueta);
      setDocPrecio(String(PLANES_CONTRATO[0].precio));
    } else {
      setDocPlan("");
      setDocPrecio(String(tipo === "juditoads" ? PRECIO_JUDITOADS : PRECIO_ASISTENTE));
    }
  };

  const enviarDocumento = async () => {
    const email = docEmail.trim().toLowerCase();
    if (!email) return flash("Falta el correo del cliente");
    if (docNombre.trim().length < 2) return flash("Falta el nombre del cliente");
    if (!(Number(docPrecio) > 0)) return flash("Revisa el precio mensual");

    const body = await pedirDocumento({
      accion: "enviar",
      tipo: docTipo,
      email,
      nombre: docNombre.trim(),
      empresa: docEmpresa.trim() || undefined,
      plan: docTipo === "websites" ? docPlan : undefined,
      precio: Number(docPrecio),
      proyecto: docProyecto.trim() || undefined,
      inicio: docInicio,
    });
    if (!body) return;
    if (body.ok) {
      flash(`Contrato de ${NOMBRE_TIPO[docTipo]} enviado a ${email} ✓`);
      setDocEmail("");
      setDocNombre("");
      setDocEmpresa("");
      setDocProyecto("");
    } else {
      // El PDF quedó guardado; solo el correo falló. La lista lo enseña.
      flash(`El contrato se generó pero el correo no salió: ${body.error ?? "sin detalle"}`);
    }
  };

  const accionDocumento = async (d: DocumentoRow, accion: "reenviar" | "eliminar") => {
    if (
      accion === "eliminar" &&
      !window.confirm(`¿Borrar el contrato ${d.code} de ${d.recipient_name}? Se borra el PDF y el enlace deja de funcionar.`)
    )
      return;
    const body = await pedirDocumento({ accion, id: d.id });
    if (!body) return;
    if (accion === "eliminar") flash(`Contrato ${d.code} borrado ✓`);
    else if (body.ok) flash(`Contrato reenviado a ${d.recipient_email} ✓`);
    else flash(`No salió: ${body.error ?? "sin detalle"}`);
  };

  const descargarDocumento = async (d: DocumentoRow) => {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) return flash("Sesión vencida, vuelve a entrar");
    const res = await fetch(`/api/admin/documentos?descargar=${encodeURIComponent(d.id)}`, {
      headers: { Authorization: `Bearer ${sess.session.access_token}` },
    });
    const body = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
    if (!res.ok || !body.url) return flash(body.error ?? "No se pudo abrir el PDF");
    window.open(body.url, "_blank", "noopener");
  };

  const copiarEnlaceAceptacion = async (d: DocumentoRow) => {
    const enlace = `https://www.judomarketing.net/es/acepto/${d.code}`;
    try {
      await navigator.clipboard.writeText(enlace);
      flash("Enlace de aceptación copiado ✓");
    } catch {
      window.prompt("Copia el enlace:", enlace);
    }
  };

  // ── Google ────────────────────────────────────────────────────────
  const cargarGoogle = async () => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;
    setGoogleBusy(true);
    try {
      const res = await fetch("/api/admin/google?todos=1", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = (await res.json().catch(() => ({}))) as {
        robot?: string | null;
        sitios?: Record<string, GoogleDeSitio>;
      };
      if (res.ok) {
        setGoogle(body.sitios ?? {});
        setGoogleRobot(body.robot ?? null);
      }
    } catch {
      // Sin Google el portal sigue igual; el bloque de cada website lo dice.
    }
    setGoogleBusy(false);
  };

  /** Vuelve a pedirle a Google un website, saltándose lo guardado. */
  const refrescarGoogle = async (siteId: string) => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return flash("Sesión vencida, vuelve a entrar");
    setGoogleBusy(true);
    try {
      const res = await fetch(`/api/admin/google?site=${encodeURIComponent(siteId)}&fresco=1`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = (await res.json().catch(() => ({}))) as GoogleDeSitio & { robot?: string | null; error?: string };
      if (!res.ok) flash(body.error ?? `Google no contestó (${res.status})`);
      else {
        setGoogle((g) => ({ ...g, [siteId]: body }));
        setGoogleRobot(body.robot ?? null);
      }
    } catch {
      flash("No se pudo contactar al servidor");
    }
    setGoogleBusy(false);
  };

  /** Pide el token de sesión, que es lo que autoriza cada llamada. */
  const tokenSesion = async (): Promise<string | null> => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  };

  const abrirJudito = async (id: string) => {
    const token = await tokenSesion();
    if (!token) return flash("Sesión vencida, vuelve a entrar.");
    setJuditoGuardando(true);
    try {
      const res = await fetch(`/api/admin/juditos?judito=${encodeURIComponent(id)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) flash(body.error || `Error ${res.status}`);
      else setJuditoAbierto(body as JuditoDetalle);
    } catch {
      flash("No se pudo contactar a Juditos.");
    }
    setJuditoGuardando(false);
  };

  const guardarJudito = async () => {
    if (!juditoAbierto) return;
    const token = await tokenSesion();
    if (!token) return flash("Sesión vencida, vuelve a entrar.");
    setJuditoGuardando(true);
    try {
      const res = await fetch("/api/admin/juditos", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          id: juditoAbierto.id,
          nombre: juditoAbierto.nombre,
          estado: juditoAbierto.estado,
          negocio: juditoAbierto.negocio,
          tono: juditoAbierto.tono,
          reglas: juditoAbierto.reglas,
          saludo: juditoAbierto.saludo,
          capacidades: juditoAbierto.capacidades,
          resumen: "Editado desde el portal de administración",
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) flash(body.error || `Error ${res.status}`);
      else {
        flash(`${juditoAbierto.nombre} guardado ✓`);
        setJuditoAbierto(null);
        await cargarJuditos();
      }
    } catch {
      flash("No se pudo guardar.");
    }
    setJuditoGuardando(false);
  };

  const facturar = async (clientId: string, nombre: string) => {
    if (!confirm(`¿Emitir y enviar la factura del mes a ${nombre}?`)) return;
    const token = await tokenSesion();
    if (!token) return flash("Sesión vencida, vuelve a entrar.");
    setJuditosBusy(true);
    try {
      const res = await fetch("/api/admin/juditos", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok || body.ok === false) flash(body.error || `Error ${res.status}`);
      else if (body.enviada) flash(`Factura ${body.numero} enviada ✓`);
      else flash(`Factura ${body.numero} creada, pero el correo no salió: ${body.motivo}`);
    } catch {
      flash("No se pudo emitir la factura.");
    }
    setJuditosBusy(false);
  };

  // ── Render ─────────────────────────────────────────────────────────
  if (needsLogin) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col justify-center px-4 py-16">
        <h1 className="text-center text-2xl font-bold">Acceso de Administración</h1>
        <form onSubmit={iniciarSesion} className="mt-6 flex flex-col gap-3">
          <input
            type="email"
            required
            autoComplete="email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            placeholder="Correo"
            className={inputClass}
          />
          <input
            type="password"
            required
            autoComplete="current-password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            placeholder="Contraseña"
            className={inputClass}
          />
          <Turnstile onToken={setCaptcha} onFallo={setCaptchaRoto} />
          {loginError && <p className="text-sm text-red-300">{loginError}</p>}
          <button
            type="submit"
            disabled={loginBusy || bloqueaEnvio(captcha, captchaRoto)}
            className="rounded-full bg-judo-purple px-4 py-3 text-sm font-semibold text-white transition hover:bg-judo-lilac disabled:opacity-50"
          >
            {loginBusy ? "Entrando…" : "Entrar"}
          </button>
        </form>
      </div>
    );
  }
  if (denied) {
    return (
      <div className="flex flex-col items-center gap-5 py-24 text-center">
        <p className="text-judo-fog/60">
          🚫 Acceso solo para Administración.
          <br />
          <span className="text-sm text-judo-fog/40">
            Entraste con una cuenta que no es de administrador.
          </span>
        </p>
        {/* Sin esto la sesión equivocada queda guardada en el navegador y
            esta pantalla no tiene salida: cada recarga vuelve aquí. */}
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.reload();
          }}
          className="rounded-full bg-judo-purple px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-judo-lilac"
        >
          Cerrar esa sesión y entrar con otra cuenta
        </button>
      </div>
    );
  }
  if (!ready) {
    return <p className="py-24 text-center text-judo-fog/50">…</p>;
  }

  // Fecha de hoy en la zona del navegador (la tuya), no en UTC: si no, entre
  // las 8pm y medianoche un cobro de hoy ya saldría marcado como vencido.
  const hoy = new Date().toLocaleDateString("en-CA");
  /** Un website pide atención si está activo y ya se le pasó el cobro, o si el kit lo reporta caído. */
  const necesitaAtencion = (s: SiteRow) =>
    (s.status === "activo" && !!s.next_payment_due && s.next_payment_due < hoy) ||
    metrics[s.id]?.is_live === false;
  const sitiosEnRiesgo = sites.filter(necesitaAtencion).length;

  // Buscador de la lista de websites: nombre, dominio o cliente
  const consulta = buscarSitio.trim().toLowerCase();
  const sitiosFiltrados = consulta
    ? sites.filter((s) =>
        [s.name, s.domain, s.clients?.full_name, s.clients?.business_name]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(consulta))
      )
    : sites;

  const sitiosBreves = sites.map((s) => ({
    id: s.id,
    name: s.name,
    domain: s.domain,
  }));

  /** Salta a un website y lo deja abierto. Lo usan los formularios. */
  const irASitio = (id: string) => {
    setBuscarSitio("");
    setSitioAbierto(id);
    setTab("sitios");
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Portal de Administración</h1>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            // Sin sesión, al recargar aparece el formulario de acceso
            window.location.reload();
          }}
          className="text-sm text-judo-fog/50 hover:text-judo-lilac"
        >
          Cerrar sesión →
        </button>
      </div>

      {msg && (
        <p className="mt-3 rounded-xl border border-judo-lilac/40 bg-judo-purple/15 px-4 py-2 text-sm">
          {msg}
        </p>
      )}

      {/* Pestañas en dos grupos: lo de la agencia (websites y clientes) y las
          apps hermanas. El número en ámbar es lo que espera por ti; el gris es
          solo cuántos hay. */}
      <div className="mt-6 flex flex-col gap-2.5">
        {(
          [
            {
              titulo: "Agencia",
              pestañas: [
                ["resumen", "📊", "Resumen", 0, 0],
                ["sitios", "🌐", "Websites", sitiosEnRiesgo, sites.length],
                ["formularios", "📨", "Formularios", intakeNuevos, intakeSueltos],
                [
                  "documentos",
                  "📄",
                  "Documentos",
                  // Lo urgente: correos que no salieron y contratos viejos sin website.
                  (documentos ?? []).filter((d) => d.send_error && !d.sent_at).length +
                    contractRows.filter((c) => !c.site_id).length,
                  (documentos ?? []).length,
                ],
                [
                  "pagos",
                  "💵",
                  "Dinero",
                  proofs.filter((p) => p.status === "pendiente").length,
                  0,
                ],
                [
                  "resenas",
                  "⭐",
                  "Reseñas",
                  reviews.filter((r) => r.status === "pendiente").length,
                  0,
                ],
              ],
            },
            {
              titulo: "Apps",
              pestañas: [
                ["juditoads", "🚀", "JuditoADS", 0, juditoUsers?.length ?? 0],
                [
                  "juditos",
                  "🤖",
                  "AI Assistants",
                  (juditos?.totales.solicitudesPendientes ?? 0) +
                    (juditos?.totales.esperandoPersona ?? 0),
                  juditos?.totales.clientes ?? 0,
                ],
                [
                  "judimental",
                  "🧠",
                  "JudiMental",
                  0,
                  mental?.totales?.registrados ?? mental?.personas?.length ?? 0,
                ],
                [
                  "invitados",
                  "🎟️",
                  "Invitados",
                  // Lo urgente es lo que la app hermana todavía no aplicó.
                  (sillas ?? []).filter((s) => s.status === "pendiente" || s.status === "error").length,
                  (sillas ?? []).filter((s) => s.status === "activa").length,
                ],
              ],
            },
          ] as { titulo: string; pestañas: [Tab, string, string, number, number][] }[]
        ).map((grupo) => (
          <div key={grupo.titulo} className="flex flex-wrap items-center gap-2">
            <span className="w-14 text-[10px] font-semibold uppercase tracking-[0.18em] text-judo-fog/35">
              {grupo.titulo}
            </span>
            {grupo.pestañas.map(([key, icono, label, urgente, total]) => (
              <button
                key={key}
                onClick={() => {
                  setTab(key);
                  if (key === "juditoads" && !juditoUsers && !juditoBusy) cargarJuditoads();
                  if (key === "juditos" && !juditos && !juditosBusy) cargarJuditos();
                  if (key === "judimental" && !mental && !mentalBusy) cargarJudimental();
                  if (key === "invitados" && !sillas && !sillasBusy) cargarSillas();
                  if (key === "documentos" && !documentos && !documentosBusy) cargarDocumentos();
                }}
                className={`flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold transition ${
                  tab === key
                    ? "border border-emerald-300 bg-emerald-400 text-judo-black shadow-[0_0_16px_-2px_rgba(52,211,153,0.75)]"
                    : "border border-judo-lilac/25 text-white hover:border-emerald-400/50 hover:text-emerald-300"
                }`}
              >
                <span aria-hidden>{icono}</span>
                {label}
                {urgente > 0 && (
                  <span
                    className={`rounded-full px-1.5 text-[10px] font-bold ${
                      tab === key ? "bg-judo-black text-amber-300" : "bg-amber-400/90 text-judo-black"
                    }`}
                  >
                    {urgente}
                  </span>
                )}
                {urgente === 0 && total > 0 && (
                  <span className={tab === key ? "text-judo-black/55" : "text-judo-fog/40"}>
                    {total}
                  </span>
                )}
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* ── RESUMEN ───────────────────────────────────────────────────
          Tres preguntas, en orden: ¿qué espera por mí? ¿cuánto entra? ¿cómo
          está cada website? Lo demás vive en su pestaña. */}
      {tab === "resumen" && (() => {
        const now = new Date();
        const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const monthRevenue = payRows
          .filter((p) => p.paid_at?.startsWith(monthKey))
          .reduce((s, p) => s + Number(p.amount), 0);
        // La cuenta real: solo cuentan los sitios que están activos
        const activosFin = finance.filter((f) => f.status === "activo");
        const mrr = activosFin.reduce((t, f) => t + (f.revenue_cents ?? 0), 0) / 100;
        const costos = activosFin.reduce((t, f) => t + (f.cost_cents ?? 0), 0) / 100;
        const margen = mrr - costos;

        const vencido = (s: SiteRow) =>
          s.status === "activo" && !!s.next_payment_due && s.next_payment_due < hoy;
        const caido = (s: SiteRow) => metrics[s.id]?.is_live === false;

        // Solo lo que de verdad espera por ti, y cada línea lleva a donde se
        // resuelve. Si no hay nada, se dice "todo al día" y ya.
        const porHacer = (
          [
            ["📨", "formularios nuevos sin atender", intakeNuevos, "formularios"],
            ["🔗", "formularios sin website", intakeSueltos, "formularios"],
            ["⏰", "websites con el pago vencido", sites.filter(vencido).length, "sitios"],
            ["🔴", "websites caídos según el kit", sites.filter(caido).length, "sitios"],
            ["🔑", "accesos de clientes por conseguir", accessGaps, "sitios"],
            ["🧾", "comprobantes de pago por verificar", proofs.filter((p) => p.status === "pendiente").length, "pagos"],
            ["📄", "contratos enviados que el cliente no ha aceptado", (documentos ?? []).filter((d) => d.sent_at && !d.accepted_at).length, "documentos"],
            ["✉️", "contratos cuyo correo no salió", (documentos ?? []).filter((d) => d.send_error && !d.sent_at).length, "documentos"],
            ["📑", "contratos del programa anterior sin website", contractRows.filter((c) => !c.site_id).length, "documentos"],
            ["⭐", "reseñas por moderar", reviews.filter((r) => r.status === "pendiente").length, "resenas"],
          ] as [string, string, number, Tab][]
        ).filter(([, , n]) => n > 0);

        // Los que piden atención primero, luego activos, luego el resto
        const peso = (s: SiteRow) =>
          vencido(s) || caido(s) ? 0 : s.status === "activo" ? 1 : s.status === "en_desarrollo" ? 2 : 3;
        const ordenados = [...sites].sort((a, b) => peso(a) - peso(b) || a.name.localeCompare(b.name));
        const activos = sites.filter((s) => s.status === "activo").length;

        return (
          <div className="mt-6 flex flex-col gap-7">
            {/* Por hacer */}
            <section>
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-judo-fog/45">
                Por hacer
              </h2>
              {porHacer.length === 0 ? (
                <p className={`${box} mt-2 text-sm text-emerald-300`}>
                  ✓ Todo al día. Nada espera por ti.
                </p>
              ) : (
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {porHacer.map(([icono, label, n, destino]) => (
                    <button
                      key={label}
                      onClick={() => setTab(destino)}
                      className={`${box} flex items-center gap-3 py-3 text-left transition hover:border-amber-400/60`}
                    >
                      <span className="w-8 text-2xl font-bold tabular-nums text-amber-300">{n}</span>
                      <span className="text-sm text-judo-fog/85">
                        <span aria-hidden>{icono}</span> {label}
                      </span>
                      <span className="ml-auto text-judo-lilac" aria-hidden>→</span>
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Dinero, en cuatro números */}
            <section>
              <div className="flex items-center justify-between">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-judo-fog/45">
                  Dinero
                </h2>
                <button onClick={() => setTab("pagos")} className="text-xs text-judo-lilac hover:underline">
                  ver el detalle →
                </button>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(
                  [
                    ["Cobrado este mes", `$${monthRevenue.toFixed(0)}`, "text-white"],
                    ["Facturación al mes", `$${mrr.toFixed(0)}`, "text-judo-lilac"],
                    ["Costos al mes", `$${costos.toFixed(0)}`, "text-judo-fog/70"],
                    ["Ganancia al mes", `$${margen.toFixed(0)}`, "text-emerald-300"],
                  ] as [string, string, string][]
                ).map(([label, valor, color]) => (
                  <div key={label} className={box}>
                    <p className="text-xs text-judo-fog/50">{label}</p>
                    <p className={`mt-1 text-2xl font-bold tabular-nums ${color}`}>{valor}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Websites: lo que el cliente ve en su portal, resumido a una línea */}
            <section>
              <div className="flex items-center justify-between">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-judo-fog/45">
                  Websites · {activos} de {sites.length} activos
                </h2>
                <button onClick={() => setTab("sitios")} className="text-xs text-judo-lilac hover:underline">
                  ver todos →
                </button>
              </div>
              <div className="mt-2 overflow-x-auto rounded-2xl border border-judo-lilac/20">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="bg-white/[0.04] text-[11px] uppercase tracking-wide text-judo-fog/45">
                    <tr>
                      <th className="px-4 py-2.5">Website</th>
                      <th className="px-4 py-2.5">Estado</th>
                      <th className="px-4 py-2.5 text-right">Ventas</th>
                      <th className="px-4 py-2.5 text-right">Visitas</th>
                      <th className="px-4 py-2.5 text-right" title="Search Console y Analytics, últimos 28 días">
                        Google · 28 d
                      </th>
                      <th className="px-4 py-2.5">Cobro</th>
                      <th className="px-4 py-2.5 text-right">Al mes</th>
                      <th className="px-4 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-judo-lilac/10">
                    {sites.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-judo-fog/45">
                          Todavía no hay websites. Se crean en la pestaña Websites.
                        </td>
                      </tr>
                    )}
                    {ordenados.map((s) => {
                      const m = metrics[s.id];
                      const atencion = vencido(s) || caido(s);
                      return (
                        <tr key={s.id} className={`transition hover:bg-white/[0.03] ${atencion ? "bg-amber-400/[0.04]" : ""}`}>
                          <td className="px-4 py-2.5">
                            <button onClick={() => irASitio(s.id)} className="text-left">
                              <p className="font-semibold text-white hover:text-emerald-300">{s.name}</p>
                              <p className="text-xs text-judo-fog/45">{s.domain ?? "sin dominio"}</p>
                            </button>
                          </td>
                          <td className="px-4 py-2.5">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                                s.status === "activo"
                                  ? "bg-emerald-400/15 text-emerald-300"
                                  : s.status === "deshabilitado"
                                    ? "bg-red-500/15 text-red-300"
                                    : "bg-amber-400/15 text-amber-300"
                              }`}
                            >
                              {s.status === "en_desarrollo" ? "en desarrollo" : s.status}
                            </span>
                            <p className="mt-1 text-[11px] text-judo-fog/45">
                              {m
                                ? `${m.is_live === false ? "🔴 caído" : "🟢 en vivo"} · ${haceCuanto(m.reported_at)}`
                                : "📡 sin kit"}
                            </p>
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-white">
                            {m ? m.salesTotal : <span className="text-judo-fog/30">—</span>}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-white">
                            {m?.traffic != null ? m.traffic : <span className="text-judo-fog/30">—</span>}
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums">
                            {(() => {
                              const g = google[s.id];
                              if (!g || (!g.gsc && !g.ga4)) {
                                return (
                                  <span className="text-[11px] text-judo-fog/30">
                                    {s.gsc_property || s.ga4_property_id ? (googleBusy ? "…" : "sin datos") : "sin conectar"}
                                  </span>
                                );
                              }
                              const tc = g.gsc ? tendencia(g.gsc.clics, g.gsc.clicsAntes) : null;
                              const tu = g.ga4 ? tendencia(g.ga4.usuarios, g.ga4.usuariosAntes) : null;
                              return (
                                <>
                                  {g.gsc && (
                                    <p className="text-white">
                                      {g.gsc.clics} clics{" "}
                                      {tc && <span className={`text-[11px] ${tc.clase}`}>{tc.texto}</span>}
                                    </p>
                                  )}
                                  {g.ga4 && (
                                    <p className="text-judo-fog/70">
                                      {g.ga4.usuarios} usuarios{" "}
                                      {tu && <span className={`text-[11px] ${tu.clase}`}>{tu.texto}</span>}
                                    </p>
                                  )}
                                </>
                              );
                            })()}
                          </td>
                          <td className="px-4 py-2.5">
                            {s.status === "activo" && s.next_payment_due ? (
                              <span className={vencido(s) ? "font-semibold text-amber-300" : "text-judo-fog/70"}>
                                {vencido(s) ? "⏰ " : ""}
                                {fechaCorta(s.next_payment_due)}
                              </span>
                            ) : (
                              <span className="text-judo-fog/30">—</span>
                            )}
                            <p className="text-[11px] text-judo-fog/40">{s.months_paid}/12 pagos</p>
                          </td>
                          <td className="px-4 py-2.5 text-right tabular-nums text-white">
                            ${Number(s.monthly_price)}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <button
                              onClick={() => toggleSite(s)}
                              className={s.status === "deshabilitado" ? btnGreen : btnDanger}
                            >
                              {s.status === "deshabilitado" ? "Encender" : "Apagar"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Herramienta suelta: aviso a los buscadores que no son Google */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-judo-lilac/15 px-5 py-3 text-xs text-judo-fog/55">
              <span>
                🔎 ¿Cambiaste textos o publicaste un website en el showcase? Avísale
                a Bing, Yahoo, DuckDuckGo, Yandex y Ecosia. Google se entera solo.
              </span>
              <button onClick={avisarBuscadores} className={btnGhost}>
                📡 Avisar a los buscadores
              </button>
            </div>
          </div>
        );
      })()}

      {/* ── DINERO ────────────────────────────────────────────────────
          Cuánto entró, cuánto entra cada mes, qué deja cada website, y los
          comprobantes de Zelle/USDT que hay que verificar a mano. */}
      {tab === "pagos" && (() => {
        const claveMes = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const ahora = new Date();
        const meses: string[] = [];
        for (let i = 5; i >= 0; i--) {
          meses.push(claveMes(new Date(ahora.getFullYear(), ahora.getMonth() - i, 1)));
        }
        const porMes: Record<string, number> = {};
        for (const p of payRows) {
          const k = (p.paid_at ?? "").slice(0, 7);
          porMes[k] = (porMes[k] ?? 0) + Number(p.amount);
        }
        const esteMes = porMes[meses[5]] ?? 0;
        const mesPasado = porMes[meses[4]] ?? 0;
        const total = payRows.reduce((s, p) => s + Number(p.amount), 0);
        const activosFin = finance.filter((f) => f.status === "activo");
        const mrr = activosFin.reduce((t, f) => t + (f.revenue_cents ?? 0), 0) / 100;
        const costos = activosFin.reduce((t, f) => t + (f.cost_cents ?? 0), 0) / 100;
        const finPorSitio: Record<string, FinanceRow> = {};
        for (const f of finance) finPorSitio[f.site_id] = f;
        const nombreSitio = (id: string | null) => sites.find((s) => s.id === id)?.name ?? "—";
        const pendientesProof = proofs.filter((p) => p.status === "pendiente");
        const resueltosProof = proofs.filter((p) => p.status !== "pendiente").slice(0, 8);

        const Comprobante = ({ p }: { p: ProofRow }) => (
          <div className={`${box} flex flex-wrap items-center gap-3 py-3`}>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                {p.method === "usdt" ? "🪙" : "🏦"} {p.payer_name}{" "}
                <span className="text-sm font-normal text-judo-fog/50">
                  · {p.method === "usdt" ? "USDT" : "Zelle"} · plan {p.plan} ·{" "}
                  {new Date(p.created_at).toLocaleDateString("es-US")}
                </span>
              </p>
              <p className="text-xs text-judo-fog/50">
                {p.source ? `Origen: ${p.source} · ` : ""}
                <b
                  className={
                    p.status === "verificado"
                      ? "text-emerald-300"
                      : p.status === "rechazado"
                        ? "text-red-300"
                        : "text-amber-300"
                  }
                >
                  {p.status}
                </b>
                {p.method === "usdt" && p.status === "pendiente" && (
                  <span className="ml-2 text-amber-200">⏳ la red tarda 30 a 60 min en confirmar</span>
                )}
              </p>
            </div>
            {p.tx_hash && (
              <a href={`https://etherscan.io/tx/${p.tx_hash}`} target="_blank" rel="noopener noreferrer" className={btnGhost}>
                Ver en Etherscan
              </a>
            )}
            {p.screenshot_path && (
              <button onClick={() => viewProof(p.screenshot_path!)} className={btnGhost}>
                Ver captura
              </button>
            )}
            {p.status !== "verificado" && (
              <button onClick={() => setProofStatus(p.id, "verificado")} className={btnGreen}>
                Verificar ✓
              </button>
            )}
            {p.status !== "rechazado" && (
              <button onClick={() => setProofStatus(p.id, "rechazado")} className={btnDanger}>
                Rechazar
              </button>
            )}
          </div>
        );

        return (
          <div className="mt-6 flex flex-col gap-7">
            {/* Los cuatro números */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(
                [
                  ["Cobrado este mes", `$${esteMes.toFixed(0)}`, "text-white"],
                  ["Mes pasado", `$${mesPasado.toFixed(0)}`, "text-judo-fog/70"],
                  ["Cobrado en total", `$${total.toFixed(0)}`, "text-judo-lilac"],
                  ["Ganancia al mes", `$${(mrr - costos).toFixed(0)}`, "text-emerald-300"],
                ] as [string, string, string][]
              ).map(([label, valor, color]) => (
                <div key={label} className={box}>
                  <p className="text-xs text-judo-fog/50">{label}</p>
                  <p className={`mt-1 text-2xl font-bold tabular-nums ${color}`}>{valor}</p>
                </div>
              ))}
            </div>

            {/* Seis meses, de un vistazo */}
            <section>
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-judo-fog/45">
                Cobrado por mes
              </h2>
              <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
                {meses.map((k, i) => (
                  <div
                    key={k}
                    className={`rounded-xl border px-3 py-2 ${
                      i === 5 ? "border-judo-lilac/40 bg-judo-purple/10" : "border-judo-lilac/15"
                    }`}
                  >
                    <p className="text-[11px] text-judo-fog/45">{nombreDeMes(k)}</p>
                    <p className="text-lg font-bold tabular-nums text-white">${(porMes[k] ?? 0).toFixed(0)}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Qué deja cada website */}
            <section>
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-judo-fog/45">
                Por website · facturación ${mrr.toFixed(0)} − costos ${costos.toFixed(0)} = ganancia ${(mrr - costos).toFixed(0)} al mes
              </h2>
              <div className="mt-2 overflow-x-auto rounded-2xl border border-judo-lilac/20">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-white/[0.04] text-[11px] uppercase tracking-wide text-judo-fog/45">
                    <tr>
                      <th className="px-4 py-2.5">Website</th>
                      <th className="px-4 py-2.5 text-right">Cobra</th>
                      <th className="px-4 py-2.5 text-right">Costos</th>
                      <th className="px-4 py-2.5 text-right">Deja</th>
                      <th className="px-4 py-2.5">Pagos</th>
                      <th className="px-4 py-2.5">Próximo cobro</th>
                      <th className="px-4 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-judo-lilac/10">
                    {sites.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-judo-fog/45">
                          Todavía no hay websites.
                        </td>
                      </tr>
                    )}
                    {[...sites]
                      .sort((a, b) => (a.status === "activo" ? 0 : 1) - (b.status === "activo" ? 0 : 1))
                      .map((s) => {
                        const f = finPorSitio[s.id];
                        const vencido = s.status === "activo" && !!s.next_payment_due && s.next_payment_due < hoy;
                        const apagado = s.status !== "activo";
                        return (
                          <tr key={s.id} className={apagado ? "opacity-55" : ""}>
                            <td className="px-4 py-2.5">
                              <button onClick={() => irASitio(s.id)} className="text-left">
                                <p className="font-semibold text-white hover:text-emerald-300">{s.name}</p>
                                <p className="text-[11px] text-judo-fog/45">
                                  {s.status === "en_desarrollo" ? "en desarrollo" : s.status}
                                  {s.payment_method ? ` · ${s.payment_method}` : ""}
                                </p>
                              </button>
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-white">${Number(s.monthly_price)}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-judo-fog/70">
                              {f ? `$${(f.cost_cents / 100).toFixed(0)}` : "—"}
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-emerald-300">
                              {f ? `$${(f.margin_cents / 100).toFixed(0)}` : "—"}
                            </td>
                            <td className="px-4 py-2.5 tabular-nums text-judo-fog/70">{s.months_paid}/12</td>
                            <td className="px-4 py-2.5">
                              {s.status === "activo" && s.next_payment_due ? (
                                <span className={vencido ? "font-semibold text-amber-300" : "text-judo-fog/70"}>
                                  {vencido ? "⏰ " : ""}
                                  {fechaCorta(s.next_payment_due)}
                                </span>
                              ) : (
                                <span className="text-judo-fog/30">—</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-right">
                              {s.status === "activo" && (
                                <button onClick={() => registerPayment(s)} className={btnGhost}>
                                  💵 Registrar pago
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Comprobantes que esperan */}
            {pendientesProof.length > 0 && (
              <section>
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300">
                  Comprobantes por verificar · {pendientesProof.length}
                </h2>
                <div className="mt-2 flex flex-col gap-2">
                  {pendientesProof.map((p) => (
                    <Comprobante key={p.id} p={p} />
                  ))}
                </div>
              </section>
            )}

            {/* Últimos pagos registrados */}
            <section>
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-judo-fog/45">
                Últimos pagos
              </h2>
              {payRows.length === 0 ? (
                <p className="mt-2 text-sm text-judo-fog/45">Todavía no hay pagos registrados.</p>
              ) : (
                <div className="mt-2 overflow-hidden rounded-2xl border border-judo-lilac/20">
                  <table className="w-full text-left text-sm">
                    <tbody className="divide-y divide-judo-lilac/10">
                      {payRows.slice(0, 12).map((p, i) => (
                        <tr key={`${p.paid_at}-${i}`}>
                          <td className="px-4 py-2 text-judo-fog/60">
                            {new Date(p.paid_at).toLocaleDateString("es-US")}
                          </td>
                          <td className="px-4 py-2 text-white">{nombreSitio(p.site_id)}</td>
                          <td className="px-4 py-2 text-judo-fog/45">{p.method ?? ""}</td>
                          <td className="px-4 py-2 text-right tabular-nums text-emerald-300">
                            ${Number(p.amount).toFixed(0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {resueltosProof.length > 0 && (
              <section>
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-judo-fog/45">
                  Comprobantes ya revisados
                </h2>
                <div className="mt-2 flex flex-col gap-2 opacity-70">
                  {resueltosProof.map((p) => (
                    <Comprobante key={p.id} p={p} />
                  ))}
                </div>
              </section>
            )}
          </div>
        );
      })()}

      {/* ── FORMULARIOS DE CLIENTES: la entrada de todo ── */}
      {tab === "formularios" && (
        <IntakeInbox
          flash={flash}
          sitios={sitiosBreves}
          onIrASitio={irASitio}
          onCambio={loadAll}
        />
      )}

      {/* ── JUDITOADS: cuentas del portal de publicidad ── */}
      {tab === "juditoads" && (
        <section className="mt-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Cuentas de JuditoADS</h2>
              <p className="text-sm text-judo-fog/60">
                Clientes con portal de publicidad ($20/mes). Vive en otra base de
                datos, por eso se consulta aparte.
              </p>
            </div>
            <button
              onClick={cargarJuditoads}
              disabled={juditoBusy}
              className="rounded-full border border-judo-lilac/25 px-4 py-1.5 text-xs font-semibold text-white transition hover:border-emerald-400/50 hover:text-emerald-300 disabled:opacity-50"
            >
              {juditoBusy ? "Cargando…" : "↻ Actualizar"}
            </button>
          </div>

          {juditoError && (
            <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {juditoError}
            </p>
          )}

          {/* Envio de correos: la verificacion por codigo depende de esto */}
          {juditoEmail && (
            <div
              className={`mb-4 rounded-xl border px-4 py-3 text-sm ${
                juditoEmail.ok
                  ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                  : "border-amber-400/40 bg-amber-400/10 text-amber-200"
              }`}
            >
              <p className="font-semibold">
                {juditoEmail.ok
                  ? "✓ Envio de correos conectado"
                  : "⚠ Envio de correos sin funcionar"}
              </p>
              <p className="mt-1 text-xs opacity-80">
                {juditoEmail.ok
                  ? "La confirmacion de email por codigo esta activa para las cuentas nuevas."
                  : `${juditoEmail.error ?? "SMTP no respondio"}. Mientras tanto las cuentas nuevas se dan por verificadas.`}
              </p>
            </div>
          )}

          {/* Cuenta del revisor de Meta: la que se pone en el App Review */}
          <div className="mb-4 rounded-xl border border-judo-lilac/20 bg-judo-black/40 px-4 py-4">
            <p className="font-semibold text-white">🔍 Cuenta del revisor de Meta</p>
            <p className="mt-1 text-xs text-judo-fog/60">
              Es la que se pone en el App Review para que el revisor entre. Elige la
              contraseña y pulsa el botón: queda con el correo verificado, sin cobro, y con
              una cuenta de demostración con campañas para que el tablero no esté vacío.
              Se puede repetir cuando haga falta; cada vez pone la contraseña nueva.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <input
                type="text"
                value={revisorClave}
                onChange={(e) => setRevisorClave(e.target.value)}
                placeholder="contraseña para el revisor (mínimo 8)"
                autoComplete="off"
                className={`${inputClass} sm:max-w-xs`}
              />
              <button
                onClick={() => void crearRevisor()}
                disabled={revisorBusy || revisorClave.trim().length < 8}
                className="rounded-full bg-emerald-400 px-5 py-2 text-xs font-bold text-judo-black transition hover:bg-emerald-300 disabled:opacity-50"
              >
                {revisorBusy ? "Creando…" : "Crear / restablecer"}
              </button>
            </div>
            {revisorListo && (
              <div className="mt-3 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
                <p className="font-semibold">✓ Lista. Esto es lo que va en el App Review:</p>
                <p className="mt-1 font-mono text-xs">{revisorListo.url}</p>
                <p className="font-mono text-xs">{revisorListo.email}</p>
                <p className="font-mono text-xs">{revisorListo.password}</p>
                <p className="mt-1 text-xs opacity-80">
                  La contraseña solo se enseña aquí y ahora. Si la pierdes, vuelve a crearla.
                </p>
              </div>
            )}
          </div>

          {!juditoError && juditoUsers && juditoUsers.length > 0 && (
            <>
              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ["Cuentas", juditoUsers.length],
                  [
                    "Suscritas",
                    juditoUsers.filter((u) => u.suscripcion === "active").length,
                  ],
                  [
                    "En prueba",
                    juditoUsers.filter((u) => u.suscripcion === "trial").length,
                  ],
                  [
                    "Campañas",
                    juditoUsers.reduce((n, u) => n + u.campanas, 0),
                  ],
                ].map(([label, value]) => (
                  <div
                    key={String(label)}
                    className="rounded-xl border border-judo-lilac/20 bg-white/[0.03] px-4 py-3"
                  >
                    <p className="text-xs text-judo-fog/50">{label}</p>
                    <p className="text-2xl font-bold text-white">{value}</p>
                  </div>
                ))}
              </div>

              <div className="overflow-x-auto rounded-xl border border-judo-lilac/20">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-judo-fog/50">
                    <tr>
                      <th className="px-4 py-3">Cliente</th>
                      <th className="px-4 py-3">Suscripción</th>
                      <th className="px-4 py-3">Campañas</th>
                      <th className="px-4 py-3">Cuentas Meta</th>
                      <th className="px-4 py-3">Alta</th>
                      <th className="sticky right-0 bg-judo-black px-4 py-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-judo-lilac/10">
                    {juditoUsers.map((u) => (
                      <tr key={u.id} className="align-top">
                        <td className="px-4 py-3">
                          <p className="font-semibold text-white">
                            {u.negocio || u.nombre}
                          </p>
                          <p className="text-xs text-judo-fog/60">{u.email}</p>
                          {!u.emailVerificado && (
                            <span className="mt-1 inline-block rounded-full bg-amber-400/90 px-2 py-0.5 text-[10px] font-bold text-judo-black">
                              email sin confirmar
                            </span>
                          )}
                          {u.suspendida && (
                            <span className="mt-1 inline-block rounded-full bg-red-500/90 px-2 py-0.5 text-[10px] font-bold text-white">
                              suspendida
                            </span>
                          )}
                          {u.dadaDeBaja && (
                            <span className="mt-1 inline-block rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold text-judo-fog/80" title="Baja antigua: la fila sigue ocupando el correo. Bórrala con 🗑.">
                              dada de baja
                            </span>
                          )}
                          {u.whitelabel && (
                            <span className="ml-1 mt-1 inline-block rounded-full bg-judo-purple px-2 py-0.5 text-[10px] font-bold text-white">
                              whitelabel
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                              u.suscripcion === "active"
                                ? "bg-emerald-400 text-judo-black"
                                : u.suscripcion === "trial"
                                  ? "bg-amber-400/90 text-judo-black"
                                  : "bg-white/10 text-judo-fog/70"
                            }`}
                          >
                            {u.suscripcion}
                          </span>
                          {u.suscripcion === "trial" && u.pruebaHasta && (
                            <p className="mt-1 text-[11px] text-judo-fog/50">
                              hasta {u.pruebaHasta.slice(0, 10)}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-white">{u.campanas}</td>
                        <td className="px-4 py-3 text-white">{u.cuentasMeta}</td>
                        <td className="px-4 py-3 text-judo-fog/60">
                          {u.creada.slice(0, 10)}
                        </td>
                        <td className="sticky right-0 bg-judo-black px-4 py-3">
                          <div className="flex items-center gap-2">
                            {u.dadaDeBaja ? null : u.suspendida ? (
                              <button
                                onClick={() => void accionJudito(u, "reactivar")}
                                className="rounded-full border border-emerald-400/40 px-3 py-1 text-[11px] font-semibold text-emerald-300 transition hover:bg-emerald-400/10"
                              >
                                Reactivar
                              </button>
                            ) : (
                              <button
                                onClick={() => void accionJudito(u, "suspender")}
                                className="rounded-full border border-amber-400/40 px-3 py-1 text-[11px] font-semibold text-amber-300 transition hover:bg-amber-400/10"
                              >
                                Suspender
                              </button>
                            )}
                            <button
                              onClick={() => void accionJudito(u, "eliminar")}
                              title="Eliminar la cuenta y sus campañas"
                              className="rounded-full border border-red-400/40 px-2.5 py-1 text-[11px] text-red-300 transition hover:bg-red-400/10"
                            >
                              🗑
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {!juditoError && juditoUsers && juditoUsers.length === 0 && (
            <p className="py-12 text-center text-judo-fog/50">
              Todavía no hay cuentas creadas en JuditoADS.
            </p>
          )}
        </section>
      )}

      {/* ── JUDIMENTAL: quién se registró y cómo va ── */}
      {tab === "judimental" && (
        <section className="mt-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">JudiMental</h2>
              <p className="text-sm text-judo-fog/60">
                Quién está registrado y cómo va. Solo lectura: desde aquí no se
                toca nada de la app.
              </p>
            </div>
            <button
              onClick={cargarJudimental}
              disabled={mentalBusy}
              className="rounded-full border border-judo-lilac/25 px-4 py-1.5 text-xs font-semibold text-white transition hover:border-emerald-400/50 hover:text-emerald-300 disabled:opacity-50"
            >
              {mentalBusy ? "Cargando…" : "↻ Actualizar"}
            </button>
          </div>

          <p className="mb-4 rounded-xl border border-judo-lilac/20 bg-white/[0.03] px-4 py-3 text-xs text-judo-fog/60">
            🔒 Aquí llega el avance, nunca lo que la persona escribe dentro de la
            app. El contenido de una app de salud mental no sale de su base de
            datos.
          </p>

          {mentalError && (
            <p className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
              {mentalError}
            </p>
          )}

          {!mentalError && mental && (
            <>
              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {[
                  ["Registrados", mental.totales?.registrados ?? mental.personas?.length ?? 0],
                  ["Activos (7 días)", mental.totales?.activos7d ?? "—"],
                  ["Sesiones", mental.totales?.sesiones ?? "—"],
                ].map(([label, value]) => (
                  <div
                    key={String(label)}
                    className="rounded-xl border border-judo-lilac/20 bg-white/[0.03] px-4 py-3"
                  >
                    <p className="text-xs text-judo-fog/50">{label}</p>
                    <p className="text-2xl font-bold text-white">{value}</p>
                  </div>
                ))}
              </div>

              {(mental.personas ?? []).length === 0 ? (
                <p className="py-12 text-center text-judo-fog/50">
                  Todavía no hay nadie registrado en JudiMental.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-judo-lilac/20">
                  <table className="w-full min-w-[680px] text-left text-sm">
                    <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-judo-fog/50">
                      <tr>
                        <th className="px-4 py-3">Persona</th>
                        <th className="px-4 py-3">Progreso</th>
                        <th className="px-4 py-3">Racha</th>
                        <th className="px-4 py-3">Última vez</th>
                        <th className="px-4 py-3">Alta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-judo-lilac/10">
                      {(mental.personas ?? []).map((p) => (
                        <tr key={p.id}>
                          <td className="px-4 py-3">
                            <p className="font-semibold text-white">{p.nombre || p.email || p.id}</p>
                            {p.email && p.nombre && (
                              <p className="text-xs text-judo-fog/60">{p.email}</p>
                            )}
                            {p.plan && (
                              <span className="mt-1 inline-block rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-judo-fog/70">
                                {p.plan}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {typeof p.progreso?.porcentaje === "number" ? (
                              <div className="min-w-[130px]">
                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                                  <div
                                    className="h-full rounded-full bg-emerald-400"
                                    style={{
                                      width: `${Math.max(0, Math.min(100, p.progreso.porcentaje))}%`,
                                    }}
                                  />
                                </div>
                                <p className="mt-1 text-[11px] text-judo-fog/60">
                                  {p.progreso.etiqueta ?? `${p.progreso.porcentaje}%`}
                                </p>
                              </div>
                            ) : (
                              <span className="text-judo-fog/50">
                                {p.progreso?.etiqueta ?? "—"}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-white">
                            {typeof p.racha === "number" ? `${p.racha} días` : "—"}
                          </td>
                          <td className="px-4 py-3 text-judo-fog/60">
                            {p.ultimaActividad ? p.ultimaActividad.slice(0, 10) : "—"}
                          </td>
                          <td className="px-4 py-3 text-judo-fog/60">
                            {p.registradoEn ? p.registradoEn.slice(0, 10) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* ── INVITADOS: sillas gratis en las apps de la casa ── */}
      {tab === "invitados" && (
        <section className="mt-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Sillas de invitado</h2>
              <p className="text-sm text-judo-fog/60">
                Gente que entra sin pagar suscripción. La lista se guarda aquí y
                la orden se le manda a la app.
              </p>
            </div>
            <button
              onClick={cargarSillas}
              disabled={sillasBusy}
              className="rounded-full border border-judo-lilac/25 px-4 py-1.5 text-xs font-semibold text-white transition hover:border-emerald-400/50 hover:text-emerald-300 disabled:opacity-50"
            >
              {sillasBusy ? "Cargando…" : "↻ Actualizar"}
            </button>
          </div>

          {/* Dar una silla */}
          <div className="mb-5 rounded-xl border border-judo-lilac/20 bg-white/[0.03] p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-judo-fog/50">
              Dar acceso gratis
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <select
                value={sillaApp}
                onChange={(e) => setSillaApp(e.target.value as AppInvitado)}
                className={inputClass}
              >
                {APPS_INVITADO.map((a) => (
                  <option key={a.key} value={a.key} className="bg-judo-black">
                    {a.icono} {a.nombre}
                  </option>
                ))}
              </select>
              <input
                type="email"
                value={sillaEmail}
                onChange={(e) => setSillaEmail(e.target.value)}
                placeholder="correo de la persona"
                className={inputClass}
              />
              <input
                value={sillaNombre}
                onChange={(e) => setSillaNombre(e.target.value)}
                placeholder="nombre (opcional)"
                className={inputClass}
              />
              <input
                value={sillaNota}
                onChange={(e) => setSillaNota(e.target.value)}
                placeholder="por qué (obligatorio)"
                className={inputClass}
              />
              <input
                type="date"
                value={sillaExpira}
                onChange={(e) => setSillaExpira(e.target.value)}
                title="Hasta cuándo. Vacío = para siempre."
                className={inputClass}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                onClick={() => void otorgarSilla()}
                disabled={sillasBusy}
                className="rounded-full bg-emerald-400 px-5 py-2 text-xs font-bold text-judo-black transition hover:bg-emerald-300 disabled:opacity-50"
              >
                Dar la silla
              </button>
              <p className="text-xs text-judo-fog/50">
                Sin fecha, el acceso es para siempre. La app hermana es la que
                deja de cobrar.
              </p>
            </div>
          </div>

          {sillasError && (
            <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {sillasError}
            </p>
          )}

          {!sillasError && sillas && sillas.length === 0 && (
            <p className="py-12 text-center text-judo-fog/50">
              Todavía no hay invitados. Todo el mundo paga.
            </p>
          )}

          {!sillasError && sillas && sillas.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-judo-lilac/20">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-judo-fog/50">
                  <tr>
                    <th className="px-4 py-3">Persona</th>
                    <th className="px-4 py-3">App</th>
                    <th className="px-4 py-3">Motivo</th>
                    <th className="px-4 py-3">Hasta</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-judo-lilac/10">
                  {sillas.map((s) => (
                    <tr key={s.id} className="align-top">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-white">{s.name || s.email}</p>
                        {s.name && <p className="text-xs text-judo-fog/60">{s.email}</p>}
                        <p className="text-[11px] text-judo-fog/40">
                          desde {s.created_at.slice(0, 10)}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-white">{nombreApp(s.app)}</td>
                      <td className="px-4 py-3 text-judo-fog/70">{s.note || "—"}</td>
                      <td className="px-4 py-3 text-judo-fog/60">
                        {s.expires_at ? s.expires_at.slice(0, 10) : "sin fecha"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            s.status === "activa"
                              ? "bg-emerald-400 text-judo-black"
                              : s.status === "pendiente"
                                ? "bg-amber-400/90 text-judo-black"
                                : s.status === "error"
                                  ? "bg-red-500/90 text-white"
                                  : "bg-white/10 text-judo-fog/70"
                          }`}
                        >
                          {s.status}
                        </span>
                        {s.last_error && (
                          <p className="mt-1 max-w-[240px] text-[11px] text-amber-300/80">
                            {s.last_error}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {(s.status === "pendiente" || s.status === "error") && (
                            <button
                              onClick={() => void accionSilla(s, "reintentar")}
                              disabled={sillasBusy}
                              className="rounded-full border border-emerald-400/40 px-3 py-1 text-[11px] font-semibold text-emerald-300 transition hover:bg-emerald-400/10 disabled:opacity-50"
                            >
                              Reintentar
                            </button>
                          )}
                          {s.status === "activa" && (
                            <button
                              onClick={() => void accionSilla(s, "revocar")}
                              disabled={sillasBusy}
                              className="rounded-full border border-amber-400/40 px-3 py-1 text-[11px] font-semibold text-amber-300 transition hover:bg-amber-400/10 disabled:opacity-50"
                            >
                              Quitar
                            </button>
                          )}
                          <button
                            onClick={() => void accionSilla(s, "eliminar")}
                            disabled={sillasBusy}
                            title="Quitarle el acceso y borrar la fila"
                            className="rounded-full border border-red-400/40 px-2.5 py-1 text-[11px] text-red-300 transition hover:bg-red-400/10 disabled:opacity-50"
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ── DOCUMENTOS: contratos firmados que salen por correo ── */}
      {tab === "documentos" && (
        <section className="mt-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Documentos</h2>
              <p className="text-sm text-judo-fog/60">
                El contrato sale ya firmado por Judo Marketing, en PDF, al correo
                del cliente, con un enlace para que lo acepte. Su aceptación queda
                registrada con nombre, fecha, hora e IP.
              </p>
            </div>
            <button
              onClick={cargarDocumentos}
              disabled={documentosBusy}
              className="rounded-full border border-judo-lilac/25 px-4 py-1.5 text-xs font-semibold text-white transition hover:border-emerald-400/50 hover:text-emerald-300 disabled:opacity-50"
            >
              {documentosBusy ? "Cargando…" : "↻ Actualizar"}
            </button>
          </div>

          {/* Nuevo contrato */}
          <div className="mb-5 rounded-xl border border-judo-lilac/20 bg-white/[0.03] p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-judo-fog/50">
              Enviar un contrato
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <select
                value={docTipo}
                onChange={(e) => cambiarTipoDocumento(e.target.value as TipoDocumento)}
                className={inputClass}
              >
                {TIPOS_DOCUMENTO.map((t) => (
                  <option key={t} value={t} className="bg-judo-black">
                    {NOMBRE_TIPO[t]}
                  </option>
                ))}
              </select>
              {docTipo === "websites" ? (
                <select
                  value={docPlan}
                  onChange={(e) => {
                    setDocPlan(e.target.value);
                    const p = PLANES_CONTRATO.find((x) => x.etiqueta === e.target.value);
                    if (p) setDocPrecio(String(p.precio));
                  }}
                  className={inputClass}
                >
                  {PLANES_CONTRATO.map((p) => (
                    <option key={p.etiqueta} value={p.etiqueta} className="bg-judo-black">
                      {p.etiqueta} · ${p.precio}/mes
                    </option>
                  ))}
                  <option value="Otro" className="bg-judo-black">
                    Otro (precio a mano)
                  </option>
                </select>
              ) : (
                <input
                  value={docProyecto}
                  onChange={(e) => setDocProyecto(e.target.value)}
                  placeholder={docTipo === "juditos" ? "nombre del asistente (opcional)" : "negocio o cuenta (opcional)"}
                  className={inputClass}
                />
              )}
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-judo-fog/50">
                  $
                </span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={docPrecio}
                  onChange={(e) => setDocPrecio(e.target.value)}
                  placeholder="precio mensual"
                  className={`${inputClass} pl-8`}
                />
              </div>
              <input
                type="date"
                value={docInicio}
                onChange={(e) => setDocInicio(e.target.value)}
                title="Fecha de inicio del servicio"
                className={inputClass}
              />
              <input
                type="email"
                value={docEmail}
                onChange={(e) => setDocEmail(e.target.value)}
                placeholder="correo del cliente"
                className={inputClass}
              />
              <input
                value={docNombre}
                onChange={(e) => setDocNombre(e.target.value)}
                placeholder="nombre y apellido del cliente"
                className={inputClass}
              />
              <input
                value={docEmpresa}
                onChange={(e) => setDocEmpresa(e.target.value)}
                placeholder="empresa (opcional)"
                className={inputClass}
              />
              {docTipo === "websites" && (
                <input
                  value={docProyecto}
                  onChange={(e) => setDocProyecto(e.target.value)}
                  placeholder="dominio o proyecto (opcional)"
                  className={inputClass}
                />
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                onClick={() => void enviarDocumento()}
                disabled={documentosBusy}
                className="rounded-full bg-emerald-400 px-5 py-2 text-xs font-bold text-judo-black transition hover:bg-emerald-300 disabled:opacity-50"
              >
                {documentosBusy ? "Generando…" : "Generar, firmar y enviar"}
              </button>
              <p className="text-xs text-judo-fog/50">
                Se genera el PDF con estos datos, se firma por Judo Marketing y se
                manda al correo. Revísalos antes: el contrato sale con lo que diga aquí.
              </p>
            </div>
          </div>

          {documentosError && (
            <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {documentosError}
            </p>
          )}

          {!documentosError && documentos && documentos.length === 0 && (
            <p className="py-12 text-center text-judo-fog/50">
              Todavía no has enviado ningún contrato.
            </p>
          )}

          {!documentosError && documentos && documentos.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-judo-lilac/20">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-judo-fog/50">
                  <tr>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Contrato</th>
                    <th className="px-4 py-3">Precio</th>
                    <th className="px-4 py-3">Correo</th>
                    <th className="px-4 py-3">Aceptación</th>
                    <th className="px-4 py-3">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-judo-lilac/10">
                  {documentos.map((d) => (
                    <tr key={d.id} className="align-top">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-white">{d.recipient_name}</p>
                        {d.business_name && (
                          <p className="text-xs text-judo-fog/60">{d.business_name}</p>
                        )}
                        <p className="text-xs text-judo-fog/60">{d.recipient_email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-white">{NOMBRE_TIPO[d.kind]}</p>
                        <p className="text-xs text-judo-fog/60">
                          {[d.plan, d.project].filter(Boolean).join(" · ") || "—"}
                        </p>
                        <p className="text-[11px] text-judo-lilac">{d.code}</p>
                        <p className="text-[11px] text-judo-fog/40">
                          inicio {d.starts_on.slice(0, 10)} · creado {d.created_at.slice(0, 10)}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-white">${Number(d.monthly_price)}/mes</td>
                      <td className="px-4 py-3">
                        {d.sent_at ? (
                          <span className="whitespace-nowrap rounded-full bg-emerald-400 px-2 py-0.5 text-[11px] font-bold text-judo-black">
                            ✓ {fechaCorta(d.sent_at)}
                          </span>
                        ) : (
                          <span className="whitespace-nowrap rounded-full bg-red-500/90 px-2 py-0.5 text-[11px] font-bold text-white">
                            no salió
                          </span>
                        )}
                        {d.send_error && (
                          <p className="mt-1 max-w-[220px] text-[11px] text-amber-300/80">{d.send_error}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {d.accepted_at ? (
                          <>
                            <span className="rounded-full bg-emerald-400 px-2 py-0.5 text-[11px] font-bold text-judo-black">
                              ✓ aceptado
                            </span>
                            <p className="mt-1 text-[11px] text-judo-fog/60">
                              {d.accepted_name} · {d.accepted_at.slice(0, 10)}
                              {d.accepted_ip ? ` · IP ${d.accepted_ip}` : ""}
                            </p>
                          </>
                        ) : (
                          <span className="rounded-full bg-amber-400/90 px-2 py-0.5 text-[11px] font-bold text-judo-black">
                            pendiente
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => void descargarDocumento(d)}
                            className="rounded-full border border-judo-lilac/30 px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-white/[0.06]"
                          >
                            PDF
                          </button>
                          <button
                            onClick={() => void accionDocumento(d, "reenviar")}
                            disabled={documentosBusy}
                            className="rounded-full border border-emerald-400/40 px-3 py-1 text-[11px] font-semibold text-emerald-300 transition hover:bg-emerald-400/10 disabled:opacity-50"
                          >
                            Reenviar
                          </button>
                          {!d.accepted_at && (
                            <>
                              <button
                                onClick={() => void copiarEnlaceAceptacion(d)}
                                title="Copiar el enlace de aceptación para mandarlo por WhatsApp"
                                className="rounded-full border border-judo-lilac/30 px-3 py-1 text-[11px] text-judo-fog/80 transition hover:bg-white/[0.06]"
                              >
                                🔗 Enlace
                              </button>
                              <button
                                onClick={() => void accionDocumento(d, "eliminar")}
                                disabled={documentosBusy}
                                title="Borrar el contrato y su PDF"
                                className="rounded-full border border-red-400/40 px-2.5 py-1 text-[11px] text-red-300 transition hover:bg-red-400/10 disabled:opacity-50"
                              >
                                🗑
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {/* ── CONTRATOS DEL PROGRAMA ANTERIOR ─────────────────────────────
          Los que firmaron los vendedores en su teléfono. El programa se
          retiró; estos quedan aquí, debajo de los Documentos nuevos, hasta que
          cada uno tenga su website o se borre. Un contrato sin website no es
          papeleo: es una venta cerrada cuyo sitio todavía no existe. */}
      {tab === "documentos" && contractRows.length > 0 && (() => {
        const pendientes = contractRows.filter((c) => !c.site_id);
        const asignados = contractRows.filter((c) => c.site_id);

        const Ficha = ({ c }: { c: ContractRow }) => {
          const sitio = sites.find((s) => s.id === c.site_id);
          return (
            <div
              className={`rounded-2xl border bg-judo-surface p-5 ${
                c.site_id ? "border-judo-lilac/20" : "border-amber-400/45"
              }`}
            >
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {c.client_name}
                    {c.business_name && (
                      <span className="ml-2 text-sm font-normal text-judo-fog/50">
                        {c.business_name}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-judo-fog/50">
                    <span className="text-judo-lilac">{c.code}</span> · {c.plan} ·{" "}
                    <b className="text-judo-fog">
                      ${Number(c.monthly_price).toFixed(2)}/mes
                    </b>{" "}
                    · {new Date(c.created_at).toLocaleDateString("es-US")}
                  </p>
                  <p className="text-xs text-judo-fog/40">
                    {c.client_email}
                    {c.domain && ` · ${c.domain}`}
                  </p>
                </div>
                <button onClick={() => abrirContrato(c)} className={btnGhost}>
                  📄 Descargar PDF
                </button>
                <button
                  onClick={() => void borrarContrato(c)}
                  title="Borrar este contrato y su PDF"
                  className={btnDanger}
                >
                  🗑
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-judo-lilac/10 pt-3 text-xs text-judo-fog/50">
                <span>🌐 Website:</span>
                <select
                  value={c.site_id ?? ""}
                  onChange={(e) => void asignarContrato(c, e.target.value)}
                  className={`${fieldSm} max-w-[16rem]`}
                >
                  <option value="" className="bg-judo-surface">
                    Sin asignar (pendiente)
                  </option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id} className="bg-judo-surface">
                      {s.name}
                      {s.domain ? ` · ${s.domain}` : ""}
                    </option>
                  ))}
                </select>
                {sitio ? (
                  <button
                    onClick={() => irASitio(sitio.id)}
                    className="text-judo-lilac hover:underline"
                  >
                    abrir {sitio.name} →
                  </button>
                ) : (
                  <>
                    <span className="font-semibold text-amber-300">
                      pendiente: este cliente ya firmó y su website no existe
                    </span>
                    <button onClick={() => void sitioDesdeContrato(c)} className={btnPurple}>
                      ➕ Crear su website
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        };

        return (
          <div className="mt-10 flex flex-col gap-5 border-t border-judo-lilac/15 pt-6">
            <div>
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-judo-fog/45">
                Contratos del programa de vendedores (anterior) · {contractRows.length}
              </h2>
              <p className="mt-1 text-xs text-judo-fog/50">
                Firmados en el teléfono de un vendedor antes de retirar el programa.
                Los nuevos salen arriba, ya firmados por ti.
              </p>
            </div>

            {pendientes.length > 0 && (
              <div className="flex flex-col gap-3">
                <h3 className="font-semibold text-amber-300">
                  ⏳ Sin website ({pendientes.length})
                </h3>
                <p className="-mt-2 text-xs text-judo-fog/50">
                  Cada uno es una venta cerrada esperando su website. Asígnalo a
                  uno que ya exista, o créalo aquí mismo.
                </p>
                {pendientes.map((c) => (
                  <Ficha key={c.id} c={c} />
                ))}
              </div>
            )}

            {asignados.length > 0 && (
              <div className="flex flex-col gap-3">
                <h3 className="font-semibold">✓ Con website ({asignados.length})</h3>
                {asignados.map((c) => (
                  <Ficha key={c.id} c={c} />
                ))}
              </div>
            )}
          </div>
        );
      })()}


      {/* Editor de la lógica de un Judito, sobre el resto del panel */}
      {juditoAbierto && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setJuditoAbierto(null)}
        >
          <div
            className="my-8 w-full max-w-2xl rounded-2xl border border-judo-lilac/25 bg-judo-surface p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold">{juditoAbierto.nombre}</h3>
                <p className="text-sm text-judo-fog/55">
                  {juditoAbierto.cliente.name} · {juditoAbierto.modelo.replace("claude-", "")}
                </p>
              </div>
              <button
                onClick={() => setJuditoAbierto(null)}
                className="text-judo-fog/50 transition hover:text-judo-fog"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-judo-fog/80">Nombre</label>
                  <input
                    className={inputClass}
                    value={juditoAbierto.nombre}
                    onChange={(e) => setJuditoAbierto({ ...juditoAbierto, nombre: e.target.value })}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-judo-fog/80">Estado</label>
                  <select
                    className={inputClass}
                    value={juditoAbierto.estado}
                    onChange={(e) => setJuditoAbierto({ ...juditoAbierto, estado: e.target.value })}
                  >
                    <option value="DRAFT">Borrador (no responde)</option>
                    <option value="TRAINING">En pruebas (solo el simulador)</option>
                    <option value="LIVE">En vivo (responde a clientes)</option>
                    <option value="PAUSED">En pausa</option>
                  </select>
                </div>
              </div>

              {([
                ["negocio", "El negocio", 6],
                ["tono", "Tono", 2],
                ["reglas", "Reglas obligatorias", 5],
              ] as const).map(([campo, etiqueta, filas]) => (
                <div key={campo}>
                  <label className="mb-1 block text-sm font-medium text-judo-fog/80">{etiqueta}</label>
                  <textarea
                    rows={filas}
                    className={`${inputClass} font-mono text-[13px] leading-relaxed`}
                    value={juditoAbierto[campo]}
                    onChange={(e) => setJuditoAbierto({ ...juditoAbierto, [campo]: e.target.value })}
                  />
                </div>
              ))}

              <div>
                <label className="mb-1 block text-sm font-medium text-judo-fog/80">Saludo</label>
                <input
                  className={inputClass}
                  value={juditoAbierto.saludo}
                  onChange={(e) => setJuditoAbierto({ ...juditoAbierto, saludo: e.target.value })}
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-judo-fog/80">Qué puede hacer</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {([
                    ["mensajes", "Mensajes directos"],
                    ["comentarios", "Comentarios"],
                    ["pedidos", "Tomar pedidos"],
                    ["citas", "Agendar citas"],
                    ["escalar", "Pasar a humano"],
                    ["memoria", "Memoria (Pro)"],
                    ["correos", "Enviar correos (Pro)"],
                  ] as const).map(([clave, etiqueta]) => {
                    const soloPro = clave === "memoria" || clave === "correos";
                    return (
                      <label
                        key={clave}
                        className={`flex items-center gap-2 text-xs ${soloPro ? "opacity-60" : ""}`}
                        title={soloPro ? "Se activa con el plan Pro" : undefined}
                      >
                        <input
                          type="checkbox"
                          disabled={soloPro}
                          checked={Boolean(juditoAbierto.capacidades[clave])}
                          onChange={(e) =>
                            setJuditoAbierto({
                              ...juditoAbierto,
                              capacidades: {
                                ...juditoAbierto.capacidades,
                                [clave]: e.target.checked,
                              },
                            })
                          }
                          className="h-4 w-4 rounded border-judo-lilac/30"
                        />
                        {etiqueta}
                      </label>
                    );
                  })}
                </div>
              </div>

              {juditoAbierto.canales.length > 0 && (
                <p className="text-xs text-judo-fog/45">
                  Canales: {juditoAbierto.canales.map((c) => c.displayName).join(", ")}
                </p>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={guardarJudito}
                disabled={juditoGuardando}
                className="rounded-full bg-judo-purple px-5 py-2 text-sm font-semibold text-white transition hover:bg-judo-lilac disabled:opacity-50"
              >
                {juditoGuardando ? "Guardando…" : "Guardar cambios"}
              </button>
              <a
                href={`/juditos/clientes/${juditoAbierto.cliente.id}/cerebro`}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-judo-lilac/30 px-5 py-2 text-sm font-semibold text-judo-fog/75 transition hover:border-judo-lilac"
              >
                Abrir en Juditos ↗
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── AI ASSISTANTS: los Juditos de cada cliente ── */}
      {tab === "juditos" && (
        <section className="mt-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">AI Assistants</h2>
              <p className="text-sm text-judo-fog/60">
                El Judito de cada cliente: responde Messenger, Instagram y
                WhatsApp. Vive en otra base de datos, por eso se consulta aparte.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={cargarJuditos}
                disabled={juditosBusy}
                className="rounded-full border border-judo-lilac/25 px-4 py-1.5 text-xs font-semibold text-white transition hover:border-emerald-400/50 hover:text-emerald-300 disabled:opacity-50"
              >
                {juditosBusy ? "Cargando…" : "↻ Actualizar"}
              </button>
              <a
                href="/juditos/clientes"
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-judo-purple px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-judo-lilac"
              >
                Abrir el panel ↗
              </a>
            </div>
          </div>

          {juditosError && (
            <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {juditosError}
            </p>
          )}

          {!juditosError && juditos && (
            <>
              {(juditos.totales.solicitudesPendientes ?? 0) > 0 && (
                <a
                  href="/juditos/solicitudes"
                  target="_blank"
                  rel="noreferrer"
                  className="mb-4 block rounded-xl border border-judo-purple/40 bg-judo-purple/15 px-4 py-3 text-sm transition hover:border-judo-purple"
                >
                  <span className="font-semibold">
                    {juditos.totales.solicitudesPendientes} negocio(s) contrataron y están
                    esperando a que les montes su Judito.
                  </span>
                  <span className="mt-0.5 block text-xs text-judo-fog/60">
                    Ya rellenaron su cuestionario. Ábrelo para crearlos →
                  </span>
                </a>
              )}

              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                {(
                  [
                    ["Clientes", String(juditos.totales.clientes)],
                    ["Juditos en vivo", String(juditos.totales.juditosEnVivo)],
                    ["Mensajes hoy", String(juditos.totales.mensajesHoy)],
                    ["Esperando persona", String(juditos.totales.esperandoPersona)],
                    ["Coste del mes", juditos.totales.costeMes],
                  ] as [string, string][]
                ).map(([label, valor]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-judo-lilac/20 bg-judo-black/40 px-4 py-3"
                  >
                    <p className="text-[11px] uppercase tracking-wide text-judo-fog/45">
                      {label}
                    </p>
                    <p className="mt-1 text-xl font-bold text-judo-fog">{valor}</p>
                  </div>
                ))}
              </div>

              {juditos.clientes.length === 0 ? (
                <p className="rounded-xl border border-judo-lilac/20 bg-judo-black/40 px-4 py-8 text-center text-sm text-judo-fog/55">
                  Todavía no hay clientes con asistente. Créalos desde el panel.
                </p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-judo-lilac/20">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead>
                      <tr className="text-[11px] uppercase tracking-wide text-judo-fog/45">
                        <th className="px-4 py-2.5">Cliente</th>
                        <th className="px-4 py-2.5">Judito</th>
                        <th className="px-4 py-2.5">Canales</th>
                        <th className="px-4 py-2.5">Cerebro</th>
                        <th className="px-4 py-2.5 text-right">Hoy</th>
                        <th className="px-4 py-2.5 text-right">Mes</th>
                        <th className="px-4 py-2.5 text-right">Coste</th>
                      </tr>
                    </thead>
                    <tbody>
                      {juditos.clientes.map((c) => (
                        <tr key={c.id} className="border-t border-judo-lilac/10">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-judo-fog">{c.nombre}</p>
                            {c.esperandoPersona > 0 && (
                              <p className="mt-0.5 text-xs text-amber-300">
                                {c.esperandoPersona} esperando a una persona
                              </p>
                            )}
                            <button
                              onClick={() => facturar(c.id, c.nombre)}
                              disabled={juditosBusy}
                              className="mt-1.5 rounded-full border border-judo-lilac/30 px-3 py-0.5 text-[11px] font-semibold text-judo-fog/70 transition hover:border-emerald-400/60 hover:text-emerald-300 disabled:opacity-50"
                            >
                              Enviar factura
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            {c.juditos.length === 0 ? (
                              <span className="text-xs text-judo-fog/35">sin Judito</span>
                            ) : (
                              <div className="space-y-1.5">
                                {c.juditos.map((j) => (
                                  <button
                                    key={j.id}
                                    onClick={() => abrirJudito(j.id)}
                                    className="block w-full rounded-lg border border-judo-lilac/15 px-2.5 py-1.5 text-left transition hover:border-judo-lilac/50"
                                  >
                                    <span className="text-judo-fog/85">{j.nombre}</span>{" "}
                                    <span
                                      className={
                                        j.estado === "LIVE"
                                          ? "text-emerald-300"
                                          : "text-judo-fog/40"
                                      }
                                    >
                                      · {j.estado === "LIVE" ? "en vivo" : j.estado.toLowerCase()}
                                    </span>
                                    <span className="block text-[11px] text-judo-fog/40">
                                      {j.mensajesMes} mensajes este mes · {j.modelo.replace("claude-", "")}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-judo-fog/70">{c.canales}</td>
                          <td className="px-4 py-3 text-judo-fog/70">
                            {c.documentos} docs · {c.productos} prod.
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-judo-fog/80">
                            {c.mensajesHoy}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-judo-fog/80">
                            {c.mensajesMes}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-judo-fog/60">
                            {c.costeMes}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {tab === "resenas" && (
        <div className="mt-6 flex flex-col gap-3">
          {reviews.length === 0 && (
            <p className="text-sm text-judo-fog/50">
              Aún no hay reseñas enviadas por visitantes.
            </p>
          )}
          {reviews.map((r) => (
            <div key={r.id} className={`${box} flex flex-wrap items-center gap-3`}>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {r.name}{" "}
                  <span className="text-sm font-normal text-judo-fog/50">
                    · {r.place} · {new Date(r.created_at).toLocaleDateString("es-US")} ·{" "}
                    <b
                      className={
                        r.status === "aprobada"
                          ? "text-emerald-300"
                          : r.status === "rechazada"
                            ? "text-red-300"
                            : "text-amber-300"
                      }
                    >
                      {r.status}
                    </b>
                  </span>
                </p>
                <p className="mt-1 text-sm text-judo-fog/70">“{r.body}”</p>
              </div>
              {r.status !== "aprobada" && (
                <button
                  onClick={() => setReviewStatus(r.id, "aprobada")}
                  className={btnGreen}
                >
                  Publicar ✓
                </button>
              )}
              {r.status !== "rechazada" && (
                <button
                  onClick={() => setReviewStatus(r.id, "rechazada")}
                  className={btnDanger}
                >
                  {r.status === "aprobada" ? "Quitar" : "Rechazar"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── WEBSITES / CLIENTES ── */}
      {tab === "sitios" && (
        <div className="mt-6 flex flex-col gap-5">
          {/* Barra de acciones: crear y buscar, sin robarle sitio a la lista */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setAltaAbierta(!altaAbierta)}
              className={altaAbierta ? btnGhost : btnPurple}
            >
              {altaAbierta ? "Cancelar" : "➕ Nuevo website"}
            </button>
            {sites.length > 4 && (
              <input
                value={buscarSitio}
                onChange={(e) => setBuscarSitio(e.target.value)}
                placeholder="Buscar por nombre, dominio o cliente…"
                className={`${inputClass} min-w-[14rem] flex-1`}
              />
            )}
          </div>

          <form
            onSubmit={createSite}
            className={altaAbierta ? box : "hidden"}
            aria-hidden={!altaAbierta}
          >
            <h2 className="font-semibold">➕ Nuevo website</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <input required value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="Nombre del proyecto" className={inputClass} />
              <input value={siteDomain} onChange={(e) => setSiteDomain(e.target.value)} placeholder="Dominio (ej. cliente.com)" className={inputClass} />
              <input required value={siteClient} onChange={(e) => setSiteClient(e.target.value)} placeholder="Nombre del cliente" className={inputClass} />
              <input required type="number" min="0" value={sitePrice} onChange={(e) => setSitePrice(e.target.value)} placeholder="Precio mensual (USD)" className={inputClass} />
              <select
                value={siteStatus}
                onChange={(e) => setSiteStatus(e.target.value as "en_desarrollo" | "activo")}
                className={inputClass}
              >
                <option value="en_desarrollo" className="bg-judo-surface">En desarrollo</option>
                <option value="activo" className="bg-judo-surface">Ya está listo (activo)</option>
              </select>
              <label className="flex flex-col gap-1 text-xs text-judo-fog/60">
                Próximo pago
                <input type="date" value={siteDue} onChange={(e) => setSiteDue(e.target.value)} className={inputClass} />
              </label>
            </div>
            <button type="submit" className={`${btnPurple} mt-4`}>Crear website</button>
          </form>

          {/* La lista va plegada: una línea por website. Se abre el que se
              necesita y ahí aparece todo su expediente. */}
          <div className="flex flex-col gap-2">
            {sitiosFiltrados.length === 0 && (
              <p className="text-sm text-judo-fog/45">
                Ningún website coincide con “{buscarSitio}”.
              </p>
            )}
            {sitiosFiltrados.map((site) => {
              const abierto = sitioAbierto === site.id;
              const atencion = necesitaAtencion(site);
              const vencido =
                site.status === "activo" &&
                !!site.next_payment_due &&
                site.next_payment_due < hoy;
              return (
                <div
                  key={site.id}
                  className={`rounded-2xl border bg-judo-surface transition ${
                    abierto
                      ? "border-emerald-400/70 shadow-[0_0_20px_-6px_rgba(52,211,153,0.55)]"
                      : "border-judo-lilac/15"
                  }`}
                >
                  {/* La línea corta */}
                  <button
                    onClick={() => setSitioAbierto(abierto ? null : site.id)}
                    aria-expanded={abierto}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left"
                  >
                    <span
                      aria-hidden
                      title={site.status}
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                        site.status === "activo"
                          ? "bg-emerald-400"
                          : site.status === "deshabilitado"
                            ? "bg-red-400"
                            : "bg-amber-400"
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block truncate text-sm font-semibold ${
                          abierto ? "text-emerald-300" : "text-white"
                        }`}
                      >
                        {site.name}
                        {atencion && (
                          <span className="ml-2 text-[11px] font-bold text-amber-300">
                            {vencido ? "⏰ pago vencido" : "🔴 caído"}
                          </span>
                        )}
                      </span>
                      <span className="block truncate text-xs text-judo-fog/45">
                        {site.domain ?? "sin dominio"} ·{" "}
                        {site.clients?.full_name ?? "sin cliente"}
                        {intakePorSitio[site.id] && " · 📨 con formulario"}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-judo-fog/55">
                      ${site.monthly_price}/mes
                    </span>
                    <span
                      aria-hidden
                      className={`shrink-0 ${abierto ? "text-emerald-300" : "text-judo-lilac"}`}
                    >
                      {abierto ? "−" : "+"}
                    </span>
                  </button>

                  {/* Todo lo demás, solo del que está abierto */}
                  {abierto && (
                    <div className="border-t border-judo-lilac/10 px-4 pt-3 pb-4">
                      <p className="text-xs text-judo-fog/50">
                        {site.months_paid}/12 pagos ·{" "}
                        <b
                          className={
                            site.status === "activo"
                              ? "text-emerald-300"
                              : site.status === "deshabilitado"
                                ? "text-red-300"
                                : "text-amber-300"
                          }
                        >
                          {site.status}
                        </b>
                      </p>
                      {/* Telemetría del Judo Site Kit */}
                      <p className="text-xs text-judo-fog/50">
                        {metrics[site.id] ? (
                          <>
                            {metrics[site.id].is_live === false ? "🔴 caído" : "🟢 en vivo"} ·
                            último reporte{" "}
                            {new Date(metrics[site.id].reported_at).toLocaleString("es-US", {
                              dateStyle: "short",
                              timeStyle: "short",
                            })}{" "}
                            · ventas reportadas:{" "}
                            <b className="text-judo-fog">{metrics[site.id].salesTotal}</b>
                            {metrics[site.id].traffic != null && (
                              <> · tráfico: {metrics[site.id].traffic}</>
                            )}
                          </>
                        ) : (
                          "📡 sin telemetría aún (kit no conectado)"
                        )}
                      </p>
                      <GoogleSitio
                        site={site}
                        datos={google[site.id] ?? null}
                        robot={googleRobot}
                        ocupado={googleBusy}
                        onRefrescar={() => void refrescarGoogle(site.id)}
                      />
                      <SiteIdentidad site={site} onSaved={loadAll} flash={flash} />
                      {/* La clave lleva el valor guardado: al registrar un pago o
                          cambiar el precio, el campo se vuelve a montar con el dato
                          nuevo en vez de quedarse enseñando el viejo. */}
                      <SitePrice key={`p-${site.monthly_price}`} site={site} onGuardar={cambiarPrecio} />
                      <SiteDates
                        key={`f-${site.next_payment_due}-${site.domain_expires_at}`}
                        site={site}
                        onSaved={loadAll}
                        flash={flash}
                      />
                      <SitePortfolio site={site} onSaved={loadAll} flash={flash} />
                      <SiteDossier site={site} onSaved={loadAll} flash={flash} />

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={async () => {
                            await navigator.clipboard.writeText(site.kit_api_key);
                            flash(
                              "Clave del kit copiada ✓ (para conectar el website del cliente)"
                            );
                          }}
                          className={btnGhost}
                          title="Copiar la clave del Judo Site Kit"
                        >
                          🔑 Copiar clave del kit
                        </button>
                        <button onClick={() => registerPayment(site)} className={btnGhost}>
                          💵 Registrar pago
                        </button>
                        <button
                          onClick={() => toggleSite(site)}
                          className={
                            site.status === "deshabilitado" ? btnGreen : btnDanger
                          }
                        >
                          {site.status === "deshabilitado" ? "Reactivar" : "Deshabilitar"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Portafolio público: qué se muestra de este sitio en el website ──
// Estas cuatro listas tienen que decir lo mismo: aquí, en
// src/content/portfolio.ts, en src/lib/portfolio.ts y en el candado de la
// base (migración 0023). Si se agrega una categoría, se agrega en las cuatro.
const CATEGORIAS_PORTAFOLIO = [
  { id: "food", nombre: "Comida y restaurantes" },
  { id: "delivery", nombre: "Apps de delivery" },
  { id: "tiendas", nombre: "Tiendas online" },
  { id: "servicios", nombre: "Servicios" },
  { id: "fundaciones", nombre: "Fundaciones y ONG" },
  { id: "equipos", nombre: "Equipos e industria" },
  { id: "educacion", nombre: "Educación y cursos" },
  { id: "automotriz", nombre: "Automotriz" },
  { id: "construccion", nombre: "Construcción" },
];

function SitePortfolio({
  site,
  onSaved,
  flash,
}: {
  site: SiteRow;
  onSaved: () => void;
  flash: (m: string) => void;
}) {
  const supabase = getSupabase();
  const [abierto, setAbierto] = useState(false);
  const [visible, setVisible] = useState(site.portfolio_visible ?? true);
  const [categoria, setCategoria] = useState(site.portfolio_category ?? "");
  const [descEs, setDescEs] = useState(site.portfolio_desc_es ?? "");
  const [descEn, setDescEn] = useState(site.portfolio_desc_en ?? "");
  const [pidiendoFoto, setPidiendoFoto] = useState(false);

  /**
   * Manda a tomar la portada de nuevo.
   *
   * El servicio de capturas guarda cada foto un día contra la dirección exacta
   * que se le pidió, aunque haya salido en blanco. Cambiar esta fecha cambia
   * esa dirección, así que lo obliga a disparar otra vez.
   */
  const volverATomarPortada = async () => {
    setPidiendoFoto(true);
    const { error } = await supabase
      .from("sites")
      .update({ portfolio_shot_at: new Date().toISOString() })
      .select("id")
      .eq("id", site.id);
    setPidiendoFoto(false);
    if (error) {
      return flash(
        error.message.includes("portfolio_shot_at")
          ? "Falta la migración 0024 en la base. Córrela y vuelve a intentarlo."
          : `No se pudo: ${error.message}`
      );
    }
    flash("Portada pedida ✓ Tarda un par de minutos en aparecer");
    onSaved();
  };

  const guardar = async (cambios: Record<string, unknown>) => {
    const { error } = await supabase.from("sites").update(cambios).eq("id", site.id);
    if (error) {
      // Si la base rechaza el cambio, la pantalla vuelve a lo que hay guardado:
      // que no diga una cosa mientras la base guarda otra.
      setVisible(site.portfolio_visible ?? true);
      setCategoria(site.portfolio_category ?? "");
      return flash(
        error.message.includes("portfolio_category")
          ? "Esa categoría todavía no está permitida en la base. Corre la migración 0023 y vuelve a intentarlo."
          : `No se guardó: ${error.message}`
      );
    }
    flash("Portafolio actualizado ✓");
    onSaved();
  };

  // Sale publicado si está visible y no está apagado. Los que están en
  // desarrollo también aparecen, marcados como vista previa.
  const publicado = visible && site.status !== "deshabilitado";

  return (
    <div className="mt-1.5 text-xs text-judo-fog/50">
      <div className="flex flex-wrap items-center gap-2">
        <span>🖼️ Portafolio:</span>
        <button
          onClick={() => {
            const nuevo = !visible;
            setVisible(nuevo);
            void guardar({ portfolio_visible: nuevo });
          }}
          className={
            publicado
              ? "rounded-full bg-emerald-500/80 px-2 py-0.5 text-[11px] font-semibold text-white"
              : "rounded-full border border-judo-lilac/30 px-2 py-0.5 text-[11px] text-judo-fog/60"
          }
        >
          {publicado
            ? site.status === "activo"
              ? "publicado"
              : "publicado (vista previa)"
            : visible
              ? "listo (sitio apagado)"
              : "oculto"}
        </button>
        <button
          onClick={() => setAbierto(!abierto)}
          className="text-judo-lilac hover:underline"
        >
          {abierto ? "cerrar" : "editar"}
        </button>
      </div>

      {abierto && (
        <div className="mt-2 flex flex-col gap-2">
          <select
            value={categoria}
            onChange={(e) => {
              setCategoria(e.target.value);
              void guardar({ portfolio_category: e.target.value || null });
            }}
            className="rounded-lg border border-judo-lilac/25 bg-judo-black/60 px-2 py-1 text-xs text-judo-fog outline-none focus:border-judo-lilac"
          >
            <option value="" className="bg-judo-surface">Sin categoría</option>
            {CATEGORIAS_PORTAFOLIO.map((c) => (
              <option key={c.id} value={c.id} className="bg-judo-surface">
                {c.nombre}
              </option>
            ))}
          </select>
          <textarea
            rows={2}
            maxLength={220}
            value={descEs}
            onChange={(e) => setDescEs(e.target.value)}
            onBlur={() => guardar({ portfolio_desc_es: descEs.trim() || null })}
            placeholder="Descripción en español (qué hace este website)"
            className="resize-none rounded-lg border border-judo-lilac/25 bg-judo-black/60 px-2 py-1 text-xs text-judo-fog outline-none focus:border-judo-lilac"
          />
          <textarea
            rows={2}
            maxLength={220}
            value={descEn}
            onChange={(e) => setDescEn(e.target.value)}
            onBlur={() => guardar({ portfolio_desc_en: descEn.trim() || null })}
            placeholder="Description in English (opcional, si no se usa la de arriba)"
            className="resize-none rounded-lg border border-judo-lilac/25 bg-judo-black/60 px-2 py-1 text-xs text-judo-fog outline-none focus:border-judo-lilac"
          />
          <input
            defaultValue={site.portfolio_image ?? ""}
            onBlur={async (e) => {
              const valor = e.target.value.trim() || null;
              const { error } = await supabase
                .from("sites")
                .update({ portfolio_image: valor })
                .eq("id", site.id);
              if (error) return flash(`Error: ${error.message}`);
              flash("Imagen del portafolio actualizada ✓");
              onSaved();
            }}
            placeholder="Imagen propia (opcional): /portfolio/algo.jpg o una dirección"
            className="rounded-lg border border-judo-lilac/25 bg-judo-black/60 px-2 py-1 text-xs text-judo-fog outline-none focus:border-judo-lilac"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => void volverATomarPortada()}
              disabled={pidiendoFoto || Boolean(site.portfolio_image?.trim())}
              title={
                site.portfolio_image?.trim()
                  ? "Este website usa una imagen propia, no una captura"
                  : "Toma la captura del home otra vez"
              }
              className={`${btnGhost} disabled:opacity-40`}
            >
              {pidiendoFoto ? "Pidiendo…" : "🔄 Actualizar portada"}
            </button>
            {site.portfolio_shot_at && (
              <span className="text-[11px] text-judo-fog/35">
                última: {new Date(site.portfolio_shot_at).toLocaleString("es-US")}
              </span>
            )}
          </div>
          <p className="text-[11px] text-judo-fog/35">
            Si dejas la imagen vacía se usa una captura del home, que se genera
            sola. Si esa captura no luce bien, pon aquí una imagen propia y esa
            manda. El portafolio se refresca a los pocos minutos.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Google: lo que el buscador y Analytics saben de este website ────
// Los últimos 28 días contra los 28 anteriores. Si falta algo (la llave del
// robot, el acceso a la propiedad, la propiedad misma), lo dice aquí en
// palabras y con el correo del robot a mano para copiarlo.
function GoogleSitio({
  site,
  datos,
  robot,
  ocupado,
  onRefrescar,
}: {
  site: SiteRow;
  datos: GoogleDeSitio | null;
  robot: string | null;
  ocupado: boolean;
  onRefrescar: () => void;
}) {
  const conectado = Boolean(site.gsc_property || site.ga4_property_id);
  const g = datos?.gsc ?? null;
  const a = datos?.ga4 ?? null;

  const Numero = ({ etiqueta, valor, antes }: { etiqueta: string; valor: string | number; antes?: number }) => {
    const t = antes != null && typeof valor === "number" ? tendencia(valor, antes) : null;
    return (
      <div>
        <p className="text-[10px] uppercase tracking-wide text-judo-fog/40">{etiqueta}</p>
        <p className="text-base font-bold tabular-nums text-white">
          {valor} {t && <span className={`text-[11px] font-normal ${t.clase}`}>{t.texto}</span>}
        </p>
      </div>
    );
  };

  return (
    <div className="mt-2 rounded-xl border border-judo-lilac/15 bg-judo-black/30 p-3 text-xs text-judo-fog/60">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-judo-fog/80">🔍 Google · últimos 28 días</span>
        {g && (
          <span className="text-[11px] text-judo-fog/40">
            {g.desde.slice(5)} → {g.hasta.slice(5)}
          </span>
        )}
        <button
          onClick={onRefrescar}
          disabled={ocupado}
          className="ml-auto text-judo-lilac hover:underline disabled:opacity-50"
          title="Pedirle a Google los datos frescos"
        >
          {ocupado ? "…" : "↻ actualizar"}
        </button>
      </div>

      {!conectado && (
        <p className="mt-2 text-[11px] text-judo-fog/45">
          Sin conectar. Pon la propiedad de Search Console y el ID de Analytics en
          <b> Expediente → 📊 Medición</b>. Los pasos están en <code>docs/google-conexion.md</code>.
        </p>
      )}

      {conectado && !datos && (
        <p className="mt-2 text-[11px] text-judo-fog/45">{ocupado ? "Pidiendo a Google…" : "Sin datos todavía."}</p>
      )}

      {(g || a) && (
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          {g && (
            <div>
              <p className="mb-1.5 text-[11px] font-semibold text-judo-fog/70">Buscador (Search Console)</p>
              <div className="grid grid-cols-4 gap-2">
                <Numero etiqueta="Clics" valor={g.clics} antes={g.clicsAntes} />
                <Numero etiqueta="Impresiones" valor={g.impresiones} antes={g.impresionesAntes} />
                <Numero etiqueta="CTR" valor={`${(g.ctr * 100).toFixed(1)} %`} />
                <Numero etiqueta="Posición" valor={g.posicion.toFixed(1)} />
              </div>
              {g.consultas.length > 0 && (
                <ul className="mt-2 space-y-0.5">
                  {g.consultas.map((c) => (
                    <li key={c.consulta} className="flex justify-between gap-2">
                      <span className="truncate text-judo-fog/75">“{c.consulta}”</span>
                      <span className="shrink-0 tabular-nums text-judo-fog/45">
                        {c.clics} clics · pos. {c.posicion}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
          {a && (
            <div>
              <p className="mb-1.5 text-[11px] font-semibold text-judo-fog/70">Visitas (Analytics)</p>
              <div className="grid grid-cols-3 gap-2">
                <Numero etiqueta="Usuarios" valor={a.usuarios} antes={a.usuariosAntes} />
                <Numero etiqueta="Sesiones" valor={a.sesiones} antes={a.sesionesAntes} />
                <Numero etiqueta="Páginas vistas" valor={a.vistas} />
              </div>
              {a.paginas.length > 0 && (
                <ul className="mt-2 space-y-0.5">
                  {a.paginas.map((p) => (
                    <li key={p.ruta} className="flex justify-between gap-2">
                      <span className="truncate text-judo-fog/75">{p.ruta}</span>
                      <span className="shrink-0 tabular-nums text-judo-fog/45">{p.vistas} vistas</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {datos && datos.faltas.length > 0 && (
        <div className="mt-2 space-y-0.5">
          {datos.faltas.map((f) => (
            <p key={f} className="text-[11px] text-amber-300/85">⚠ {f}</p>
          ))}
          {robot && datos.faltas.some((f) => /no deja entrar/.test(f)) && (
            <p className="text-[11px] text-judo-fog/50">
              Correo del robot para darle acceso:{" "}
              <button
                onClick={() => void navigator.clipboard.writeText(robot)}
                className="text-judo-lilac hover:underline"
                title="Copiar"
              >
                {robot}
              </button>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Lo básico del website, editable ────────────────────────────────
// Nombre, dominio, cliente y estado. Un dominio cambia (se compra el bueno,
// se pasa de la vista previa de Vercel al real) y un nombre se escribe mal el
// día del alta: no tiene sentido que queden congelados.
const ESTADOS_SITIO = [
  { id: "en_desarrollo", nombre: "En desarrollo" },
  { id: "activo", nombre: "Activo" },
  { id: "deshabilitado", nombre: "Deshabilitado (apagado)" },
];

function SiteIdentidad({
  site,
  onSaved,
  flash,
}: {
  site: SiteRow;
  onSaved: () => void;
  flash: (m: string) => void;
}) {
  const supabase = getSupabase();
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState(site.name);
  const [dominio, setDominio] = useState(site.domain ?? "");
  const [cliente, setCliente] = useState(site.clients?.full_name ?? "");
  const [empresa, setEmpresa] = useState(site.clients?.business_name ?? "");
  const [guardando, setGuardando] = useState(false);

  const cambio =
    nombre.trim() !== site.name ||
    dominio.trim() !== (site.domain ?? "") ||
    cliente.trim() !== (site.clients?.full_name ?? "") ||
    empresa.trim() !== (site.clients?.business_name ?? "");

  const guardar = async () => {
    if (nombre.trim().length < 2) return flash("El nombre no puede quedar vacío");
    setGuardando(true);
    try {
      // El dominio se guarda limpio: sin https:// ni barra final, que es como
      // lo espera el showcase para armar la captura.
      const limpio = dominio.trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");
      const { error } = await supabase
        .from("sites")
        .update({ name: nombre.trim(), domain: limpio || null })
        .select("id")
        .eq("id", site.id);
      if (error) return flash(`Error: ${error.message}`);

      if (site.client_id && (cliente.trim() || empresa.trim())) {
        const { error: cErr } = await supabase
          .from("clients")
          .update({
            full_name: cliente.trim() || site.clients?.full_name || "",
            business_name: empresa.trim() || null,
          })
          .eq("id", site.client_id);
        if (cErr) return flash(`Website guardado, pero el cliente no: ${cErr.message}`);
      }
      setDominio(limpio);
      flash("Datos del website actualizados ✓");
      onSaved();
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async (estado: string) => {
    if (
      estado === "deshabilitado" &&
      !window.confirm(`¿Apagar ${site.name}? Sus visitantes verán la página de suspensión.`)
    )
      return;
    const { error } = await supabase
      .from("sites")
      .update({ status: estado })
      .eq("id", site.id);
    if (error) return flash(`Error: ${error.message}`);
    // Apagar o encender un website queda en la auditoría, venga del botón o de aquí
    if (estado === "deshabilitado" || site.status === "deshabilitado") {
      await supabase.from("audit_log").insert({
        actor: (await supabase.auth.getUser()).data.user?.id,
        action: estado === "deshabilitado" ? "site_disabled" : "site_enabled",
        target: site.name,
      });
    }
    flash(`Estado: ${ESTADOS_SITIO.find((e) => e.id === estado)?.nombre} ✓`);
    onSaved();
  };

  return (
    <div className="mt-2 text-xs text-judo-fog/50">
      <div className="flex flex-wrap items-center gap-2">
        <span>✏️ Datos del website:</span>
        <button
          onClick={() => setAbierto(!abierto)}
          className={abierto ? "text-emerald-300 hover:underline" : "text-judo-lilac hover:underline"}
        >
          {abierto ? "cerrar" : "editar nombre, dominio, cliente y estado"}
        </button>
      </div>

      {abierto && (
        <div className="mt-2 grid gap-2 rounded-xl border border-judo-lilac/20 bg-judo-black/40 p-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-[11px]">
            Nombre del website
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={fieldSm} />
          </label>
          <label className="flex flex-col gap-1 text-[11px]">
            Dominio (o vista previa de Vercel)
            <input
              value={dominio}
              onChange={(e) => setDominio(e.target.value)}
              placeholder="cliente.com"
              className={fieldSm}
            />
          </label>
          <label className="flex flex-col gap-1 text-[11px]">
            Cliente
            <input
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              disabled={!site.client_id}
              placeholder={site.client_id ? "" : "este website no tiene cliente"}
              className={`${fieldSm} disabled:opacity-40`}
            />
          </label>
          <label className="flex flex-col gap-1 text-[11px]">
            Empresa del cliente
            <input
              value={empresa}
              onChange={(e) => setEmpresa(e.target.value)}
              disabled={!site.client_id}
              className={`${fieldSm} disabled:opacity-40`}
            />
          </label>

          <label className="flex flex-col gap-1 text-[11px]">
            Estado
            <select
              value={site.status}
              onChange={(e) => void cambiarEstado(e.target.value)}
              className={fieldSm}
            >
              {ESTADOS_SITIO.map((e) => (
                <option key={e.id} value={e.id} className="bg-judo-surface">
                  {e.nombre}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            {cambio && (
              <button onClick={guardar} disabled={guardando} className={btnPurple}>
                {guardando ? "Guardando…" : "Guardar cambios"}
              </button>
            )}
          </div>

          <p className="text-[11px] text-judo-fog/35 sm:col-span-2">
            Si cambias el dominio, la captura del showcase se rehace sola con el
            nuevo. El estado se guarda al instante; lo demás, con el botón.
          </p>
        </div>
      )}
    </div>
  );
}

// ── Lo que el cliente paga al mes, editable ────────────────────────
// Cambia cuando el cliente amplía su servicio. Solo se guarda si de verdad
// cambió, para no llenar la bitácora de notas repetidas.
function SitePrice({
  site,
  onGuardar,
}: {
  site: SiteRow;
  onGuardar: (site: SiteRow, nuevo: number) => void;
}) {
  const [valor, setValor] = useState(String(site.monthly_price));
  const nuevo = Number(valor);
  const cambio =
    valor !== "" && Number.isFinite(nuevo) && nuevo >= 0 && nuevo !== Number(site.monthly_price);

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-judo-fog/50">
      <label className="flex items-center gap-1">
        💲 Paga al mes: $
        <input
          type="number"
          min="0"
          step="1"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          className="w-24 rounded-lg border border-judo-lilac/25 bg-judo-black/60 px-2 py-1 text-xs text-judo-fog outline-none focus:border-judo-lilac"
        />
      </label>
      {cambio && (
        <button onClick={() => onGuardar(site, nuevo)} className={btnPurple}>
          Guardar
        </button>
      )}
    </div>
  );
}

// ── Fechas editables del sitio (próximo pago y expiración de dominio) ──
function SiteDates({
  site,
  onSaved,
  flash,
}: {
  site: SiteRow;
  onSaved: () => void;
  flash: (m: string) => void;
}) {
  const supabase = getSupabase();
  const [due, setDue] = useState(site.next_payment_due ?? "");
  const [domainExp, setDomainExp] = useState(site.domain_expires_at ?? "");
  const dirty = due !== (site.next_payment_due ?? "") || domainExp !== (site.domain_expires_at ?? "");

  const save = async () => {
    const { error } = await supabase
      .from("sites")
      .update({
        next_payment_due: due || null,
        domain_expires_at: domainExp || null,
      })
      .eq("id", site.id);
    if (error) return flash(`Error: ${error.message}`);
    flash("Fechas actualizadas ✓");
    onSaved();
  };

  const dateClass =
    "rounded-lg border border-judo-lilac/25 bg-judo-black/60 px-2 py-1 text-xs text-judo-fog outline-none focus:border-judo-lilac";

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-judo-fog/50">
      <label className="flex items-center gap-1">
        💵 Próximo cobro:
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={dateClass} />
      </label>
      <label className="flex items-center gap-1">
        🌐 Dominio expira:
        <input type="date" value={domainExp} onChange={(e) => setDomainExp(e.target.value)} className={dateClass} />
      </label>
      {dirty && (
        <button onClick={save} className={btnPurple}>
          Guardar
        </button>
      )}
    </div>
  );
}
