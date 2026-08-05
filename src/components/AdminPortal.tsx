"use client";

/**
 * Portal de Administración (/es/admin) — MVP Fase 4.
 * Solo para la cuenta con role='admin' (admin@judomarketing.net).
 * Texto en español: el admin es el dueño.
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { getSupabase } from "@/lib/supabase";
import { inputClass } from "./AuthForms";

type Tab = "vendedores" | "pagos" | "sitios";

type SellerRow = {
  id: string;
  status: string;
  referral_code: string | null;
  commission_kind: string | null;
  commission_value: number | null;
  created_at: string;
  profiles: { full_name: string; photo_url: string | null; phone: string | null };
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
  clients: { full_name: string; business_name: string | null } | null;
};

type SiteMetric = {
  is_live: boolean | null;
  reported_at: string;
  salesTotal: number;
  traffic: number | null;
};

const box = "rounded-2xl border border-judo-lilac/20 bg-judo-surface p-5";

export default function AdminPortal() {
  const supabase = getSupabase();
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [denied, setDenied] = useState(false);
  const [tab, setTab] = useState<Tab>("vendedores");

  const [sellers, setSellers] = useState<SellerRow[]>([]);
  const [proofs, setProofs] = useState<ProofRow[]>([]);
  const [sites, setSites] = useState<SiteRow[]>([]);
  const [metrics, setMetrics] = useState<Record<string, SiteMetric>>({});
  const [msg, setMsg] = useState("");

  // Formulario de nuevo sitio
  const [siteName, setSiteName] = useState("");
  const [siteDomain, setSiteDomain] = useState("");
  const [sitePrice, setSitePrice] = useState("50");
  const [siteClient, setSiteClient] = useState("");
  const [siteSeller, setSiteSeller] = useState("");
  const [siteDue, setSiteDue] = useState("");

  const loadAll = useCallback(async () => {
    const [selRes, proofRes, siteRes, metricsRes] = await Promise.all([
      supabase
        .from("sellers")
        .select(
          "id,status,referral_code,commission_kind,commission_value,created_at,profiles(full_name,photo_url,phone)"
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("payment_proofs")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("sites")
        .select(
          "id,name,domain,status,monthly_price,months_paid,next_payment_due,seller_id,kit_api_key,domain_expires_at,clients(full_name,business_name)"
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("site_metrics")
        .select("site_id,is_live,sales_count,traffic_count,reported_at")
        .order("reported_at", { ascending: false })
        .limit(400),
    ]);
    setSellers((selRes.data as unknown as SellerRow[]) ?? []);
    setProofs((proofRes.data as ProofRow[]) ?? []);
    setSites((siteRes.data as unknown as SiteRow[]) ?? []);

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
      monthly_price: Number(sitePrice) || 50,
      client_id: client.id,
      seller_id: siteSeller || null,
      next_payment_due: siteDue || null,
      status: "en_desarrollo",
    });
    if (sErr) return flash(`Error: ${sErr.message}`);
    setSiteName("");
    setSiteDomain("");
    setSiteClient("");
    setSiteDue("");
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
            ["vendedores", `Vendedores (${sellers.length})`],
            ["pagos", `Pagos Zelle (${proofs.filter((p) => p.status === "pendiente").length})`],
            ["sitios", `Websites (${sites.length})`],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              tab === key
                ? "bg-judo-purple text-white"
                : "border border-judo-lilac/25 text-judo-fog/60 hover:text-judo-lilac"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── VENDEDORES ── */}
      {tab === "vendedores" && (
        <div className="mt-6 flex flex-col gap-4">
          {sellers.length === 0 && (
            <p className="text-sm text-judo-fog/50">Aún no hay vendedores registrados.</p>
          )}
          {sellers.map((s) => (
            <SellerCard key={s.id} seller={s} onSave={saveSeller} />
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
                  className="btn-secondary px-4 py-1.5 text-sm"
                >
                  Ver en Etherscan
                </a>
              )}
              {p.screenshot_path && (
                <button onClick={() => viewProof(p.screenshot_path!)} className="btn-secondary px-4 py-1.5 text-sm">
                  Ver captura
                </button>
              )}
              <button onClick={() => setProofStatus(p.id, "verificado")} className="btn-primary px-4 py-1.5 text-sm">
                Verificar ✓
              </button>
              <button
                onClick={() => setProofStatus(p.id, "rechazado")}
                className="rounded-full border border-red-400/40 px-4 py-1.5 text-sm text-red-300 hover:bg-red-400/10"
              >
                Rechazar
              </button>
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
              <input required type="number" min="1" value={sitePrice} onChange={(e) => setSitePrice(e.target.value)} placeholder="Precio mensual (USD)" className={inputClass} />
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
            <button type="submit" className="btn-primary mt-4">Crear website</button>
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
              </div>
              <button
                onClick={async () => {
                  await navigator.clipboard.writeText(site.kit_api_key);
                  flash("Clave del kit copiada ✓ (para conectar el website del cliente)");
                }}
                className="rounded-full border border-judo-lilac/30 px-3 py-1.5 text-sm text-judo-lilac hover:bg-judo-purple/15"
                title="Copiar la clave del Judo Site Kit"
              >
                🔑 Kit
              </button>
              <button onClick={() => registerPayment(site)} className="btn-secondary px-4 py-1.5 text-sm">
                💵 Registrar pago
              </button>
              <button
                onClick={() => toggleSite(site)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  site.status === "deshabilitado"
                    ? "bg-emerald-500/80 text-white hover:bg-emerald-500"
                    : "border border-red-400/40 text-red-300 hover:bg-red-400/10"
                }`}
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
        <button onClick={save} className="rounded-full bg-judo-purple px-3 py-1 text-xs font-semibold text-white hover:bg-judo-lilac">
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
}: {
  seller: SellerRow;
  onSave: (id: string, status: string, kind: string | null, value: string) => void;
}) {
  const [kind, setKind] = useState(seller.commission_kind ?? "monto_fijo");
  const [value, setValue] = useState(seller.commission_value?.toString() ?? "");

  return (
    <div className={`${box} flex flex-wrap items-center gap-4`}>
      {seller.profiles?.photo_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={seller.profiles.photo_url} alt="" className="h-12 w-12 rounded-full border border-judo-lilac/40 object-cover" />
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
        </p>
      </div>
      <div className="flex items-center gap-2">
        <select value={kind} onChange={(e) => setKind(e.target.value)} className={`${inputClass} w-auto py-2`}>
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
          className={`${inputClass} w-24 py-2`}
        />
      </div>
      <div className="flex gap-2">
        {seller.status !== "aprobado" && (
          <button onClick={() => onSave(seller.id, "aprobado", kind, value)} className="btn-primary px-4 py-1.5 text-sm">
            Aprobar ✓
          </button>
        )}
        {seller.status === "aprobado" && (
          <button onClick={() => onSave(seller.id, "aprobado", kind, value)} className="btn-primary px-4 py-1.5 text-sm">
            Guardar
          </button>
        )}
        {seller.status !== "rechazado" && seller.status !== "suspendido" && (
          <button
            onClick={() => onSave(seller.id, seller.status === "aprobado" ? "suspendido" : "rechazado", kind, value)}
            className="rounded-full border border-red-400/40 px-4 py-1.5 text-sm text-red-300 hover:bg-red-400/10"
          >
            {seller.status === "aprobado" ? "Suspender" : "Rechazar"}
          </button>
        )}
      </div>
    </div>
  );
}
