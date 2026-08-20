"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { inputClass } from "./ui";

/**
 * Ventana de chat de la mascota. Vive fuera del contenedor escalado del
 * robot para verse a tamaño completo también en el teléfono.
 */

type Msg = { role: "user" | "assistant"; content: string };

export default function MascotChat({ onClose }: { onClose: () => void }) {
  const t = useTranslations("mascot");
  const locale = useLocale();

  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || thinking) return;
    setError("");
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setThinking(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, locale }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      if (data.reply) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply! }]);
      } else if (data.error === "not_configured") {
        setMessages((prev) => [...prev, { role: "assistant", content: t("chatSoon") }]);
      } else if (res.status === 429) {
        setError(t("chatSlow"));
      } else {
        setError(t("chatError"));
      }
    } catch {
      setError(t("chatError"));
    } finally {
      setThinking(false);
    }
  };

  return (
    <div className="fixed right-2 bottom-20 z-50 flex max-h-[70vh] w-[330px] max-w-[94vw] flex-col overflow-hidden rounded-2xl border border-judo-lilac/30 bg-[#0e0e16] shadow-[0_24px_70px_-20px_rgba(123,45,255,0.45)] sm:right-6 sm:bottom-44">
      <div className="flex items-center justify-between border-b border-judo-lilac/15 bg-judo-purple/15 px-4 py-2.5">
        <p className="text-sm font-semibold">👾 {t("chatTitle")}</p>
        <button
          onClick={onClose}
          aria-label="Cerrar chat"
          className="rounded-full px-2 text-judo-fog/60 transition hover:text-judo-lilac"
        >
          ✕
        </button>
      </div>

      <div ref={listRef} className="flex-1 space-y-2.5 overflow-y-auto p-3">
        <Bubble role="assistant">{t("chatIntro")}</Bubble>
        {messages.map((m, i) => (
          <Bubble key={i} role={m.role}>
            {m.content}
          </Bubble>
        ))}
        {thinking && (
          <Bubble role="assistant">
            <span className="animate-pulse">{t("chatThinking")}</span>
          </Bubble>
        )}
        {error && <p className="px-1 text-xs text-red-400">{error}</p>}
      </div>

      <form onSubmit={send} className="flex gap-2 border-t border-judo-lilac/15 p-2.5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={600}
          placeholder={t("chatPlaceholder")}
          className={`${inputClass} py-2 text-sm`}
        />
        <button
          type="submit"
          disabled={thinking || !input.trim()}
          className="rounded-xl bg-judo-purple px-3.5 text-sm font-semibold text-white transition hover:bg-judo-lilac disabled:opacity-50"
          aria-label={t("chatSend")}
        >
          ➤
        </button>
      </form>
    </div>
  );
}

function Bubble({
  role,
  children,
}: {
  role: "user" | "assistant";
  children: React.ReactNode;
}) {
  return (
    <div className={`flex ${role === "user" ? "justify-end" : "justify-start"}`}>
      <p
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
          role === "user"
            ? "rounded-br-md bg-judo-purple text-white"
            : "rounded-bl-md border border-judo-lilac/20 bg-judo-surface text-judo-fog/90"
        }`}
      >
        {children}
      </p>
    </div>
  );
}
