import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * Eliminar una aplicación de vendedor (cuenta completa: auth + perfil +
 * ficha, en cascada). Solo puede invocarlo una sesión de admin.
 * Usa la service role key del servidor; si el vendedor tiene actividad
 * (visitas, contratos, comisiones) la base lo bloquea y se sugiere
 * Rechazar o Suspender para no perder historial.
 */

export async function POST(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !url) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const jwt = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!jwt) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { userId } = (await req.json()) as { userId?: string };
  if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  // ¿Quien llama es admin de verdad?
  const asCaller = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data: userData } = await asCaller.auth.getUser(jwt);
  if (!userData.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { data: callerProf } = await asCaller
    .from("profiles")
    .select("role")
    .eq("id", userData.user.id)
    .single();
  if (callerProf?.role !== "admin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Nunca eliminar una cuenta de administración
  const { data: targetProf } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  if (targetProf?.role === "admin") {
    return NextResponse.json({ error: "cannot_delete_admin" }, { status: 400 });
  }

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    // Restricciones de la base: el vendedor tiene actividad ligada
    const msg = error.message ?? "unknown";
    console.error("delete seller error:", msg);
    return NextResponse.json(
      { error: "has_activity", message: msg },
      { status: 409 }
    );
  }

  return NextResponse.json({ deleted: true });
}
