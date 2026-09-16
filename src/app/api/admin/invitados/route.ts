// Sillas de invitado: gente que entra a una app de la casa sin pagar.
//
// El reparto de trabajo es el de siempre (docs/QUIEN-HACE-QUE.md): la lista y
// el registro viven aquí, en la base de judomarketing.net; quien de verdad
// deja de cobrar es la app hermana, en su propia base. Esta ruta guarda la
// silla, se la manda a la app y anota si la aceptó.
//
// Contrato con la app hermana:
//   POST {base}/api/admin/invitados
//        { accion: "otorgar" | "revocar", email, nombre?, nota?, expira? }
//   → 200 { ok: true }   |   4xx/5xx { error: "..." }

import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { ES_APP_INVITADO, nombreApp, type AppInvitado } from "@/content/apps-hermanas";
import { hablarCon } from "@/lib/apps-hermanas";

type Silla = {
  id: string;
  app: AppInvitado;
  email: string;
  name: string | null;
  note: string | null;
  expires_at: string | null;
  status: "pendiente" | "activa" | "revocada" | "error";
  synced_at: string | null;
  last_error: string | null;
  created_at: string;
};

const COLUMNAS =
  "id, app, email, name, note, expires_at, status, synced_at, last_error, created_at";

/**
 * Cliente de Supabase con la sesión del admin, no con la llave de servicio:
 * así la política RLS "admin: sillas de invitado" sigue siendo la que manda.
 * Devuelve null si quien llama no es el administrador.
 */
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

const noAutorizado = () =>
  NextResponse.json({ error: "Solo para Administración" }, { status: 403 });

/** Manda la orden a la app hermana y deja anotado en la fila cómo le fue. */
async function sincronizar(
  supabase: SupabaseClient,
  silla: Silla,
  accion: "otorgar" | "revocar"
): Promise<Silla> {
  const r = await hablarCon(silla.app, "/api/admin/invitados", {
    method: "POST",
    body: JSON.stringify({
      accion,
      email: silla.email,
      nombre: silla.name,
      nota: silla.note,
      expira: silla.expires_at,
    }),
  });

  const cambio = r.ok
    ? {
        status: accion === "otorgar" ? "activa" : "revocada",
        synced_at: new Date().toISOString(),
        last_error: null,
      }
    : {
        // Si falla no se miente: la silla queda "pendiente" con el motivo a la
        // vista y un botón para reintentar. La app hermana no la aplicó.
        status: accion === "otorgar" ? "pendiente" : "error",
        last_error: r.error,
      };

  const { data } = await supabase
    .from("guest_seats")
    .update(cambio)
    .eq("id", silla.id)
    .select(COLUMNAS)
    .single();

  return (data as Silla) ?? { ...silla, ...cambio } as Silla;
}

export async function GET(req: NextRequest) {
  const supabase = await comoAdmin(req);
  if (!supabase) return noAutorizado();

  const { data, error } = await supabase
    .from("guest_seats")
    .select(COLUMNAS)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      {
        error:
          error.code === "42P01"
            ? "Falta correr la migración 0025 (tabla guest_seats)."
            : error.message,
      },
      { status: 500 }
    );
  }
  return NextResponse.json({ sillas: (data ?? []) as Silla[] });
}

export async function POST(req: NextRequest) {
  const supabase = await comoAdmin(req);
  if (!supabase) return noAutorizado();

  const body = (await req.json().catch(() => ({}))) as {
    accion?: string;
    id?: string;
    app?: string;
    email?: string;
    nombre?: string;
    nota?: string;
    expira?: string | null;
    /** Solo para "eliminar": borrar la fila aunque la app no confirmara. */
    forzar?: boolean;
  };

  // ── Dar una silla nueva ──────────────────────────────────────────
  if (body.accion === "otorgar") {
    const email = (body.email ?? "").trim().toLowerCase();
    if (!body.app || !ES_APP_INVITADO(body.app)) {
      return NextResponse.json({ error: "App desconocida" }, { status: 400 });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "Ese correo no se ve bien" }, { status: 400 });
    }

    const { data: quien } = await supabase.auth.getUser();
    const { data: creada, error } = await supabase
      .from("guest_seats")
      .insert({
        app: body.app,
        email,
        name: body.nombre?.trim() || null,
        note: body.nota?.trim() || null,
        expires_at: body.expira || null,
        granted_by: quien?.user?.id ?? null,
      })
      .select(COLUMNAS)
      .single();

    if (error) {
      // 23505 = ya existe esa persona en esa app
      if (error.code === "23505") {
        return NextResponse.json(
          { error: `${email} ya tiene silla en ${nombreApp(body.app)}.` },
          { status: 409 }
        );
      }
      return NextResponse.json(
        {
          error:
            error.code === "42P01"
              ? "Falta correr la migración 0025 (tabla guest_seats)."
              : error.message,
        },
        { status: 500 }
      );
    }

    const silla = await sincronizar(supabase, creada as Silla, "otorgar");
    return NextResponse.json({ ok: true, silla });
  }

  // ── Las demás acciones son sobre una silla que ya existe ─────────
  if (!body.id) return NextResponse.json({ error: "Petición inválida" }, { status: 400 });

  const { data: fila } = await supabase
    .from("guest_seats")
    .select(COLUMNAS)
    .eq("id", body.id)
    .single();
  if (!fila) return NextResponse.json({ error: "Esa silla ya no existe" }, { status: 404 });
  const silla = fila as Silla;

  if (body.accion === "revocar") {
    return NextResponse.json({ ok: true, silla: await sincronizar(supabase, silla, "revocar") });
  }

  // Volver a mandarle a la app la orden que quedó a medias.
  if (body.accion === "reintentar") {
    const accion = silla.status === "revocada" || silla.status === "error" ? "revocar" : "otorgar";
    return NextResponse.json({ ok: true, silla: await sincronizar(supabase, silla, accion) });
  }

  // Borrar la fila. Se revoca primero: si se borrara sin avisarle a la app,
  // la persona seguiría entrando gratis y ya no quedaría rastro de por qué.
  if (body.accion === "eliminar") {
    const revocada = await sincronizar(supabase, silla, "revocar");
    if (revocada.status !== "revocada" && !body.forzar) {
      return NextResponse.json(
        {
          error: `No se pudo quitarle el acceso en ${nombreApp(silla.app)}: ${
            revocada.last_error ?? "sin detalle"
          }. La silla NO se borró, para no perder el rastro.`,
          silla: revocada,
        },
        { status: 502 }
      );
    }
    await supabase.from("guest_seats").delete().eq("id", silla.id);
    return NextResponse.json({ ok: true, eliminada: silla.id });
  }

  return NextResponse.json({ error: "Petición inválida" }, { status: 400 });
}
