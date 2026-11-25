import { NextRequest, NextResponse } from "next/server";
import { agendarCita, cuposTomados, pasoElLimite, type DatosCita } from "@/lib/agendar";

/**
 * Citas por videollamada (Google Meet).
 *  GET  ?desde=YYYY-MM-DD&hasta=YYYY-MM-DD  → cupos ya tomados en ese rango.
 *  POST                                     → agenda la cita, avisa por correo
 *                                             y manda la invitación de calendario.
 *
 * Las reglas y los correos viven en src/lib/agendar.ts, que comparte con el
 * chat de la mascota: los dos agendan igual.
 */

/** Límite flojo contra inundaciones: cualquier envío, aunque venga mal. */
const inundacion = new Map<string, number[]>();

export async function GET(req: NextRequest) {
  const desde = req.nextUrl.searchParams.get("desde");
  const hasta = req.nextUrl.searchParams.get("hasta");
  if (!desde || !hasta) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  // Si algo falla no se bloquea el calendario: se muestra todo libre y el POST
  // sigue siendo el que manda sobre los choques de horario.
  try {
    const inicioRango = new Date(desde);
    const finRango = new Date(hasta);
    if (Number.isNaN(inicioRango.getTime()) || Number.isNaN(finRango.getTime())) {
      return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }
    const tomados = await cuposTomados(inicioRango, finRango);
    return NextResponse.json({ tomados: [...tomados] });
  } catch {
    return NextResponse.json({ tomados: [] });
  }
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "desconocido";
  if (pasoElLimite(inundacion, ip, 20)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const cuerpo = (await req.json().catch(() => null)) as DatosCita | null;
  if (!cuerpo) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const resultado = await agendarCita(cuerpo, ip);
  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.error }, { status: resultado.status });
  }
  return NextResponse.json({
    ok: true,
    id: resultado.id,
    meet: resultado.meet,
    google: resultado.google,
  });
}
