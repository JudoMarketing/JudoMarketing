"use client";

/**
 * Portal de Administración (/es/admin) — MVP Fase 4.
 * Solo para la cuenta con role='admin' (admin@judomarketing.net).
 * Texto en español: el admin es el dueño.
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { getSupabase } from "@/lib/supabase";
import SiteDossier from "./SiteDossier";
import IntakeInbox from "./IntakeInbox";
import { inputClass } from "./AuthForms";
import { precio } from "@/lib/pricing";

/**
 * Las pestañas van en el orden en que pasan las cosas de verdad:
 * llega un formulario → se abre el website → se cobra → se reparte al equipo
 * → se cuida la reputación. El Resumen manda al frente.
 */
type Tab =
  | "resumen"
  | "formularios"
  | "contratos"
  | "sitios"
  | "pagos"
  | "vendedores"
  | "visitas"
  | "resenas";

type VisitRow = {
  id: string;
  seller_id: string;
  prospect_name: string;
  company_name: string | null;
  visited_on: string;
  visit_time: string | null;
};

type ContractRow = {
  id: string;
  seller_id: string;
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
  sites: { seller_id: string | null } | null;
};

type SellerRow = {
  id: string;
  status: string;
  referral_code: string | null;
  commission_kind: string | null;
  commission_value: number | null;
  created_at: string;
  profiles: {
    full_name: string;
    photo_url: string | null;
    phone: string | null;
    photo_change_requested: boolean | null;
  };
};

type ProofRow = {
  id: string;
  plan: string;
  method: string | null;
  tx_hash: string | null;
  payer_name: string;
  referral_code: string | null;
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
  seller_id: string | null;
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

type CommissionRow = {
  id: string;
  seller_id: string;
  amount: number;
  status: string;
  period: string | null;
  created_at: string;
  sellers: { profiles: { full_name: string } | null } | null;
  sites: { name: string } | null;
};

type ReviewModRow = {
  id: string;
  name: string;
  place: string;
  body: string;
  status: string;
  created_at: string;
};

type BonusRow = {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  referrer: { profiles: { full_name: string } | null } | null;
  referred: { profiles: { full_name: string } | null } | null;
  sites: { name: string } | null;
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
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [denied, setDenied] = useState(false);
  const [tab, setTab] = useState<Tab>("resumen");

  const [sellers, setSellers] = useState<SellerRow[]>([]);
  const [proofs, setProofs] = useState<ProofRow[]>([]);
  const [sites, setSites] = useState<SiteRow[]>([]);
  const [commissions, setCommissions] = useState<CommissionRow[]>([]);
  const [bonuses, setBonuses] = useState<BonusRow[]>([]);
  const [reviews, setReviews] = useState<ReviewModRow[]>([]);
  const [visitRows, setVisitRows] = useState<VisitRow[]>([]);
  const [contractRows, setContractRows] = useState<ContractRow[]>([]);
  const [visitFilter, setVisitFilter] = useState("");
  const [visitaEditada, setVisitaEditada] = useState<string | null>(null);
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
  const [siteSeller, setSiteSeller] = useState("");
  const [siteDue, setSiteDue] = useState("");
  // Un website que ya está publicado entra directo como activo
  const [siteStatus, setSiteStatus] = useState<"en_desarrollo" | "activo">(
    "en_desarrollo"
  );

  const loadAll = useCallback(async () => {
    const [selRes, proofRes, siteRes, metricsRes, finRes, accRes, comRes, bonusRes, visitRes, contractRes, payRes, revRes, intakeRes] = await Promise.all([
      // profiles va desambiguado: sellers tiene dos caminos a profiles
      // (el perfil propio y el de quien aprobó) y sin esto la base rechaza
      // la consulta entera y las aplicaciones no se ven
      supabase
        .from("sellers")
        .select(
          "id,status,referral_code,commission_kind,commission_value,created_at,profiles!sellers_id_fkey(full_name,photo_url,phone,photo_change_requested)"
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("payment_proofs")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("sites")
        .select(
          "id,name,domain,status,monthly_price,months_paid,next_payment_due,seller_id,kit_api_key,domain_expires_at,portfolio_visible,portfolio_category,portfolio_desc_es,portfolio_desc_en,portfolio_image,portfolio_shot_at,client_id,currency,billing_day,payment_method,grace_days,timezone,repo_url,vercel_project,registrar,domain_holder,dns_provider,email_provider,db_provider,ga4_property_id,gsc_property,gbp_location,meta_pixel_id,meta_page,notes,clients(full_name,business_name)"
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
        .from("commissions")
        .select(
          "id,seller_id,amount,status,period,created_at,sellers(profiles!sellers_id_fkey(full_name)),sites(name)"
        )
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("referral_bonuses")
        .select(
          "id,amount,status,created_at,referrer:sellers!referral_bonuses_referrer_id_fkey(profiles!sellers_id_fkey(full_name)),referred:sellers!referral_bonuses_referred_id_fkey(profiles!sellers_id_fkey(full_name)),sites(name)"
        )
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("visits")
        .select("id,seller_id,prospect_name,company_name,visited_on,visit_time")
        .order("visited_on", { ascending: false })
        .limit(2000),
      supabase
        .from("signed_contracts")
        .select(
          "id,seller_id,client_name,business_name,client_email,plan,monthly_price,domain,pdf_path,code,site_id,created_at"
        )
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("payments")
        .select("amount,paid_at,sites(seller_id)")
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
    setSellers((selRes.data as unknown as SellerRow[]) ?? []);
    setProofs((proofRes.data as ProofRow[]) ?? []);
    setSites((siteRes.data as unknown as SiteRow[]) ?? []);
    setCommissions((comRes.data as unknown as CommissionRow[]) ?? []);
    setBonuses((bonusRes.data as unknown as BonusRow[]) ?? []);
    setReviews((revRes.data as ReviewModRow[]) ?? []);
    setVisitRows((visitRes.data as VisitRow[]) ?? []);
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
        router.replace("/login");
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
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const flash = (text: string) => {
    setMsg(text);
    setTimeout(() => setMsg(""), 3000);
  };

  // ── Vendedores ─────────────────────────────────────────────────────
  const saveSeller = async (
    id: string,
    status: string,
    kind: string | null,
    value: string
  ) => {
    // Cómo estaba antes: es lo que decide qué aviso corresponde. Sin esto,
    // guardar un cambio de comisión mandaba el correo de bienvenida otra vez.
    const antes = sellers.find((s) => s.id === id);
    const estadoAntes = antes?.status;
    const valorAntes = antes?.commission_value ?? null;
    const tipoAntes = antes?.commission_kind ?? null;
    const valorNuevo = value ? Number(value) : null;
    const tipoNuevo = kind || null;

    const { error } = await supabase
      .from("sellers")
      .update({
        status,
        commission_kind: tipoNuevo,
        commission_value: valorNuevo,
        approved_at: status === "aprobado" ? new Date().toISOString() : null,
      })
      .eq("id", id);
    if (error) return flash(`Error: ${error.message}`);

    const cambioEstado = estadoAntes !== status;
    const cambioComision = tipoAntes !== tipoNuevo || valorAntes !== valorNuevo;

    /**
     * Qué aviso le toca:
     *  · entró al equipo (de pendiente o rechazado a aprobado) → bienvenida
     *  · volvió (de suspendido a aprobado) o lo suspendieron → aviso de estado
     *  · solo le cambió el trato → aviso de comisión
     * Y si nada cambió, no se manda nada.
     */
    let aviso: Record<string, unknown> | null = null;
    if (status === "aprobado" && cambioEstado && estadoAntes !== "suspendido") {
      aviso = { type: "approved" };
    } else if (cambioEstado) {
      aviso = { type: "seller_status", status, previousStatus: estadoAntes };
    } else if (cambioComision) {
      aviso = {
        type: "commission",
        kind: tipoNuevo,
        value: valorNuevo,
        previousKind: tipoAntes,
        previousValue: valorAntes,
      };
    }

    if (!aviso) {
      flash("Vendedor actualizado ✓ (sin cambios que avisar)");
      void loadAll();
      return;
    }

    let resultado = "sin correo del vendedor";
    try {
      const [{ data: sess }, { data: prof }] = await Promise.all([
        supabase.auth.getSession(),
        supabase.from("profiles").select("email, full_name").eq("id", id).single(),
      ]);
      if (sess.session && prof?.email) {
        const res = await fetch("/api/notify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sess.session.access_token}`,
          },
          body: JSON.stringify({ ...aviso, email: prof.email, name: prof.full_name }),
        });
        const data = (await res.json()) as { sent?: boolean; reason?: string };
        resultado = data.sent
          ? `avisado ${prof.full_name}`
          : data.reason === "smtp_not_configured"
            ? "correo no configurado, no se avisó"
            : "no se pudo avisar";
      }
    } catch {
      resultado = "no se pudo avisar";
    }
    flash(`Vendedor actualizado ✓ — ${resultado}`);
    void loadAll();
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
    const { error } = await supabase
      .from("payment_proofs")
      .update({ status })
      .eq("id", id);
    if (error) return flash(`Error: ${error.message}`);
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
      seller_id: siteSeller || null,
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
    const { error } = await supabase
      .from("sites")
      .update({ status: next })
      .eq("id", site.id);
    if (error) return flash(`Error: ${error.message}`);
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
    const base = site.next_payment_due ? new Date(site.next_payment_due) : new Date();
    base.setMonth(base.getMonth() + 1);
    await supabase
      .from("sites")
      .update({
        months_paid: site.months_paid + 1,
        next_payment_due: base.toISOString().slice(0, 10),
      })
      .eq("id", site.id);
    flash(`Pago de $${site.monthly_price} registrado ✓`);
    void loadAll();
  };

  const requestPhotoChange = async (id: string, name: string) => {
    const { error } = await supabase.rpc("request_photo_change", { target: id });
    if (error) return flash(`Error: ${error.message}`);
    flash(`Le pediste una foto nueva a ${name}. Podrá subirla desde su portal ✓`);
    void loadAll();
  };

  const deleteSeller = async (id: string, name: string) => {
    if (
      !window.confirm(
        `¿Eliminar por completo a ${name}? Su cuenta se borra (no se puede deshacer) y todo su historial (comisiones, bonos, websites asignados, visitas y contratos) pasa automáticamente a tu cuenta juniorosorio36@gmail.com.`
      )
    )
      return;
    const { data: sess } = await supabase.auth.getSession();
    const res = await fetch("/api/admin/delete-seller", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${sess.session?.access_token}`,
      },
      body: JSON.stringify({ userId: id }),
    });
    const data = (await res.json()) as { deleted?: boolean; error?: string };
    if (data.deleted) {
      flash(`${name} eliminado ✓ Su historial pasó a juniorosorio36@gmail.com`);
      void loadAll();
      return;
    }
    if (data.error === "cannot_delete_fallback") {
      flash("Esa es tu cuenta de la casa (recibe los traspasos), no se puede eliminar.");
    } else if (data.error === "not_configured") {
      flash("Falta la SUPABASE_SERVICE_ROLE_KEY en Vercel para poder eliminar cuentas.");
    } else {
      flash(`No se pudo eliminar: ${data.error ?? "error desconocido"}`);
    }
  };

  /**
   * Barre las aplicaciones que dejan los bots: las que nunca confirmaron su
   * correo, llevan más de un día así y no tienen nada a su nombre. Primero
   * muestra la lista; borrar es un segundo paso aparte.
   */
  const limpiarBots = async () => {
    const { data: sess } = await supabase.auth.getSession();
    if (!sess.session) return flash("Sesión vencida, vuelve a entrar");
    const llamar = async (soloContar: boolean) => {
      const res = await fetch("/api/admin/limpiar-bots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sess.session!.access_token}`,
        },
        body: JSON.stringify({ soloContar }),
      });
      return (await res.json()) as {
        candidatos?: { email: string; nombre: string; creada: string }[];
        borrados?: number;
        fallidos?: { email: string; motivo: string }[];
        error?: string;
        message?: string;
      };
    };

    flash("Buscando aplicaciones sin confirmar…");
    const previo = await llamar(true);
    if (previo.error) {
      return flash(
        previo.error === "not_configured"
          ? "Falta la SUPABASE_SERVICE_ROLE_KEY en Vercel."
          : `No se pudo revisar: ${previo.message ?? previo.error}`
      );
    }
    const lista = previo.candidatos ?? [];
    if (lista.length === 0) {
      return flash("No hay aplicaciones sin confirmar para borrar ✓");
    }
    const muestra = lista
      .slice(0, 12)
      .map((c) => `· ${c.nombre} — ${c.email}`)
      .join("\n");
    if (
      !window.confirm(
        `${lista.length} aplicaciones nunca confirmaron su correo, llevan más de un día así y no tienen ninguna actividad:\n\n${muestra}${
          lista.length > 12 ? `\n… y ${lista.length - 12} más` : ""
        }\n\n¿Las borro? No se puede deshacer.`
      )
    )
      return;

    flash(`Borrando ${lista.length}…`);
    const hecho = await llamar(false);
    if (hecho.error) return flash(`No se pudo borrar: ${hecho.message ?? hecho.error}`);
    const fallidos = hecho.fallidos?.length ?? 0;
    flash(
      fallidos
        ? `${hecho.borrados} borradas ✓ ${fallidos} se resistieron (mira la consola)`
        : `${hecho.borrados} aplicaciones de bots borradas ✓`
    );
    if (fallidos) console.error("No se pudieron borrar:", hecho.fallidos);
    void loadAll();
  };

  const markCommissionPaid = async (id: string) => {
    const { error } = await supabase
      .from("commissions")
      .update({ status: "pagada", paid_at: new Date().toISOString().slice(0, 10) })
      .eq("id", id);
    if (error) return flash(`Error: ${error.message}`);
    flash("Comisión marcada como pagada ✓");
    void loadAll();
  };

  const setReviewStatus = async (id: string, status: "aprobada" | "rechazada") => {
    const { error } = await supabase.from("reviews").update({ status }).eq("id", id);
    if (error) return flash(`Error: ${error.message}`);
    flash(status === "aprobada" ? "Reseña publicada ✓" : "Reseña rechazada");
    void loadAll();
  };

  const markBonusPaid = async (id: string) => {
    const { error } = await supabase
      .from("referral_bonuses")
      .update({ status: "pagada", paid_at: new Date().toISOString().slice(0, 10) })
      .eq("id", id);
    if (error) return flash(`Error: ${error.message}`);
    flash("Bono de referido marcado como pagado ✓");
    void loadAll();
  };

  /**
   * Cambia lo que el cliente paga al mes. Pasa cuando amplía el servicio.
   *
   * Queda escrito en la bitácora del sitio, y si subió y el website tiene
   * vendedor, se le avisa por correo: su comisión sale de ese monto y no
   * puede enterarse por casualidad.
   */
  const cambiarPrecio = async (site: SiteRow, nuevo: number) => {
    const anterior = Number(site.monthly_price);
    if (!Number.isFinite(nuevo) || nuevo < 0 || nuevo === anterior) return;

    const { error } = await supabase
      .from("sites")
      .update({ monthly_price: nuevo })
      .eq("id", site.id);
    if (error) return flash(`Error: ${error.message}`);

    const { data: user } = await supabase.auth.getUser();
    await supabase.from("site_events").insert({
      site_id: site.id,
      kind: "nota",
      detail: `Precio mensual: $${anterior.toFixed(2)} → $${nuevo.toFixed(2)}`,
      actor: user.user?.id ?? null,
    });

    if (nuevo <= anterior || !site.seller_id) {
      flash(
        nuevo > anterior
          ? `Precio actualizado a $${nuevo.toFixed(2)} ✓ (este website no tiene vendedor)`
          : `Precio actualizado a $${nuevo.toFixed(2)} ✓`
      );
      void loadAll();
      return;
    }

    // Subió y hay vendedor: avisarle
    const [{ data: sess }, { data: prof }] = await Promise.all([
      supabase.auth.getSession(),
      supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", site.seller_id)
        .single(),
    ]);
    let aviso = "sin correo del vendedor";
    if (sess.session && prof?.email) {
      try {
        const res = await fetch("/api/notify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sess.session.access_token}`,
          },
          body: JSON.stringify({
            type: "price_up",
            email: prof.email,
            name: prof.full_name,
            site: site.name,
            from: anterior,
            to: nuevo,
          }),
        });
        const data = (await res.json()) as { sent?: boolean; reason?: string };
        aviso = data.sent
          ? `avisado ${prof.full_name}`
          : data.reason === "smtp_not_configured"
            ? "correo no configurado, no se avisó"
            : "no se pudo avisar";
      } catch {
        aviso = "no se pudo avisar";
      }
    }
    flash(`Precio actualizado a $${nuevo.toFixed(2)} ✓ — ${aviso}`);
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
          ? `${data.urls} páginas avisadas ✓ — ${ok.map((r) => r.motor).join(", ")}`
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
   * decir que el website se creó con el precio de arranque y sin vendedor, y
   * que el contrato es el que trae los números de verdad. Al colgarlo se
   * ofrece copiarlos: si no, el sitio se queda cobrando lo que se tecleó al
   * abrirlo y la comisión del vendedor no se genera nunca.
   */
  const asignarContrato = async (c: ContractRow, siteId: string) => {
    const { error } = await supabase
      .from("signed_contracts")
      .update({ site_id: siteId || null })
      .eq("id", c.id);
    if (error) return flash(`Error: ${error.message}`);
    if (!siteId) {
      flash(`Contrato ${c.code} sin website: vuelve a quedar pendiente`);
      return void loadAll();
    }

    const actor = (await supabase.auth.getUser()).data.user?.id ?? null;
    await supabase.from("site_events").insert({
      site_id: siteId,
      kind: "contrato_firmado",
      detail: `Contrato ${c.code} de ${c.client_name} — $${Number(c.monthly_price).toFixed(2)}/mes`,
      actor,
    });

    // Lo que dice el contrato firmado contra lo que tiene puesto el website
    const sitio = sites.find((s) => s.id === siteId);
    const quien = (id: string | null) =>
      id ? (sellers.find((s) => s.id === id)?.profiles?.full_name ?? "Administración") : "ninguno";
    const precioContrato = Number(c.monthly_price);
    const cambios: Record<string, unknown> = {};
    const lista: string[] = [];
    if (sitio && precioContrato > 0 && Number(sitio.monthly_price) !== precioContrato) {
      cambios.monthly_price = precioContrato;
      lista.push(
        `Precio: $${Number(sitio.monthly_price).toFixed(2)} → $${precioContrato.toFixed(2)}`
      );
    }
    if (sitio && c.seller_id && sitio.seller_id !== c.seller_id) {
      cambios.seller_id = c.seller_id;
      lista.push(`Vendedor: ${quien(sitio.seller_id)} → ${quien(c.seller_id)}`);
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

    const { error: sErr } = await supabase.from("sites").update(cambios).eq("id", siteId);
    if (sErr) {
      flash(`Contrato asignado, pero no se pudo copiar: ${sErr.message}`);
      return void loadAll();
    }
    await supabase.from("site_events").insert({
      site_id: siteId,
      // La bitácora solo acepta los tipos de la migración 0016; esto es una nota
      kind: "nota",
      detail: `Copiado del contrato ${c.code} — ${lista.join(" · ")}`,
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
   * que pertenece está activo — ese cliente sí está pagando y ese documento
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

    const { error } = await supabase.from("signed_contracts").delete().eq("id", c.id);
    if (error) return flash(`Error: ${error.message}`);

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
        seller_id: c.seller_id,
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
   * Corrige una visita. En la calle se escribe rápido: nombres a medias,
   * empresas mal puestas. El número de visitas es con lo que se mide a cada
   * vendedor, así que tiene que poder arreglarse.
   */
  const guardarVisita = async (
    id: string,
    cambios: { prospect_name: string; company_name: string | null; visited_on: string }
  ) => {
    const { error } = await supabase.from("visits").update(cambios).eq("id", id);
    if (error) return flash(`Error: ${error.message}`);
    flash("Visita corregida ✓");
    void loadAll();
  };

  const borrarVisita = async (v: VisitRow) => {
    if (
      !window.confirm(
        `¿Borrar la visita a ${v.prospect_name}${
          v.company_name ? ` (${v.company_name})` : ""
        }? Deja de contar para su vendedor y no se puede deshacer.`
      )
    )
      return;
    const { error } = await supabase.from("visits").delete().eq("id", v.id);
    if (error) return flash(`Error: ${error.message}`);
    flash("Visita borrada");
    void loadAll();
  };

  const assignSeller = async (site: SiteRow, sellerId: string) => {
    const { error } = await supabase
      .from("sites")
      .update({ seller_id: sellerId || null })
      .eq("id", site.id);
    if (error) return flash(`Error: ${error.message}`);
    flash("Vendedor asignado ✓ (aplica a los pagos que se registren desde ahora)");
    void loadAll();
  };

  // ── Render ─────────────────────────────────────────────────────────
  if (denied) {
    return (
      <p className="py-24 text-center text-judo-fog/60">
        🚫 Acceso solo para Administración.
      </p>
    );
  }
  if (!ready) {
    return <p className="py-24 text-center text-judo-fog/50">…</p>;
  }

  const approvedSellers = sellers.filter((s) => s.status === "aprobado");

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
            router.replace("/login");
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

      {/* Pestañas, en el orden del camino de un cliente. El número en ámbar es
          lo que espera por ti; el gris es solo cuántos hay. */}
      <div className="mt-6 flex flex-wrap gap-2">
        {(
          [
            ["resumen", "📊", "Resumen", 0, 0],
            ["formularios", "📨", "Formularios", intakeNuevos, intakeSueltos],
            [
              "contratos",
              "📑",
              "Contratos",
              contractRows.filter((c) => !c.site_id).length,
              contractRows.length,
            ],
            ["sitios", "🌐", "Websites", sitiosEnRiesgo, sites.length],
            [
              "pagos",
              "💵",
              "Dinero",
              proofs.filter((p) => p.status === "pendiente").length +
                commissions.filter((c) => c.status === "pendiente").length +
                bonuses.filter((b) => b.status === "pendiente").length,
              0,
            ],
            [
              "vendedores",
              "🧑‍💼",
              "Vendedores",
              sellers.filter((s) => s.status === "pendiente").length,
              sellers.length,
            ],
            ["visitas", "📍", "Visitas", 0, visitRows.length],
            [
              "resenas",
              "⭐",
              "Reseñas",
              reviews.filter((r) => r.status === "pendiente").length,
              0,
            ],
          ] as [Tab, string, string, number, number][]
        ).map(([key, icono, label, urgente, total]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
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

      {/* ── RESUMEN: estadísticas y leaderboard ── */}
      {tab === "resumen" && (() => {
        const now = new Date();
        const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const monthRevenue = payRows
          .filter((p) => p.paid_at?.startsWith(monthKey))
          .reduce((s, p) => s + Number(p.amount), 0);
        const totalRevenue = payRows.reduce((s, p) => s + Number(p.amount), 0);
        const pendingCommissions =
          commissions.filter((c) => c.status === "pendiente").reduce((s, c) => s + Number(c.amount), 0) +
          bonuses.filter((b) => b.status === "pendiente").reduce((s, b) => s + Number(b.amount), 0);
        // La cuenta real: solo cuentan los sitios que están activos
        const activos = finance.filter((f) => f.status === "activo");
        const mrr = activos.reduce((t, f) => t + (f.revenue_cents ?? 0), 0) / 100;
        const costos = activos.reduce((t, f) => t + (f.cost_cents ?? 0), 0) / 100;
        const margen = mrr - costos;
        // Mismo criterio que el aviso ⏰ de la lista de websites, para que los
        // dos números nunca se contradigan
        const enRiesgo = sites.filter(
          (s) =>
            s.status === "activo" && !!s.next_payment_due && s.next_payment_due < hoy
        ).length;

        // Cada tarjeta lleva a la pestaña donde eso se resuelve: el Resumen
        // dice qué pasa, y el clic dice dónde arreglarlo.
        const stats: [string, string, string, Tab][] = [
          ["📨", "Formularios sin atender", String(intakeNuevos), "formularios"],
          ["🔗", "Formularios sin website", String(intakeSueltos), "formularios"],
          [
            "📑",
            "Contratos por armar",
            String(contractRows.filter((c) => !c.site_id).length),
            "contratos",
          ],
          ["🌐", "Websites activos", `${sites.filter((s) => s.status === "activo").length}/${sites.length}`, "sitios"],
          ["⏰", "Con el pago vencido", String(enRiesgo), "sitios"],
          ["🔑", "Accesos por conseguir", String(accessGaps), "sitios"],
          ["💵", "Ingresos este mes", `$${monthRevenue.toFixed(0)}`, "pagos"],
          ["📈", "Ingresos totales", `$${totalRevenue.toFixed(0)}`, "pagos"],
          ["🔁", "Facturación recurrente", `$${mrr.toFixed(0)}/mes`, "sitios"],
          ["📉", "Costos de los sitios", `$${costos.toFixed(0)}/mes`, "sitios"],
          ["🟢", "Tu ganancia al mes", `$${margen.toFixed(0)}`, "sitios"],
          ["🧾", "Pagos por verificar", String(proofs.filter((p) => p.status === "pendiente").length), "pagos"],
          ["💰", "Comisiones por pagar", `$${pendingCommissions.toFixed(2)}`, "pagos"],
          ["🆕", "Aplicaciones nuevas", String(sellers.filter((s) => s.status === "pendiente").length), "vendedores"],
          ["🧑‍💼", "Vendedores aprobados", String(approvedSellers.length), "vendedores"],
          ["⭐", "Reseñas por moderar", String(reviews.filter((r) => r.status === "pendiente").length), "resenas"],
        ];

        // Leaderboard: vendido, visitas y comisiones por vendedor aprobado
        const board = approvedSellers
          .map((s) => {
            const sold = payRows
              .filter((p) => p.sites?.seller_id === s.id)
              .reduce((sum, p) => sum + Number(p.amount), 0);
            const visits = visitRows.filter((v) => v.seller_id === s.id).length;
            const earned =
              commissions
                .filter((c) => c.seller_id === s.id && c.status !== "anulada")
                .reduce((sum, c) => sum + Number(c.amount), 0);
            return { id: s.id, name: s.profiles?.full_name ?? "¿?", sold, visits, earned };
          })
          .sort((a, b) => b.sold - a.sold || b.visits - a.visits);
        const medals = ["🥇", "🥈", "🥉"];

        return (
          <div className="mt-6 flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map(([icon, label, value, destino]) => (
                <button
                  key={label}
                  onClick={() => setTab(destino)}
                  className={`${box} text-left transition hover:border-judo-lilac/50`}
                >
                  <p className="text-xs text-judo-fog/50">{icon} {label}</p>
                  <p className="mt-1 text-2xl font-bold text-judo-lilac">{value}</p>
                </button>
              ))}
            </div>

            {/* Aviso a los buscadores que no son Google */}
            <div className={`${box} flex flex-wrap items-center gap-3`}>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold">🔎 Avisar a los buscadores</h2>
                <p className="mt-1 text-xs text-judo-fog/55">
                  Le dice a Bing, Yahoo, DuckDuckGo, Yandex y Ecosia que hay
                  contenido nuevo. Úsalo cuando cambies textos o publiques un
                  website en el showcase; no hace falta más de una vez al día.
                </p>
              </div>
              <button onClick={avisarBuscadores} className={btnPurple}>
                📡 Avisar ahora
              </button>
            </div>

            <div className={box}>
              <h2 className="font-semibold">🏆 Leaderboard de vendedores</h2>
              {board.length === 0 ? (
                <p className="mt-3 text-sm text-judo-fog/50">
                  Aún no hay vendedores aprobados. Las nuevas aplicaciones te
                  esperan en la pestaña Vendedores.
                </p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-judo-fog/50">
                        <th className="py-2 pr-3">#</th>
                        <th className="py-2 pr-3">Vendedor</th>
                        <th className="py-2 pr-3">Vendido</th>
                        <th className="py-2 pr-3">Visitas</th>
                        <th className="py-2">Comisiones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-judo-lilac/10">
                      {board.map((r, i) => (
                        <tr key={r.id}>
                          <td className="py-2.5 pr-3">{medals[i] ?? `#${i + 1}`}</td>
                          <td className="py-2.5 pr-3 font-semibold">{r.name}</td>
                          <td className="py-2.5 pr-3 text-judo-lilac">${r.sold.toFixed(0)}</td>
                          <td className="py-2.5 pr-3">{r.visits}</td>
                          <td className="py-2.5">${r.earned.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── VENDEDORES ── */}
      {tab === "vendedores" && (
        <div className="mt-6 flex flex-col gap-4">
          {/* Los bots registran aplicaciones y nunca confirman el correo.
              Esto las junta y las borra de una, en vez de una por una. */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-judo-lilac/15 bg-judo-surface px-4 py-3">
            <p className="text-xs text-judo-fog/50">
              ¿Aplicaciones que huelen a bot? Se borran las que nunca confirmaron
              su correo, llevan más de un día así y no tienen actividad.
            </p>
            <button onClick={() => void limpiarBots()} className={btnGhost}>
              🧹 Limpiar aplicaciones sin confirmar
            </button>
          </div>
          {sellers.length === 0 && (
            <p className="text-sm text-judo-fog/50">Aún no hay vendedores registrados.</p>
          )}
          {sellers.map((s) => (
            <SellerCard
              key={s.id}
              seller={s}
              onSave={saveSeller}
              onDelete={deleteSeller}
              onPhotoChange={requestPhotoChange}
            />
          ))}
        </div>
      )}

      {/* ── PAGOS ZELLE ── */}
      {tab === "pagos" && (
        <div className="mt-6 flex flex-col gap-3">
          {proofs.length === 0 && (
            <p className="text-sm text-judo-fog/50">No hay comprobantes de pago todavía.</p>
          )}
          {proofs.map((p) => (
            <div key={p.id} className={`${box} flex flex-wrap items-center gap-3`}>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {p.method === "usdt" ? "🪙" : "🏦"} {p.payer_name}{" "}
                  <span className="text-sm font-normal text-judo-fog/50">
                    · {p.method === "usdt" ? "USDT" : "Zelle"} · plan {p.plan} ·{" "}
                    {new Date(p.created_at).toLocaleDateString("es-US")}
                  </span>
                </p>
                <p className="text-xs text-judo-fog/50">
                  {p.referral_code ? `Referido: ${p.referral_code} · ` : ""}
                  {p.source ? `Origen: ${p.source} · ` : ""}
                  Estado:{" "}
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
                    <span className="ml-2 text-amber-200">
                      ⏳ la red tarda 30 a 60 min en confirmar
                    </span>
                  )}
                </p>
              </div>
              {p.tx_hash && (
                <a
                  href={`https://etherscan.io/tx/${p.tx_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={btnGhost}
                >
                  Ver en Etherscan
                </a>
              )}
              {p.screenshot_path && (
                <button onClick={() => viewProof(p.screenshot_path!)} className={btnGhost}>
                  Ver captura
                </button>
              )}
              <button onClick={() => setProofStatus(p.id, "verificado")} className={btnGreen}>
                Verificar ✓
              </button>
              <button
                onClick={() => setProofStatus(p.id, "rechazado")}
                className={btnDanger}
              >
                Rechazar
              </button>
            </div>
          ))}

          {/* ── Comisiones de vendedores ── */}
          <div className={`${box} mt-2`}>
            <h2 className="font-semibold">💰 Comisiones de vendedores</h2>
            <p className="mt-1 text-xs text-judo-fog/50">
              Se generan solas al registrar un pago de un website con vendedor
              asignado. Si un sitio se deshabilita, las pendientes de ese mes se
              anulan (regla de solvencia).
            </p>
            {commissions.length === 0 && bonuses.length === 0 ? (
              <p className="mt-3 text-sm text-judo-fog/50">
                Aún no hay comisiones generadas.
              </p>
            ) : (
              <>
                {(() => {
                  const pendingBySeller = new Map<string, number>();
                  for (const c of commissions) {
                    if (c.status !== "pendiente") continue;
                    const name = c.sellers?.profiles?.full_name ?? "¿?";
                    pendingBySeller.set(
                      name,
                      (pendingBySeller.get(name) ?? 0) + Number(c.amount)
                    );
                  }
                  for (const b of bonuses) {
                    if (b.status !== "pendiente") continue;
                    const name = b.referrer?.profiles?.full_name ?? "¿?";
                    pendingBySeller.set(
                      name,
                      (pendingBySeller.get(name) ?? 0) + Number(b.amount)
                    );
                  }
                  return pendingBySeller.size > 0 ? (
                    <p className="mt-3 text-sm">
                      Por pagar:{" "}
                      {[...pendingBySeller.entries()].map(([name, total], i) => (
                        <span key={name}>
                          {i > 0 && " · "}
                          <b className="text-judo-lilac">{name}</b> ${total.toFixed(2)}
                        </span>
                      ))}
                    </p>
                  ) : null;
                })()}
                {/* Bonos por referir vendedores: $10 una sola vez por cada
                    suscripción nueva que consiga el referido */}
                {bonuses.length > 0 && (
                  <ul className="mt-3 divide-y divide-judo-lilac/10 border-b border-judo-lilac/10">
                    {bonuses.map((b) => (
                      <li
                        key={b.id}
                        className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
                      >
                        <span className={b.status === "anulada" ? "opacity-50 line-through" : ""}>
                          🎁 <b>{b.referrer?.profiles?.full_name ?? "¿?"}</b>
                          <span className="text-judo-fog/50">
                            {" "}· bono por referir a{" "}
                            {b.referred?.profiles?.full_name ?? "¿?"} ·{" "}
                            {b.sites?.name ?? "sitio"}
                          </span>{" "}
                          <b className="text-judo-lilac">${Number(b.amount).toFixed(2)}</b>
                        </span>
                        {b.status === "pendiente" ? (
                          <button
                            onClick={() => markBonusPaid(b.id)}
                            className={btnGreen}
                          >
                            Marcar pagado ✓
                          </button>
                        ) : (
                          <span
                            className={`text-xs ${
                              b.status === "pagada" ? "text-emerald-300" : "text-red-300"
                            }`}
                          >
                            {b.status === "pagada" ? "✓ pagado" : "anulado"}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <ul className="mt-3 divide-y divide-judo-lilac/10">
                  {commissions.map((c) => (
                    <li
                      key={c.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm"
                    >
                      <span className={c.status === "anulada" ? "opacity-50 line-through" : ""}>
                        <b>{c.sellers?.profiles?.full_name ?? "¿?"}</b>
                        <span className="text-judo-fog/50">
                          {" "}· {c.sites?.name ?? "sitio"} ·{" "}
                          {(c.period ?? c.created_at).slice(0, 7)}
                        </span>{" "}
                        <b className="text-judo-lilac">${Number(c.amount).toFixed(2)}</b>
                      </span>
                      {c.status === "pendiente" ? (
                        <button
                          onClick={() => markCommissionPaid(c.id)}
                          className={btnGreen}
                        >
                          Marcar pagada ✓
                        </button>
                      ) : (
                        <span
                          className={`text-xs ${
                            c.status === "pagada" ? "text-emerald-300" : "text-red-300"
                          }`}
                        >
                          {c.status === "pagada" ? "✓ pagada" : "anulada"}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── VISITAS Y CONVERSIÓN ── */}
      {tab === "visitas" && (() => {
        const nameOf = (id: string) =>
          sellers.find((s) => s.id === id)?.profiles?.full_name ?? "¿?";
        const norm = (s: string) =>
          s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
        // Un prospecto "convirtió" si su nombre o empresa aparece en un
        // contrato firmado o en un website ya creado
        const closed = new Set<string>();
        for (const c of contractRows) {
          closed.add(norm(c.client_name));
          if (c.business_name) closed.add(norm(c.business_name));
        }
        for (const s of sites) {
          closed.add(norm(s.name));
          if (s.clients?.full_name) closed.add(norm(s.clients.full_name));
          if (s.clients?.business_name) closed.add(norm(s.clients.business_name));
        }
        const converted = (v: VisitRow) =>
          closed.has(norm(v.prospect_name)) ||
          (v.company_name ? closed.has(norm(v.company_name)) : false);

        const board = approvedSellers.map((s) => {
          const mine = visitRows.filter((v) => v.seller_id === s.id);
          const won = mine.filter(converted).length;
          return {
            id: s.id,
            name: s.profiles?.full_name ?? "¿?",
            visits: mine.length,
            contracts: contractRows.filter((c) => c.seller_id === s.id).length,
            websites: sites.filter((si) => si.seller_id === s.id).length,
            rate: mine.length ? Math.round((won / mine.length) * 100) : 0,
          };
        });

        const q = norm(visitFilter);
        const shown = visitRows.filter(
          (v) =>
            !q ||
            norm(v.prospect_name).includes(q) ||
            norm(v.company_name ?? "").includes(q) ||
            norm(nameOf(v.seller_id)).includes(q)
        );

        return (
          <div className="mt-6 flex flex-col gap-5">
            <div className={box}>
              <h2 className="font-semibold">📊 Visitas contra cierres, por vendedor</h2>
              <p className="mt-1 text-xs text-judo-fog/50">
                Cuántas puertas tocó cada uno y cuántas se volvieron contrato o
                website. Así ves quién tiene puntería y quién necesita apoyo.
              </p>
              {board.length === 0 ? (
                <p className="mt-3 text-sm text-judo-fog/50">
                  Aún no hay vendedores aprobados.
                </p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-judo-fog/50">
                        <th className="py-2 pr-3">Vendedor</th>
                        <th className="py-2 pr-3">Visitas</th>
                        <th className="py-2 pr-3">Contratos</th>
                        <th className="py-2 pr-3">Websites</th>
                        <th className="py-2">Conversión</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-judo-lilac/10">
                      {board.map((r) => (
                        <tr key={r.id}>
                          <td className="py-2.5 pr-3 font-semibold">{r.name}</td>
                          <td className="py-2.5 pr-3">{r.visits}</td>
                          <td className="py-2.5 pr-3">{r.contracts}</td>
                          <td className="py-2.5 pr-3">{r.websites}</td>
                          <td className="py-2.5 text-judo-lilac">{r.rate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className={box}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold">📍 Todas las visitas ({visitRows.length})</h2>
                <input
                  value={visitFilter}
                  onChange={(e) => setVisitFilter(e.target.value)}
                  placeholder="Buscar por prospecto, empresa o vendedor…"
                  className={`${fieldSm} w-auto min-w-[220px]`}
                />
              </div>
              {shown.length === 0 ? (
                <p className="mt-3 text-sm text-judo-fog/50">
                  {visitRows.length === 0
                    ? "Todavía no hay visitas registradas por los vendedores."
                    : "Ninguna visita coincide con esa búsqueda."}
                </p>
              ) : (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wide text-judo-fog/50">
                        <th className="py-2 pr-3">Fecha</th>
                        <th className="py-2 pr-3">Prospecto</th>
                        <th className="py-2 pr-3">Empresa</th>
                        <th className="py-2 pr-3">Vendedor</th>
                        <th className="py-2 pr-3">Estado</th>
                        <th className="py-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-judo-lilac/10">
                      {shown.slice(0, 300).map((v) => {
                        const won = converted(v);
                        if (visitaEditada === v.id) {
                          return (
                            <tr key={v.id}>
                              <td colSpan={6} className="py-3">
                                <VisitaEditor
                                  visita={v}
                                  onGuardar={async (cambios) => {
                                    await guardarVisita(v.id, cambios);
                                    setVisitaEditada(null);
                                  }}
                                  onCancelar={() => setVisitaEditada(null)}
                                />
                              </td>
                            </tr>
                          );
                        }
                        return (
                          <tr key={v.id}>
                            <td className="whitespace-nowrap py-2.5 pr-3 text-judo-fog/60">
                              {v.visited_on}
                              {v.visit_time ? ` · ${v.visit_time.slice(0, 5)}` : ""}
                            </td>
                            <td className="py-2.5 pr-3 font-semibold">{v.prospect_name}</td>
                            <td className="py-2.5 pr-3 text-judo-fog/70">
                              {v.company_name || "—"}
                            </td>
                            <td className="py-2.5 pr-3 text-judo-fog/70">
                              {nameOf(v.seller_id)}
                            </td>
                            <td className="py-2.5 pr-3">
                              {won ? (
                                <span className="text-emerald-300">✓ cerrado</span>
                              ) : (
                                <span className="text-judo-fog/45">en seguimiento</span>
                              )}
                            </td>
                            <td className="py-2.5">
                              <div className="flex flex-wrap gap-2">
                                {!won && (
                                  <button
                                    onClick={() => {
                                      setSiteClient(v.prospect_name);
                                      setSiteName(v.company_name || v.prospect_name);
                                      setSiteSeller(v.seller_id);
                                      setAltaAbierta(true);
                                      setTab("sitios");
                                      flash("Datos cargados en el formulario de nuevo website ✓");
                                    }}
                                    className={btnGhost}
                                  >
                                    ➕ Crear website
                                  </button>
                                )}
                                <button
                                  onClick={() => setVisitaEditada(v.id)}
                                  className={btnGhost}
                                  title="Corregir esta visita"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => borrarVisita(v)}
                                  className={btnDanger}
                                  title="Borrar esta visita"
                                >
                                  🗑
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {shown.length > 300 && (
                    <p className="mt-2 text-xs text-judo-fog/45">
                      Mostrando las 300 visitas más recientes de {shown.length}. Usa la
                      búsqueda para encontrar una en particular.
                    </p>
                  )}
                </div>
              )}
            </div>
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

      {/* ── CONTRATOS FIRMADOS ─────────────────────────────────────────
          Un contrato sin website no es papeleo pendiente: es una venta
          cerrada cuyo sitio todavía no existe. Sale primero y en ámbar. */}
      {tab === "contratos" && (() => {
        const nombreVendedor = (id: string) =>
          sellers.find((s) => s.id === id)?.profiles?.full_name ?? "Administración";
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
                    · {nombreVendedor(c.seller_id)} ·{" "}
                    {new Date(c.created_at).toLocaleDateString("es-US")}
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
                    — sin asignar (pendiente) —
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
          <div className="mt-6 flex flex-col gap-5">
            {contractRows.length === 0 && (
              <p className={`${box} text-sm text-judo-fog/50`}>
                Todavía no hay contratos firmados. Aparecen aquí en cuanto un
                vendedor cierre uno desde su portal.
              </p>
            )}

            {pendientes.length > 0 && (
              <div className="flex flex-col gap-3">
                <h2 className="font-semibold text-amber-300">
                  ⏳ Por armar ({pendientes.length})
                </h2>
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
                <h2 className="font-semibold">✓ Con website ({asignados.length})</h2>
                {asignados.map((c) => (
                  <Ficha key={c.id} c={c} />
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* ── RESEÑAS DE VISITANTES ── */}

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
              <select value={siteSeller} onChange={(e) => setSiteSeller(e.target.value)} className={inputClass}>
                <option value="" className="bg-judo-surface">Vendedor: yo (Administración)</option>
                {approvedSellers.map((s) => (
                  <option key={s.id} value={s.id} className="bg-judo-surface">
                    {s.profiles?.full_name}
                  </option>
                ))}
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
                      <SiteIdentidad site={site} onSaved={loadAll} flash={flash} />
                      <SitePrice site={site} onGuardar={cambiarPrecio} />
                      <SiteDates site={site} onSaved={loadAll} flash={flash} />
                      <SitePortfolio site={site} onSaved={loadAll} flash={flash} />
                      <SiteDossier site={site} onSaved={loadAll} flash={flash} />
                      <label className="mt-1.5 flex items-center gap-2 text-xs text-judo-fog/50">
                        👤 Vendedor:
                        <select
                          value={site.seller_id ?? ""}
                          onChange={(e) => void assignSeller(site, e.target.value)}
                          className="rounded-lg border border-judo-lilac/25 bg-judo-black/60 px-2 py-1 text-xs text-judo-fog outline-none focus:border-judo-lilac"
                        >
                          <option value="" className="bg-judo-surface">
                            Yo (Administración)
                          </option>
                          {approvedSellers.map((s) => (
                            <option key={s.id} value={s.id} className="bg-judo-surface">
                              {s.profiles?.full_name}
                            </option>
                          ))}
                        </select>
                      </label>

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
                          🔑 Kit
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

// ── Corrección de una visita ───────────────────────────────────────
// Vive fuera del componente: definido adentro, React lo trataría como un
// componente nuevo en cada tecla y el cursor saltaría fuera de la casilla.
function VisitaEditor({
  visita,
  onGuardar,
  onCancelar,
}: {
  visita: VisitRow;
  onGuardar: (cambios: {
    prospect_name: string;
    company_name: string | null;
    visited_on: string;
  }) => void;
  onCancelar: () => void;
}) {
  const [nombre, setNombre] = useState(visita.prospect_name);
  const [empresa, setEmpresa] = useState(visita.company_name ?? "");
  const [fecha, setFecha] = useState(visita.visited_on);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (nombre.trim().length < 2) return;
        onGuardar({
          prospect_name: nombre.trim(),
          company_name: empresa.trim() || null,
          visited_on: fecha,
        });
      }}
      className="flex flex-wrap items-center gap-2 rounded-xl border border-judo-lilac/30 bg-judo-black/40 p-3"
    >
      <input
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Prospecto"
        className={`${fieldSm} min-w-[10rem] flex-1`}
      />
      <input
        value={empresa}
        onChange={(e) => setEmpresa(e.target.value)}
        placeholder="Empresa"
        className={`${fieldSm} min-w-[10rem] flex-1`}
      />
      <input
        type="date"
        value={fecha}
        onChange={(e) => setFecha(e.target.value)}
        className={fieldSm}
      />
      <button type="submit" className={btnPurple}>
        Guardar
      </button>
      <button type="button" onClick={onCancelar} className={btnGhost}>
        Cancelar
      </button>
    </form>
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
// cambió, para no disparar avisos de más al vendedor.
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
        <>
          <button onClick={() => onGuardar(site, nuevo)} className={btnPurple}>
            Guardar
          </button>
          {nuevo > Number(site.monthly_price) && site.seller_id && (
            <span className="text-emerald-300">
              sube: se le avisa por correo al vendedor
            </span>
          )}
        </>
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

// ── Tarjeta de vendedor con edición de comisión ─────────────────────
function SellerCard({
  seller,
  onSave,
  onDelete,
  onPhotoChange,
}: {
  seller: SellerRow;
  onSave: (id: string, status: string, kind: string | null, value: string) => void;
  onDelete: (id: string, name: string) => void;
  onPhotoChange: (id: string, name: string) => void;
}) {
  const [kind, setKind] = useState(seller.commission_kind ?? "monto_fijo");
  const [value, setValue] = useState(seller.commission_value?.toString() ?? "");

  return (
    <div className={`${box} flex flex-wrap items-center gap-4`}>
      {seller.profiles?.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <a href={seller.profiles.photo_url} target="_blank" rel="noopener noreferrer" title="Ver la foto en grande">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={seller.profiles.photo_url} alt="" className="h-12 w-12 rounded-full border border-judo-lilac/40 object-cover" />
        </a>
      ) : (
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-judo-purple/25">👤</span>
      )}
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{seller.profiles?.full_name}</p>
        <p className="text-xs text-judo-fog/50">
          Código: <span className="text-judo-lilac">{seller.referral_code}</span> · Estado:{" "}
          <b className={seller.status === "aprobado" ? "text-emerald-300" : seller.status === "pendiente" ? "text-amber-300" : "text-red-300"}>
            {seller.status}
          </b>
          {!seller.profiles?.photo_url && " · ⚠ sin foto"}
          {seller.profiles?.photo_change_requested && " · 📷 esperando foto nueva"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <select value={kind} onChange={(e) => setKind(e.target.value)} className={`${fieldSm} w-auto`}>
          <option value="monto_fijo" className="bg-judo-surface">$ por cada $50</option>
          <option value="porcentaje" className="bg-judo-surface">% de la venta</option>
        </select>
        <input
          type="number"
          step="0.01"
          min="0"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="0"
          className={`${fieldSm} w-20`}
        />
      </div>
      <div className="flex gap-2">
        {seller.status !== "aprobado" && (
          <button onClick={() => onSave(seller.id, "aprobado", kind, value)} className={btnGreen}>
            Aprobar ✓
          </button>
        )}
        {seller.status === "aprobado" && (
          <button onClick={() => onSave(seller.id, "aprobado", kind, value)} className={btnPurple}>
            Guardar
          </button>
        )}
        {seller.status !== "rechazado" && seller.status !== "suspendido" && (
          <button
            onClick={() => onSave(seller.id, seller.status === "aprobado" ? "suspendido" : "rechazado", kind, value)}
            className={btnDanger}
          >
            {seller.status === "aprobado" ? "Suspender" : "Rechazar"}
          </button>
        )}
        {seller.profiles?.photo_url && !seller.profiles?.photo_change_requested && (
          <button
            onClick={() => onPhotoChange(seller.id, seller.profiles?.full_name ?? "el vendedor")}
            title="Desbloquear su foto para que suba una nueva"
            className={btnGhost}
          >
            📷 Pedir foto
          </button>
        )}
        <button
          onClick={() => onDelete(seller.id, seller.profiles?.full_name ?? "este vendedor")}
          title="Eliminar la cuenta por completo"
          className={btnDanger}
        >
          🗑
        </button>
      </div>
    </div>
  );
}
