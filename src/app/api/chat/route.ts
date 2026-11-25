import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { chatbotSystem } from "@/content/chatbot";
import { ejecutarHerramienta, HERRAMIENTAS, type Salida } from "@/lib/chat-herramientas";

/**
 * Chat de la mascota (solo judomarketing.net).
 *
 * Desde el 25 de noviembre de 2026 entiende el negocio y el problema del
 * visitante y agenda la videollamada desde el mismo chat, con dos
 * herramientas (src/lib/chat-herramientas.ts). El servidor corre las vueltas
 * de herramienta y al navegador solo le llega el texto final (y la cita, si
 * se agendó).
 *
 * Con límites para proteger el presupuesto del dueño: mensajes cortos,
 * historial recortado, pocas vueltas de herramienta y límite por IP. El
 * prompt del sistema y las herramientas van en la caché: no cambian entre
 * mensajes.
 */

const MODELO = "claude-opus-5-5";
const MAX_MESSAGE_CHARS = 600;
const MAX_HISTORY = 16;
const MAX_VUELTAS = 5;
const PER_MINUTE_LIMIT = 8;

const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  if (hits.size > 5000) hits.clear();
  hits.set(ip, recent);
  return recent.length > PER_MINUTE_LIMIT;
}

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }

  const { messages, locale: pedido } = (await req.json().catch(() => ({}))) as {
    messages?: ChatMessage[];
    locale?: string;
  };
  const locale = pedido === "en" ? "en" : "es";

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const recortado: ChatMessage[] = messages
    .filter(
      (m) =>
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0
    )
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }));
  // Al recortar puede quedar primero una respuesta de la mascota: la
  // conversación tiene que empezar por el visitante.
  while (recortado.length > 0 && recortado[0].role !== "user") recortado.shift();

  if (recortado.length === 0 || recortado[recortado.length - 1].role !== "user") {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const client = new Anthropic();
  const conversacion: Anthropic.Beta.BetaMessageParam[] = recortado.map((m) => ({ role: m.role, content: m.content }));
  let cita: Salida["cita"];

  try {
    for (let vuelta = 0; vuelta < MAX_VUELTAS; vuelta++) {
      const response = (await client.beta.messages.create({
        model: MODELO,
        max_tokens: 2000,
        // Estable entre mensajes: herramientas y sistema se leen de la caché
        tools: HERRAMIENTAS,
        system: [{ type: "text", text: chatbotSystem(locale), cache_control: { type: "ephemeral" } }],
        messages: conversacion,
        // Respuestas rápidas y económicas para chat de sitio
        output_config: { effort: "low" },
        // Si los clasificadores declinan, otro modelo responde en la misma llamada
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
      } as Parameters<typeof client.beta.messages.create>[0])) as Anthropic.Beta.BetaMessage;

      if (response.stop_reason === "refusal") {
        return NextResponse.json({
          reply:
            locale === "en"
              ? "I can only chat about Judo Marketing. How can I help your business?"
              : "Solo puedo conversar sobre Judo Marketing. ¿Te ayudo con tu negocio?",
          cita,
        });
      }

      const usos = response.content.filter(
        (b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use"
      );

      if (response.stop_reason !== "tool_use" || usos.length === 0) {
        const reply = response.content
          .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
          .map((b) => b.text)
          .join("")
          .trim();
        return NextResponse.json({ reply: reply || respaldo(locale), cita });
      }

      // La respuesta completa vuelve tal cual (con su razonamiento): el
      // modelo la necesita para seguir en la siguiente vuelta.
      conversacion.push({ role: "assistant", content: response.content as Anthropic.Beta.BetaContentBlockParam[] });

      const salidas = await Promise.all(
        usos.map((uso) => ejecutarHerramienta(uso.name, uso.input, { locale, ip }))
      );
      salidas.forEach((s) => {
        if (s.cita) cita = s.cita;
      });
      conversacion.push({
        role: "user",
        content: usos.map(
          (uso, i): Anthropic.Beta.BetaToolResultBlockParam => ({
            type: "tool_result",
            tool_use_id: uso.id,
            content: salidas[i].texto,
            ...(salidas[i].error ? { is_error: true } : {}),
          })
        ),
      });
    }

    return NextResponse.json({ reply: respaldo(locale), cita });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
    const msg = e instanceof Error ? e.message : "unknown";
    console.error("chat error:", msg);
    // Si la cita ya se agendó, eso no se pierde aunque la respuesta falle
    if (cita) return NextResponse.json({ reply: respaldo(locale), cita });
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
}

function respaldo(locale: string): string {
  return locale === "en"
    ? "Sorry, I got tangled up. You can also message us on WhatsApp at 305-934-9981."
    : "Perdón, me enredé. También puedes escribirnos por WhatsApp al 305-934-9981.";
}
