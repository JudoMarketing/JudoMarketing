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

  // Regla del dueño: al eliminar un vendedor, todo su historial pasa a la
  // cuenta de la casa (juniorosorio36@gmail.com): comisiones, bonos,
  // websites asignados, visitas y contratos. Nada de dinero ni evidencia
  // legal se pierde.
  const FALLBACK_EMAIL = "juniorosorio36@gmail.com";
  const { data: fallback } = await admin
    .from("profiles")
    .select("id")
    .eq("email", FALLBACK_EMAIL)
    .single();
  if (!fallback) {
    return NextResponse.json({ error: "fallback_missing" }, { status: 500 });
  }
  if (fallback.id === userId) {
    return NextResponse.json({ error: "cannot_delete_fallback" }, { status: 400 });
  }
  const { data: fallbackSeller } = await admin
    .from("sellers")
    .select("id")
    .eq("id", fallback.id)
    .single();
  if (!fallbackSeller) {
    return NextResponse.json({ error: "fallback_missing" }, { status: 500 });
  }

  const transfers: [string, PromiseLike<{ error: { message: string } | null }>][] = [
    ["comisiones", admin.from("commissions").update({ seller_id: fallback.id }).eq("seller_id", userId)],
    ["bonos (referidor)", admin.from("referral_bonuses").update({ referrer_id: fallback.id }).eq("referrer_id", userId)],
    ["bonos (referido)", admin.from("referral_bonuses").update({ referred_id: fallback.id }).eq("referred_id", userId)],
    ["websites", admin.from("sites").update({ seller_id: fallback.id }).eq("seller_id", userId)],
    ["visitas", admin.from("visits").update({ seller_id: fallback.id }).eq("seller_id", userId)],
    ["contratos", admin.from("signed_contracts").update({ seller_id: fallback.id }).eq("seller_id", userId)],
    ["referidos del vendedor", admin.from("sellers").update({ referred_by: fallback.id }).eq("referred_by", userId)],
    ["aprobaciones", admin.from("sellers").update({ approved_by: null }).eq("approved_by", userId)],
    ["pagos registrados", admin.from("payments").update({ recorded_by: null }).eq("recorded_by", userId)],
    ["auditoría", admin.from("audit_log").update({ actor: null }).eq("actor", userId)],
    ["clientes", admin.from("clients").update({ profile_id: null }).eq("profile_id", userId)],
    ["aceptación de términos", admin.from("terms_acceptances").delete().eq("user_id", userId)],
  ];
  for (const [label, op] of transfers) {
    const { error: tErr } = await op;
    if (tErr) {
      console.error(`transfer error (${label}):`, tErr.message);
      return NextResponse.json(
        { error: "transfer_failed", message: `${label}: ${tErr.message}` },
        { status: 500 }
      );
    }
  }

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) {
    const msg = error.message ?? "unknown";
    console.error("delete seller error:", msg);
    return NextResponse.json({ error: "delete_failed", message: msg }, { status: 500 });
  }

  return NextResponse.json({ deleted: true, transferredTo: FALLBACK_EMAIL });
}
