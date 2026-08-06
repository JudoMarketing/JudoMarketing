import { NextResponse } from "next/server";
import { diagnosticarGoogle } from "@/lib/google-calendar";

/**
 * Revisión de la conexión con Google Calendar.
 *
 * Solo dice si cada variable está puesta (sí/no, nunca su contenido) y qué
 * respondió Google, con los correos y tokens tapados. Sirve para saber en qué
 * paso se rompe la configuración sin tener que entrar al panel de Vercel.
 * Es temporal: se puede borrar cuando la conexión quede funcionando.
 */

export const dynamic = "force-dynamic";

export async function GET() {
  const reporte = await diagnosticarGoogle();
  return NextResponse.json(reporte, {
    headers: { "cache-control": "no-store", "x-robots-tag": "noindex" },
  });
}
