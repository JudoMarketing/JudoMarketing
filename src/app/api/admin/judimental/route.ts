// JudiMental para el portal de administración: solo mirar.
//
// JudiMental es la app del teléfono y vive en su propio repo y su propia base
// de datos. Aquí solo se pide un resumen: quién está registrado y cómo va.
//
// SOLO LECTURA A PROPÓSITO. Esta ruta no tiene POST ni PATCH. Lo que se ve
// desde el portal es el AVANCE (cuándo entró, cuándo fue su última vez, en qué
// punto va), nunca el CONTENIDO de lo que la persona escribe en la app. Es una
// app de salud mental: el contenido no debe salir de ella ni pasar por este
// servidor. Si algún día hace falta actuar sobre una cuenta, se agrega la
// acción explícitamente y se piensa aparte.
//
// Contrato con JudiMental:
//   GET {JUDIMENTAL_URL}/api/admin/resumen
//   → 200 {
//       totales: { registrados, activos7d, sesiones },
//       personas: [{
//         id, nombre, email, registradoEn,
//         ultimaActividad, racha, progreso: { etiqueta, porcentaje }, plan
//       }]
//     }

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { hablarCon } from "@/lib/apps-hermanas";

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

  const r = await hablarCon("judimental", "/api/admin/resumen");
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 502 });
  return NextResponse.json(r.cuerpo);
}
