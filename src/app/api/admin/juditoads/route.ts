// Cuentas de JuditoADS para el portal de administración.
//
// JuditoADS es otra aplicación con su propia base de datos, así que se le
// pide por HTTP. El secreto compartido vive SOLO aquí en el servidor: si el
// navegador lo tuviera, cualquiera con la consola abierta podría leer la
// lista completa de clientes.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * JUDITOADS_URL es el ORIGEN del deploy (sin basePath). Es la misma que
 * usa el rewrite de next.config.ts. La app vive bajo /juditoads, así que hay
 * que añadirlo aquí; si no, la ruta cae en el 404 del propio deploy.
 */
function juditoadsBase(): string {
  const origin = process.env.JUDITOADS_URL;
  if (!origin) return "https://www.judomarketing.net/juditoads";
  return `${origin.replace(/\/$/, "")}/juditoads`;
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

export async function GET(req: NextRequest) {
  const header = req.headers.get("authorization") || "";
  const accessToken = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!accessToken || !(await esAdmin(accessToken))) {
    return NextResponse.json({ error: "Solo para Administración" }, { status: 403 });
  }

  const secret = process.env.JUDITOADS_ADMIN_TOKEN;
  if (!secret) {
    return NextResponse.json(
      { error: "Falta JUDITOADS_ADMIN_TOKEN en las variables de entorno." },
      { status: 501 }
    );
  }

  try {
    const res = await fetch(`${juditoadsBase()}/api/admin/usuarios`, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `JuditoADS respondió ${res.status}` },
        { status: 502 }
      );
    }
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json(
      { error: "No se pudo contactar a JuditoADS." },
      { status: 502 }
    );
  }
}

/**
 * Acciones sobre una cuenta de JuditoADS: suspender, reactivar o eliminar.
 *
 * El portal manda la orden y este servidor la reenvía con el secreto
 * compartido; quien de verdad la ejecuta es la app de JuditoADS en su
 * propia base. El contrato es:
 *   POST {base}/api/admin/usuarios  { accion, userId }
 *   → 200 { ok: true }  o  { error: "..." }
 */
const ACCIONES = ["suspender", "reactivar", "eliminar"] as const;

export async function POST(req: NextRequest) {
  const header = req.headers.get("authorization") || "";
  const accessToken = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!accessToken || !(await esAdmin(accessToken))) {
    return NextResponse.json({ error: "Solo para Administración" }, { status: 403 });
  }

  const secret = process.env.JUDITOADS_ADMIN_TOKEN;
  if (!secret) {
    return NextResponse.json(
      { error: "Falta JUDITOADS_ADMIN_TOKEN en las variables de entorno." },
      { status: 501 }
    );
  }

  const { accion, userId } = (await req.json().catch(() => ({}))) as {
    accion?: string;
    userId?: string;
  };
  if (!ACCIONES.includes(accion as (typeof ACCIONES)[number]) || !userId) {
    return NextResponse.json({ error: "Petición inválida" }, { status: 400 });
  }

  try {
    const res = await fetch(`${juditoadsBase()}/api/admin/usuarios`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ accion, userId }),
      cache: "no-store",
    });
    const cuerpo = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        {
          error:
            (cuerpo as { error?: string }).error ??
            // 404/405: la app de JuditoADS todavía no implementa acciones
            (res.status === 404 || res.status === 405
              ? "JuditoADS todavía no acepta esta orden: falta implementarla en su app."
              : `JuditoADS respondió ${res.status}`),
        },
        { status: 502 }
      );
    }
    return NextResponse.json(cuerpo);
  } catch {
    return NextResponse.json(
      { error: "No se pudo contactar a JuditoADS." },
      { status: 502 }
    );
  }
}
