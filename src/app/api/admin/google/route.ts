// Los datos de Google de los websites, para el portal de administración.
//
//   GET ?todos=1          resumen de todos los websites (para el Resumen)
//   GET ?site=<id>        un website, con detalle
//   GET ?site=<id>&fresco=1   lo mismo, sin usar lo guardado
//
// Solo lectura. Cada website dice en su expediente (Medición) qué propiedad
// de Search Console y qué ID de Analytics le corresponden; aquí se consultan
// con la cuenta de servicio de Google (src/lib/google.ts).

import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { correoDelRobot, googleDeSitio, type GoogleDeSitio } from "@/lib/google";

async function comoAdmin(req: NextRequest): Promise<SupabaseClient | null> {
  const header = req.headers.get("authorization") || "";
  const accessToken = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!accessToken) return null;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
  );
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return null;
  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();
  return prof?.role === "admin" ? supabase : null;
}

type Sitio = { id: string; gsc_property: string | null; ga4_property_id: string | null };

export async function GET(req: NextRequest) {
  const supabase = await comoAdmin(req);
  if (!supabase) return NextResponse.json({ error: "Solo para Administración" }, { status: 403 });

  const params = req.nextUrl.searchParams;
  const robot = correoDelRobot();

  if (params.get("todos")) {
    const { data } = await supabase.from("sites").select("id,gsc_property,ga4_property_id");
    const sitios = ((data ?? []) as Sitio[]).filter((s) => s.gsc_property || s.ga4_property_id);
    const resultados = await Promise.all(
      sitios.map(async (s) => [s.id, await googleDeSitio(s.id, s.gsc_property, s.ga4_property_id)] as const)
    );
    const porSitio: Record<string, GoogleDeSitio> = {};
    for (const [id, g] of resultados) porSitio[id] = g;
    return NextResponse.json({ robot, sitios: porSitio });
  }

  const id = params.get("site");
  if (!id) return NextResponse.json({ error: "Falta el website" }, { status: 400 });
  const { data: sitio } = await supabase
    .from("sites")
    .select("id,gsc_property,ga4_property_id")
    .eq("id", id)
    .single();
  if (!sitio) return NextResponse.json({ error: "Ese website no existe" }, { status: 404 });
  const s = sitio as Sitio;
  const datos = await googleDeSitio(s.id, s.gsc_property, s.ga4_property_id, params.get("fresco") === "1");
  return NextResponse.json({ robot, ...datos });
}
