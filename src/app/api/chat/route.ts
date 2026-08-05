import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { chatbotSystem } from "@/content/chatbot";

/**
 * Chat de la mascota (solo judomarketing.net).
 * Con límites para proteger el presupuesto del dueño: mensajes cortos,
 * historial recortado, respuestas acotadas y límite por IP.
 */

const MAX_MESSAGE_CHARS = 600;
const MAX_HISTORY = 10;
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

  const { messages, locale } = (await req.json()) as {
    messages?: ChatMessage[];
    locale?: string;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const history: ChatMessage[] = messages
    .filter(
      (m) =>
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0
    )
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }));

  if (history.length === 0 || history[history.length - 1].role !== "user") {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const client = new Anthropic();

  try {
    const response = (await client.beta.messages.create({
      model: "claude-opus-5",
      max_tokens: 600,
      system: chatbotSystem(locale === "en" ? "en" : "es"),
      messages: history,
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
            ? "I can only chat about Judo Marketing. How can I help you with your project?"
            : "Solo puedo conversar sobre Judo Marketing. ¿Te ayudo con tu proyecto?",
      });
    }

    const reply = response.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    return NextResponse.json({ reply });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "rate_limited" }, { status: 429 });
    }
    const msg = e instanceof Error ? e.message : "unknown";
    console.error("chat error:", msg);
    return NextResponse.json({ error: "unavailable" }, { status: 502 });
  }
}
