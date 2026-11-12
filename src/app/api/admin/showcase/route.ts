// Renueva el showcase en cuanto Administración cambia un website en el portal.
//
// El showcase es ISR (revalidate = 120): sin esto, un cambio de estado o de
// descripción esperaba a que alguien visitara la página pasados dos minutos, y
// esa primera visita todavía veía la versión vieja. Junior, 11 de noviembre de
// 2026: "actualicé el estado de Pachy Pinchos a activo y aún no se actualiza".

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";

/** Solo el administrador, con su propia sesión (la misma regla que las demás rutas de admin). */
async function esAdmin(req: NextRequest): Promise<boolean> {
  const header = req.headers.get("authorization") || "";
  const accessToken = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!accessToken) return false;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
  );
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) return false;
  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();
  return prof?.role === "admin";
}

export async function POST(req: NextRequest) {
  if (!(await esAdmin(req))) {
    return NextResponse.json({ error: "Solo para Administración" }, { status: 403 });
  }
  // Las dos versiones (/es y /en) salen de la misma ruta
  revalidatePath("/[locale]/showcase", "page");
  return NextResponse.json({ ok: true });
}
