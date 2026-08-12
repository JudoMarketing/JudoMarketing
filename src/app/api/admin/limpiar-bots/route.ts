import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Barre las aplicaciones de vendedor que dejan los bots.
 *
 * Un bot llena el registro, se crea la cuenta y nunca abre el correo de
 * confirmación: la aplicación queda en la lista de pendientes para siempre y
 * hay que borrarla a mano, una por una. Esto las junta y las borra de golpe.
 *
 * No sustituye al captcha. Mientras Supabase Auth no exija el token, el bot
 * puede llamar a la API de registro sin pasar por la página y seguirá
 * entrando; esto solo limpia lo que ya entró.
 *
 * Se borra únicamente lo que no puede ser una persona de verdad:
 *   - la cuenta nunca confirmó su correo,
 *   - lleva más de un día así (nadie tarda tanto en abrir el correo, y quien
 *     acaba de registrarse hace un minuto no se toca),
 *   - sigue en 'pendiente',
 *   - y no tiene NADA a su nombre: ni visitas, ni contratos, ni comisiones,
 *     ni bonos, ni websites.
 * Con que una sola de esas condiciones falle, la cuenta se queda.
 *
 * POST { soloContar: true } devuelve la lista sin borrar nada, para poder
 * mirarla antes de decidir.
 */

const HORAS_DE_GRACIA = 24;
const FALLBACK_EMAIL = "juniorosorio36@gmail.com";

type Candidato = { id: string; email: string; nombre: string; creada: string };

/** Las tablas donde un vendedor de verdad deja rastro. */
const RASTROS: [string, string][] = [
  ["visits", "seller_id"],
  ["signed_contracts", "seller_id"],
  ["commissions", "seller_id"],
  ["sites", "seller_id"],
  ["referral_bonuses", "referrer_id"],
  ["referral_bonuses", "referred_id"],
  ["payments", "recorded_by"],
];

async function conActividad(admin: SupabaseClient, ids: string[]): Promise<Set<string>> {
  const ocupados = new Set<string>();
  for (const [tabla, columna] of RASTROS) {
    const { data, error } = await admin.from(tabla).select(columna).in(columna, ids);
    // Ante la duda no se borra: si la consulta falla, se salvan todos
    if (error) return new Set(ids);
    for (const fila of (data ?? []) as unknown as Record<string, string | null>[]) {
      const valor = fila[columna];
      if (valor) ocupados.add(valor);
    }
  }
  return ocupados;
}

export async function POST(req: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !url) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const jwt = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!jwt) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { soloContar } = (await req.json().catch(() => ({}))) as { soloContar?: boolean };

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

  // 1. Las cuentas que nunca confirmaron el correo. El estado de confirmación
  //    vive en auth.users, que solo se puede leer con la llave de servicio.
  const limite = Date.now() - HORAS_DE_GRACIA * 3600_000;
  const sinConfirmar: Candidato[] = [];
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) {
      return NextResponse.json(
        { error: "list_failed", message: error.message },
        { status: 500 }
      );
    }
    const usuarios = data?.users ?? [];
    for (const u of usuarios) {
      if (u.email_confirmed_at) continue;
      if (Date.parse(u.created_at) > limite) continue;
      if ((u.email ?? "").toLowerCase() === FALLBACK_EMAIL) continue;
      sinConfirmar.push({
        id: u.id,
        email: u.email ?? "sin correo",
        nombre: String(u.user_metadata?.full_name ?? "Sin nombre"),
        creada: u.created_at,
      });
    }
    if (usuarios.length < 1000) break;
  }

  if (sinConfirmar.length === 0) {
    return NextResponse.json({ candidatos: [], borrados: 0 });
  }

  // 2. Solo vendedores pendientes: un admin o un vendedor ya aprobado no se toca
  const ids = sinConfirmar.map((c) => c.id);
  const [{ data: perfiles }, { data: fichas }] = await Promise.all([
    admin.from("profiles").select("id,role").in("id", ids),
    admin.from("sellers").select("id,status").in("id", ids),
  ]);
  const pendientes = new Set(
    (fichas ?? [])
      .filter((f) => (f as { status: string }).status === "pendiente")
      .map((f) => (f as { id: string }).id)
  );
  const admins = new Set(
    (perfiles ?? [])
      .filter((p) => (p as { role: string }).role === "admin")
      .map((p) => (p as { id: string }).id)
  );

  // 3. Y sin nada a su nombre
  const ocupados = await conActividad(admin, ids);

  const candidatos = sinConfirmar.filter(
    (c) => pendientes.has(c.id) && !admins.has(c.id) && !ocupados.has(c.id)
  );

  if (soloContar || candidatos.length === 0) {
    return NextResponse.json({ candidatos, borrados: 0 });
  }

  // 4. A borrar. terms_acceptances no cae en cascada y referred_by tampoco,
  //    así que se sueltan primero o el borrado falla.
  const aBorrar = candidatos.map((c) => c.id);
  await admin.from("terms_acceptances").delete().in("user_id", aBorrar);
  await admin.from("sellers").update({ referred_by: null }).in("referred_by", aBorrar);

  const borrados: string[] = [];
  const fallidos: { email: string; motivo: string }[] = [];
  for (const c of candidatos) {
    const { error } = await admin.auth.admin.deleteUser(c.id);
    if (error) fallidos.push({ email: c.email, motivo: error.message });
    else borrados.push(c.email);
  }

  if (borrados.length) {
    await admin.from("audit_log").insert({
      actor: userData.user.id,
      action: "bot_applications_purged",
      target: `${borrados.length} aplicaciones sin confirmar: ${borrados.join(", ").slice(0, 500)}`,
    });
  }

  return NextResponse.json({ candidatos, borrados: borrados.length, fallidos });
}
