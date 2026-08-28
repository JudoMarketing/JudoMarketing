// Resumen de Juditos (los asistentes de IA) para el portal de administración.
//
// Juditos es otra aplicación con su propia base de datos, así que se le pide
// por HTTP, igual que a JuditoADS. El secreto compartido vive SOLO aquí en el
// servidor: si el navegador lo tuviera, cualquiera con la consola abierta
// podría leer la lista completa de clientes.

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * JUDITOS_URL es el ORIGEN del deploy (sin basePath), la misma que usa el
 * rewrite de next.config.ts. La app vive bajo /juditos, así que hay que
 * añadirlo aquí; si no, la ruta cae en el 404 del propio deploy.
 */
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

export async function GET(req: NextRequest) {
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

  const secret = process.env.JUDITOS_ADMIN_TOKEN;
  if (!secret) {
    return NextResponse.json(
      { error: "Falta JUDITOS_ADMIN_TOKEN en las variables de entorno." },
      { status: 501 }
    );
  }

  try {
    const res = await fetch(`${base}/api/admin/resumen`, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Juditos respondió ${res.status}` },
        { status: 502 }
      );
    }
    return NextResponse.json(await res.json());
  } catch {
    return NextResponse.json(
      { error: "No se pudo contactar a Juditos." },
      { status: 502 }
    );
  }
}
