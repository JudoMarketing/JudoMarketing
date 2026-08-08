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

/**
 * Reporta métricas del sitio al panel central.
 *
 * El contrato es el mismo para TODOS los sitios: así el panel puede comparar
 * dos clientes sin traducir nada. Reglas que no se rompen:
 *   · el ingreso va en CENTAVOS enteros, nunca en decimales
 *   · siempre acompañado de su moneda
 *   · si un dato no se tiene, se manda vacío; no se inventa un cero
 *
 * Nunca lanza: la telemetría jamás debe tumbar el sitio de un cliente.
 */
export async function reportMetrics(metrics: {
  /** ¿El sitio está en pie? Lo manda el cron diario. */
  live?: boolean;
  /** Órdenes cerradas en el período que se reporta. */
  orders?: number;
  /** Ingreso del período, en centavos enteros. 1234 = $12.34 */
  revenueCents?: number;
  /** Moneda del ingreso, en tres letras. Ej: "USD" */
  currency?: string;
  /** Sesiones (visitantes distintos). */
  sessions?: number;
  /** Visitas totales (páginas vistas). */
  traffic?: number;
  /** Conversiones: formularios, citas, llamadas. */
  conversions?: number;
  /** Puntaje SEO propio del sitio, de 0 a 100. */
  seo?: number;
  /** Disponibilidad del período, de 0 a 100. */
  uptimePct?: number;
  /** Último error grave, para verlo desde el panel sin entrar a los logs. */
  lastError?: string;
  /** Lo que sea propio de este negocio y no entre arriba. */
  detail?: Record<string, unknown>;
}): Promise<void> {
  if (!KIT_KEY || !ANON_KEY) return;
  try {
    await fetch(`${STATUS_URL}/rest/v1/rpc/report_site_metrics_v2`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify({
        kit_key: KIT_KEY,
        p_is_live: metrics.live ?? true,
        p_orders: metrics.orders ?? null,
        p_revenue_cents: metrics.revenueCents ?? null,
        p_currency: metrics.currency ?? null,
        p_sessions: metrics.sessions ?? null,
        p_traffic: metrics.traffic ?? null,
        p_conversions: metrics.conversions ?? null,
        p_seo: metrics.seo ?? null,
        p_uptime_pct: metrics.uptimePct ?? null,
        p_last_error: metrics.lastError ?? null,
        p_detail: metrics.detail ?? null,
      }),
    });
  } catch {
    // la telemetría nunca debe romper el sitio del cliente
  }
}
