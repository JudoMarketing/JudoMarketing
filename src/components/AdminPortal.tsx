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

type Tab = "resumen" | "vendedores" | "visitas" | "pagos" | "sitios" | "formularios" | "resenas";

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
  code: string;
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
  const [payRows, setPayRows] = useState<PayRow[]>([]);
  const [metrics, setMetrics] = useState<Record<string, SiteMetric>>({});
  const [finance, setFinance] = useState<FinanceRow[]>([]);
  const [accessGaps, setAccessGaps] = useState(0);
  const [msg, setMsg] = useState("");

  // Formulario de nuevo sitio
  const [siteName, setSiteName] = useState("");
  const [siteDomain, setSiteDomain] = useState("");
  const [sitePrice, setSitePrice] = useState("50");
  const [siteClient, setSiteClient] = useState("");
  const [siteSeller, setSiteSeller] = useState("");
  const [siteDue, setSiteDue] = useState("");
  // Un website que ya está publicado entra directo como activo
  const [siteStatus, setSiteStatus] = useState<"en_desarrollo" | "activo">(
    "en_desarrollo"
  );

  const loadAll = useCallback(async () => {
    const [selRes, proofRes, siteRes, metricsRes, finRes, accRes, comRes, bonusRes, visitRes, contractRes, payRes, revRes] = await Promise.all([
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
          "id,name,domain,status,monthly_price,months_paid,next_payment_due,seller_id,kit_api_key,domain_expires_at,portfolio_visible,portfolio_category,portfolio_desc_es,portfolio_desc_en,client_id,currency,billing_day,payment_method,grace_days,timezone,repo_url,vercel_project,registrar,domain_holder,dns_provider,email_provider,db_provider,ga4_property_id,gsc_property,gbp_location,meta_pixel_id,meta_page,notes,clients(full_name,business_name)"
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
        .select("id,seller_id,client_name,business_name,code,created_at")
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
    const { error } = await supabase
      .from("sellers")
      .update({
        status,
        commission_kind: kind || null,
        commission_value: value ? Number(value) : null,
        approved_at: status === "aprobado" ? new Date().toISOString() : null,
      })
      .eq("id", id);
    if (error) return flash(`Error: ${error.message}`);
    flash("Vendedor actualizado ✓");

    // Email bonito de "fuiste aprobado" (si SMTP está configurado)
    if (status === "aprobado") {
      try {
        const [{ data: sess }, { data: prof }] = await Promise.all([
          supabase.auth.getSession(),
          supabase.from("profiles").select("email, full_name").eq("id", id).single(),
        ]);
        if (sess.session && prof?.email) {
          void fetch("/api/notify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${sess.session.access_token}`,
            },
            body: JSON.stringify({
              type: "approved",
              email: prof.email,
              name: prof.full_name,
            }),
          }).catch(() => {});
        }
      } catch {
        // sin columna email todavía (migración 0005 pendiente): se omite
      }
    }
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
      monthly_price: sitePrice === "" ? 50 : Number(sitePrice),
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

      {/* Pestañas */}
      <div className="mt-6 flex gap-2">
        {(
          [
            ["resumen", "📊 Resumen"],
            [
              "vendedores",
              `Vendedores (${sellers.length}${
                sellers.filter((s) => s.status === "pendiente").length > 0
                  ? `, ${sellers.filter((s) => s.status === "pendiente").length} nuevas`
                  : ""
              })`,
            ],
            ["visitas", `Visitas (${visitRows.length})`],
            [
              "pagos",
              `Pagos y comisiones (${
                proofs.filter((p) => p.status === "pendiente").length +
                commissions.filter((c) => c.status === "pendiente").length +
                bonuses.filter((b) => b.status === "pendiente").length
              })`,
            ],
            ["sitios", `Websites (${sites.length})`],
            ["formularios", "Formularios"],
            [
              "resenas",
              `Reseñas (${reviews.filter((r) => r.status === "pendiente").length})`,
            ],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-full px-3.5 py-1 text-xs font-semibold transition ${
              tab === key
                ? "bg-judo-purple text-white"
                : "border border-judo-lilac/25 text-judo-fog/60 hover:text-judo-lilac"
            }`}
          >
            {label}
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
        const enRiesgo = sites.filter(
          (s) =>
            s.status === "activo" &&
            s.next_payment_due &&
            new Date(s.next_payment_due) < now
        ).length;

        const stats: [string, string, string][] = [
          ["🆕", "Aplicaciones nuevas", String(sellers.filter((s) => s.status === "pendiente").length)],
          ["🧑‍💼", "Vendedores aprobados", String(approvedSellers.length)],
          ["🌐", "Websites activos", `${sites.filter((s) => s.status === "activo").length}/${sites.length}`],
          ["💵", "Ingresos este mes", `$${monthRevenue.toFixed(0)}`],
          ["📈", "Ingresos totales", `$${totalRevenue.toFixed(0)}`],
          ["💰", "Comisiones por pagar", `$${pendingCommissions.toFixed(2)}`],
          ["🧾", "Pagos por verificar", String(proofs.filter((p) => p.status === "pendiente").length)],
          ["⭐", "Reseñas por moderar", String(reviews.filter((r) => r.status === "pendiente").length)],
          ["🔁", "Facturación recurrente", `$${mrr.toFixed(0)}/mes`],
          ["📉", "Costos de los sitios", `$${costos.toFixed(0)}/mes`],
          ["🟢", "Tu ganancia al mes", `$${margen.toFixed(0)}`],
          ["🔑", "Accesos por conseguir", String(accessGaps)],
          ["⏰", "Con el pago vencido", String(enRiesgo)],
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
              {stats.map(([icon, label, value]) => (
                <div key={label} className={box}>
                  <p className="text-xs text-judo-fog/50">{icon} {label}</p>
                  <p className="mt-1 text-2xl font-bold text-judo-lilac">{value}</p>
                </div>
              ))}
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
                              {!won && (
                                <button
                                  onClick={() => {
                                    setSiteClient(v.prospect_name);
                                    setSiteName(v.company_name || v.prospect_name);
                                    setSiteSeller(v.seller_id);
                                    setTab("sitios");
                                    flash("Datos cargados en el formulario de nuevo website ✓");
                                  }}
                                  className={btnGhost}
                                >
                                  ➕ Crear website
                                </button>
                              )}
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

      {/* ── RESEÑAS DE VISITANTES ── */}
      {tab === "formularios" && <IntakeInbox flash={flash} />}

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
          <form onSubmit={createSite} className={box}>
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

          {sites.map((site) => (
            <div key={site.id} className={`${box} flex flex-wrap items-center gap-3`}>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {site.name}
                  {site.domain && (
                    <span className="ml-2 text-sm font-normal text-judo-lilac">{site.domain}</span>
                  )}
                </p>
                <p className="text-xs text-judo-fog/50">
                  {site.clients?.full_name ?? "Sin cliente"} · ${site.monthly_price}/mes ·{" "}
                  {site.months_paid}/12 pagos ·{" "}
                  <b className={site.status === "activo" ? "text-emerald-300" : site.status === "deshabilitado" ? "text-red-300" : "text-amber-300"}>
                    {site.status}
                  </b>
                </p>
                {/* Telemetría del Judo Site Kit */}
                <p className="text-xs text-judo-fog/50">
                  {metrics[site.id] ? (
                    <>
                      {metrics[site.id].is_live === false ? "🔴 caído" : "🟢 en vivo"} · último
                      reporte {new Date(metrics[site.id].reported_at).toLocaleString("es-US", { dateStyle: "short", timeStyle: "short" })} ·
                      ventas reportadas: <b className="text-judo-fog">{metrics[site.id].salesTotal}</b>
                      {metrics[site.id].traffic != null && <> · tráfico: {metrics[site.id].traffic}</>}
                    </>
                  ) : (
                    "📡 sin telemetría aún (kit no conectado)"
                  )}
                </p>
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
              </div>
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(site.kit_api_key);
                  flash("Clave del kit copiada ✓ (para conectar el website del cliente)");
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
                className={site.status === "deshabilitado" ? btnGreen : btnDanger}
              >
                {site.status === "deshabilitado" ? "Reactivar" : "Deshabilitar"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Portafolio público: qué se muestra de este sitio en el website ──
const CATEGORIAS_PORTAFOLIO = [
  { id: "food", nombre: "Comida y restaurantes" },
  { id: "delivery", nombre: "Apps de delivery" },
  { id: "tiendas", nombre: "Tiendas online" },
  { id: "servicios", nombre: "Servicios" },
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

  const guardar = async (cambios: Record<string, unknown>) => {
    const { error } = await supabase.from("sites").update(cambios).eq("id", site.id);
    if (error) return flash(`Error: ${error.message}`);
    flash("Portafolio actualizado ✓");
    onSaved();
  };

  // Solo los sitios activos salen publicados; el resto no aparece igual.
  const publicado = visible && site.status === "activo";

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
          {publicado ? "publicado" : visible ? "listo (sitio no activo)" : "oculto"}
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
          <p className="text-[11px] text-judo-fog/35">
            La imagen es una captura del home, se genera sola. El portafolio se
            refresca a los pocos minutos.
          </p>
        </div>
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
