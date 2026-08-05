/**
 * Judo Site Kit: conexión del website del cliente con el panel central
 * de Judo Marketing. Ver kit/README.md para la instalación.
 */

const STATUS_URL =
  process.env.NEXT_PUBLIC_JUDO_STATUS_URL ?? "https://ajsuskyeatgatbubctzl.supabase.co";
const KIT_KEY = process.env.JUDO_KIT_KEY ?? "";
const ANON_KEY = process.env.JUDO_ANON_KEY ?? "";

/** Consulta el estado del sitio en el panel central. Fail-open: ante
 *  cualquier error responde "activo" para no tumbar al cliente. */
export async function fetchSiteStatus(): Promise<string> {
  if (!KIT_KEY || !ANON_KEY) return "activo";
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`${STATUS_URL}/rest/v1/rpc/site_status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify({ kit_key: KIT_KEY }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return "activo";
    const status = (await res.json()) as string | null;
    return status ?? "activo";
  } catch {
    return "activo";
  }
}

/** Reporta métricas del sitio al panel central (ventas, tráfico, seo). */
export async function reportMetrics(metrics: {
  live?: boolean;
  sales?: number;
  traffic?: number;
  seo?: number;
  detail?: Record<string, unknown>;
}): Promise<void> {
  if (!KIT_KEY || !ANON_KEY) return;
  try {
    await fetch(`${STATUS_URL}/rest/v1/rpc/report_site_metrics`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify({
        kit_key: KIT_KEY,
        p_is_live: metrics.live ?? true,
        p_sales: metrics.sales ?? null,
        p_traffic: metrics.traffic ?? null,
        p_seo: metrics.seo ?? null,
        p_detail: metrics.detail ?? null,
      }),
    });
  } catch {
    // la telemetría nunca debe romper el sitio del cliente
  }
}
