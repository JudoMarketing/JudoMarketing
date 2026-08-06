import { NextResponse } from "next/server";
import { horariosOcupados } from "@/lib/google-calendar";

/**
 * Chequeo de la lectura de agenda.
 *
 * Solo dice cuántos bloques ocupados devolvió Google en los próximos 30 días.
 * Nunca el título, ni los invitados, ni de qué calendario viene: únicamente el
 * conteo, para saber si el permiso freebusy quedó autorizado. Es temporal.
 */

export const dynamic = "force-dynamic";

export async function GET() {
  const desde = new Date();
  const hasta = new Date(desde.getTime() + 30 * 24 * 60 * 60_000);

  const calendarios = process.env.GOOGLE_BUSY_CALENDARS?.trim()
    ? process.env.GOOGLE_BUSY_CALENDARS.split(",").map((c) => c.trim())
    : ["primary", "juniorosorio36@gmail.com"];

  const bloques = await horariosOcupados(desde, hasta, calendarios);

  return NextResponse.json(
    {
      agendasConsultadas: calendarios.length,
      bloquesOcupados: bloques.length,
      lectura: bloques.length > 0 ? "funcionando" : "sin_datos",
      nota:
        bloques.length > 0
          ? "Google está entregando los horarios ocupados."
          : "O no hay eventos en los próximos 30 días, o falta autorizar el permiso freebusy.",
    },
    { headers: { "cache-control": "no-store", "x-robots-tag": "noindex" } }
  );
}
