import type Anthropic from "@anthropic-ai/sdk";
import { agendarCita, cuposTomados, fechaLegible } from "@/lib/agendar";
import { DIAS_A_FUTURO, cuposEnRango, miamiAUtc } from "@/lib/booking";

/**
 * Las herramientas del chat de la mascota: ver horarios libres y agendar la
 * videollamada (Junior, 25 de noviembre de 2026: «que pueda hacer citas desde
 * ese chat»).
 *
 * El modelo nunca decide si un horario está libre ni guarda nada por su
 * cuenta: pide los cupos a ver_horarios y agendar_cita pasa por la misma
 * función que el calendario de la página de contacto (src/lib/agendar.ts),
 * que vuelve a revisar choques, valida el correo y aplica el tope por IP.
 *
 * La lista no cambia entre mensajes ni de orden: va en la caché del prompt.
 */
export const HERRAMIENTAS: Anthropic.Beta.BetaTool[] = [
  {
    name: "ver_horarios",
    description:
      "Devuelve la fecha y hora actuales en Miami y los horarios libres para una videollamada por Google Meet con el equipo de Judo Marketing, en hora de Miami. Úsala antes de ofrecer cualquier horario. Cada horario trae su `slot` (el valor exacto que se le pasa a agendar_cita) y `cuando` (cómo decírselo al visitante).",
    input_schema: {
      type: "object",
      properties: {
        desde: {
          type: "string",
          description: "Día desde el que buscar, en formato AAAA-MM-DD (hora de Miami). Si no se da, desde ahora.",
        },
        dias: {
          type: "integer",
          description: "Cuántos días revisar a partir de `desde`, de 1 a 14. Por defecto 5.",
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "agendar_cita",
    description:
      "Agenda la videollamada y le manda al visitante la invitación con el enlace de Google Meet a su correo. Úsala solo después de que el visitante confirmó el día, la hora, su nombre y su correo. El `slot` tiene que ser uno de los que devolvió ver_horarios.",
    input_schema: {
      type: "object",
      properties: {
        slot: { type: "string", description: "El `slot` exacto que devolvió ver_horarios." },
        nombre: { type: "string", description: "Nombre del visitante." },
        correo: { type: "string", description: "Correo del visitante, donde le llega la invitación." },
        telefono: { type: "string", description: "Teléfono del visitante, si lo dio. Vacío si no." },
        nota: {
          type: "string",
          description:
            "En español, de 1 a 3 líneas: a qué se dedica su negocio, dónde está, cuál es su problema y qué le interesa.",
        },
      },
      required: ["slot", "nombre", "correo", "nota"],
      additionalProperties: false,
    },
  },
];

const HORA = 60 * 60_000;
const DIA = 24 * HORA;

/** Lo que sale de una herramienta: el texto para el modelo y, si agendó, la cita. */
export type Salida = { texto: string; error?: boolean; cita?: { cuando: string; meet: string | null } };

const texto = (v: unknown) => (typeof v === "string" ? v.trim() : "");

async function verHorarios(entrada: Record<string, unknown>, locale: string): Promise<Salida> {
  const ahora = new Date();
  const dias = Math.min(14, Math.max(1, Math.round(Number(entrada.dias) || 5)));
  // Con dos horas de aviso como mínimo: nadie agenda para dentro de diez minutos.
  let inicio = new Date(ahora.getTime() + 2 * HORA);
  const desde = texto(entrada.desde);
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(desde);
  if (partes) {
    const medianoche = miamiAUtc(Number(partes[1]), Number(partes[2]), Number(partes[3]), 0);
    if (medianoche > inicio) inicio = medianoche;
  }
  const fin = new Date(Math.min(inicio.getTime() + dias * DIA, ahora.getTime() + DIAS_A_FUTURO * DIA));
  if (fin <= inicio) {
    return { texto: JSON.stringify({ ahora_en_miami: fechaLegible(ahora, locale), horarios: [], nota: "Ese día está fuera de los próximos dos meses." }) };
  }
  const tomados = await cuposTomados(inicio, fin).catch(() => new Set<string>());
  const libres = cuposEnRango(inicio, fin)
    .filter((c) => c >= inicio && c <= fin && !tomados.has(c.toISOString()))
    .slice(0, 30);
  return {
    texto: JSON.stringify({
      ahora_en_miami: fechaLegible(ahora, locale),
      horarios: libres.map((c) => ({ slot: c.toISOString(), cuando: fechaLegible(c, locale) })),
    }),
  };
}

async function agendar(entrada: Record<string, unknown>, locale: string, ip: string): Promise<Salida> {
  const nota = texto(entrada.nota);
  const resultado = await agendarCita(
    {
      slot: texto(entrada.slot),
      name: texto(entrada.nombre),
      email: texto(entrada.correo),
      phone: texto(entrada.telefono) || null,
      note: `Agendada desde el chat de la mascota. ${nota}`.trim(),
      locale,
    },
    ip
  );
  if (resultado.ok) {
    const cuando = fechaLegible(resultado.inicio, locale);
    return {
      texto: JSON.stringify({
        agendada: true,
        cuando: `${cuando} (hora de Miami)`,
        meet: resultado.meet,
        invitacion: "Se le mandó la confirmación y la invitación de calendario a su correo.",
      }),
      cita: { cuando, meet: resultado.meet },
    };
  }
  const motivos: Record<string, string> = {
    bad_request: "Faltan datos o el correo no es válido. Pídele que lo revise.",
    slot_invalid: "Ese horario no es válido. Vuelve a usar ver_horarios y ofrece uno de los que devuelva.",
    slot_taken: "Ese horario se acaba de ocupar. Vuelve a usar ver_horarios y ofrece otro.",
    rate_limited: "Ya se agendaron varias citas desde esta conexión. Que escriba por WhatsApp al 305-934-9981.",
    server_error: "No se pudo guardar la cita. Que agende en la página de Contacto o escriba por WhatsApp al 305-934-9981.",
  };
  return { texto: JSON.stringify({ agendada: false, motivo: motivos[resultado.error] }), error: true };
}

export async function ejecutarHerramienta(
  nombre: string,
  entrada: unknown,
  contexto: { locale: string; ip: string }
): Promise<Salida> {
  const datos = entrada && typeof entrada === "object" ? (entrada as Record<string, unknown>) : {};
  try {
    if (nombre === "ver_horarios") return await verHorarios(datos, contexto.locale);
    if (nombre === "agendar_cita") return await agendar(datos, contexto.locale, contexto.ip);
    return { texto: `No existe la herramienta ${nombre}.`, error: true };
  } catch (e) {
    console.error(`chat: la herramienta ${nombre} falló:`, e instanceof Error ? e.message : e);
    return {
      texto: "La herramienta falló. Ofrece el WhatsApp 305-934-9981 o la página de Contacto.",
      error: true,
    };
  }
}
