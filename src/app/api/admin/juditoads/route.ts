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
