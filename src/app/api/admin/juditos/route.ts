// Puente entre el portal de administración y Juditos.
//
// Juditos es otra aplicación con su propia base de datos, así que se le pide
// por HTTP. El secreto compartido vive SOLO aquí en el servidor: si el
// navegador lo tuviera, cualquiera con la consola abierta podría leer la
// lista completa de clientes o cambiar la lógica de sus bots.
//
//   GET                       resumen de todos los clientes y sus Juditos
//   GET  ?judito=<id>         la lógica de un Judito
//   GET  ?facturas=<cliente>  historial de facturas
//   PATCH                     guarda la lógica de un Judito
//   POST                      emite una factura

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function juditosBase(): string | null {
  const origin = process.env.JUDITOS_URL;
  if (!origin) return null;
  return `${origin.replace(/\/$/, "")}/juditos`;
}

/** Solo la cuenta con role='admin' puede ver esto. */
async function esAdmin(accessToken: string): Promise<boolean> {
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

type Contexto = { base: string; secreto: string };

async function preparar(req: NextRequest): Promise<Contexto | NextResponse> {
  const header = req.headers.get("authorization") || "";
  const accessToken = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!accessToken || !(await esAdmin(accessToken))) {
    return NextResponse.json({ error: "Solo para Administración" }, { status: 403 });
  }

  const base = juditosBase();
  if (!base) {
    return NextResponse.json(
      { error: "Falta JUDITOS_URL en las variables de entorno." },
      { status: 501 }
    );
  }

  const secreto = process.env.JUDITOS_ADMIN_TOKEN;
  if (!secreto) {
    return NextResponse.json(
      { error: "Falta JUDITOS_ADMIN_TOKEN en las variables de entorno." },
      { status: 501 }
    );
  }

  return { base, secreto };
}

/** Reenvía a Juditos con el secreto y devuelve su respuesta tal cual. */
async function reenviar(
  ctx: Contexto,
  ruta: string,
  init: RequestInit = {}
): Promise<NextResponse> {
  try {
    const res = await fetch(`${ctx.base}${ruta}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${ctx.secreto}`,
        ...(init.body ? { "Content-Type": "application/json" } : {}),
      },
      cache: "no-store",
    });
    const cuerpo = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: cuerpo.error || `Juditos respondió ${res.status}` },
        { status: res.status === 403 ? 502 : res.status }
      );
    }
    return NextResponse.json(cuerpo);
  } catch {
    return NextResponse.json({ error: "No se pudo contactar a Juditos." }, { status: 502 });
  }
}

export async function GET(req: NextRequest) {
  const ctx = await preparar(req);
  if (ctx instanceof NextResponse) return ctx;

  const params = req.nextUrl.searchParams;

  const judito = params.get("judito");
  if (judito) return reenviar(ctx, `/api/admin/judito?id=${encodeURIComponent(judito)}`);

  const facturas = params.get("facturas");
  if (facturas) {
    return reenviar(ctx, `/api/admin/factura?clientId=${encodeURIComponent(facturas)}`);
  }

  return reenviar(ctx, "/api/admin/resumen");
}

export async function PATCH(req: NextRequest) {
  const ctx = await preparar(req);
  if (ctx instanceof NextResponse) return ctx;

  const cuerpo = await req.json().catch(() => ({}));
  return reenviar(ctx, "/api/admin/judito", { method: "PATCH", body: JSON.stringify(cuerpo) });
}

export async function POST(req: NextRequest) {
  const ctx = await preparar(req);
  if (ctx instanceof NextResponse) return ctx;

  const cuerpo = await req.json().catch(() => ({}));
  return reenviar(ctx, "/api/admin/factura", { method: "POST", body: JSON.stringify(cuerpo) });
}
