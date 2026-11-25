import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { autorizado } from "@/lib/leads";

/**
 * Diagnóstico de solo lectura del portal (25 de noviembre de 2026): lo que la
 * base tiene guardado de cada website, para comparar con lo que muestra el
 * portal y el showcase cuando algo «se desincroniza».
 *
 * Solo con `Authorization: Bearer LEADS_SECRET`. Devuelve únicamente columnas
 * que no son secretas (nunca la clave del Judo Site Kit) y no escribe nada.
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!autorizado(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const llave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !llave) return NextResponse.json({ error: "Sin base" }, { status: 501 });

  const supabase = createClient(url, llave, { auth: { persistSession: false } });
  const { data, error } = await supabase
    .from("sites")
    .select("name,status,domain,portfolio_visible,portfolio_category,created_at")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: bitacora } = await supabase
    .from("audit_log")
    .select("action,created_at")
    .order("created_at", { ascending: false })
    .limit(15);

  return NextResponse.json({
    websites: (data ?? []).map((s) => ({
      nombre: s.name,
      estado: s.status,
      dominio: s.domain,
      portafolio: s.portfolio_visible,
      categoria: s.portfolio_category,
    })),
    ultimosMovimientos: bitacora ?? [],
  });
}
